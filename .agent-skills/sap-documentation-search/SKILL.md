---
name: sap-documentation-search
description: Use when ABAP-MCP work needs grounded SAP documentation, ABAP/RAP syntax evidence, SAP Community troubleshooting, feature availability, or local/offline doc-index guidance.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, documentation, abap, rap, community, docs]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP Documentation Search

## Overview

ABAP-MCP already has documentation-oriented tools such as ABAP keyword docs, class docs, syntax search, SAP web search, and Clean ABAP search. Marian Zeis' SAP documentation MCPs show a broader and more structured direction: local indexed SAP docs, ABAP Cloud vs Standard ABAP sources, SAP Community search, ABAP feature matrix lookup, and `abap_lint`-style preflight checks.

Useful references:

```text
https://github.com/marianfoo/mcp-sap-docs
https://github.com/marianfoo/abap-mcp-server
https://github.com/marianfoo/abap-docs
https://mcp-abap.marianzeis.de/mcp
http://mcp-sap-docs.marianzeis.de/mcp
```

## When to Use

Use this skill for:

- Looking up ABAP syntax, RAP patterns, annotations, and Fiori/CDS examples.
- Explaining whether ABAP syntax is Standard ABAP or ABAP Cloud compatible.
- Finding SAP Community posts for error messages and workarounds.
- Designing future ABAP-MCP documentation tools.
- Avoiding hallucinated APIs, keywords, annotations, or release behavior.

## Source Priority

| Source | Use for | Notes |
|---|---|---|
| Local ABAP docs index | syntax and keyword facts | Prefer offline, versioned docs where available |
| ABAP Cloud docs | cloud-restricted syntax | Keep separate from Standard ABAP docs |
| SAP Help | official current docs | Use for exact API/syntax references |
| SAP Community | troubleshooting and workarounds | Treat as community evidence, not official guarantee |
| Clean ABAP / DSAG guide | style and engineering guidance | Not a release-state authority |
| SAP samples / cheat sheets | examples | Validate before copying into customer systems |

## Desired ABAP-MCP Tool Direction

Future read-only documentation tools should look like:

| Tool idea | Purpose |
|---|---|
| `docs_search_sap` | Unified search over local SAP docs and optional online sources |
| `docs_fetch` | Fetch a document/community post by stable ID or URL |
| `abap_feature_matrix` | Check ABAP feature availability by flavor/version |
| `sap_community_search` | Dedicated community search for errors and workarounds |
| `abap_lint_source` | Local preflight linting before SAP writes |

These tools should never mutate SAP state and should cite source IDs/URLs.

## Workflow

1. **Classify the question.** Syntax, feature availability, troubleshooting, architecture, style, or API policy. Done when the right source category is chosen.

2. **Search official/local docs first.** Prefer local indexed docs and SAP Help for factual syntax/API claims. Done when the answer has a citation or explicit source label.

3. **Use community evidence for symptoms.** Search SAP Community for dumps, activation errors, Gateway/OData errors, and edge cases. Done when community answers are clearly marked as non-authoritative.

4. **Check flavor/version.** Distinguish Standard ABAP, ABAP Cloud, S/4HANA release, and BTP ABAP Environment. Done when compatibility claims include flavor/version assumptions.

5. **Verify before writing.** Documentation evidence is not enough for activation. Use live syntax/DDIC/ATC checks before SAP writes. Done when docs and system verification are not conflated.

## Common Pitfalls

1. **Mixing Standard ABAP and ABAP Cloud.** Syntax may exist but not be allowed in cloud.
2. **Treating examples as production code.** Samples need adaptation and validation.
3. **Overtrusting community posts.** They are useful diagnostics, not official policy.
4. **Citation-free claims.** If the agent cannot cite the source, label the answer as uncertain.

## Verification Checklist

- [ ] Source category is appropriate to the question.
- [ ] Official/local docs are preferred for factual claims.
- [ ] Community evidence is labeled as such.
- [ ] ABAP flavor/version assumptions are explicit.
- [ ] Live SAP validation is still required before writes.
