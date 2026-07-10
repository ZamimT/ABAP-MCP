---
name: sap-mcp-ecosystem
description: Use when deciding whether an SAP capability belongs inside ABAP-MCP, should remain a sister MCP, or should be captured as portable agent guidance.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, mcp, ecosystem, architecture, integration]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP MCP Ecosystem

## Overview

ABAP-MCP should stay focused on ABAP development through ADT: repository objects, RAP/CDS, transports, checks, documentation, and safe development workflows. The SAP AI/MCP ecosystem is broader: HANA, Datasphere, CAP, CPI, SuccessFactors, BTP account management, Fiori design, and OData business APIs all have their own security and authentication boundaries.

Use this skill to route work to the right boundary instead of building a fragile "SAP super-MCP".

Primary ecosystem catalog to monitor:

```text
https://github.com/marianfoo/sap-ai-mcp-servers
https://sap-ai-tools.marianzeis.de/
```

## When to Use

Use this skill when:

- Evaluating a new SAP MCP/server/skill to merge or reference.
- Adding agent guidance about external SAP tools.
- Deciding whether to implement a feature in ABAP-MCP or keep it as a sister MCP.
- Reviewing architecture proposals that span ABAP, HANA, BTP, Datasphere, CAP, CPI, SuccessFactors, or OData.

## Boundary Decision Matrix

| Capability | Default decision | Reason |
|---|---|---|
| ABAP ADT read/write, ATC, Unit, transports | In ABAP-MCP | Core purpose |
| RAP/CDS/service definition/binding | In ABAP-MCP | ABAP development workflow |
| Clean Core/released object checks | In ABAP-MCP | Directly affects ABAP Cloud/RAP choices |
| Offline ABAP lint/review | In ABAP-MCP | Complements live ADT and CI review |
| OData discovery/metadata/read-only smoke query | In ABAP-MCP, read-only first | Useful to test services ABAP-MCP creates |
| HANA direct DB access | Sister MCP | Separate DB credentials and data risk |
| SAP Datasphere | Sister MCP | Separate platform/API/auth model |
| CAP service MCP generation | Sister MCP | CAP app/runtime concern, not ADT |
| CPI/Integration Suite lifecycle | Sister MCP | Integration runtime and deploy risk |
| SuccessFactors | Sister MCP | HR/PII data sensitivity |
| BTP/Cloud Foundry account management | Sister MCP | Account/admin blast radius |
| Fiori UX/Figma/design system | Skill/reference or sister MCP | Not ABAP repository state |

## Recommended External MCPs to Track

| Area | Repo | Use |
|---|---|---|
| SAP MCP catalog | `marianfoo/sap-ai-mcp-servers` | Watch new SAP MCPs/skills |
| Clean Core / released objects | `ClementRingot/ROSA` | Released API/object guidance |
| ABAP translations | `ClementRingot/LISA` | Translation/i18n workflows |
| Offline ABAP analysis | `palimkarakshay/abap-mcp` | abaplint, ABAP Cloud readiness |
| OData/S/4 services | `lemaiwo/btp-sap-odata-to-mcp-server`, `Nidhideep/sap-s4-mcp-server` | OData discovery/metadata/query ideas |
| HANA | `HatriGt/hana-mcp-server` | Direct HANA schema/query MCP |
| CAP | `gavdilabs/cap-mcp-plugin` | Generate MCP surfaces from CAP services |
| Datasphere | `MarioDeFelipe/sap-datasphere-mcp` | Datasphere metadata/analytics APIs |
| BTP/CF admin | `marianfoo/btp-cf-mcp` | BTP account and Cloud Foundry inspection |
| CPI | `SathiyabalanSengodan/btp-is-ci-mcp-server` | Cloud Integration OData APIs |
| SuccessFactors | `aiadiguru2025/sf-mcp` | SuccessFactors OData MCP |

## Integration Rules

1. **Prefer references before code.** Add ecosystem guidance and links first. Done when agents know which external MCP to use.
2. **Prefer read-only before mutation.** New cross-domain features must start as discovery/metadata/read-only. Done when no business or platform state can be changed.
3. **Keep credentials scoped.** Do not reuse ABAP credentials for HANA, Datasphere, CPI, or SuccessFactors. Done when each domain has explicit env vars and docs.
4. **Namespace tools by domain.** Avoid flat duplicate names. Prefer future names like `odata_discover_services` or `clean_core_check_released_object`. Done when tool purpose is clear from its name.
5. **Promote only tight couplings.** Add code to ABAP-MCP only when it directly supports ABAP development through ADT or validates artifacts created by ABAP-MCP.

## Common Pitfalls

1. **Building a super-MCP.** Combining every SAP domain creates auth, security, and maintenance problems.
2. **Duplicate ABAP wrappers.** Multiple ADT MCPs often overlap; compare ideas instead of copying whole implementations.
3. **Crossing data boundaries silently.** HANA, OData, Datasphere, and SuccessFactors can expose sensitive business data.
4. **Ignoring licenses.** Do not copy code without checking license, NOTICE, and attribution requirements.

## Verification Checklist

- [ ] New capability is classified as core, adjacent, or sister MCP.
- [ ] Security boundary and credentials are explicit.
- [ ] Initial implementation is read-only unless explicitly approved.
- [ ] External repo/license is reviewed before copying code.
- [ ] AGENTS/skills explain which MCP or skill to use.
