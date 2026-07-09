/**
 * ABAP MCP Server — ADT client session pool.
 *
 * Instead of a single shared `ADTClient`, the server keeps a small pool of
 * sessions keyed by an opaque session key (e.g. the MCP transport session id
 * in multi-user HTTP mode). Each session owns its own `ADTClient`, logged in
 * with that session's SAP credentials, so ADT locks, stateful lock→write→
 * activate sequences and the SAP-side audit trail stay isolated per user.
 *
 * The *network transport* (proxy agent + connectivity JWT) is shared across
 * all sessions: it authenticates the *app* to the BTP Connectivity Proxy via
 * client_credentials and is independent of the end user. Agent strategy is
 * selected once and memoized (the first configured one wins):
 *
 *   1. BTP Connectivity Proxy        (Cloud Connector / hybrid CAP dev)
 *   2. SAProuter NI tunnel           (B2B VPN where only SAProuter is open)
 *   3. Generic HTTP CONNECT proxy    (corporate proxy or local SSH tunnel)
 *   4. Direct HTTPS                  (optionally with self-signed tolerance)
 *
 * Local stdio mode keeps working unchanged: a single implicit "default"
 * session is auto-registered from the SAP_* env vars on first `getClient()`.
 * Multi-user HTTP mode calls `registerSession(key, creds)` per connection and
 * then resolves the client via `getClientFor(key)`.
 *
 * See the `readme.md` "Network connectivity" section for the matching env vars.
 */

import http from "http";
import https from "https";
import { ADTClient, createSSLConfig } from "abap-adt-api";
import type { ClientOptions } from "abap-adt-api";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { cfg } from "./config.js";
import { ADT_CORE_DISCOVERY } from "./adt-endpoints.js";
import { SAProuterHttpsAgent } from "./saprouter-agent.js";
import { parseSapRouteString, SAProuterHop } from "./saprouter.js";
import {
  BtpConnectivityAgentBundle,
  createBtpConnectivityAgentBundle,
  loadBtpConnectivityCreds,
} from "./btp/index.js";

/** Discriminated agent spec so the wiring layer can switch on `kind` cleanly. */
type AgentSpec =
  | { kind: "http"; agent: http.Agent }
  | { kind: "https"; agent: https.Agent }
  | { kind: "none" };

/** SAP backend credentials for a single session's ADT login. */
export interface SapCreds {
  readonly user: string;
  readonly password: string;
  readonly client: string;
  readonly language: string;
}

interface UserSession {
  creds: SapCreds;
  client: ADTClient | null;
  lastUsed: number;
}

/** Session key used by the implicit single-user (stdio / local) session. */
export const DEFAULT_SESSION_KEY = "__default__";

const sessions = new Map<string, UserSession>();

// The network transport is shared across every session. Memoized as a promise
// so concurrent first-callers don't each build (and JWT-fetch) their own.
let sharedAgentPromise: Promise<AgentSpec> | null = null;
let sharedBtpBundle: BtpConnectivityAgentBundle | null = null;

/* ============================================================ *
 * Public API — session pool                                     *
 * ============================================================ */

/**
 * Register (or update) a session's SAP credentials under `key`. Does not log
 * in eagerly — the login happens lazily on the next `getClientFor(key)` so
 * callers that want to validate credentials immediately should follow up with
 * a `getClientFor(key)` and surface any error.
 *
 * If the key already exists with different credentials, the old client is
 * dropped (logged out) so the next resolve re-authenticates as the new user.
 */
export function registerSession(key: string, creds: SapCreds): void {
  const existing = sessions.get(key);
  if (existing) {
    if (sameCreds(existing.creds, creds)) {
      existing.lastUsed = Date.now();
      return;
    }
    existing.creds = creds;
    if (existing.client) {
      void safeLogout(existing.client);
      existing.client = null;
    }
    existing.lastUsed = Date.now();
    return;
  }
  sessions.set(key, { creds, client: null, lastUsed: Date.now() });
}

/** Whether a session has been registered for `key`. */
export function hasSession(key: string): boolean {
  return sessions.has(key);
}

/**
 * Resolve a logged-in ADT client for a registered session. Reuses the live
 * connection after a cheap HEAD-discovery liveness probe; re-logs in
 * transparently when the SAP session has expired.
 *
 * Throws `InvalidRequest` when no session is registered for `key` — callers
 * must `registerSession` first (the implicit `getClient()` does this for the
 * default session automatically).
 */
export async function getClientFor(key: string): Promise<ADTClient> {
  const s = sessions.get(key);
  if (!s) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `No SAP session registered for key '${key}'. Provide SAP credentials first (MCP initialize).`,
    );
  }
  if (s.client && (await isStillAlive(s.client))) {
    s.lastUsed = Date.now();
    return s.client;
  }
  s.client = null;

  const agentSpec = await getSharedAgent();
  s.client = await buildLoggedInClient(agentSpec, s.creds);
  s.lastUsed = Date.now();
  return s.client;
}

/**
 * Backward-compatible single-user accessor. Auto-registers an implicit
 * "default" session from the SAP_* env vars and returns its client — this is
 * what the local stdio entry point and the diagnostic scripts use.
 */
export async function getClient(): Promise<ADTClient> {
  if (!sessions.has(DEFAULT_SESSION_KEY)) {
    registerSession(DEFAULT_SESSION_KEY, credsFromConfig());
  }
  return getClientFor(DEFAULT_SESSION_KEY);
}

/** Log out and forget a single session. No-op if the key is unknown. */
export async function dropClientSession(key: string): Promise<void> {
  const s = sessions.get(key);
  if (!s) return;
  sessions.delete(key);
  if (s.client) await safeLogout(s.client);
}

/**
 * Evict sessions idle for longer than `maxIdleMs` (the default session is
 * never evicted). Frees SAP backend sessions so the pool does not exhaust
 * `rdisp/tm_max_no`. Returns the number of sessions dropped.
 */
export async function evictIdleSessions(maxIdleMs: number): Promise<number> {
  const now = Date.now();
  const stale = [...sessions.entries()].filter(
    ([key, s]) => key !== DEFAULT_SESSION_KEY && now - s.lastUsed > maxIdleMs,
  );
  for (const [key] of stale) await dropClientSession(key);
  return stale.length;
}

/** Current number of live sessions (incl. the default session if present). */
export function sessionCount(): number {
  return sessions.size;
}

/* ============================================================ *
 * Helpers — credentials                                         *
 * ============================================================ */

function credsFromConfig(): SapCreds {
  return { user: cfg.user, password: cfg.password, client: cfg.client, language: cfg.language };
}

function sameCreds(a: SapCreds, b: SapCreds): boolean {
  return (
    a.user === b.user && a.password === b.password && a.client === b.client && a.language === b.language
  );
}

async function safeLogout(client: ADTClient): Promise<void> {
  try {
    await client.logout();
  } catch (e) {
    console.error("⚠️ logout failed:", e instanceof Error ? e.message : String(e));
  }
}

/* ============================================================ *
 * Agent strategy selection (shared across all sessions)         *
 * ============================================================ */

/** Build the network agent once and memoize it; reset on failure to retry. */
function getSharedAgent(): Promise<AgentSpec> {
  if (!sharedAgentPromise) {
    sharedAgentPromise = selectAgent().catch((e) => {
      sharedAgentPromise = null; // allow a later call to retry the selection
      throw e;
    });
  }
  return sharedAgentPromise;
}

async function selectAgent(): Promise<AgentSpec> {
  if (cfg.btpConnectivityProxy) return buildBtpConnectivityAgent();
  if (cfg.sapRouter) return buildSAProuterAgent();
  if (cfg.proxyUrl) return buildHttpProxyAgent();
  return buildDirectHttpsAgent();
}

async function buildBtpConnectivityAgent(): Promise<AgentSpec> {
  const creds = loadBtpConnectivityCreds();
  if (!creds) {
    throw new Error(
      "SAP_BTP_CONNECTIVITY_PROXY is set but no connectivity service credentials are " +
      "available. Provide one of: SAP_BTP_CONNECTIVITY_CREDS_FILE, " +
      "SAP_BTP_CONNECTIVITY_CDS_BIND_FILE + SAP_BTP_CONNECTIVITY_CDS_BIND_NAME, " +
      "or SAP_BTP_CONNECTIVITY_CLIENT_ID / _CLIENT_SECRET / _TOKEN_URL.",
    );
  }
  sharedBtpBundle = createBtpConnectivityAgentBundle(
    {
      proxyUrl: cfg.btpConnectivityProxy,
      creds,
      locationId: cfg.btpConnectivityLocationId || undefined,
      allowUnauthorized: cfg.allowUnauthorized,
      debug: cfg.btpConnectivityDebug,
    },
    cfg.url,
  );
  // Pre-fetch the JWT so the first proxy request carries Proxy-Authorization.
  await sharedBtpBundle.tokenSource.get();
  if (cfg.btpConnectivityDebug) {
    console.error(
      `[btp-connectivity] using ${sharedBtpBundle.scheme.toUpperCase()} forward proxy at ` +
      `${cfg.btpConnectivityProxy} for target ${cfg.url}`,
    );
  }
  return sharedBtpBundle.scheme === "https"
    ? { kind: "https", agent: sharedBtpBundle.agent as https.Agent }
    : { kind: "http", agent: sharedBtpBundle.agent as http.Agent };
}

function buildSAProuterAgent(): AgentSpec {
  const router = resolveFirstHop(cfg.sapRouter);
  if (cfg.sapRouterPassword) router.password = cfg.sapRouterPassword;
  return {
    kind: "https",
    agent: new SAProuterHttpsAgent({
      router,
      keepAlive: true,
      rejectUnauthorized: !cfg.allowUnauthorized,
      debug: cfg.sapRouterDebug,
    }),
  };
}

function buildHttpProxyAgent(): AgentSpec {
  return {
    kind: "https",
    agent: new HttpsProxyAgent(cfg.proxyUrl, {
      keepAlive: true,
      rejectUnauthorized: !cfg.allowUnauthorized,
    }),
  };
}

function buildDirectHttpsAgent(): AgentSpec {
  if (!cfg.allowUnauthorized) return { kind: "none" };
  const sslOptions = createSSLConfig(true);
  return sslOptions.httpsAgent
    ? { kind: "https", agent: sslOptions.httpsAgent }
    : { kind: "none" };
}

function resolveFirstHop(raw: string): SAProuterHop {
  if (raw.startsWith("/")) return parseSapRouteString(raw)[0];
  const [host, portStr] = raw.split(":");
  return { host, port: portStr ? parseInt(portStr, 10) : 3299 };
}

/* ============================================================ *
 * Client construction & maintenance                             *
 * ============================================================ */

async function buildLoggedInClient(agentSpec: AgentSpec, creds: SapCreds): Promise<ADTClient> {
  const options: ClientOptions & { httpAgent?: http.Agent } = { keepAlive: true };
  if (agentSpec.kind === "https") options.httpsAgent = agentSpec.agent;
  if (agentSpec.kind === "http") options.httpAgent = agentSpec.agent;

  const client = new ADTClient(cfg.url, creds.user, creds.password, creds.client, creds.language, options);

  if (agentSpec.kind === "http") patchAxiosHttpAgent(client, agentSpec.agent);

  try {
    await client.login();
  } catch (e) {
    throw new McpError(ErrorCode.InternalError, formatLoginError(e));
  }
  return client;
}

async function isStillAlive(client: ADTClient): Promise<boolean> {
  try {
    await client.httpClient.request(ADT_CORE_DISCOVERY, { method: "HEAD" });
    return true;
  } catch {
    return false;
  }
}

function formatLoginError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const via = describeActiveRoute();
  return (
    `ADT connection not available${via}: ${msg}. ` +
    `Check: SAP_URL (${cfg.url}) reachable through the configured route? ` +
    `Cloud Connector exposes /sap/bc/adt for that virtual host? ` +
    `SSH tunnel for the connectivity proxy still up? Credentials correct?`
  );
}

function describeActiveRoute(): string {
  if (cfg.btpConnectivityProxy) return ` (via BTP Connectivity Proxy ${cfg.btpConnectivityProxy})`;
  if (cfg.sapRouter) return ` (via SAProuter ${cfg.sapRouter})`;
  if (cfg.proxyUrl) return ` (via proxy ${cfg.proxyUrl})`;
  return "";
}

/* ============================================================ *
 * abap-adt-api axios httpAgent monkey-patch                     *
 * ============================================================ *
 *
 * `abap-adt-api` is `axios`-based and accepts `httpsAgent` in its public
 * `ClientOptions`, but does not forward an `httpAgent`. For plain `http://`
 * targets (used by the BTP Connectivity Proxy on its forward-proxy port)
 * this means axios bypasses our agent entirely and tries to DNS-resolve the
 * on-prem virtual host locally, which always fails.
 *
 * The fix is to reach into the library's hidden axios instance after the
 * client is constructed and set `defaults.httpAgent` ourselves, plus
 * `defaults.proxy = false` so axios does not also try to honour any
 * ambient `HTTP_PROXY` env var.
 *
 * If the upstream library renames its internals we log a clear warning and
 * fall back to whatever axios would have done — the resulting error is
 * surfaced to the caller, not silently swallowed.
 */

interface AxiosClientStub {
  axios?: { defaults?: { httpAgent?: http.Agent; proxy?: false } };
}
interface AdtHttpStub {
  httpclient?: AxiosClientStub;
}
interface AdtClientInternals {
  httpClient?: AdtHttpStub;
  h?: AdtHttpStub;
}

function patchAxiosHttpAgent(client: ADTClient, agent: http.Agent): void {
  const internals = client as unknown as AdtClientInternals;
  const adtHttp = internals.httpClient ?? internals.h;
  const defaults = adtHttp?.httpclient?.axios?.defaults;
  if (!defaults) {
    console.error(
      "[btp-connectivity] WARNING: could not locate axios instance inside abap-adt-api " +
      "(tried client.httpClient.httpclient.axios). http:// targets may fail with DNS errors.",
    );
    return;
  }
  defaults.httpAgent = agent;
  defaults.proxy = false;
  if (cfg.btpConnectivityDebug) {
    console.error("[btp-connectivity] injected httpAgent into abap-adt-api's axios instance");
  }
}
