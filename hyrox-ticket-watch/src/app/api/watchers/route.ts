import { NextResponse } from "next/server";

import { addWatcher, getWatchers } from "@/lib/mock-store";
import { createWatcherSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "user-demo";

  return NextResponse.json({
    mode: "mock",
    items: getWatchers(userId),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createWatcherSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid watcher payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const watcher = addWatcher(parsed.data);

  return NextResponse.json(
    {
      mode: "mock",
      item: watcher,
    },
    { status: 201 },
  );
}
