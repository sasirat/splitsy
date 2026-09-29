// Pure bill math — no Prisma, no Next. All amounts are integer satang.
import { splitItem, type Split } from "@/modules/items/service";

export type BillTotals = {
  subtotalSatang: number;
  /** What each person owes for the items they've claimed, by userId. */
  perPersonSatang: Record<string, number>;
  /** Value of items nobody has claimed yet. */
  unassignedSatang: number;
};

export function billTotals(items: { priceSatang: number; splits: Split[] }[]): BillTotals {
  const totals: BillTotals = { subtotalSatang: 0, perPersonSatang: {}, unassignedSatang: 0 };

  for (const item of items) {
    totals.subtotalSatang += item.priceSatang;
    if (item.splits.length === 0) {
      totals.unassignedSatang += item.priceSatang;
      continue;
    }
    for (const [userId, amount] of Object.entries(splitItem(item.priceSatang, item.splits))) {
      totals.perPersonSatang[userId] = (totals.perPersonSatang[userId] ?? 0) + amount;
    }
  }
  return totals;
}
