# Agent Instructions for ABAP-MCP

These instructions are intentionally portable. Codex, Claude Code, OpenCode, Hermes, Cursor/Cline, and similar coding agents should all be able to use them.

## Repository Purpose

This repository is an MCP server for agentic SAP ABAP development via the ADT REST API. It exposes tools for ABAP search/read/write, CDS/RAP/OData creation, syntax/ATC/unit checks, transports, abapGit, Clean ABAP review, BTP connectivity routing, and SAP documentation lookup.

## Always Load These Local Skills

When working in this repository, read the relevant Markdown skill files before changing code or configuring the server:

| Task | Read first |
|---|---|
| Any ABAP-MCP code/config change | `.agent-skills/abap-mcp-development/SKILL.md` |
| Clean ABAP review or generated ABAP | `.agent-skills/clean-abap-workflow/SKILL.md` |
| BTP Cloud Connector / SAProuter / proxy connectivity | `.agent-skills/sap-btp-connectivity/SKILL.md` |
| CDS, RAP, service definition/binding, Fiori Elements | `.agent-skills/sap-rap-fiori/SKILL.md` |
| HANA, SQLScript, AMDP, DDIC/table access | `.agent-skills/sap-hana-sqlscript/SKILL.md` |
| External APIs, OData, integration design | `.agent-skills/sap-api-integration-style/SKILL.md` |
| Datasphere / AI Core / Cloud SDK adjacent work | `.agent-skills/sap-cloud-adjacent/SKILL.md` |
| Deciding whether to merge/reference another SAP MCP | `.agent-skills/sap-mcp-ecosystem/SKILL.md` |
| Clean Core / released object / ABAP Cloud compatibility | `.agent-skills/sap-clean-core-released-objects/SKILL.md` |
| Offline ABAP lint/review without live SAP access | `.agent-skills/offline-abap-analysis/SKILL.md` |
| Read-only OData discovery/metadata/smoke testing | `.agent-skills/sap-odata-readonly/SKILL.md` |
| Grounded SAP docs, ABAP feature matrix, SAP Community evidence | `.agent-skills/sap-documentation-search/SKILL.md` |
| SAP API policy/evidence, API Hub, Notes, Road Map | `.agent-skills/sap-api-evidence-policy/SKILL.md` |
| Enterprise ADT alternatives, SSO/SNC/JCo, transport/package governance | `.agent-skills/abap-adt-enterprise-options/SKILL.md` |
| ABAP translations/i18n/text pools/message texts | `.agent-skills/abap-i18n-translation/SKILL.md` |

Claude Code can also load mirrored native skills from `.claude/skills/*/SKILL.md`. The `.agent-skills` copies are the source of truth for all agents.

## Build and Test

Use the project scripts:

```bash
npm install
npm run build
npm test
```

Tests are Vitest tests and should not require a live SAP system. Do not claim a change works until the relevant command actually ran and returned successfully.

## Safety Rules

- Never commit real SAP credentials, service keys, passwords, cookies, tokens, private keys, or customer hostnames.
- Treat `.env` as local-only secret material. Use `.env.example` for placeholders and documentation.
- Keep write/delete/execute actions disabled by default: `ALLOW_WRITE=false`, `ALLOW_DELETE=false`, `ALLOW_EXECUTE=false`.
- For DEV-only exceptions, document the risk and keep PROD read-only.
- Do not remove namespace/package guards unless the user explicitly requests it and understands the risk.

## MCP Tool Design Rules

- Prefer small, composable tools with explicit schemas.
- Keep mutating tools behind safety flags and audit logging.
- Add new mutating tools to the mutating-tool registry so `batch_read` cannot call them and audit coverage stays complete.
- If a tool can avoid a full object read/write, prefer a token-efficient operation (method-level, contract-level, metadata-only, batch read).
- For SAP operations, fail with actionable diagnostics: object name, ADT URL, SAP message text, and safe next step.

## Completion Criteria

Before finishing a code/config task:

- [ ] Relevant `.agent-skills/.../SKILL.md` files were read and applied.
- [ ] No secrets were added to tracked files.
- [ ] `npm run build` passed for TypeScript changes.
- [ ] `npm test` passed for helper/tool/schema/safety changes, or the reason it could not run is reported.
- [ ] New mutating capability has safety flag, audit coverage, and tests.
- [ ] User-facing docs mention required env vars and safe defaults.
