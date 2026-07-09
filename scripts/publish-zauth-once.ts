/** One-off: publish ZAUTH_API_V4 from the SAP_CLIENT in the environment. */
import { getClient } from "../src/adt-client.js";
import { handlePublishServiceBinding } from "../src/tools/handlers/create.js";

async function main() {
  const client = await getClient();
  const result = await handlePublishServiceBinding(client, {
    name: "ZAUTH_API_V4",
    version: "0001",
  });
  const text = result.content?.[0]?.type === "text" ? result.content[0].text : JSON.stringify(result);
  console.log(text);
  if (text.startsWith("❌")) process.exit(1);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
