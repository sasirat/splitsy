const bahtFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Format a whole-baht amount with the ฿ symbol and thousands grouping, using a
 *  fixed locale so server and client render identical markup (no hydration drift). */
export function formatBaht(amount: number): string {
  return `฿${bahtFormatter.format(amount)}`;
}

/** Up to two initials for an avatar: "Mint" → "M", "Ploy Sae" → "PS". */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
