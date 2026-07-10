---
name: sap-cloud-adjacent
description: Use when ABAP-MCP work touches SAP AI Core, SAP Cloud SDK, SAP Datasphere, CAP, or other SAP cloud services adjacent to ABAP/BTP but not directly implemented by the MCP server.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, btp, cap, ai-core, cloud-sdk, datasphere]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP Cloud-Adjacent Work

## Overview

ABAP-MCP focuses on ABAP ADT workflows. It may interact with cloud-adjacent SAP topics such as CAP hybrid connectivity, SAP Cloud SDK consumers, SAP AI Core orchestration, or Datasphere models, but it is not a full replacement for those platforms' CLIs or SDKs. This skill tells agents how to handle that boundary.

## When to Use

Use this skill for:

- CAP projects using BTP Connectivity to reach ABAP.
- Documentation that references SAP Cloud SDK, AI Core, Datasphere, or Integration Suite.
- Requests to add MCP support for cloud-adjacent metadata or APIs.
- Deciding whether a requirement belongs in ABAP-MCP or an external tool/skill.

## Boundary Rules

- Do not pretend ABAP-MCP can administer AI Core, Datasphere, or Cloud SDK projects unless code actually exists for it.
- Keep ABAP-facing concerns in this repo; keep platform administration in dedicated tools/CLIs.
- If adding an integration, isolate credentials, document scopes, and keep read-only discovery separate from mutation.
- Prefer SAP official SDKs/CLIs for cloud services rather than scraping web UIs.

## CAP Hybrid Connectivity

When CAP is only used to provide a Cloud Connector route:

- Use `cds bind --for hybrid` outputs as credential sources only by path/reference.
- Do not commit `.cdsrc-private.json` or service-key JSON.
- Keep CF login/session assumptions in docs, not hardcoded code.
- Verify ABAP ADT reachability with `npm run diag:adt` after connectivity setup.

## Feature Intake Workflow

1. **Classify the request.** ABAP ADT, BTP connectivity, CAP app logic, AI Core orchestration, Datasphere modeling, or external API integration. Done when ownership is clear.

2. **Check existing MCP scope.** Search `src/tools/tool-definitions.ts` and handlers. Done when you know whether the server already has a tool category for it.

3. **Choose implementation boundary.** Add an ABAP-MCP tool only if it benefits ABAP development via ADT or safe adjacent discovery. Done when credentials, safety, and tests are feasible.

4. **Document prerequisites.** Cloud CLI login, service binding, API keys, destinations, and scopes must be explicit placeholders. Done when a new user can configure without secrets in repo.

## Common Pitfalls

1. **Overextending the MCP server.** Not every SAP cloud task belongs in ABAP-MCP.
2. **Committing cloud service credentials.** Never track service keys or private binding files.
3. **Confusing Cloud Connector routing with application auth.** Connectivity opens the tunnel; ABAP auth remains separate.
4. **Inventing SAP platform APIs.** Use official docs/SDKs or clearly mark assumptions.

## Verification Checklist

- [ ] The requirement is classified and scoped.
- [ ] No cloud credentials or private bindings are tracked.
- [ ] External SAP service assumptions are backed by docs or code.
- [ ] ABAP-MCP changes remain useful for ABAP/ADT workflows.
- [ ] Diagnostics or tests cover the new boundary behavior.
