import { NextResponse } from "next/server";

import { getWatchers } from "@/lib/mock-store";

export async function POST() {
  const watchers = getWatchers("user-demo");

  const availableCount = watchers.filter((watcher) => watcher.lastKnownStatus === "available").length;
  const soldOutCount = watchers.filter((watcher) => watcher.lastKnownStatus === "sold_out").length;

  return NextResponse.json({
    mode: "mock",
    runId: crypto.randomUUID(),
    status: "success",
    checkedOptionsCount: watchers.length,
    availableCount,
    soldOutCount,
    notificationsQueued: availableCount,
    executedAt: new Date().toISOString(),
  });
}
