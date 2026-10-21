/** Sales tax applied to every invoice. */
export const TAX_RATE = 0.16;

/** Price suggested for a new invoice: material cost plus the usual margin. */
export const DEFAULT_MARKUP = 1.45;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function invoiceTotals(subtotal: number) {
  const tax = round2(subtotal * TAX_RATE);
  return { subtotal: round2(subtotal), tax, total: round2(subtotal + tax) };
}

export function suggestedPrice(cost: number): number {
  return round2(cost * DEFAULT_MARKUP);
}

/** Calendar month key, e.g. "2026-10", in UTC. */
export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** The last `count` month keys, oldest first, ending with the month of `now`. */
export function recentMonths(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}
