---
name: sap-api-integration-style
description: Use when designing SAP OData/API exposure, integration flows, workflow queries, BAPI-like operations, or ABAP-MCP tools that present SAP business data to external consumers.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, api, odata, integration, workflow, clean-core]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP API and Integration Style

## Overview

ABAP-MCP can expose and inspect SAP objects, create service definitions/bindings, analyze workflows, and execute read-only business queries. This skill keeps API/integration work stable, clean-core aligned, and safe for enterprise environments.

## When to Use

Use this skill for:

- OData service definitions and service bindings.
- External API shape, naming, versioning, and error design.
- Workflow metadata/instance/agent analysis.
- Integration docs involving BAPI/RFC concepts, Cloud SDK, or SAP Integration Suite.
- MCP tools that return SAP business data to AI clients.

## API Design Rules

- Use stable business names, not implementation table names, in external API contracts.
- Keep API payloads minimal and typed; do not mirror huge SAP internal structures by default.
- Define error semantics explicitly: validation error, authorization error, not found, conflict/lock, backend failure.
- Preserve SAP message details for diagnostics but avoid leaking sensitive values.
- Version externally consumed APIs when changing response shape or semantics.

## Clean Core Rules

- Prefer released APIs/CDS views/classes where available.
- Avoid modifying SAP namespace objects.
- Keep custom artifacts in Z/Y namespace and safe packages.
- Document any unreleased/private object dependency as technical debt.

## Integration Workflow

1. **Identify the consumer.** Fiori UI, external system, agent tool, batch integration, or diagnostic-only. Done when latency, auth, and payload requirements are clear.

2. **Select the right artifact.** CDS/OData for queryable data, RAP for transactional services, workflow analysis tools for process insight, read-only queries for diagnostics only. Done when artifact choice matches consumer intent.

3. **Shape the contract.** Define fields, filters, keys, paging, and error behavior before implementation. Done when the contract can be tested independently.

4. **Apply authorization and data minimization.** Consider DCL/roles and do not expose fields unnecessarily. Done when sensitive fields have an explicit allow/deny decision.

5. **Test with small data.** Validate with narrow queries or test records. Done when behavior is verified without broad extraction.

## Common Pitfalls

1. **Exposing table internals as APIs.** Use stable business contracts.
2. **Skipping authorization.** Every business API needs an access-control story.
3. **Treating diagnostics as production integration.** `run_select_query` is for troubleshooting, not a public API.
4. **Dropping SAP messages.** Keep diagnostic context, sanitized where needed.

## Verification Checklist

- [ ] Consumer and contract are explicit.
- [ ] Authorization/data minimization was considered.
- [ ] Clean-core/released-object impact is documented.
- [ ] Response shape and error semantics are stable.
- [ ] No sensitive business data is leaked in logs/docs/final answer.
