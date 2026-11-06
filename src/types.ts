export interface Holiday {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  /** English holiday name */
  name: string;
  /** English weekday name, e.g. "Friday" */
  weekday: string;
}

export interface Country {
  /** ISO 3166 code, e.g. "BD" */
  code: string;
  /** English country name */
  name: string;
}

export interface CountryHolidays extends Country {
  holidays: Holiday[];
}

export interface FlatHoliday extends Holiday {
  country: string;
  countryName: string;
}

/** 2027, "current", "next", or "all" (every covered year) */
export type YearInput = number | "current" | "next" | "all";

/** 1-12, or an English month name: "March", "mar" */
export type MonthInput = number | string;

export interface HolidayOptions {
  /** Default: "current" */
  year?: YearInput;
  /** Default: whole year */
  month?: MonthInput;
}

/** A single country's calendar, returned by "world-holidays/country/XX" */
export interface CountryCalendar extends Country {
  /** Years covered, e.g. [2026, 2027] */
  years: number[];
  getHolidays(options?: number | HolidayOptions): Holiday[];
  getYearHolidays(year?: YearInput): Holiday[];
  getMonthHolidays(month: MonthInput, year?: YearInput): Holiday[];
  isHoliday(date?: Date | string): Holiday | null;
  getNextHoliday(from?: Date | string): Holiday | null;
  getUpcomingHolidays(limit?: number, from?: Date | string): Holiday[];
}
