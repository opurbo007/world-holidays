export interface Holiday {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  /** English holiday name */
  name: string;
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
