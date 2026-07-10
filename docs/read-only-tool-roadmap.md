# Read-Only Tool Roadmap for ABAP-MCP

This roadmap captures the safe implementation order for integrating ideas from SAP sister MCPs without turning ABAP-MCP into an unsafe super-MCP.

## Principles

1. Start read-only and offline where possible.
2. Keep each SAP domain behind its own credentials and safety model.
3. Prefer sister MCP references for domains outside ABAP/ADT.
4. Add mutation only after explicit flags, role checks, audit logging, tests, and user approval.
5. Keep tools namespace-clear and token-efficient.

## Phase 1 — Documentation and Evidence Tools

| Candidate tool | Source inspiration | Purpose | Risk |
|---|---|---|---|
| `docs_search_sap` | `marianfoo/mcp-sap-docs` | unified SAP docs search | low |
| `docs_fetch` | `marianfoo/abap-mcp-server` | fetch document/community post by ID/URL | low |
| `abap_feature_matrix` | `marianfoo/abap-mcp-server` | feature/flavor availability | low |
| `sap_community_search` | `marianfoo/abap-mcp-server` | troubleshooting search | low |
| `sap_note_search` | `marianfoo/sap-mcp-servers` | SAP Notes/KBA evidence | medium: auth |
| `api_hub_lookup` | `marianfoo/sap-mcp-servers` | official API metadata/specs | medium: auth |

## Phase 2 — Offline ABAP Checks

| Candidate tool | Source inspiration | Purpose | Risk |
|---|---|---|---|
| `abap_lint_source` | `abaplint`, `palimkarakshay/abap-mcp`, `marianfoo/abap-mcp-server` | local source lint | low |
| `scan_abapgit_export` | abaplint/offline MCPs | PR/CI review of abapGit exports | low |
| `check_abap_cloud_readiness_offline` | abaplint + released-object data | preflight cloud readiness | low-medium |

## Phase 3 — Clean Core / Released Object Checks

| Candidate tool | Source inspiration | Purpose | Risk |
|---|---|---|---|
| `check_released_object` | ROSA / Cloudification Repository | released-object status | low |
| `find_clean_core_alternative` | ROSA | suggest released replacement | low |
| `explain_clean_core_violation` | ROSA + ATC findings | explain remediation | low |

## Phase 4 — OData Read-Only Verification

| Candidate tool | Source inspiration | Purpose | Risk |
|---|---|---|---|
| `odata_discover_services` | `odata-mcp-proxy`, S/4 OData MCPs | service catalog discovery | medium: business system access |
| `odata_get_metadata` | OData MCPs | summarize `$metadata` | medium |
| `odata_list_entity_sets` | OData MCPs | entity/field/navigation map | medium |
| `odata_query_entity_readonly` | OData MCPs | constrained smoke query | high: data exposure |
| `odata_get_value_help` | S/4 OData MCPs | dropdown/value list read | medium-high |

Guardrails for Phase 4:

- GET only.
- `$top` required by default.
- `$select` preferred.
- sensitive values masked or summarized.
- separate OData credentials/config.
- audit service, entity, row count, selected fields.

## Phase 5 — Knowledge Base / Agentic Memory

`Gixsy95/abap_wiki` is a sister project for persistent, citation-first ABAP knowledge. ABAP-MCP should not absorb its Python/SQLite/Obsidian engine. Instead, ABAP-MCP can later export local evidence packages that abap_wiki imports through its own pipeline.

| Candidate tool | Owner | Purpose | Risk |
|---|---|---|---|
| `wiki_export_object_context` | ABAP-MCP | export live source, metadata, where-used/call graph, and checks into a local evidence package | low-medium: source export |
| `wiki_export_change_evidence` | ABAP-MCP | after a live change, export verification results, transport info, and decision notes | low-medium |
| `wiki_check_freshness` | ABAP-MCP or bridge | compare wiki `source_hash` with live source hash before using stale context | low |
| `ingest-mcp-run` | abap_wiki | import an ABAP-MCP evidence package into abap_wiki's SQLite/vault pipeline | medium: separate repo state |
| `wiki_query_context` | abap_wiki or bridge | query verified wiki pages before live ABAP reads | low |
| `wiki_validate_citations` | abap_wiki | validate `[VERIFIED: path:N-M]` citations and wiki integrity | low |

Guardrails for Phase 5:

- ABAP-MCP writes only local evidence files; it does not edit abap_wiki SQLite state directly.
- Evidence packages must exclude credentials, tokens, cookies, broad table dumps, and unnecessary business data.
- abap_wiki owns citation validation, L0/L1/L2 promotion, Obsidian vault updates, and lint/gates.
- Wiki context is authoritative only when its `source_hash` matches live source or is explicitly treated as historical.

See [`live-to-wiki-workflow.md`](./live-to-wiki-workflow.md) for the sister-project contract.

## Defer / Keep as Sister MCPs

| Domain | Recommended path |
|---|---|
| HANA direct DB access | Sister MCP (`HatriGt/hana-mcp-server`) |
| Datasphere | Sister MCP (`MarioDeFelipe/sap-datasphere-mcp`) |
| CAP service MCP generation | Sister MCP/plugin (`gavdilabs/cap-mcp-plugin`) |
| BTP/CF administration | Sister MCP (`marianfoo/btp-cf-mcp`) |
| Cloud ALM | Sister MCP (`marianfoo/calmcp`) |
| CPI/Integration Suite | Sister MCP (`btp-is-ci-mcp-server`, `odata-mcp-proxy`) |
| SuccessFactors | Sister MCP (`aiadiguru2025/sf-mcp`) |
| ABAP translations | Sister MCP first (`marianfoo/LISA`) |
| ABAP knowledge base | Sister project first (`Gixsy95/abap_wiki`) |

## Implementation Gate Checklist

Before implementing any roadmap item:

- [ ] It is read-only or offline.
- [ ] It has clear source/repo inspiration and license checked.
- [ ] It has schema-first tests.
- [ ] It cannot be called through mutating paths.
- [ ] It has row/size/time limits where data access is involved.
- [ ] It has docs in `.agent-skills` and user-facing README/AGENTS where relevant.
