// Pure item money math — no Prisma, no Next. All amounts are integer satang.

export type Split = { userId: string; shares: number };

/** Satang each sharer owes for one item, weighted by shares.
 *  Uses largest remainders so the parts always sum exactly to the price;
 *  ties go to the lowest userId, so the result never depends on input order. */
export function splitItem(priceSatang: number, splits: Split[]): Record<string, number> {
  if (!Number.isInteger(priceSatang) || priceSatang < 0) {
    throw new RangeError(`Invalid price: ${priceSatang}`);
  }
  const seen = new Set<string>();
  for (const { userId, shares } of splits) {
    if (!Number.isInteger(shares) || shares < 1) throw new RangeError(`Invalid shares: ${shares}`);
    if (seen.has(userId)) throw new RangeError(`Duplicate sharer: ${userId}`);
    seen.add(userId);
  }
  if (splits.length === 0) return {};

  const totalShares = splits.reduce((n, s) => n + s.shares, 0);
  const parts = [...splits]
    .sort((a, b) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0))
    .map(({ userId, shares }) => {
      const exact = priceSatang * shares;
      return {
        userId,
        amount: Math.floor(exact / totalShares),
        remainder: exact % totalShares,
      };
    });

  let leftover = priceSatang - parts.reduce((n, p) => n + p.amount, 0);
  // Stable sort keeps userId order among equal remainders.
  for (const part of [...parts].sort((a, b) => b.remainder - a.remainder)) {
    if (leftover === 0) break;
    part.amount += 1;
    leftover -= 1;
  }

  return Object.fromEntries(parts.map((p) => [p.userId, p.amount]));
}

/** Upper bound for one item: ฿10,000,000 — far below the Int column limit. */
const MAX_ITEM_SATANG = 1_000_000_000;

/** Parse what a user typed ("120", "120.50", "1,200", "฿45") into satang
 *  without going through floats. Returns null for anything else. */
export function parseBahtToSatang(input: string): number | null {
  const match = /^฿?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;

  const baht = Number(match[1].replaceAll(",", ""));
  const satang = Number((match[2] ?? "").padEnd(2, "0"));
  const total = baht * 100 + satang;
  return total <= MAX_ITEM_SATANG ? total : null;
}
