# Live-to-Wiki Workflow: ABAP-MCP + abap_wiki

This document defines the sister-project workflow between ABAP-MCP and `Gixsy95/abap_wiki`.

- ABAP-MCP = live SAP/ADT tool server.
- abap_wiki = persistent, citation-first Markdown/Obsidian knowledge base.

Reference:

```text
https://github.com/Gixsy95/abap_wiki
```

## Goal

Agents should avoid re-reading large ABAP sources every session. They should first use verified wiki context. When the wiki is missing or stale, they read live SAP through ABAP-MCP, export evidence, and let abap_wiki ingest the result.

```text
User request
  -> query abap_wiki for verified context
  -> if missing/stale, use ABAP-MCP live reads/checks
  -> export local evidence package
  -> abap_wiki imports/lints/promotes
  -> final answer cites wiki and live evidence separately
```

## Operating Modes

### Mode 0 — Manual pilot, no new tools

Use today for 1-2 objects:

1. Use ABAP-MCP live tools:
   - `read_abap_source`
   - `get_object_info`
   - `where_used`
   - `get_call_graph`
   - `run_syntax_check`
   - `run_unit_tests`
   - `run_atc_check`
2. Save source/check/graph outputs locally under `output/wiki-ingest/<run-id>/`.
3. Manually adapt the files for abap_wiki ingestion.
4. Run abap_wiki lint/gates.
5. Commit wiki updates in the abap_wiki repo.

Use this mode to learn which export fields are actually needed before building tools.

### Mode 1 — ABAP-MCP evidence export

Implement `wiki_export_object_context` in ABAP-MCP. It remains read-only against SAP and writes only local files.

Output shape:

```text
output/wiki-ingest/<run-id>/
  manifest.yaml
  sources/
  metadata/
  evidence/
```

### Mode 2 — abap_wiki importer

Implement `ingest-mcp-run` in abap_wiki. It imports the ABAP-MCP evidence package into abap_wiki's own state machine, citation model, and vault.

ABAP-MCP should not directly edit abap_wiki SQLite state.

### Mode 3 — freshness loop

Implement `wiki_check_freshness` so agents can compare wiki `source_hash` with live source hash before deciding whether to read live SAP.

### Mode 4 — post-change evidence

Implement `wiki_export_change_evidence` for ABAP-MCP. After a live edit, it exports:

- changed object/source hash
- transport/request info
- syntax/unit/ATC results
- DDIC validation result
- change summary and rationale

## Evidence Package Contract

Minimal `manifest.yaml`:

```yaml
schema_version: 1
run_id: "2026-07-10T23-45-ZCL_EXAMPLE"
created_at: "2026-07-10T23:45:00Z"
producer: "ABAP-MCP"
system_alias: "DEV"
client: "100"
language: "EN"
package: "ZPACKAGE"
objects:
  - sap_type: "CLAS"
    sap_name: "ZCL_EXAMPLE"
    devclass: "ZPACKAGE"
    object_url: "/sap/bc/adt/oo/classes/zcl_example"
    source_path: "sources/clas-ZCL_EXAMPLE.abap"
    source_hash: "md5-or-sha256"
metadata:
  object_info: "metadata/object-info.json"
  where_used: "metadata/where-used.json"
  call_graph: "metadata/call-graph.mmd"
checks:
  syntax: "metadata/syntax-check.json"
  unit: "metadata/unit-tests.json"
  atc: "metadata/atc-check.json"
  ddic: "metadata/ddic-validation.json"
evidence:
  change_summary: "evidence/change-summary.md"
  verification: "evidence/verification.md"
```

## Data Rules

Do export:

- object identifiers
- package/devclass
- source text when user approved source export
- source hash
- dependency graph/where-used metadata
- check results
- change summary and rationale

Do not export:

- passwords, tokens, cookies, service keys
- broad business table contents
- private/internal hostnames unless explicitly allowed
- personal data from productive systems

## Freshness Rule

A wiki page is fresh only if:

```text
wiki source_hash == live ABAP-MCP source_hash
```

If hashes differ, answer from wiki only as historical context and refresh through ABAP-MCP before making live changes.

## Tool Roadmap

| Phase | Tool | Owner | Status |
|---|---|---|---|
| 1 | `wiki_export_object_context` | ABAP-MCP | planned |
| 2 | `ingest-mcp-run` | abap_wiki | planned |
| 3 | `wiki_check_freshness` | ABAP-MCP/bridge | planned |
| 4 | `wiki_export_change_evidence` | ABAP-MCP | planned |
| 5 | `wiki_query_context` | abap_wiki/bridge | planned |

These tools are not implemented in ABAP-MCP today. They are planning names and must not be claimed as exposed by `ListTools` until implemented with schemas, handlers, tests, limits, and docs.

## Completion Criteria for a Live-to-Wiki Session

- [ ] Wiki was checked first or explicitly skipped for a one-off task.
- [ ] Live SAP reads/checks were captured as local evidence.
- [ ] No credentials or unnecessary business data were exported.
- [ ] abap_wiki imported/linted the evidence or the manual gap is documented.
- [ ] Final answer cites whether information came from wiki or live ABAP-MCP.
