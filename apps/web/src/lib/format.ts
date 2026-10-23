const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const numberFormat = new Intl.NumberFormat();
const moneyFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDate = (iso: string | null | undefined) =>
  iso ? dateFormat.format(new Date(iso)) : "—";
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
export const formatNumber = (n: number) => numberFormat.format(n);
export const formatMoney = (n: number) => moneyFormat.format(n);

/** True when a deadline has passed. */
export const isOverdue = (deadline: string | null, done: boolean) =>
  !done && deadline !== null && new Date(deadline) < new Date();

/** `yyyy-mm-dd` for today, for date inputs. */
export const todayInput = () => new Date().toISOString().slice(0, 10);

/** "layla.mansour" → "Layla Mansour". */
export const displayName = (username: string) =>
  username
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const monthFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10" → "Oct 2026". */
export const formatMonth = (key: string) => monthFormat.format(new Date(`${key}-01T00:00:00Z`));
