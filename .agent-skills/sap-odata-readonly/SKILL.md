---
name: sap-odata-readonly
description: Use when adding or using read-only SAP OData discovery, metadata inspection, value help, or safe query workflows for services created or consumed around ABAP-MCP.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, odata, s4hana, gateway, metadata, readonly]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP OData Read-Only Workflows

## Overview

ABAP-MCP can create and publish OData services through CDS/RAP service definitions and bindings. A safe next step is read-only OData discovery and metadata inspection so agents can verify exposed services without directly mutating business data.

Relevant inspiration:

```text
https://github.com/lemaiwo/btp-sap-odata-to-mcp-server
https://github.com/Nidhideep/sap-s4-mcp-server
https://github.com/RavenQueen03/btp-sap-odata-to-mcp-server
```

## When to Use

Use this skill for:

- Verifying a service binding published by ABAP-MCP.
- Discovering Gateway/OData service catalogs.
- Reading `$metadata` and entity sets.
- Fetching value helps/dropdown values.
- Designing future tools for read-only OData smoke tests.

Do not use this skill to justify OData writes. Mutating OData operations require a separate safety design.

## Desired ABAP-MCP Tool Direction

Start with read-only tools only:

| Tool idea | Purpose |
|---|---|
| `odata_discover_services` | List available Gateway/OData services from a configured endpoint |
| `odata_get_metadata` | Fetch and summarize `$metadata` for LLM use |
| `odata_list_entity_sets` | Extract entity sets, keys, properties, navigation |
| `odata_get_value_help` | Read value-list/dropdown entities safely |
| `odata_query_entity_readonly` | Run constrained GET queries with limits and field projection |
| `odata_smoke_test_service` | Verify service availability after publish |

No POST/PATCH/PUT/DELETE in the first implementation phase.

## Read-Only Query Rules

- Default to `$top` limits.
- Require explicit entity set.
- Prefer explicit `$select`; avoid full wide entities.
- Support filters but avoid broad scans.
- Mask or omit sensitive values in agent-facing summaries.
- Log service, entity, selected fields, row count, and user context for audit.

## Authentication Boundary

OData access may use different infrastructure than ADT:

- SAP Gateway basic auth
- BTP Destination Service
- OAuth2 client credentials
- principal propagation
- Cloud Connector routes

Keep OData credentials/config separate from ABAP ADT credentials unless the user intentionally reuses the same system identity.

## Workflow

1. **Discover service.** Locate the service from binding URL or service catalog. Done when service root and version are known.

2. **Read metadata.** Fetch `$metadata` and summarize entity sets, keys, properties, associations, and actions. Done when entity structure is clear without sample data.

3. **Run narrow smoke query.** Query with `$top`, `$select`, and safe filters. Done when the service is reachable and returns expected shape.

4. **Avoid writes.** For create/update/delete/action calls, stop and require explicit design and safety flags. Done when no mutation occurs in read-only workflows.

## Common Pitfalls

1. **Business data leakage.** Even GET requests can expose sensitive data.
2. **Treating metadata as authorization.** Metadata visibility does not mean the user may read all data.
3. **Unbounded queries.** Always constrain rows and fields.
4. **Mixing ADT and OData credentials.** They are related but not automatically the same security boundary.

## Verification Checklist

- [ ] Only GET/metadata/value-help operations are used.
- [ ] Queries have row limits and field projection.
- [ ] Sensitive values are masked or summarized.
- [ ] OData auth/config is documented separately.
- [ ] Mutating OData operations are out of scope unless separately approved.
