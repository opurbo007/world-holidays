import raw from "../data/holidays.json";
import {
  filterHolidays,
  findNext,
  findOn,
  findUpcoming,
  type StoredHoliday,
} from "./core";
import type {
  Country,
  CountryHolidays,
  FlatHoliday,
  Holiday,
  HolidayOptions,
  MonthInput,
  YearInput,
} from "./types";

export type {
  Country,
  CountryCalendar,
  CountryHolidays,
  FlatHoliday,
  Holiday,
  HolidayOptions,
  MonthInput,
  YearInput,
} from "./types";

type Data = {
  generatedAt: string;
  years: number[];
  countries: Record<string, { name: string; holidays: StoredHoliday[] }>;
};

const data = raw as unknown as Data;

/** Years covered by this version of the data, e.g. [2026, 2027] */
export const years: number[] = data.years;

/** When the data was generated (ISO string) */
export const generatedAt: string = data.generatedAt;

function lookup(code: string) {
  const entry = data.countries[code.trim().toUpperCase()];
  if (!entry) {
    throw new Error(
      `Unknown country code: "${code}". Use searchCountries("${code}") to find it.`,
    );
  }
  return entry;
}

// ---------- countries ----------

/** All supported countries */
export function getCountries(): Country[] {
  return Object.entries(data.countries).map(([code, c]) => ({
    code,
    name: c.name,
  }));
}

/** Find countries by code or part of the name: searchCountries("bangla") */
export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getCountries().filter(
    (c) => c.code.toLowerCase() === q || c.name.toLowerCase().includes(q),
  );
}

// ---------- one country ----------

/**
 * Public holidays of one country. Every option is optional.
 *   getHolidays("BD")                                -> this year
 *   getHolidays("BD", 2027)                          -> a specific year
 *   getHolidays("BD", { year: "next" })              -> next year
 *   getHolidays("BD", { month: "March" })            -> one month of this year
 *   getHolidays("BD", { year: 2027, month: 12 })     -> one month of a year
 *   getHolidays("BD", { year: "all" })               -> every covered year
 */
export function getHolidays(
  code: string,
  options?: number | HolidayOptions,
): Holiday[] {
  return filterHolidays(lookup(code).holidays, years, options);
}

/** Whole year of a country (default: current year) */
export function getYearHolidays(
  code: string,
  year: YearInput = "current",
): Holiday[] {
  return getHolidays(code, { year });
}

/** One month of a country (default: current year) */
export function getMonthHolidays(
  code: string,
  month: MonthInput,
  year: YearInput = "current",
): Holiday[] {
  return getHolidays(code, { year, month });
}

/** Is this date a public holiday in the country? Returns the holiday or null */
export function isHoliday(
  code: string,
  date: Date | string = new Date(),
): Holiday | null {
  return findOn(lookup(code).holidays, date);
}

/** Next public holiday on or after the given date (default: today) */
export function getNextHoliday(
  code: string,
  from: Date | string = new Date(),
): Holiday | null {
  return findNext(lookup(code).holidays, from);
}

/** The next N public holidays (default 5) from a date (default: today) */
export function getUpcomingHolidays(
  code: string,
  limit = 5,
  from: Date | string = new Date(),
): Holiday[] {
  return findUpcoming(lookup(code).holidays, limit, from);
}

// ---------- whole world ----------

/** Every country with its holidays. Same options as getHolidays. */
export function getWorldHolidays(
  options?: number | HolidayOptions,
): CountryHolidays[] {
  return Object.entries(data.countries).map(([code, c]) => ({
    code,
    name: c.name,
    holidays: filterHolidays(c.holidays, years, options),
  }));
}

/** Flat list across all countries, sorted by date. Same options as getHolidays. */
export function getAllHolidaysFlat(
  options?: number | HolidayOptions,
): FlatHoliday[] {
  return getWorldHolidays(options)
    .flatMap((c) =>
      c.holidays.map((h) => ({ ...h, country: c.code, countryName: c.name })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
