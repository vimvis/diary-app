import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findUserByEmail, getStoredPasswordHash } from "@/lib/mock-store";
import { createSessionCookieValue, sessionCookieName } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid login payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const user = findUserByEmail(parsed.data.email);
  const storedPasswordHash = getStoredPasswordHash(parsed.data.email);

  if (!user || !storedPasswordHash) {
    return NextResponse.json(
      {
        error: "Invalid credentials",
      },
      { status: 401 },
    );
  }

  const isValidPassword = await compare(parsed.data.password, storedPasswordHash);

  if (!isValidPassword) {
    return NextResponse.json(
      {
        error: "Invalid credentials",
      },
      { status: 401 },
    );
  }

  const sessionValue = createSessionCookieValue({
    userId: user.id,
    email: user.email,
    issuedAt: new Date().toISOString(),
  });

  cookieStore.set(sessionCookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({
    mode: "mock",
    user,
    session: {
      token: `cookie-session-${user.id}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
  });
}
