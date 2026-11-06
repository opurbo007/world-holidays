import type { Holiday, HolidayOptions, MonthInput, YearInput } from "./types";

export type StoredHoliday = { date: string; name: string };

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function resolveYear(
  input: YearInput = "current",
  years: number[],
): number | undefined {
  if (input === "all") return undefined;
  const now = new Date().getFullYear();
  const year = input === "current" ? now : input === "next" ? now + 1 : input;
  if (!Number.isInteger(year) || !years.includes(year)) {
    throw new RangeError(
      `Year ${year} is not covered. Available: ${years.join(", ")}`,
    );
  }
  return year;
}

export function resolveMonth(input: MonthInput): number {
  let month: number;
  if (typeof input === "number") {
    month = input;
  } else {
    const s = input.trim().toLowerCase();
    month = /^\d+$/.test(s)
      ? Number(s)
      : MONTHS.findIndex((m) => m === s || m.slice(0, 3) === s) + 1;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(
      `Invalid month: "${input}". Use 1-12 or a name like "March".`,
    );
  }
  return month;
}

function normalize(options?: number | HolidayOptions): HolidayOptions {
  return typeof options === "number" ? { year: options } : (options ?? {});
}

function weekdayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export const decorate = (h: StoredHoliday): Holiday => ({
  ...h,
  weekday: weekdayOf(h.date),
});

export function toISO(date: Date | string = new Date()): string {
  if (typeof date === "string") return date.slice(0, 10);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function filterHolidays(
  list: StoredHoliday[],
  years: number[],
  options?: number | HolidayOptions,
): Holiday[] {
  const opts = normalize(options);
  const year = resolveYear(opts.year, years);
  const month = opts.month === undefined ? undefined : resolveMonth(opts.month);

  return list
    .filter((h) => {
      if (year !== undefined && !h.date.startsWith(`${year}-`)) return false;
      if (month !== undefined && h.date.slice(5, 7) !== pad(month))
        return false;
      return true;
    })
    .map(decorate);
}

export function findOn(
  list: StoredHoliday[],
  date?: Date | string,
): Holiday | null {
  const iso = toISO(date);
  const found = list.find((h) => h.date === iso);
  return found ? decorate(found) : null;
}

export function findNext(
  list: StoredHoliday[],
  from?: Date | string,
): Holiday | null {
  const iso = toISO(from);
  const found = list.find((h) => h.date >= iso);
  return found ? decorate(found) : null;
}

export function findUpcoming(
  list: StoredHoliday[],
  limit = 5,
  from?: Date | string,
): Holiday[] {
  const iso = toISO(from);
  return list
    .filter((h) => h.date >= iso)
    .slice(0, limit)
    .map(decorate);
}
