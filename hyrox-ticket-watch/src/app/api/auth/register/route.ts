import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/mock-store";
import { createSessionCookieValue, sessionCookieName } from "@/lib/session";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existingUser = findUserByEmail(parsed.data.email);

  if (existingUser) {
    return NextResponse.json(
      {
        error: "Email already registered",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
  });

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

  return NextResponse.json(
    {
      mode: "mock",
      user,
      credentials: {
        passwordStored: true,
        passwordHashPreview: `${passwordHash.slice(0, 12)}...`,
      },
    },
    { status: 201 },
  );
}
