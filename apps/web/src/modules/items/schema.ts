import { z } from "zod";
import { parseBahtToSatang } from "./service";

const itemName = z
  .string()
  .trim()
  .min(1, "What was it called?")
  .max(80, "Keep the name under 80 characters");

/** Baht as typed ("120.50"); parsed to integer satang. */
const itemPrice = z.string().transform((value, ctx) => {
  const satang = parseBahtToSatang(value);
  if (satang === null) {
    ctx.addIssue({ code: "custom", message: "Enter a price like 120 or 120.50" });
    return z.NEVER;
  }
  return satang;
});

export const addItemInput = z.object({
  billId: z.string().min(1),
  name: itemName,
  price: itemPrice,
});

export type AddItemInput = z.input<typeof addItemInput>;

/** Fix a typo: rename and/or reprice an item. Claims stay — amounts follow the price. */
export const updateItemInput = z.object({
  itemId: z.string().min(1),
  name: itemName,
  price: itemPrice,
});

export type UpdateItemInput = z.input<typeof updateItemInput>;

export const deleteItemInput = z.object({ itemId: z.string().min(1) });

export type DeleteItemInput = z.input<typeof deleteItemInput>;

export const setClaimInput = z.object({
  itemId: z.string().min(1),
  /** Who had it — anyone in the bill can tick for anyone in the bill. */
  userId: z.string().min(1),
  /** true = they had this, false = take the claim back. */
  claimed: z.boolean(),
});

export type SetClaimInput = z.input<typeof setClaimInput>;
