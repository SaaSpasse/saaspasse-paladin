import type { Handler } from "@netlify/functions";
import { privateJson } from "../lib/editorial-access";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return privateJson(405, { error: "Method Not Allowed" });
  }

  try {
    const { password } = JSON.parse(event.body || "{}");
    const expectedPassword = process.env.PALADIN_SECRET;

    if (!expectedPassword) {
      return privateJson(503, { error: "Configuration error" });
    }

    if (password !== expectedPassword) {
      return privateJson(401, { valid: false, error: "Mot de passe invalide" });
    }

    return privateJson(200, { valid: true });
  } catch (error: any) {
    return privateJson(400, { error: "Invalid request" });
  }
};
