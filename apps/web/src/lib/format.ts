// Fixed locales and time zone so server and client render identical markup
// (no hydration drift), whatever the visitor's machine is set to.

const wholeBaht = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bahtWithSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an amount in satang as baht: ฿320, ฿180.50, ฿1,040. Satang are
 *  shown only when non-zero, and then always as two digits. */
export function formatBaht(satang: number): string {
  const formatter = satang % 100 === 0 ? wholeBaht : bahtWithSatang;
  return `฿${formatter.format(satang / 100)}`;
}

/** Receipt number: NO.0042. */
export function formatBillNumber(number: number): string {
  return `NO.${String(number).padStart(4, "0")}`;
}

const BANGKOK = "Asia/Bangkok";

const billDateFormatter = new Intl.DateTimeFormat("th-TH-u-nu-latn", {
  timeZone: BANGKOK,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const billTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BANGKOK,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Thai (Buddhist-era) date in Bangkok: 16/09/2569. */
export function formatBillDate(date: Date): string {
  return billDateFormatter.format(date);
}

/** 24-hour Bangkok time: 21:06. */
export function formatBillTime(date: Date): string {
  return billTimeFormatter.format(date);
}

/** What to call a person: their display name, else their email. */
export function personName(person: { displayName: string | null; email: string }): string {
  return person.displayName ?? person.email;
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
