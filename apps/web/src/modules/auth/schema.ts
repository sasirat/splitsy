import { z } from "zod";

export const signInSchema = z.object({
  userId: z.string().min(1),
  next: z.string().optional(),
});
