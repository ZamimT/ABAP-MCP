---
name: abap-i18n-translation
description: Use when ABAP-MCP work involves SAP repository object translations, text pools, message classes, CDS labels, data element/domain texts, or LISA-style i18n workflows.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, i18n, translation, xco, lisa]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# ABAP i18n and Translation Workflows

## Overview

Translation is an ABAP-adjacent development workflow with its own data model and safety concerns. LISA (Localization & Internationalization Service for ABAP) shows a focused MCP approach: a small translation-focused server backed by an ABAP HTTP service using SAP XCO i18n APIs.

Reference:

```text
https://github.com/marianfoo/LISA
```

ABAP-MCP should not absorb all of LISA by default. It should reference LISA as a sister MCP and optionally add small read-only i18n diagnostics later.

## When to Use

Use this skill for:

- Data element/domain/CDS/message class/class text pool translations.
- Reviewing multilingual readiness of generated ABAP/RAP artifacts.
- Designing future ABAP-MCP i18n tools.
- Deciding whether to use LISA as a sister MCP.

## Candidate Objects

| Object/text area | Examples |
|---|---|
| DDIC texts | data element labels, domain fixed-value texts |
| CDS annotations | labels, quick info, field descriptions |
| Message classes | message short/long texts |
| Class/function group text pools | selection texts, text symbols |
| Fiori exposure | labels surfaced through metadata extensions |

## Desired ABAP-MCP Tool Direction

Start read-only:

| Tool idea | Purpose |
|---|---|
| `i18n_list_texts` | list translatable texts for an object |
| `i18n_compare_languages` | compare source/target language coverage |
| `i18n_find_missing_translations` | report missing translations |
| `i18n_suggest_translation_plan` | suggest workflow, not write translations |

Writing translations should remain out of scope until explicit safety, authorization, and audit design exists, or should be delegated to LISA.

## Workflow

1. **Identify translatable artifacts.** Determine whether the object has DDIC, CDS, message, or text-pool translations. Done when text sources are listed.

2. **Check language scope.** Source language, target languages, and fallback behavior must be explicit. Done when no translation target is assumed.

3. **Prefer read-only comparison.** Identify missing/stale translations before suggesting writes. Done when gaps are documented.

4. **Delegate write-heavy translation.** For actual translation management, consider LISA or a dedicated workflow. Done when ABAP-MCP stays focused unless i18n support is explicitly implemented.

5. **Preserve terminology.** SAP/business terms should not be freely paraphrased without domain review. Done when uncertain terms are flagged.

## Common Pitfalls

1. **Treating translations as comments.** They are user-facing metadata and often regulated by process.
2. **Overwriting business terminology.** Translation needs domain validation.
3. **Ignoring fallback language behavior.** Missing translations can surface unexpectedly.
4. **Mixing generation and activation.** Translation writes should have their own review/audit path.

## Verification Checklist

- [ ] Source and target languages are explicit.
- [ ] Text sources are identified.
- [ ] Missing/stale translations are reported read-only first.
- [ ] Write workflow is delegated or separately approved.
- [ ] Business terminology uncertainties are flagged.
