import Holidays from "date-holidays";
import { writeFileSync, mkdirSync } from "node:fs";

const thisYear = new Date().getFullYear();
const YEARS = [thisYear, thisYear + 1];

type Row = { date: string; name: string; type: string };

const base = new Holidays();
const countries = base.getCountries("en") as Record<string, string>;

const out: Record<string, { name: string; holidays: Row[] }> = {};
let empty = 0;

for (const [code, name] of Object.entries(countries)) {
  const hd = new Holidays(code);
  const rows: Row[] = [];

  for (const year of YEARS) {
    for (const h of hd.getHolidays(year, "en")) {
      if (h.type !== "public") continue; // official public holidays only
      rows.push({ date: h.date.slice(0, 10), name: h.name, type: h.type });
    }
  }

  // remove duplicates (same date + name) and sort by date
  const seen = new Set<string>();
  const unique = rows
    .filter((r) => {
      const k = `${r.date}|${r.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (unique.length === 0) empty++;
  out[code] = { name, holidays: unique };
}

mkdirSync("data", { recursive: true });
writeFileSync(
  "data/holidays.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), years: YEARS, countries: out })
);

console.log(
  `Done: ${Object.keys(out).length} countries, years ${YEARS.join(", ")}, ${empty} with no public holidays`
);