import { z } from "zod";

export const createGroupInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the group a name")
    .max(60, "Keep the name under 60 characters"),
});

export type CreateGroupInput = z.input<typeof createGroupInput>;
