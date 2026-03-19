import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import type { AppUser, EventSummary, TicketOption, Watcher, WatcherWithOption } from "@/lib/types";

const ticketOptions: TicketOption[] = [
  {
    id: "ticket-men-open-sat",
    eventId: "event-hyrox-incheon",
    eventName: "HYROX Incheon",
    eventDate: "2026-05-16",
    weekdayLabel: "토",
    divisionCode: "men-singles",
    divisionName: "Men Singles",
    categoryCode: "open",
    categoryName: "Open",
    displayLabel: "2026-05-16 (토) / Men Singles / Open",
  },
  {
    id: "ticket-men-pro-sat",
    eventId: "event-hyrox-incheon",
    eventName: "HYROX Incheon",
    eventDate: "2026-05-16",
    weekdayLabel: "토",
    divisionCode: "pro-men",
    divisionName: "Pro Men",
    categoryCode: "pro",
    categoryName: "Pro",
    displayLabel: "2026-05-16 (토) / Pro Men / Pro",
  },
  {
    id: "ticket-mixed-open-sun",
    eventId: "event-hyrox-incheon",
    eventName: "HYROX Incheon",
    eventDate: "2026-05-17",
    weekdayLabel: "일",
    divisionCode: "mixed-doubles",
    divisionName: "Mixed Doubles",
    categoryCode: "open",
    categoryName: "Open",
    displayLabel: "2026-05-17 (일) / Mixed Doubles / Open",
  },
];

const events: EventSummary[] = [
  {
    id: "event-hyrox-incheon",
    slug: "hyrox-incheon",
    name: "HYROX Incheon",
    location: "Incheon, KR",
    eventUrl: "https://hyrox.com/event/hyrox-incheon/",
    ticketUrl: "https://korea.hyrox.com/event/airasia-hyrox-incheon-season-25-26-h48hij?useEmbed=true",
    ticketOptions,
  },
];

const users: AppUser[] = [
  {
    id: "user-demo",
    email: "member@ticketwatch.kr",
    name: "Demo Member",
    createdAt: new Date("2026-03-19T00:00:00.000Z").toISOString(),
  },
];

const userPasswordHashes = new Map<string, string>([
  ["member@ticketwatch.kr", hashSync("password123", 10)],
]);

const watchers: Watcher[] = [
  {
    id: "watcher-1",
    userId: "user-demo",
    ticketOptionId: "ticket-men-open-sat",
    lastKnownStatus: "sold_out",
    lastCheckedAt: "2026-03-19T00:00:00.000Z",
    lastNotifiedAt: null,
  },
  {
    id: "watcher-2",
    userId: "user-demo",
    ticketOptionId: "ticket-mixed-open-sun",
    lastKnownStatus: "available",
    lastCheckedAt: "2026-03-19T00:00:00.000Z",
    lastNotifiedAt: "2026-03-19T00:01:00.000Z",
  },
];

export function getEvents() {
  return events;
}

export function getWatchers(userId?: string): WatcherWithOption[] {
  return watchers
    .filter((watcher) => (userId ? watcher.userId === userId : true))
    .map((watcher) => ({
      ...watcher,
      ticketOption: ticketOptions.find((option) => option.id === watcher.ticketOptionId)!,
    }));
}

export function addWatcher(input: { userId: string; ticketOptionId: string }) {
  const exists = watchers.find(
    (watcher) =>
      watcher.userId === input.userId && watcher.ticketOptionId === input.ticketOptionId,
  );

  if (exists) {
    return exists;
  }

  const watcher: Watcher = {
    id: randomUUID(),
    userId: input.userId,
    ticketOptionId: input.ticketOptionId,
    lastKnownStatus: "unknown",
    lastCheckedAt: null,
    lastNotifiedAt: null,
  };

  watchers.unshift(watcher);

  return watcher;
}

export function createUser(input: { email: string; name?: string; passwordHash: string }) {
  const user: AppUser = {
    id: randomUUID(),
    email: input.email,
    name: input.name ?? null,
    createdAt: new Date().toISOString(),
  };

  users.unshift(user);
  userPasswordHashes.set(input.email.toLowerCase(), input.passwordHash);

  return user;
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getStoredPasswordHash(email: string) {
  return userPasswordHashes.get(email.toLowerCase()) ?? null;
}
