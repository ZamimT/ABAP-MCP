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

## Implementation Gate Checklist

Before implementing any roadmap item:

- [ ] It is read-only or offline.
- [ ] It has clear source/repo inspiration and license checked.
- [ ] It has schema-first tests.
- [ ] It cannot be called through mutating paths.
- [ ] It has row/size/time limits where data access is involved.
- [ ] It has docs in `.agent-skills` and user-facing README/AGENTS where relevant.
