---
name: sap-rap-fiori
description: Use when creating or changing CDS, RAP behavior definitions, service definitions/bindings, metadata extensions, or Fiori Elements exposure through ABAP-MCP.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, rap, cds, fiori, odata, bdef]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP RAP, CDS, and Fiori Exposure

## Overview

ABAP-MCP includes tools for CDS views, metadata extensions, DCL, RAP behavior definitions, service definitions, service bindings, and service publishing. This skill gives agents a safe sequence for creating or modifying RAP/Fiori artifacts.

## When to Use

Use this skill for:

- `create_cds_view`, `create_cds_metadata_extension`, or `create_data_control_language`.
- `create_behavior_definition` or behavior implementation work.
- `create_service_definition`, `create_service_binding`, or `publish_service_binding`.
- Fiori Elements annotations and OData V2/V4 exposure.

## Workflow

1. **Read the existing model.** Search objects and read related CDS/DDIC/class artifacts before changing anything. Done when dependencies, package, namespace, and transport strategy are known.

2. **Validate names and fields.** Use `get_table_fields`, `get_ddic_element`, or `validate_ddic_references` before writing entity fields or associations. Done when no field/entity names are guessed.

3. **Create in dependency order.** Typical order:
   1. package/transport if needed
   2. DDIC table or base CDS
   3. interface/root CDS
   4. projection CDS
   5. metadata extension
   6. DCL
   7. BDEF
   8. behavior implementation class
   9. service definition
   10. service binding
   11. publish service binding
   Done when each artifact is activated before dependents are written.

4. **Use local files for large sources.** Write `.cds`, `.bdef`, or `.abap` content to a temp/local file and pass `sourcePath` when supported. Done when JSON escaping and token-heavy inline payloads are avoided.

5. **Check syntax/activation after each layer.** Do not continue building dependent artifacts on an inactive base artifact. Done when activation output is clean or the error list is being actively fixed.

## Fiori/OData Rules

- Use metadata extensions for UI annotations when appropriate instead of crowding base CDS.
- Choose binding type intentionally: UI bindings for Fiori/SAPUI5, API bindings for integration consumers.
- Do not publish a service until the service definition and underlying CDS/RAP artifacts are activated.
- Keep authorization behavior explicit: DCL is not optional in real business contexts.

## Common Pitfalls

1. **Creating service bindings before the model activates.** Activate CDS/BDEF first.
2. **Guessing annotation syntax.** Search SAP docs or existing local examples.
3. **Forgetting DCL/security.** Fiori exposure without access control can be unsafe.
4. **Mixing interface and projection concerns.** Keep stable interface views separate from UI projection annotations when possible.

## Verification Checklist

- [ ] Existing related objects were read.
- [ ] DDIC fields/entities were validated.
- [ ] Artifacts were created/activated in dependency order.
- [ ] Service binding type matches UI/API intent.
- [ ] Authorization/DCL impact was considered.
