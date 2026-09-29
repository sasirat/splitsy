import { z } from "zod";

export const createBillInput = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the bill a name")
    .max(80, "Keep the name under 80 characters"),
});

export type CreateBillInput = z.input<typeof createBillInput>;
