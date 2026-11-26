import { z } from "zod";

export const createBillInput = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the bill a name")
    .max(80, "Keep the name under 80 characters"),
  /** Start the bill inside this persistent group; omit for a quick bill. */
  groupId: z.string().min(1).optional(),
});

export type CreateBillInput = z.input<typeof createBillInput>;

export const deleteBillInput = z.object({ billId: z.string().min(1) });

export type DeleteBillInput = z.input<typeof deleteBillInput>;
