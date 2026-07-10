/**
 * Transport resolution — prefer reusing an already-open request over letting
 * ADT auto-create a fresh "Generated Request for Change Recording" for every
 * object.
 *
 * Why this exists
 * ---------------
 * When create_* / write_abap_source are called without an explicit transport
 * and DEFAULT_TRANSPORT is empty, the CTS backend records each new object into
 * a brand-new auto-generated request. A burst of object creation (e.g. a whole
 * RAP app) therefore ends up scattered across many one-object requests. This
 * helper asks the CTS transport check which requests are already open for the
 * object's package and funnels everything into one.
 *
 * Precedence (first hit wins):
 *   1. explicit transport passed by the caller
 *   2. DEFAULT_TRANSPORT (cfg.defaultTransport)
 *   3. sticky per-package request remembered earlier in this session
 *   4. the request the object is already locked in (edits stay put)
 *   5. the best open candidate request offered by the CTS check for this
 *      package — ranked by how many objects of the *same package* it already
 *      holds, so the real app request wins over stray auto-generated ones
 *   6. undefined → legacy behaviour (ADT may create a fresh request)
 *
 * Whatever concrete request we settle on is remembered per package (keyed by
 * the ADT client, i.e. the session) so a create/write burst all funnels into
 * one request. Explicit / default choices reseed the sticky value too.
 */

import type { ADTClient } from "abap-adt-api";
import { cfg } from "../config.js";

interface TransportHeaderLike {
  TRKORR: string;
  TRFUNCTION?: string;
  TRSTATUS?: string;
  AS4USER?: string;
  AS4TEXT?: string;
}

export interface ResolvedTransport {
  /** Request to record into, or undefined to fall back to legacy behaviour. */
  transport?: string;
  /** Human-readable line describing the decision (for the caller's log). */
  note?: string;
}

/** Session-scoped memory: ADT client → (package → chosen request). */
const stickyByClient = new WeakMap<ADTClient, Map<string, string>>();

function stickyMap(client: ADTClient): Map<string, string> {
  let m = stickyByClient.get(client);
  if (!m) {
    m = new Map();
    stickyByClient.set(client, m);
  }
  return m;
}

function remember(client: ADTClient, pkg: string, trkorr: string): void {
  if (pkg && trkorr) stickyMap(client).set(pkg, trkorr);
}

/** Normalize `client.runQuery` output to plain row objects. */
async function runRows(client: ADTClient, sql: string): Promise<Record<string, string>[]> {
  const res = (await (client as unknown as { runQuery: (q: string) => Promise<unknown> }).runQuery(sql)) as {
    values?: Record<string, string>[];
  };
  return Array.isArray(res?.values) ? res.values : [];
}

const quoteList = (items: string[]): string => items.map((i) => `'${i.replace(/'/g, "")}'`).join(",");

/**
 * Among several open candidate requests, pick the one that already contains the
 * most objects of the given package. Best-effort: any failure falls back to the
 * most recently used candidate (ADT returns TRANSPORTS newest-first).
 */
async function pickByPackageContent(
  client: ADTClient,
  candidates: TransportHeaderLike[],
  pkg: string,
): Promise<TransportHeaderLike> {
  const fallback = candidates[0];
  if (!pkg) return fallback;
  try {
    const reqs = candidates.map((c) => c.TRKORR);
    // Objects live in the tasks of a request; map every task back to its request.
    const taskRows = await runRows(client, `SELECT trkorr, strkorr FROM e070 WHERE strkorr IN (${quoteList(reqs)})`);
    const taskToReq = new Map<string, string>();
    for (const r of reqs) taskToReq.set(r, r); // request-level objects map to themselves
    for (const t of taskRows) if (t.TRKORR) taskToReq.set(t.TRKORR, t.STRKORR);

    const allTrkorrs = [...taskToReq.keys()];
    const objRows = await runRows(
      client,
      `SELECT trkorr, object, obj_name FROM e071 WHERE trkorr IN (${quoteList(allTrkorrs)}) AND pgmid = 'R3TR'`,
    );
    const pkgRows = await runRows(
      client,
      `SELECT object, obj_name FROM tadir WHERE pgmid = 'R3TR' AND devclass = '${pkg.replace(/'/g, "")}'`,
    );
    const inPkg = new Set(pkgRows.map((r) => `${r.OBJECT}/${r.OBJ_NAME}`));

    const count = new Map<string, number>();
    for (const o of objRows) {
      if (!inPkg.has(`${o.OBJECT}/${o.OBJ_NAME}`)) continue;
      const req = taskToReq.get(o.TRKORR) ?? o.TRKORR;
      count.set(req, (count.get(req) ?? 0) + 1);
    }

    let best = fallback;
    let bestN = -1;
    for (const c of candidates) {
      const n = count.get(c.TRKORR) ?? 0;
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    return best;
  } catch {
    return fallback;
  }
}

/**
 * Resolve the transport request to use for an object.
 *
 * @param objectUrl ADT URL of the object (may be a not-yet-created object — the
 *                  CTS check works package-based for creates too).
 * @param devClass  package of the object (empty for writes — derived from the
 *                  CTS check result in that case).
 * @param explicit  transport the caller passed, if any.
 */
export async function resolveTransport(
  client: ADTClient,
  objectUrl: string,
  devClass: string | undefined,
  explicit: string | undefined,
): Promise<ResolvedTransport> {
  const pkgKey = (devClass ?? "").toUpperCase();

  // 1) explicit wins and (re)seeds the sticky choice
  if (explicit) {
    remember(client, pkgKey, explicit);
    return { transport: explicit };
  }
  // 2) configured default
  if (cfg.defaultTransport) {
    remember(client, pkgKey, cfg.defaultTransport);
    return { transport: cfg.defaultTransport };
  }
  if (!cfg.reuseOpenTransport) return {};

  // 3) sticky per-package choice from earlier in this session (create path)
  if (pkgKey) {
    const remembered = stickyMap(client).get(pkgKey);
    if (remembered) {
      return { transport: remembered, note: `♻️ Reusing session request ${remembered} for package ${pkgKey}` };
    }
  }

  // 4/5) ask the CTS transport check
  let info: {
    LOCKS?: { HEADER?: { TRKORR?: string; AS4TEXT?: string } };
    TRANSPORTS?: TransportHeaderLike[];
    TADIRDEVC?: string;
  };
  try {
    info = (await client.transportInfo(objectUrl, devClass ?? "")) as typeof info;
  } catch {
    return {}; // check failed (e.g. non-transportable / offline) — leave it to ADT
  }

  const pkg = pkgKey || (info.TADIRDEVC ?? "").toUpperCase();

  // 4) object already recorded in a request → keep it there
  const lockReq = info.LOCKS?.HEADER?.TRKORR;
  if (lockReq) {
    remember(client, pkg, lockReq);
    const txt = info.LOCKS?.HEADER?.AS4TEXT;
    return { transport: lockReq, note: `♻️ Object already recorded in ${lockReq}${txt ? ` (${txt})` : ""} — reusing it` };
  }

  // sticky derived-package hit (write path picks up a create-time choice)
  if (pkg && !pkgKey) {
    const remembered = stickyMap(client).get(pkg);
    if (remembered) {
      return { transport: remembered, note: `♻️ Reusing session request ${remembered} for package ${pkg}` };
    }
  }

  // 5) pick the best open candidate for this package
  const me = ((client as unknown as { httpClient?: { username?: string } }).httpClient?.username ?? cfg.user).toUpperCase();
  const candidates = (Array.isArray(info.TRANSPORTS) ? info.TRANSPORTS : []).filter(
    (t) =>
      !!t?.TRKORR &&
      (t.TRSTATUS === "D" || t.TRSTATUS === "L") &&
      (!t.TRFUNCTION || t.TRFUNCTION === "K") &&
      (!t.AS4USER || t.AS4USER.toUpperCase() === me),
  );
  if (candidates.length === 0) return {};

  const best = candidates.length === 1 ? candidates[0] : await pickByPackageContent(client, candidates, pkg);
  remember(client, pkg, best.TRKORR);
  const extra =
    candidates.length > 1 ? ` — most ${pkg} objects among ${candidates.length} open requests` : "";
  return {
    transport: best.TRKORR,
    note: `♻️ Reusing open request ${best.TRKORR}${best.AS4TEXT ? ` (${best.AS4TEXT})` : ""}${extra}`,
  };
}
