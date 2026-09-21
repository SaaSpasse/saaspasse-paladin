import type { Handler } from "@netlify/functions";
import { privateJson, requireEditorialAccess } from "../lib/editorial-access";
import { getEditorialStore } from "../lib/editorial-store";

export const handler: Handler = async (event) => {
  const denied = requireEditorialAccess(event);
  if (denied) return denied;
  if (event.httpMethod !== "GET") {
    return privateJson(405, { error: "Method Not Allowed" });
  }

  try {
    return privateJson(200, (await getEditorialStore()).editorials);
  } catch {
    return privateJson(503, { error: "Editorial archive unavailable" });
  }
};
