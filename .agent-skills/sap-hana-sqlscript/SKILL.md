---
name: sap-hana-sqlscript
description: Use when ABAP-MCP work touches HANA-backed DDIC objects, SQLScript, AMDP, SELECT queries, table contents, performance traces, or database-oriented troubleshooting.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, hana, sqlscript, amdp, ddic, performance]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP HANA, SQLScript, AMDP, and DDIC

## Overview

ABAP-MCP is not a general HANA administration CLI, but it exposes enough ADT/DDIC/query functionality to help agents reason about HANA-backed ABAP development: table fields, DDIC elements, read-only queries, performance traces, AMDP class docs, and syntax documentation.

## When to Use

Use this skill for:

- DDIC tables/views/domains/data elements.
- SQLScript or AMDP-related ABAP classes.
- `run_select_query`, `get_table_fields`, `get_table_contents`, or `get_ddic_element`.
- Performance trace analysis.
- SELECT-heavy ABAP generation.

## Data Safety

- Treat `run_select_query` and table content reads as sensitive data access.
- Use narrow projections and filters; do not dump whole business tables.
- Never write DB-changing snippets. `execute_abap_snippet` must remain read-only and should reject DB `INSERT`, `UPDATE`, `DELETE`, `MODIFY`, `COMMIT WORK`, and unsafe BAPI calls.
- Do not expose customer data in final answers; summarize structure and findings.

## Workflow

1. **Discover structure first.** Use `get_table_fields` or `get_ddic_element` before writing SELECT logic. Done when field names, keys, and types are confirmed.

2. **Prefer Open SQL in ABAP unless SQLScript is required.** Only use AMDP/SQLScript for clear pushdown/performance reasons. Done when the reason for database pushdown is explicit.

3. **Validate SELECT logic safely.** Use small `UP TO n ROWS`, restrictive `WHERE`, and only needed columns. Done when query behavior is understood without broad data extraction.

4. **Check performance when relevant.** Use traces or explain expensive statements with indexed keys and cardinality assumptions. Done when performance claims are grounded in system data or clearly marked as assumptions.

5. **Document HANA-specific assumptions.** Note dependencies on HANA functions, CDS annotations, or AMDP marker interfaces. Done when portability limits are explicit.

## Common Pitfalls

1. **Guessing table fields.** Always inspect DDIC first.
2. **Fetching too much data.** Keep reads narrow and anonymize outputs.
3. **Using SQLScript for ordinary business logic.** Prefer maintainable ABAP/Open SQL unless pushdown is justified.
4. **Ignoring client/language fields.** Many SAP tables require correct client and language filtering.

## Verification Checklist

- [ ] DDIC/table fields were inspected before use.
- [ ] Queries are read-only, narrow, and filtered.
- [ ] Sensitive data is not copied into docs/final answers.
- [ ] HANA/AMDP-specific assumptions are documented.
- [ ] Performance claims are backed by traces or marked as assumptions.
