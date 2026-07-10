---
name: abap-knowledge-base
description: Use when ABAP-MCP work should feed a persistent, citation-first SAP/ABAP knowledge base such as Gixsy95/abap_wiki instead of re-reading live ABAP source every session.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, knowledge-base, obsidian, wiki, citations, agent-memory]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# ABAP Knowledge Base / Live-to-Wiki Workflow

## Overview

ABAP-MCP is the live SAP/ADT tool server: it reads, edits, checks, and validates objects in the SAP system. A knowledge-base engine such as `Gixsy95/abap_wiki` is the long-term memory: it turns ABAP sources, metadata, dependencies, checks, and human answers into versioned, citable Markdown/Obsidian pages.

Reference sister project:

```text
https://github.com/Gixsy95/abap_wiki
```

Treat `abap_wiki` as a sister project, not as code to merge into ABAP-MCP. The clean boundary is: ABAP-MCP exports live evidence packages; abap_wiki imports them into its own SQLite/vault pipeline.

## When to Use

Use this skill when:

- An ABAP-MCP live analysis or change should become durable documentation.
- The same ABAP objects are read repeatedly across sessions.
- A package/system has legacy Z/Y objects with missing or stale documentation.
- Agents need citable context before deciding whether to query live SAP again.
- Designing tools such as `wiki_export_object_context`, `wiki_check_freshness`, or `wiki_export_change_evidence`.

Do not use this skill for one-off experiments where no durable knowledge is needed.

## Roles

| Component | Role |
|---|---|
| ABAP-MCP | Live SAP/ADT eyes and hands: read/edit/check/validate/export evidence |
| abap_wiki | Persistent verified memory: L0 inventory, L1 code analysis, L2 functional/process knowledge |
| Agent | Orchestrator: checks wiki first, uses ABAP-MCP when missing/stale, updates wiki after work |

## Recommended Workflow

1. **Check the wiki first.** Look for the object page or query the wiki if available. Done when the agent knows whether context is fresh, missing, or stale.

2. **Use ABAP-MCP only for gaps.** If the wiki lacks a page, has stale `source_hash`, or lacks needed dependencies, use live ABAP-MCP reads/checks. Done when source, metadata, where-used/call graph, and checks are collected.

3. **Export an evidence package.** Write local files only: sources, metadata, checks, graph, change summary, manifest. Done when no credentials/secrets/business table dumps are present.

4. **Let abap_wiki ingest.** abap_wiki owns its SQLite state, Obsidian vault, L0/L1/L2 promotion, citation validation, and lint. Done when wiki pages are updated through its pipeline, not hand-edited randomly.

5. **Answer with citations.** Final answers should cite wiki pages and live evidence separately. Done when users can distinguish persistent knowledge from fresh live-system observations.

## Evidence Package Shape

A future ABAP-MCP export should produce a folder like:

```text
output/wiki-ingest/<run-id>/
  manifest.yaml
  sources/
    clas-ZCL_EXAMPLE.abap
  metadata/
    object-info.json
    where-used.json
    call-graph.mmd
    syntax-check.json
    unit-tests.json
    atc-check.json
    ddic-validation.json
  evidence/
    change-summary.md
    verification.md
    decisions.md
```

Minimal `manifest.yaml` fields:

```yaml
run_id: "2026-07-10T23-45-ZCL_EXAMPLE"
system: "DEV"
client: "100"
package: "ZPACKAGE"
objects:
  - sap_type: "CLAS"
    sap_name: "ZCL_EXAMPLE"
    devclass: "ZPACKAGE"
    source_path: "sources/clas-ZCL_EXAMPLE.abap"
    object_url: "/sap/bc/adt/oo/classes/zcl_example"
checks:
  syntax: "metadata/syntax-check.json"
  unit: "metadata/unit-tests.json"
  atc: "metadata/atc-check.json"
graph:
  where_used: "metadata/where-used.json"
  call_graph: "metadata/call-graph.mmd"
```

## Future Tool Direction

| Tool idea | Owner | Purpose |
|---|---|---|
| `wiki_export_object_context` | ABAP-MCP | read live source/metadata/graph/checks and write an evidence package |
| `wiki_export_change_evidence` | ABAP-MCP | after a change, export verification and decision evidence |
| `wiki_check_freshness` | ABAP-MCP or bridge | compare live source hash with wiki frontmatter |
| `ingest-mcp-run` | abap_wiki | import an ABAP-MCP evidence package into the wiki pipeline |
| `wiki_query_context` | abap_wiki or bridge | query verified wiki pages before live reads |
| `wiki_validate_citations` | abap_wiki | verify `[VERIFIED: path:N-M]` citations and wiki integrity |

## Safety Rules

- Export packages must never contain SAP passwords, tokens, cookies, private hosts unless explicitly allowed, or broad business table contents.
- Wiki exports are local-file writes only; they must not mutate SAP state.
- abap_wiki should be the owner of wiki state transitions and citation validation.
- Live checks such as syntax, ATC, and unit results may be exported as evidence, but stale results must be timestamped and not treated as permanently true.
- If wiki and live SAP disagree, report drift and refresh the evidence package.

## Common Pitfalls

1. **Merging the engines.** ABAP-MCP and abap_wiki have different runtimes, state models, and purposes. Keep them connected by files/contracts.
2. **Treating generated summaries as proof.** Proof comes from source/citation paths and check outputs.
3. **Exporting too much.** Avoid huge related-object explosions; use limits and manifests.
4. **Forgetting freshness.** A verified wiki page can become stale after source changes.
5. **Skipping abap_wiki lint/gates.** Durable knowledge should pass citation and integrity checks before being trusted.

## Verification Checklist

- [ ] Wiki checked before live SAP when relevant.
- [ ] Live ABAP-MCP reads/checks are used only for gaps or stale pages.
- [ ] Evidence package excludes secrets and unnecessary business data.
- [ ] abap_wiki import/lint/gate owns durable page updates.
- [ ] Final answer distinguishes wiki citations from live observations.
