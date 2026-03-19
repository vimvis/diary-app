import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findUserById } from "@/lib/mock-store";
import { parseSessionCookieValue, sessionCookieName } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSessionCookieValue(cookieStore.get(sessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = findUserById(session.userId);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
