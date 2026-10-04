import { z } from "zod";

export const startSettlingInput = z.object({
  billId: z.string().min(1),
});

export type StartSettlingInput = z.input<typeof startSettlingInput>;

/** Banks offered in the picker; "Other" covers everything else. */
export const THAI_BANKS = [
  "KBank",
  "SCB",
  "Bangkok Bank",
  "Krungthai",
  "Krungsri",
  "ttb",
  "GSB",
  "Other",
] as const;

export const paymentDetailsInput = z.object({
  bankName: z.enum(THAI_BANKS, { error: "Pick your bank" }),
  /** As typed ("123-4-56789-0"); stored as digits only. */
  accountNumber: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{10,12}$/, "Account numbers have 10–12 digits")),
  accountName: z
    .string()
    .trim()
    .min(1, "Whose name is on the account?")
    .max(80, "Keep the name under 80 characters"),
});

export type PaymentDetailsInput = z.input<typeof paymentDetailsInput>;

export const markPaidInput = z.object({
  settlementId: z.string().min(1),
  /** true = they've paid the payer back, false = undo. */
  paid: z.boolean(),
});

export type MarkPaidInput = z.input<typeof markPaidInput>;
