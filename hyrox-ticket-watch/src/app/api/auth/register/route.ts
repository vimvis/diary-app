import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/mock-store";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
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
