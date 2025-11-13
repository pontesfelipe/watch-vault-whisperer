import { format } from "date-fns";

export type PurchaseDatePrecision = "day" | "month" | "year" | "unknown";

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function twoDigitToYear(yy: number) {
  // Map 00-69 -> 2000-2069, 70-99 -> 1970-1999
  return yy >= 70 ? 1900 + yy : 2000 + yy;
}

export function parsePurchaseDate(
  when_bought?: string | null,
  created_at?: string
): { date: Date; precision: PurchaseDatePrecision } {
  const fallback = created_at ? new Date(created_at) : new Date(0);
  if (!when_bought || !when_bought.trim()) {
    return { date: fallback, precision: created_at ? "day" : "unknown" };
  }

  const s = when_bought.trim();

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return { date: d, precision: "day" };
  }

  // Month-YY or Month-YYYY (e.g., "March-24", "Oct 2023")
  const monthYearMatch = s.match(/^([A-Za-z]+)[\s-]+(\d{2}|\d{4})$/);
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].toLowerCase();
    const y = monthYearMatch[2];
    const monthIndex = MONTHS[monthStr];
    if (monthIndex !== undefined) {
      const year = y.length === 2 ? twoDigitToYear(Number(y)) : Number(y);
      const d = new Date(year, monthIndex, 1);
      return { date: d, precision: "month" };
    }
  }

  // Year only
  if (/^\d{4}$/.test(s)) {
    const d = new Date(Number(s), 0, 1);
    return { date: d, precision: "year" };
  }

  // Last resort: native Date parsing
  const native = new Date(s);
  if (!isNaN(native.getTime())) {
    return { date: native, precision: "day" };
  }

  // Fallback to created_at
  return { date: fallback, precision: created_at ? "day" : "unknown" };
}

export function formatPurchaseDateForDisplay(
  date: Date,
  precision: PurchaseDatePrecision
) {
  switch (precision) {
    case "day":
      return format(date, "MMMM d, yyyy");
    case "month":
      return format(date, "MMMM yyyy");
    case "year":
      return format(date, "yyyy");
    default:
      return "-";
  }
}
