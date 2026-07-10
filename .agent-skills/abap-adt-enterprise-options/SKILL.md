---
name: abap-adt-enterprise-options
description: Use when comparing ABAP-MCP with enterprise ADT alternatives such as vsp/vibing-steampunk or OpenADT, especially for transport controls, package whitelists, HTTP transport, SNC/SSO, or JCo-based auth.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, abap, adt, enterprise, governance, sso, transport]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# ABAP ADT Enterprise Options

## Overview

ABAP-MCP is a Node/TypeScript ADT MCP focused on agentic ABAP development. Marian Zeis' ecosystem contains enterprise-oriented ADT alternatives and references that are useful for comparison, not blind copying.

References:

```text
https://github.com/marianfoo/vibing-steampunk
https://github.com/marianfoo/openadt
```

`vibing-steampunk`/`vsp` emphasizes a single Go binary, read-only/package whitelist modes, transport controls, HTTP Streamable transport, token-efficient tool modes, method-level edit/read, and context compression.

`openadt` emphasizes terminal/CI/agent ADT access using the same SAP JCo/SNC logon stack as Eclipse ADT, including `openadt fetch`, `openadt proxy`, and `openadt mcp serve`.

## When to Use

Use this skill for:

- Deciding whether ABAP-MCP needs stronger enterprise governance.
- Considering SAP SSO/SNC/JCo instead of Basic Auth/service credentials.
- Designing transport/package write controls.
- Comparing HTTP Streamable transport vs stdio.
- Packaging/deployment discussions for enterprise clients.

## Ideas Worth Considering for ABAP-MCP

| Idea | Source inspiration | Why useful |
|---|---|---|
| package whitelist/allowlist | vsp | reduce risk of writing outside intended namespaces/packages |
| transport required before write | vsp | prevent uncontrolled/generated transport sprawl |
| explicit tool profiles | vsp | small/default/full tool surfaces for token economy |
| HTTP Streamable transport | vsp/OpenADT | remote clients, Copilot Studio, shared service deployments |
| SNC/SSO/JCo auth option | OpenADT | enterprise login parity with Eclipse/SAP GUI |
| ADT proxy mode | OpenADT | reuse warm sessions and support tools/scripts |

## Boundary Rules

- Do not mix runtimes blindly. Go single-binary and Java/JCo architectures do not drop into the Node MCP without design work.
- Do not copy authentication code without license/security review.
- Treat SSO/SNC as an enterprise feature requiring explicit installation prerequisites.
- Keep Basic Auth/dev-mode simple for local developer workflows.

## Decision Workflow

1. **Identify the enterprise requirement.** SSO, audit, transport governance, package restriction, remote HTTP, packaging, or CI. Done when the requirement is named.

2. **Check current ABAP-MCP capability.** Inspect existing config, safety flags, audit, and transport behavior. Done when the gap is concrete.

3. **Choose adaptation level.** Document-only, config enhancement, new read-only diagnostic, or new mutating guard. Done when no broad architecture rewrite is implied by a small requirement.

4. **Start with policy/gates before new write power.** Add restrictions before adding capabilities. Done when new enterprise features lower risk first.

5. **Verify on Windows and Node runtime.** Any borrowed idea must fit this repo's TypeScript/Node build. Done when build/tests pass.

## Common Pitfalls

1. **Assuming one auth stack fits all enterprises.** SAP landscapes differ widely.
2. **Adding writes before governance.** Transport/package controls should come first.
3. **Over-optimizing packaging.** Single binary is attractive but may not justify a rewrite.
4. **Ignoring client compatibility.** stdio and HTTP transports serve different users.

## Verification Checklist

- [ ] Enterprise requirement is explicit.
- [ ] Current ABAP-MCP gap is documented.
- [ ] Proposed change lowers risk or preserves safe defaults.
- [ ] Auth/runtime/license implications are reviewed.
- [ ] Build and tests pass after changes.
