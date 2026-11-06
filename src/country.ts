import {
  filterHolidays,
  findNext,
  findOn,
  findUpcoming,
  type StoredHoliday,
} from "./core";
import type { CountryCalendar } from "./types";

export function createCountry(
  code: string,
  name: string,
  holidays: StoredHoliday[],
  years: number[],
): CountryCalendar {
  return {
    code,
    name,
    years,
    getHolidays: (options) => filterHolidays(holidays, years, options),
    getYearHolidays: (year = "current") =>
      filterHolidays(holidays, years, { year }),
    getMonthHolidays: (month, year = "current") =>
      filterHolidays(holidays, years, { year, month }),
    isHoliday: (date) => findOn(holidays, date),
    getNextHoliday: (from) => findNext(holidays, from),
    getUpcomingHolidays: (limit, from) => findUpcoming(holidays, limit, from),
  };
}
