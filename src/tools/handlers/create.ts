/**
 * CREATE tool handlers: all 7 create_* tools
 */

import type { ADTClient, NewBindingOptions } from "abap-adt-api";
import type { ToolResult } from "../../types.js";
import { S_CreateProgram, S_CreateClass, S_CreateInterface, S_CreateFunctionGroup, S_CreateCdsView, S_CreateTable, S_CreateMessageClass, S_CreateCdsMetadataExtension, S_CreateServiceDefinition, S_CreateServiceBinding, S_PublishServiceBinding, S_CreateDataControlLanguage, S_CreateBehaviorDefinition } from "../../schemas.js";
import { ADT_PACKAGES, ADT_PROGRAMS, ADT_CLASSES, ADT_INTERFACES, ADT_FUNCTION_GROUPS, ADT_DDIC_DDL_SOURCES, ADT_DDIC_TABLES, ADT_DDIC_DDLX_SOURCES, ADT_DDIC_SRVD_SOURCES, ADT_BUSINESSSERVICES_BINDINGS, ADT_ACM_DCL_SOURCES, ADT_BO_BEHAVIORS } from "../../adt-endpoints.js";

const encXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
import { assertWriteEnabled, assertPackageAllowed, assertCustomerNamespace } from "../../safety.js";

function ok(text: string): ToolResult { return { content: [{ type: "text", text }] }; }

export async function handleCreateAbapProgram(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateProgram.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  const progType = p.programType ?? "P";
  await client.createObject(`PROG/${progType}`, n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_PROGRAMS}/${n.toLowerCase()}`;
  const label = progType === "I" ? "Include" : "Program";
  return ok(`✅ ${label} '${n}' created\nURI: ${url}\n\nNext steps:\n  write_abap_source with objectUrl='${url}'`);
}

export async function handleCreateAbapClass(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateClass.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["ZCL_", "YCL_"]);
  const n = p.name.toUpperCase();
  await client.createObject("CLAS/OC", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_CLASSES}/${n.toLowerCase()}`;
  return ok(`✅ Class '${n}' created\nURI: ${url}\n\nNext steps:\n  read_abap_source → write_abap_source`);
}

export async function handleCreateAbapInterface(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateInterface.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["ZIF_", "YIF_"]);
  const n = p.name.toUpperCase();
  await client.createObject("INTF/OI", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_INTERFACES}/${n.toLowerCase()}`;
  return ok(`✅ Interface '${n}' created\nURI: ${url}`);
}

export async function handleCreateFunctionGroup(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateFunctionGroup.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("FUGR/F", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_FUNCTION_GROUPS}/${n.toLowerCase()}`;
  return ok(`✅ Function group '${n}' created\nURI: ${url}`);
}

export async function handleCreateCdsView(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateCdsView.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("DDLS/DF", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_DDIC_DDL_SOURCES}/${n.toLowerCase()}`;
  return ok(`✅ CDS View '${n}' created\nURI: ${url}`);
}

export async function handleCreateDatabaseTable(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateTable.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("TABL/DT", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_DDIC_TABLES}/${n.toLowerCase()}`;
  return ok(`✅ Table '${n}' created\nURI: ${url}`);
}

export async function handleCreateMessageClass(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateMessageClass.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("MSAG/N", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  return ok(`✅ Message class '${n}' created`);
}

export async function handleCreateCdsMetadataExtension(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateCdsMetadataExtension.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("DDLX/EX", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_DDIC_DDLX_SOURCES}/${n.toLowerCase()}`;
  return ok(`✅ CDS Metadata Extension '${n}' created\nURI: ${url}\n\nNext step:\n  write_abap_source with objectUrl='${url}'`);
}

export async function handleCreateServiceDefinition(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateServiceDefinition.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("SRVD/SRV", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_DDIC_SRVD_SOURCES}/${n.toLowerCase()}`;
  return ok(`✅ Service Definition '${n}' created\nURI: ${url}\n\nNext steps:\n  1. write_abap_source with objectUrl='${url}'\n  2. create_service_binding to expose it as OData`);
}

export async function handleCreateServiceBinding(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateServiceBinding.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  const category: "0" | "1" = p.bindingType === "V2_UI" ? "1" : "0";
  const bindingOptions: NewBindingOptions = {
    objtype: "SRVB/SVB",
    name: n,
    parentName: p.devClass,
    description: p.description,
    parentPath: `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`,
    service: p.serviceDefinition.toUpperCase(),
    bindingtype: "ODATA",
    category,
    transport: p.transport || undefined,
  };
  await client.createObject(bindingOptions);
  const url = `${ADT_BUSINESSSERVICES_BINDINGS}/${n.toLowerCase()}`;
  return ok(`✅ Service Binding '${n}' created (${p.bindingType})\nService Definition: ${p.serviceDefinition.toUpperCase()}\nURI: ${url}\n\nNext step:\n  publish_service_binding with name='${n}'`);
}

export async function handlePublishServiceBinding(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_PublishServiceBinding.parse(args);
  const n = p.name.toUpperCase();
  const version = p.version ?? "0001";
  const result = await client.publishServiceBinding(n, version);
  if (result.severity === "E" || result.severity === "A") {
    return { content: [{ type: "text", text: `❌ Publish failed (${result.severity}): ${result.shortText}\n${result.longText}` }] };
  }
  return ok(`✅ Service Binding '${n}' published successfully\n${result.shortText}${result.longText ? "\n" + result.longText : ""}`);
}

export async function handleCreateDataControlLanguage(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateDataControlLanguage.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  await client.createObject("DCLS/DL", n, p.devClass, p.description, `${ADT_PACKAGES}/${encodeURIComponent(p.devClass)}`, undefined, p.transport || undefined);
  const url = `${ADT_ACM_DCL_SOURCES}/${n.toLowerCase()}`;
  return ok(`✅ Data Control Language source '${n}' created\nURI: ${url}\n\nNext step:\n  write_abap_source with objectUrl='${url}'`);
}

export async function handleCreateBehaviorDefinition(client: ADTClient, args: Record<string, unknown>): Promise<ToolResult> {
  assertWriteEnabled();
  const p = S_CreateBehaviorDefinition.parse(args);
  assertPackageAllowed(p.devClass);
  assertCustomerNamespace(p.name, ["Z", "Y"]);
  const n = p.name.toUpperCase();
  const responsible = client.httpClient.username.toUpperCase();

  // abap-adt-api has no BDEF support — direct HTTP POST following the createBodySimple pattern
  // from objectcreator.js: xmlns from /sap/bc/adt/bo/behaviors, type BDEF/BF
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<bdef:behaviorDefinition xmlns:bdef="http://www.sap.com/adt/bo/behaviors"`,
    `  xmlns:adtcore="http://www.sap.com/adt/core"`,
    `  adtcore:description="${encXml(p.description)}"`,
    `  adtcore:name="${n}" adtcore:type="BDEF/BF"`,
    `  adtcore:language="EN" adtcore:masterLanguage="EN"`,
    `  adtcore:responsible="${responsible}">`,
    `  <adtcore:packageRef adtcore:name="${p.devClass}"/>`,
    `</bdef:behaviorDefinition>`,
  ].join("\n");

  const qs: Record<string, string> = {};
  if (p.transport) qs.corrNr = p.transport;

  await client.httpClient.request(ADT_BO_BEHAVIORS, {
    method: "POST",
    headers: { "Content-Type": "application/*" },
    qs,
    body,
  });

  const url = `${ADT_BO_BEHAVIORS}/${n.toLowerCase()}`;
  return ok(
    `✅ Behavior Definition '${n}' created\nURI: ${url}\n\n` +
    `Next steps:\n` +
    `  1. write_abap_source with objectUrl='${url}'\n` +
    `     First line must be: managed; | unmanaged; | projection; | abstract; | interface;\n` +
    `  2. Use the rap-bdef skill for full BDL syntax`
  );
}
