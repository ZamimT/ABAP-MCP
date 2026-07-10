---
name: sap-clean-core-released-objects
description: Use when ABAP-MCP work must respect SAP Clean Core, ABAP Cloud restrictions, released object/API usage, or S/4HANA Cloudification Repository guidance.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, clean-core, abap-cloud, released-objects, rosa]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP Clean Core and Released Objects

## Overview

Clean Core work needs more than Clean ABAP formatting. Agents must know whether an object/API is released for ABAP Cloud, whether an unreleased object has a released replacement, and whether a planned dependency creates upgrade risk.

This skill captures the intended ABAP-MCP direction inspired by ROSA (Released Objects Search Assistant):

```text
https://github.com/ClementRingot/ROSA
```

Use ROSA and the SAP Cloudification Repository as reference material for future implementation, but do not copy code without license review.

## When to Use

Use this skill for:

- ABAP Cloud / Steampunk / S/4HANA Cloud development.
- RAP services intended to be Clean Core compliant.
- Replacing unreleased SAP objects, tables, function modules, classes, or APIs.
- Reviews that mention ATC Clean Core findings or Cloudification Repository results.
- Designing future tools such as `check_released_object` or `find_clean_core_alternative`.

## Desired ABAP-MCP Tool Direction

Future read-only tools should be shaped like:

| Tool idea | Purpose |
|---|---|
| `check_released_object` | Tell whether an object is released/allowed for ABAP Cloud or Clean Core |
| `find_clean_core_alternative` | Suggest released alternatives for unreleased objects |
| `check_abap_cloud_readiness` | Scan a source/object dependency list for ABAP Cloud compatibility |
| `explain_clean_core_violation` | Explain why a dependency is risky and how to remediate |

These should be read-only, require no SAP mutation flags, and produce compact citations to the underlying source of truth.

## Workflow

1. **Identify dependencies.** Extract tables, classes, interfaces, function modules, CDS views, APIs, and packages used by the code. Done when the dependency list is explicit.

2. **Check release status.** Use ROSA/external released-object data, ATC findings, or SAP docs. Done when each risky object is marked released, unreleased, unknown, or custom.

3. **Find alternatives.** For unreleased SAP objects, look for released CDS views, RAP BOs, classes, APIs, or BAPIs. Done when the recommendation avoids private SAP internals where possible.

4. **Document exceptions.** If no released alternative exists, document the risk and scope the dependency. Done when the final answer names the technical debt clearly.

5. **Keep code and policy separate.** Do not silently rewrite business logic just to satisfy Clean Core. Done when behavioral changes are explicit and tested.

## Hard Rules

- Do not modify SAP namespace objects.
- Do not present an object as released unless checked against a trusted source.
- Do not treat Clean ABAP style compliance as Clean Core compliance; they are different.
- Keep custom objects in Z/Y namespaces and safe packages.

## Common Pitfalls

1. **Conflating style and release state.** Clean ABAP says code is readable; Clean Core says dependencies are upgrade-safe.
2. **Guessing released alternatives.** Verify alternatives before recommending them.
3. **Ignoring dynamic usage.** Static scans may miss dynamic calls; mark uncertainty.
4. **Overfixing legacy code.** Separate compatibility remediation from unrelated refactoring.

## Verification Checklist

- [ ] SAP/private object dependencies were identified.
- [ ] Release state was checked or marked unknown.
- [ ] Alternatives were suggested for unreleased dependencies.
- [ ] Exceptions are documented as technical debt.
- [ ] No mutation was required for release-status checks.
