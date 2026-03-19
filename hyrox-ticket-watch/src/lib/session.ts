import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "hyrox_ticket_watch_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";

type SessionPayload = {
  userId: string;
  email: string;
  issuedAt: string;
};

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function createSessionCookieValue(payload: SessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);

  return `${encoded}.${signature}`;
}

export function parseSessionCookieValue(value?: string | null): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE;
