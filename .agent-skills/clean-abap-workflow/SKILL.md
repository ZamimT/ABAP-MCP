---
name: clean-abap-workflow
description: Use when generating, editing, or reviewing ABAP code so every agent applies the local Clean ABAP guide and the MCP clean-code tools before writing or approving code.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, clean-abap, review, coding-standards]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# Clean ABAP Workflow

## Overview

The repository includes the SAP Clean ABAP guide under `clean-abap/`. This skill turns that reference into an agent workflow: search the guide before writing, validate generated code before pushing, and review legacy code before changing it.

## When to Use

Use this skill whenever an agent:

- Writes ABAP source, ABAP Unit tests, CDS-adjacent ABAP, or RAP behavior implementation code.
- Reviews ABAP code for maintainability.
- Uses `write_abap_source`, `edit_abap_method`, `create_test_include`, or `execute_abap_snippet`.
- Explains coding style decisions to a user.

## Workflow

1. **Inspect local conventions.** Read nearby source and package conventions before applying generic style. Done when naming, exception, test, and formatting patterns are known.

2. **Search Clean ABAP guidance.** Use the MCP tool `search_clean_abap` when connected, or read `clean-abap/CleanABAP.md` locally. Done when the relevant rule names are identified.

3. **Prefer modern, readable ABAP.** Favor clear names, small methods, constructor expressions where readable, class-based exceptions, ABAP Unit tests, and explicit contracts. Done when generated code can be explained without hidden assumptions.

4. **Validate before writing.** Before `write_abap_source`, run or request `validate_ddic_references` for table/field-heavy code and `run_syntax_check` when available. Done when invalid field names and syntax issues are handled before activation.

5. **Review before final answer.** Use `review_clean_abap` on meaningful ABAP changes. Done when findings are fixed or consciously documented.

## Hard Rules

- Full-line `*` comments must start at column 1. Use `"` for indented comments.
- Do not invent DDIC table fields, CDS elements, classes, BAPIs, or message IDs. Validate them against the system or ask for the source.
- Prefer `sourcePath` for large code writes.
- Do not activate code with known syntax errors.
- Keep PROD and QAS read-only unless the user explicitly approved a safe workflow.

## Common Pitfalls

1. **Blindly modernizing legacy code.** Keep behavioral changes separate from cleanup.
2. **Assuming field names.** DDIC hallucinations are common; validate first.
3. **Overwriting whole classes for one method.** Prefer `edit_abap_method` for method-local changes.
4. **Skipping ABAP Unit.** If code has tests or the change is logic-heavy, run or add ABAP Unit tests.

## Verification Checklist

- [ ] Relevant Clean ABAP guidance was searched/read.
- [ ] DDIC references were validated for table/field-heavy code.
- [ ] Syntax check or activation result was reviewed.
- [ ] Clean ABAP review findings were fixed or documented.
- [ ] Behavioral changes and style-only changes are not mixed unnecessarily.
