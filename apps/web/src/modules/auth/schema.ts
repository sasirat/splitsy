import { z } from "zod";

export const signInSchema = z.object({
  userId: z.string().min(1),
  next: z.string().optional(),
});

export const displayNameInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Tell us what to call you")
    .max(30, "Keep it under 30 characters"),
});

export type DisplayNameInput = z.input<typeof displayNameInput>;
