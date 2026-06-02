/**
 * WORKFLOW tool handler: analyze_workflow
 * Analyzes SAP Business Workflow (classic WF / SWDD) metadata by querying
 * standard workflow tables via the ADT runQuery endpoint (read-only, no
 * ALLOW_WRITE required).
 *
 * Tables used:
 *   SWF_FLEX_HEADER  – Flexible workflow template headers (NW 7.40+)
 *   SWFTASKI         – Classic task/workflow definitions (all NW versions)
 *   SWWWIHEAD        – Work item instance headers
 *   SWF_FLEX_STEP    – Flexible workflow step definitions
 *   SWF_FLEX_ROLE    – Agent/role assignments in flexible workflows
 *   SWWUSERWI        – Work items per user (instance-level agent tracking)
 */

import type { ADTClient } from "abap-adt-api";
import type { ToolResult } from "../../types.js";
import { S_AnalyzeWorkflow } from "../../schemas.js";
import { cfg } from "../../config.js";

function ok(text: string): ToolResult { return { content: [{ type: "text", text }] }; }
function err(text: string): ToolResult { return { content: [{ type: "text", text }], isError: true }; }

/** Run a SELECT via ADT and catch errors so one failing query doesn't break the whole response. */
async function safeQuery(
  client: ADTClient,
  sql: string,
): Promise<{ rows: Record<string, string>[]; error?: string }> {
  try {
    const result = await client.runQuery(sql);
    const rows = Array.isArray(result) ? (result as Record<string, string>[]) : [];
    return { rows };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { rows: [], error: msg.substring(0, 120) };
  }
}

const WI_STATUS: Record<string, string> = {
  "0": "WAITING",
  "1": "READY",
  "2": "SELECTED",
  "3": "STARTED",
  "4": "COMPLETED",
  "5": "CANCELLED",
  "6": "ERROR",
  "7": "EXECUTED",
};

export async function handleAnalyzeWorkflow(
  client: ADTClient,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const p = S_AnalyzeWorkflow.parse(args);
  const max = p.maxResults ?? 20;

  switch (p.mode) {

    // ── DEFINITIONS ─────────────────────────────────────────────────────────
    case "definitions": {
      const [flex, classic] = await Promise.all([
        safeQuery(
          client,
          `SELECT * FROM SWF_FLEX_HEADER UP TO ${max} ROWS`,
        ),
        safeQuery(
          client,
          `SELECT TASKID, TASKTYPE, DESCRIPT, CREATEDBY, CREATEDON, CHANGEDBY, CHANGEDON ` +
          `FROM SWFTASKI UP TO ${max} ROWS WHERE TASKTYPE = 'WS'`,
        ),
      ]);

      const parts: string[] = ["# SAP Workflow Definitions\n"];

      if (flex.rows.length > 0) {
        parts.push(`## Flexible Workflow Templates (SWF_FLEX_HEADER) — ${flex.rows.length} found\n`);
        parts.push("```json\n" + JSON.stringify(flex.rows, null, 2) + "\n```");
      } else {
        parts.push(
          flex.error
            ? `## Flexible Workflow (SWF_FLEX_HEADER)\n⚠️ Not available: ${flex.error}`
            : "## Flexible Workflow (SWF_FLEX_HEADER)\n_No entries found._",
        );
      }

      if (classic.rows.length > 0) {
        parts.push(`\n## Classic Workflow Templates (SWFTASKI, TASKTYPE=WS) — ${classic.rows.length} found\n`);
        parts.push("```json\n" + JSON.stringify(classic.rows, null, 2) + "\n```");
      } else {
        parts.push(
          classic.error
            ? `\n## Classic Workflow (SWFTASKI)\n⚠️ Not available: ${classic.error}`
            : "\n## Classic Workflow (SWFTASKI)\n_No workflow templates (WS) found._",
        );
      }

      if (flex.rows.length === 0 && classic.rows.length === 0 && !flex.error && !classic.error) {
        parts.push(
          "\n💡 No workflow definitions found. " +
          "If workflows are used, try analyze_workflow(mode='instances') to check for running instances, " +
          "or verify that the workflow tables are populated (transaction SWDD).",
        );
      }

      return ok(parts.join("\n"));
    }

    // ── INSTANCES ───────────────────────────────────────────────────────────
    case "instances": {
      const conditions: string[] = [];

      if (p.workflowId) {
        // WI_RH_TASK contains the task ID (e.g. WS90000001)
        conditions.push(`WI_RH_TASK LIKE '%${p.workflowId.toUpperCase()}%'`);
      }
      if (p.status && p.status !== "all") {
        // WI_STAT contains status as text (READY, STARTED, COMPLETED, ERROR, etc.)
        const statusMap: Record<string, string> = {
          READY: "READY", STARTED: "STARTED", COMPLETED: "COMPLETED", ERROR: "ERROR",
        };
        const statusValue = statusMap[p.status.toUpperCase()] ?? p.status.toUpperCase();
        conditions.push(`WI_STAT = '${statusValue}'`);
      }
      if (p.user) {
        // WI_AAGENT contains the actual agent (user)
        conditions.push(`WI_AAGENT = '${p.user.toUpperCase()}'`);
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT WI_ID, WI_RH_TASK, WI_STAT, WI_TEXT, WI_CD, WI_CT, WI_AAGENT, WI_CREATOR, TOP_TASK FROM SWWWIHEAD UP TO ${max} ROWS${where}`;

      const result = await safeQuery(client, sql);
      if (result.error) {
        return err(
          `❌ Error querying workflow instances (SWWWIHEAD):\n${result.error}\n\n` +
          "Note: SWWWIHEAD requires SAP Workflow (BC-BMT-WFM) to be installed and configured.",
        );
      }
      if (result.rows.length === 0) {
        return ok("No workflow instances found with the given criteria.");
      }

      return ok(
        `# Workflow Instances (SWWWIHEAD) — ${result.rows.length} found\n\n` +
        "```json\n" + JSON.stringify(result.rows, null, 2) + "\n```",
      );
    }

    // ── STEPS ───────────────────────────────────────────────────────────────
    case "steps": {
      if (!p.workflowId) {
        return err("❌ workflowId is required for mode='steps'. Example: workflowId='WS12300111'");
      }
      const wfId = p.workflowId.toUpperCase();

      const [flex, classic, contDef] = await Promise.all([
        safeQuery(client, `SELECT * FROM SWF_FLEX_STEP UP TO ${max} ROWS WHERE WFTYPEID = '${wfId}'`),
        safeQuery(client, `SELECT * FROM SWFSTEPDEF UP TO ${max} ROWS WHERE FLOWID = '${wfId}'`),
        // SWFCONTDEF: container elements of a SWDD workflow (data flowing between steps)
        safeQuery(client, `SELECT ELEMENT, CDTYPE, EDITMODE, MANDATORY FROM SWFCONTDEF UP TO ${max} ROWS WHERE TASKID = '${wfId}'`),
      ]);

      const parts: string[] = [`# Workflow Step Definitions for ${wfId}\n`];

      if (flex.rows.length > 0) {
        parts.push(`## Flexible WF Steps (SWF_FLEX_STEP) — ${flex.rows.length} steps\n`);
        parts.push("```json\n" + JSON.stringify(flex.rows, null, 2) + "\n```");
      } else {
        parts.push(
          flex.error
            ? `## SWF_FLEX_STEP\n⚠️ ${flex.error}`
            : `## SWF_FLEX_STEP\n_No steps found for ${wfId} (only relevant for Flexible Workflow)._`,
        );
      }

      if (classic.rows.length > 0) {
        parts.push(`\n## Classic WF Steps (SWFSTEPDEF) — ${classic.rows.length} steps\n`);
        parts.push("```json\n" + JSON.stringify(classic.rows, null, 2) + "\n```");
      } else {
        parts.push(
          classic.error
            ? `\n## SWFSTEPDEF\n⚠️ ${classic.error}`
            : `\n## SWFSTEPDEF\n_No steps found for ${wfId}._`,
        );
      }

      // SWDD container: always useful regardless of WF type
      if (contDef.rows.length > 0) {
        parts.push(`\n## SWDD Container Elements (SWFCONTDEF) — ${contDef.rows.length} elements\n`);
        parts.push(
          "_Container elements are the data fields passed between workflow steps (import/export/in-out)._\n",
        );
        parts.push("```json\n" + JSON.stringify(contDef.rows, null, 2) + "\n```");
      } else if (!contDef.error) {
        parts.push(`\n## SWDD Container (SWFCONTDEF)\n_No container elements found for ${wfId}._`);
      }

      // Deep SWDD analysis via execute_abap_snippet when execution is enabled.
      // Classic SWDD step/node structure is not queryable via plain SQL — the compiled
      // workflow graph lives in internal WF runtime tables. The snippet reads SWFTASKI
      // (task header) and SWFCONTDEF (container) to give meaningful output while
      // gracefully noting that the visual step graph requires SWDD.
      if (cfg.allowWrite && cfg.allowExecute) {
        parts.push("\n## SWDD Deep Analysis (execute_abap_snippet)\n");
        try {
          // Dynamic import avoids circular dependency: handler-map → workflow → handler-map
          const { handleExecuteAbapSnippet } = await import("./query.js");
          const snippet = buildSwddStepsSnippet(wfId);
          const result = await handleExecuteAbapSnippet(client, { source: snippet, timeout: 15 });
          const text = result.content[0]?.type === "text" ? result.content[0].text : String(result.content);
          parts.push(text);
        } catch (e) {
          parts.push(`⚠️ execute_abap_snippet failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        parts.push(
          "\n> **SWDD step graph**: Classic SWDD step/node structure is compiled into an internal " +
          "WF runtime format and cannot be read via direct SQL. " +
          "Enable `ALLOW_WRITE=true` + `ALLOW_EXECUTE=true` for ABAP-snippet-based deep analysis. " +
          "Alternative: transaction **SWDD** for visual step display, or **SWI14** for task usage analysis.",
        );
      }

      return ok(parts.join("\n"));
    }

    // ── AGENTS ──────────────────────────────────────────────────────────────
    case "agents": {
      if (!p.workflowId) {
        return err("❌ workflowId is required for mode='agents'. Example: workflowId='WS12300111'");
      }
      const wfId = p.workflowId.toUpperCase();

      const [roles, userWi] = await Promise.all([
        safeQuery(
          client,
          `SELECT * FROM SWF_FLEX_ROLE UP TO ${max} ROWS WHERE WFTYPEID = '${wfId}'`,
        ),
        safeQuery(
          client,
          `SELECT WI_ID, TASK_OBJ, USER_ID FROM SWWUSERWI UP TO ${max} ROWS ` +
          `WHERE TASK_OBJ LIKE '%${wfId.substring(0, 10)}%'`,
        ),
      ]);

      const parts: string[] = [`# Agent/Role Assignments for ${wfId}\n`];

      if (roles.rows.length > 0) {
        parts.push(`## Role Definitions (SWF_FLEX_ROLE) — ${roles.rows.length} entries\n`);
        parts.push("```json\n" + JSON.stringify(roles.rows, null, 2) + "\n```");
      } else {
        parts.push(
          roles.error
            ? `## SWF_FLEX_ROLE\n⚠️ ${roles.error}`
            : `## SWF_FLEX_ROLE\n_No role assignments found for ${wfId}._`,
        );
      }

      if (userWi.rows.length > 0) {
        parts.push(`\n## Instance-Level Agents (SWWUSERWI) — ${userWi.rows.length} entries\n`);
        parts.push("```json\n" + JSON.stringify(userWi.rows, null, 2) + "\n```");
      } else {
        parts.push(
          userWi.error
            ? `\n## SWWUSERWI\n⚠️ ${userWi.error}`
            : `\n## SWWUSERWI\n_No agent assignments found for ${wfId}._`,
        );
      }

      if (roles.rows.length === 0 && userWi.rows.length === 0) {
        parts.push(
          `\n💡 No agent assignments found for '${wfId}'. ` +
          "Check in SWDD under step → Agent assignment, or use mode='instances' to see who worked on actual instances.",
        );
      }

      return ok(parts.join("\n"));
    }

    default:
      return err(`❌ Unknown mode: ${String((p as { mode?: unknown }).mode)}`);
  }
}

/**
 * Builds an ABAP snippet that reads SWDD workflow metadata at runtime.
 * Uses only tables and field names known to exist on all SAP systems with
 * classic Business Workflow installed (NW 7.0+):
 *   SWFTASKI   — task header (TASKID, TASKTYPE, DESCRIPT, CREATEDBY, CREATEDON, …)
 *   SWFCONTDEF — container element definitions (ELEMENT, CDTYPE, EDITMODE, MANDATORY)
 *
 * Intentionally avoids function module calls with uncertain type interfaces so the
 * snippet passes the syntax check on all target systems.
 */
function buildSwddStepsSnippet(wfId: string): string {
  return `REPORT ztest.
DATA lv_id TYPE swf_task_id VALUE '${wfId}'.
WRITE: / '=== SWDD Workflow Detail:', lv_id.
WRITE: / ''.

" ---- Task header ----
SELECT SINGLE taskid tasktype descript createdby createdon changedby changedon
  FROM swftaski INTO @DATA(ls) WHERE taskid = @lv_id.
IF sy-subrc <> 0.
  WRITE: / 'ERROR: Workflow', lv_id, 'not found in SWFTASKI.'.
  RETURN.
ENDIF.
WRITE: / 'Description :', ls-descript.
WRITE: / 'Task Type   :', ls-tasktype.
WRITE: / 'Created by  :', ls-createdby, 'on', ls-createdon.
WRITE: / 'Changed by  :', ls-changedby, 'on', ls-changedon.
WRITE: / ''.

" ---- Container elements ----
" SWFCONTDEF holds the data elements (import/export/in-out) shared between steps.
WRITE: / '=== Container (SWFCONTDEF):'.
SELECT element cdtype editmode mandatory
  FROM swfcontdef INTO TABLE @DATA(lt_c)
  WHERE taskid = @lv_id UP TO 50 ROWS.
IF sy-subrc = 0.
  LOOP AT lt_c INTO DATA(lc).
    WRITE: / '  [', lc-element, ']  type:', lc-cdtype,
             '  edit:', lc-editmode, '  mand:', lc-mandatory.
  ENDLOOP.
ELSE.
  WRITE: / '  (no container elements)'.
ENDIF.
WRITE: / ''.

" ---- Information on step-level detail ----
WRITE: / 'Note: The compiled SWDD step/node graph is not accessible via plain SQL.'.
WRITE: / 'For visual step display: transaction SWDD (enter WF-ID above).'.
WRITE: / 'For task usage in running instances: analyze_workflow(mode=instances,workflowId=ID).'.
WRITE: / 'For who performed which step: check SWWWIHEAD filtered by task LIKE TS%.'.`;
}
