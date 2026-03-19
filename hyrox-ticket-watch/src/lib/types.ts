export type TicketStatus = "unknown" | "sold_out" | "available" | "error";

export type TicketOption = {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  weekdayLabel: string;
  divisionCode: string;
  divisionName: string;
  categoryCode: string;
  categoryName: string;
  displayLabel: string;
};

export type EventSummary = {
  id: string;
  slug: string;
  name: string;
  location: string;
  eventUrl: string;
  ticketUrl: string;
  ticketOptions: TicketOption[];
};

export type Watcher = {
  id: string;
  userId: string;
  ticketOptionId: string;
  lastKnownStatus: TicketStatus;
  lastCheckedAt: string | null;
  lastNotifiedAt: string | null;
};

export type WatcherWithOption = Watcher & {
  ticketOption: TicketOption;
};

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};
