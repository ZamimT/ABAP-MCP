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
          `SELECT TASKID TASKTYPE DESCRIPT CREATEDBY CREATEDON CHANGEDBY CHANGEDON ` +
          `FROM SWFTASKI WHERE TASKTYPE = 'WS' UP TO ${max} ROWS`,
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
        conditions.push(`TASK = '${p.workflowId.toUpperCase()}'`);
      }
      if (p.status && p.status !== "all") {
        const statusCodeMap: Record<string, string> = {
          READY: "1", STARTED: "3", COMPLETED: "4", ERROR: "6",
        };
        const code = statusCodeMap[p.status] ?? p.status;
        conditions.push(`WISTA = '${code}'`);
      }
      if (p.user) {
        conditions.push(`ACTUAL_AGENT = '${p.user.toUpperCase()}'`);
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT * FROM SWWWIHEAD${where} UP TO ${max} ROWS`;

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

      const enriched = result.rows.map(row => ({
        ...row,
        WISTA_LABEL: WI_STATUS[row["WISTA"]] ?? row["WISTA"],
      }));

      return ok(
        `# Workflow Instances (SWWWIHEAD) — ${result.rows.length} found\n\n` +
        "```json\n" + JSON.stringify(enriched, null, 2) + "\n```",
      );
    }

    // ── STEPS ───────────────────────────────────────────────────────────────
    case "steps": {
      if (!p.workflowId) {
        return err("❌ workflowId is required for mode='steps'. Example: workflowId='WS12300111'");
      }
      const wfId = p.workflowId.toUpperCase();

      const [flex, classic] = await Promise.all([
        safeQuery(
          client,
          `SELECT * FROM SWF_FLEX_STEP WHERE WFTYPEID = '${wfId}' UP TO ${max} ROWS`,
        ),
        safeQuery(
          client,
          `SELECT * FROM SWFSTEPDEF WHERE FLOWID = '${wfId}' UP TO ${max} ROWS`,
        ),
      ]);

      const parts: string[] = [`# Workflow Step Definitions for ${wfId}\n`];

      if (flex.rows.length > 0) {
        parts.push(`## Flexible WF Steps (SWF_FLEX_STEP) — ${flex.rows.length} steps\n`);
        parts.push("```json\n" + JSON.stringify(flex.rows, null, 2) + "\n```");
      } else {
        parts.push(
          flex.error
            ? `## SWF_FLEX_STEP\n⚠️ ${flex.error}`
            : `## SWF_FLEX_STEP\n_No steps found for ${wfId}._`,
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

      if (flex.rows.length === 0 && classic.rows.length === 0) {
        parts.push(
          `\n💡 No step definitions found for '${wfId}'. ` +
          "Verify the workflow ID in SWDD. IDs have the format WS<8 digits> (e.g. WS12300111).",
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
          `SELECT * FROM SWF_FLEX_ROLE WHERE WFTYPEID = '${wfId}' UP TO ${max} ROWS`,
        ),
        safeQuery(
          client,
          `SELECT WIID TASK ACTUAL_AGENT FROM SWWUSERWI ` +
          `WHERE TASK LIKE '${wfId.substring(0, 12)}%' UP TO ${max} ROWS`,
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
