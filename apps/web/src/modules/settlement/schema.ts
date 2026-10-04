import { z } from "zod";

export const startSettlingInput = z.object({
  billId: z.string().min(1),
});

export type StartSettlingInput = z.input<typeof startSettlingInput>;
