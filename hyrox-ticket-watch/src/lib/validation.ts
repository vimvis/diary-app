import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(40).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const createWatcherSchema = z.object({
  userId: z.string().trim().min(1),
  ticketOptionId: z.string().trim().min(1),
});
