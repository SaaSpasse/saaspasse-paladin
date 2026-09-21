import { timingSafeEqual } from "node:crypto";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

export function privateJson(statusCode: number, data: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "CDN-Cache-Control": "no-store",
      "Netlify-CDN-Cache-Control": "no-store",
      "Vary": "X-Paladin-Secret",
    },
    body: JSON.stringify(data),
  };
}

export function requireEditorialAccess(event: HandlerEvent): HandlerResponse | null {
  const expectedSecret = process.env.PALADIN_SECRET;
  if (!expectedSecret) {
    return privateJson(503, { error: "Configuration error" });
  }

  const secret = Object.entries(event.headers).find(
    ([name]) => name.toLowerCase() === "x-paladin-secret"
  )?.[1];
  const provided = Buffer.from(secret || "");
  const expected = Buffer.from(expectedSecret);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return privateJson(401, { error: "Mot de passe invalide" });
  }

  return null;
}

// Keep decomposed accents used by existing filenames; reject path/URL syntax.
export function isEditorialFilename(filename: string): boolean {
  return filename.length <= 255
    && /^\d{4}-\d{2}-\d{2}-[\p{L}\p{N}][\p{L}\p{M}\p{N}-]*\.md$/u.exec(filename)?.[0] === filename;
}
