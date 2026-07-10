---
name: abap-mcp-development
description: Use when modifying, configuring, or troubleshooting this ABAP MCP server. Portable instructions for Codex, Claude, Hermes, OpenCode, Cursor/Cline, and other coding agents.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, mcp, adt, typescript, agent]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# ABAP-MCP Development

## Overview

This skill guides agents working on the ABAP-MCP server. The server is a TypeScript/Node MCP server that talks to SAP ABAP systems through ADT REST APIs and exposes tools for ABAP development, quality checks, diagnostics, transports, abapGit, BTP connectivity, documentation search, and token-efficient context handling.

Use this file as the cross-agent source of truth. Claude-native mirrors may exist under `.claude/skills/`, but agents that do not support native skills should read this file via `AGENTS.md`.

## When to Use

Use this skill for:

- Changing server code under `src/`.
- Adding, renaming, or changing MCP tools and schemas.
- Configuring `.env.example`, connection modes, safety flags, or diagnostics.
- Debugging build/test/runtime problems.
- Updating docs for agent workflows.

Do not use this skill as a replacement for domain skills. Also load the task-specific skill for BTP, RAP/Fiori, HANA/SQLScript, Clean ABAP, or API/integration work when relevant.

## Repository Map

| Area | Purpose |
|---|---|
| `src/index.ts` | startup and banner |
| `src/server.ts` | MCP ListTools/CallTool/Prompt handlers |
| `src/config.ts` | env parsing and safe defaults |
| `src/schemas.ts` | Zod schemas for tool arguments |
| `src/tools/tool-definitions.ts` | user-facing MCP tool metadata |
| `src/tools/tool-registry.ts` | categories, core tools, deferred loading |
| `src/tools/handler-map.ts` | tool name to handler dispatch |
| `src/tools/handlers/` | tool implementations by domain |
| `src/helpers/` | shared parsing, DDIC, docs, clean ABAP, contracts |
| `src/write-workflow.ts` | lock → write → check → activate → unlock flow |
| `src/safety.ts` | safety guards and policy enforcement |
| `src/audit.ts` | mutating action audit logging |
| `test/` | Vitest tests without live SAP dependency |

## Development Workflow

1. **Identify the tool surface.** Decide whether the change is a new MCP tool, a new operation on an intent facade, a helper improvement, documentation, or config only. Done when the affected files and user-facing behavior are listed.

2. **Keep schemas first.** For any new/changed tool argument, update `src/schemas.ts` before handler logic. Done when invalid inputs have clear Zod validation failures.

3. **Wire all three layers.** Tool changes normally require:
   - schema in `src/schemas.ts`
   - definition in `src/tools/tool-definitions.ts`
   - handler in `src/tools/handlers/...` plus dispatch in `src/tools/handler-map.ts`
   Done when `ListTools` exposes the right description and `CallTool` reaches the handler.

4. **Protect mutating operations.** If the tool writes, creates, deletes, activates, pulls, executes, changes transports, or otherwise mutates SAP state:
   - require the relevant safety flag and role gate
   - add audit logging
   - add it to the mutating-tool registry/blocklist coverage
   - ensure `batch_read` cannot invoke it
   Done when tests or static checks prove it cannot be called through read-only paths.

5. **Prefer token-efficient context.** Before adding a verbose read operation, consider method-level, contract-level, metadata-only, or batch-read alternatives. Done when the new behavior avoids unnecessary full-source payloads.

6. **Add diagnostics, not mystery errors.** Preserve SAP/ADT message details and return safe next actions. Done when a failed call tells the user what object/request/system condition failed.

7. **Verify.** Run:
   ```bash
   npm run build
   npm test
   ```
   Done only when commands return exit code 0, or the blocker is reported with exact output.

## Configuration Rules

Required connection variables:

```env
SAP_URL=https://dev-system:44300
SAP_USER=DEVELOPER
SAP_PASSWORD=...
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

Safe defaults:

```env
ALLOW_WRITE=false
ALLOW_DELETE=false
ALLOW_EXECUTE=false
BLOCKED_PACKAGES=SAP,SHD,SMOD
SYNTAX_CHECK_BEFORE_ACTIVATE=true
DEFER_TOOLS=true
REUSE_OPEN_TRANSPORT=true
```

Never put real values in tracked files. Documentation and examples must use placeholders.

## Common Pitfalls

1. **Adding a tool definition without a handler.** `ListTools` works but `CallTool` fails. Always wire schema, definition, and handler together.
2. **Forgetting mutating-tool coverage.** A write-like tool outside the registry can bypass audit or batch-read protection. Treat this as a security bug.
3. **Using `source` for large writes.** Prefer `sourcePath` for large ABAP/CDS sources to avoid JSON escaping and token waste.
4. **Hiding SAP errors.** Do not replace ADT/SAP messages with generic errors; wrap them with context.
5. **Testing against live SAP by default.** Unit tests should run without SAP credentials. Live diagnostics belong in explicit smoke scripts.

## Verification Checklist

- [ ] Relevant domain skill loaded.
- [ ] No secrets in tracked files.
- [ ] Schemas, definitions, handlers, and docs are consistent.
- [ ] Mutating behavior has safety gates, audit, and batch-read exclusion.
- [ ] `npm run build` passed.
- [ ] `npm test` passed or exact blocker reported.
