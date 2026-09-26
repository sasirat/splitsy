const bahtFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Format a whole-baht amount with the ฿ symbol and thousands grouping, using a
 *  fixed locale so server and client render identical markup (no hydration drift). */
export function formatBaht(amount: number): string {
  return `฿${bahtFormatter.format(amount)}`;
}
