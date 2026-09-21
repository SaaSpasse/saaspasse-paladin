import type { Handler } from "@netlify/functions";
import { isEditorialFilename, privateJson, requireEditorialAccess } from "../lib/editorial-access";
import { getEditorialStore } from "../lib/editorial-store";

export const handler: Handler = async (event) => {
  const denied = requireEditorialAccess(event);
  if (denied) return denied;
  if (event.httpMethod !== "GET") {
    return privateJson(405, { error: "Method Not Allowed" });
  }

  const filename = event.queryStringParameters?.filename;
  if (!filename || !isEditorialFilename(filename)) {
    return privateJson(400, { error: "Invalid filename" });
  }

  try {
    const contents = (await getEditorialStore()).contents;
    if (!Object.hasOwn(contents, filename)) {
      return privateJson(404, { error: "Editorial not found" });
    }
    return privateJson(200, { content: contents[filename] });
  } catch {
    return privateJson(503, { error: "Editorial archive unavailable" });
  }
};
