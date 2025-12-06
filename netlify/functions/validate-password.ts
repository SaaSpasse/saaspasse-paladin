import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { password } = JSON.parse(event.body || "{}");
    const expectedPassword = process.env.PALADIN_SECRET;

    if (!expectedPassword) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Configuration error" })
      };
    }

    if (password !== expectedPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ valid: false, error: "Mot de passe invalide" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: true }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request" })
    };
  }
};
