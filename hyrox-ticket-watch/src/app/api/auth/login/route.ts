import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { findUserByEmail, getStoredPasswordHash } from "@/lib/mock-store";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
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

  return NextResponse.json({
    mode: "mock",
    user,
    session: {
      token: `mock-session-${user.id}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
  });
}
