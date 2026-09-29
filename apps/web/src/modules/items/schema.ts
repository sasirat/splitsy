import { z } from "zod";
import { parseBahtToSatang } from "./service";

export const addItemInput = z.object({
  billId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "What was it called?")
    .max(80, "Keep the name under 80 characters"),
  /** Baht as typed ("120.50"); parsed to integer satang. */
  price: z.string().transform((value, ctx) => {
    const satang = parseBahtToSatang(value);
    if (satang === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 120 or 120.50" });
      return z.NEVER;
    }
    return satang;
  }),
});

export type AddItemInput = z.input<typeof addItemInput>;
