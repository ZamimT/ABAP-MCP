---
name: offline-abap-analysis
description: Use when ABAP needs static analysis, abaplint-style checks, ABAP Cloud readiness review, RAP scaffolding, or code review without a live SAP system.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, abaplint, static-analysis, offline, ci]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# Offline ABAP Analysis

## Overview

ABAP-MCP is strongest when connected to a live SAP system through ADT. Some workflows should also work offline: abapGit exports, PR reviews, CI checks, generated ABAP snippets before upload, and ABAP Cloud readiness scans.

This skill captures the intended direction inspired by offline ABAP MCP work such as:

```text
https://github.com/palimkarakshay/abap-mcp
https://abaplint.org/
```

## When to Use

Use this skill for:

- Reviewing ABAP files without SAP credentials.
- Checking generated ABAP before `write_abap_source`.
- Scanning an abapGit repository/export.
- CI/static checks in GitHub without a SAP system.
- Designing future tools around abaplint or RAP scaffolding.

## Desired ABAP-MCP Tool Direction

Future tools should start offline/read-only:

| Tool idea | Purpose |
|---|---|
| `lint_abap_source` | Run syntax/style/static checks on provided ABAP text or file |
| `scan_abapgit_export` | Analyze a local abapGit export/repo for issues |
| `check_abap_cloud_readiness_offline` | Detect forbidden statements/dependencies from source where possible |
| `suggest_rap_skeleton` | Generate a RAP artifact skeleton without writing to SAP |
| `summarize_abap_dependencies_offline` | Extract classes/tables/FMs/CDS names from source for review |

Do not make offline tools pretend to know live DDIC metadata. Mark unknowns explicitly.

## Workflow

1. **Choose source input.** Accept `source`, `sourcePath`, or repository path. Done when the tool knows whether it analyzes one file or a tree.

2. **Run static checks.** Use abaplint-style parsing when available; otherwise use conservative regex extraction only as a fallback. Done when findings include line/column where possible.

3. **Separate certainty levels.** Distinguish parser-confirmed findings from heuristic warnings. Done when users can tell which findings require manual verification.

4. **Prepare safe fixes.** Suggest patches but do not write to SAP. Done when fixes can be reviewed locally first.

5. **Bridge to live ADT only when needed.** After offline checks pass, use live tools for DDIC validation, syntax check, ATC, and activation. Done when offline and live verification are not conflated.

## Safety Rules

- Offline analysis must not require SAP credentials.
- Do not upload or transmit customer source code to external services unless explicitly approved.
- Do not claim DDIC field validity from offline analysis alone.
- Keep generated scaffolds local until the user approves writing to SAP.

## Common Pitfalls

1. **False confidence.** Offline checks cannot replace system syntax, DDIC, ATC, or activation.
2. **Regex-only parsing.** Use a parser where possible; label heuristics clearly.
3. **Source leakage.** Local source may be confidential customer IP.
4. **Skipping live validation.** Offline green is not equivalent to SAP activation green.

## Verification Checklist

- [ ] Analysis can run without SAP credentials.
- [ ] Findings separate parser-confirmed and heuristic warnings.
- [ ] No source is sent to external services by default.
- [ ] Live DDIC/syntax/ATC validation is still required before SAP writes.
- [ ] Generated scaffolds remain local until explicitly written.
