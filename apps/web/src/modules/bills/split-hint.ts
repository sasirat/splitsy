import { formatBaht } from "@/lib/format";
import { splitItem } from "@/modules/items/service";

export type Sharer = { initials: string; shares?: number };

/** The per-head hint under a receipt line: "฿90 EACH" when everyone has the
 *  same shares, else each person's part ("M ฿90 · B ฿180"). Empty when nobody
 *  or just one person has it (the line already shows the price). Uses the same
 *  split math as the totals, so the hint always matches what people owe. */
export function splitHint(priceSatang: number, sharers: Sharer[]): string {
  if (sharers.length <= 1) return "";

  // Keys by position (zero-padded so their sort order matches `sharers`).
  const keyOf = (index: number) => String(index).padStart(4, "0");
  const parts = splitItem(
    priceSatang,
    sharers.map((sharer, index) => ({ userId: keyOf(index), shares: sharer.shares ?? 1 })),
  );

  const shares = sharers.map((sharer) => sharer.shares ?? 1);
  if (shares.every((n) => n === shares[0])) {
    return `${formatBaht(Math.max(...Object.values(parts)))} EACH`;
  }
  return sharers
    .map((sharer, index) => `${sharer.initials} ${formatBaht(parts[keyOf(index)] ?? 0)}`)
    .join(" · ");
}
