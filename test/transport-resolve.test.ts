import { describe, it, expect, vi } from "vitest";
import { resolveTransport } from "../src/helpers/transport-resolve.js";

/**
 * Build a fake ADTClient exposing only what resolveTransport touches:
 * `httpClient.username`, `transportInfo()` and `runQuery()`. No live SAP.
 */
function makeClient(opts: {
  username?: string;
  info?: unknown;
  infoThrows?: boolean;
  e070?: unknown[];
  e071?: unknown[];
  tadir?: unknown[];
}) {
  const transportInfo = vi.fn(async () => {
    if (opts.infoThrows) throw new Error("not transportable");
    return opts.info;
  });
  const runQuery = vi.fn(async (sql: string) => {
    const s = sql.toLowerCase();
    if (s.includes("from e070")) return { values: opts.e070 ?? [] };
    if (s.includes("from e071")) return { values: opts.e071 ?? [] };
    if (s.includes("from tadir")) return { values: opts.tadir ?? [] };
    return { values: [] };
  });
  const client = {
    httpClient: { username: opts.username ?? "TESTUSER" },
    transportInfo,
    runQuery,
  };
  return { client: client as never, transportInfo, runQuery };
}

const hdr = (TRKORR: string, extra: Record<string, string> = {}) => ({
  TRKORR,
  TRFUNCTION: "K",
  TRSTATUS: "D",
  AS4USER: "TESTUSER",
  ...extra,
});

describe("resolveTransport", () => {
  it("honours an explicit transport without querying the backend", async () => {
    const { client, transportInfo } = makeClient({});
    const r = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_x", "ZPKG_EXPL", "ZTRK900001");
    expect(r.transport).toBe("ZTRK900001");
    expect(transportInfo).not.toHaveBeenCalled();
  });

  it("reuses the request an existing object is already locked in", async () => {
    const { client } = makeClient({
      info: { LOCKS: { HEADER: { TRKORR: "S4PK912645", AS4TEXT: "ZAUTH app" } }, TRANSPORTS: [] },
    });
    const r = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_locked", "ZAUTH_LOCK", undefined);
    expect(r.transport).toBe("S4PK912645");
    expect(r.note).toContain("S4PK912645");
  });

  it("picks the candidate holding the most objects of the package, not the newest", async () => {
    const { client } = makeClient({
      info: {
        TADIRDEVC: "ZAUTH_PICK",
        TRANSPORTS: [
          hdr("S4PK_JUNK", { AS4TEXT: "Generated Request for Change Recording" }), // newest first
          hdr("S4PK_APP", { AS4TEXT: "ZAUTH app" }),
        ],
      },
      // task → request mapping
      e070: [
        { TRKORR: "TASK_JUNK", STRKORR: "S4PK_JUNK" },
        { TRKORR: "TASK_APP", STRKORR: "S4PK_APP" },
      ],
      // objects recorded in those tasks
      e071: [
        { TRKORR: "TASK_JUNK", OBJECT: "CLAS", OBJ_NAME: "ZCL_ONE" },
        { TRKORR: "TASK_APP", OBJECT: "CLAS", OBJ_NAME: "ZCL_A" },
        { TRKORR: "TASK_APP", OBJECT: "CLAS", OBJ_NAME: "ZCL_B" },
        { TRKORR: "TASK_APP", OBJECT: "DDLS", OBJ_NAME: "ZAUTH_C_A" },
      ],
      // everything belongs to the package
      tadir: [
        { OBJECT: "CLAS", OBJ_NAME: "ZCL_ONE" },
        { OBJECT: "CLAS", OBJ_NAME: "ZCL_A" },
        { OBJECT: "CLAS", OBJ_NAME: "ZCL_B" },
        { OBJECT: "DDLS", OBJ_NAME: "ZAUTH_C_A" },
      ],
    });
    const r = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_new", "ZAUTH_PICK", undefined);
    expect(r.transport).toBe("S4PK_APP");
  });

  it("remembers the package choice for the rest of the session (sticky)", async () => {
    const { client, transportInfo } = makeClient({
      info: { TRANSPORTS: [hdr("S4PK_ONLY", { AS4TEXT: "only" })] },
    });
    const first = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_a", "ZAUTH_STICKY", undefined);
    const second = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_b", "ZAUTH_STICKY", undefined);
    expect(first.transport).toBe("S4PK_ONLY");
    expect(second.transport).toBe("S4PK_ONLY");
    // Second call served from sticky memory — backend hit only once.
    expect(transportInfo).toHaveBeenCalledTimes(1);
  });

  it("ignores candidate requests owned by other users", async () => {
    const { client } = makeClient({
      info: {
        TRANSPORTS: [
          hdr("S4PK_OTHER", { AS4USER: "SOMEONE_ELSE" }),
        ],
      },
    });
    const r = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_x", "ZAUTH_OTHER", undefined);
    expect(r.transport).toBeUndefined();
  });

  it("falls back to legacy behaviour when the CTS check fails", async () => {
    const { client } = makeClient({ infoThrows: true });
    const r = await resolveTransport(client, "/sap/bc/adt/oo/classes/zcl_x", "ZAUTH_ERR", undefined);
    expect(r.transport).toBeUndefined();
  });
});
