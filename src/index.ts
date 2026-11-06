import raw from "../data/holidays.json";
import type { Country, CountryHolidays, FlatHoliday, Holiday } from "./types";

export type { Country, CountryHolidays, FlatHoliday, Holiday } from "./types";

type Data = {
  generatedAt: string;
  years: number[];
  countries: Record<string, { name: string; holidays: Holiday[] }>;
};

const data = raw as unknown as Data;

/** Years covered by this version of the data, e.g. [2026, 2027] */
export const years: number[] = data.years;

/** When the data was generated (ISO string) */
export const generatedAt: string = data.generatedAt;

function lookup(code: string) {
  const entry = data.countries[code.toUpperCase()];
  if (!entry) throw new Error(`Unknown country code: "${code}"`);
  return entry;
}

function localISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function toISO(date: Date | string): string {
  return typeof date === "string" ? date.slice(0, 10) : localISODate(date);
}

/** All supported countries */
export function getCountries(): Country[] {
  return Object.entries(data.countries).map(([code, c]) => ({
    code,
    name: c.name,
  }));
}

/** Public holidays of one country. Omit year to get all covered years. */
export function getHolidays(code: string, year?: number): Holiday[] {
  const { holidays } = lookup(code);
  if (year === undefined) return holidays;
  if (!years.includes(year)) {
    throw new RangeError(
      `Year ${year} is not covered. Available: ${years.join(", ")}`,
    );
  }
  return holidays.filter((h) => h.date.startsWith(`${year}-`));
}

/** Every country with its holidays (all covered years, or one year) */
export function getWorldHolidays(year?: number): CountryHolidays[] {
  return Object.keys(data.countries).map((code) => ({
    code,
    name: data.countries[code].name,
    holidays: getHolidays(code, year),
  }));
}

/** Flat list across all countries, sorted by date */
export function getAllHolidaysFlat(year?: number): FlatHoliday[] {
  return getWorldHolidays(year)
    .flatMap((c) =>
      c.holidays.map((h) => ({ ...h, country: c.code, countryName: c.name })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Is this date a public holiday in the country? Returns the holiday or null */
export function isHoliday(
  code: string,
  date: Date | string = new Date(),
): Holiday | null {
  const iso = toISO(date);
  return lookup(code).holidays.find((h) => h.date === iso) ?? null;
}

/** Next public holiday on or after the given date (default: today) */
export function getNextHoliday(
  code: string,
  from: Date | string = new Date(),
): Holiday | null {
  const iso = toISO(from);
  return lookup(code).holidays.find((h) => h.date >= iso) ?? null;
}
