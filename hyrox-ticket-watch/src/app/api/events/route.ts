import { NextResponse } from "next/server";

import { getEvents } from "@/lib/mock-store";

export async function GET() {
  return NextResponse.json({
    mode: "mock",
    items: getEvents(),
  });
}
