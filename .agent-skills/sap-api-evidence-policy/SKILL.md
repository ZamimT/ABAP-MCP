---
name: sap-api-evidence-policy
description: Use when assessing SAP API usage, clean-core API choices, Business Accelerator Hub evidence, SAP Notes, Road Map claims, or confidence-rated API policy guidance.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, api, policy, evidence, api-hub, notes, roadmap]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP API Evidence and Policy

## Overview

API and clean-core decisions should be evidence-based. Marian Zeis' `sap-api-policy-skill` and `sap-mcp-servers` show a useful pattern: gather evidence from official SAP sources, rate confidence, cite sources, and avoid pretending to give legal/commercial decisions.

References:

```text
https://github.com/marianfoo/sap-api-policy-skill
https://github.com/marianfoo/sap-mcp-servers
```

Related MCP packages from `sap-mcp-servers`:

| Package | Purpose |
|---|---|
| `sap-api-hub-mcp` | SAP Business Accelerator Hub: published API status, specs, docs |
| `sap-note-search-mcp` | SAP Notes / KBAs search |
| `sap-roadmap-mcp` | SAP Road Map Explorer for planned/future features |
| `@marianfoo/sap-mcp-auth` | shared SAP IAS/SSO browser login module |

## When to Use

Use this skill for:

- Choosing between released APIs, private objects, BAPIs, CDS views, OData services, or custom wrappers.
- Assessing whether an integration aligns with SAP API policy or clean-core expectations.
- Looking for SAP Notes/KBAs related to an API, error, or limitation.
- Using roadmap information without overstating certainty.
- Writing final answers that need confidence levels and citations.

## Evidence Levels

| Level | Meaning | Example source |
|---|---|---|
| High | official current SAP source directly answers the question | Business Accelerator Hub, SAP Help, SAP Note/KBA |
| Medium | official but indirect, or multiple consistent community/source signals | Roadmap + docs, SAP Community plus docs |
| Low | plausible but not directly evidenced | examples, inferred behavior, old blog posts |
| Unknown | no reliable evidence found | ask user or SAP support/account/legal |

## Workflow

1. **State the scenario.** Identify API, consumer, data domain, system type, and target release. Done when scope is precise enough to search.

2. **Gather official evidence.** Prefer Business Accelerator Hub, SAP Help, SAP Notes, Architecture Center, released-object data, and official docs. Done when each key claim has a source or is marked unknown.

3. **Separate technical from policy/legal.** Agents may explain technical evidence, not issue binding legal or contract decisions. Done when final wording says "evidence suggests" rather than "SAP permits" unless SAP source is explicit.

4. **Rate confidence.** High/medium/low/unknown with reasons. Done when uncertainty is visible.

5. **Recommend next action.** Use released API, request SAP clarification, create wrapper, run ATC, search Notes, or use sister MCP. Done when the user has an actionable path.

## Hard Rules

- Do not claim legal/commercial compliance as fact.
- Do not treat Road Map Explorer as a guarantee for current implementation.
- Do not use unofficial blogs as the only evidence for policy-sensitive claims.
- Keep citations/source names with conclusions.

## Desired ABAP-MCP Tool Direction

Possible future read-only evidence tools:

| Tool idea | Purpose |
|---|---|
| `api_hub_lookup` | Find official API Hub package/API/spec metadata |
| `sap_note_search` | Search SAP Notes/KBAs by error/API/object |
| `sap_roadmap_search` | Check planned features with explicit uncertainty |
| `api_policy_assess` | Combine evidence into confidence-rated assessment |

These should be read-only and may be implemented as sister MCP references first.

## Verification Checklist

- [ ] Scenario and system context are explicit.
- [ ] Official sources are preferred and cited.
- [ ] Confidence level is stated.
- [ ] Legal/commercial conclusions are avoided.
- [ ] Roadmap/future claims are marked non-binding.
