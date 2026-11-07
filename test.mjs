import { test } from "node:test";
import assert from "node:assert/strict";

import * as w from "./dist/index.js";
import bd, { country as bdNamed } from "./dist/countries/BD.js";
import { country as us } from "./dist/countries/US.js";

const [Y1, Y2] = w.years; // covered years, e.g. 2026 and 2027
const thisYear = new Date().getFullYear();

// ---------- data ----------

test("coverage info", () => {
  assert.equal(w.years.length, 2);
  assert.equal(Y2, Y1 + 1);
  assert.ok(!Number.isNaN(Date.parse(w.generatedAt)));
});

test("countries list and search", () => {
  const all = w.getCountries();
  assert.ok(all.length > 150, "expected 150+ countries");
  assert.ok(all.every((c) => /^[A-Z]{2}$/.test(c.code) && c.name));

  assert.deepEqual(
    w.searchCountries("bangla").map((c) => c.code),
    ["BD"],
  );
  assert.deepEqual(
    w.searchCountries("bd").map((c) => c.code),
    ["BD"],
  ); // by code
  assert.deepEqual(w.searchCountries("zzzz"), []);
  assert.deepEqual(w.searchCountries("  "), []);
});

// ---------- getHolidays options ----------

test("default is the current year", () => {
  if (!w.years.includes(thisYear)) return; // data is outdated, skip
  const list = w.getHolidays("BD");
  assert.ok(list.length > 0);
  assert.ok(list.every((h) => h.date.startsWith(`${thisYear}-`)));
});

test("year as number, 'current', 'next', 'all'", () => {
  const y1 = w.getHolidays("BD", Y1);
  const y2 = w.getHolidays("BD", { year: Y2 });
  const all = w.getHolidays("BD", { year: "all" });

  assert.ok(y1.every((h) => h.date.startsWith(`${Y1}-`)));
  assert.ok(y2.every((h) => h.date.startsWith(`${Y2}-`)));
  assert.equal(all.length, y1.length + y2.length);

  if (w.years.includes(thisYear)) {
    assert.deepEqual(
      w.getHolidays("BD", { year: "current" }),
      w.getHolidays("BD"),
    );
  }
  if (w.years.includes(thisYear + 1)) {
    assert.ok(
      w
        .getHolidays("BD", { year: "next" })
        .every((h) => h.date.startsWith(`${thisYear + 1}-`)),
    );
  }
});

test("month as number, name, short name and numeric string", () => {
  const byNumber = w.getHolidays("BD", { year: Y1, month: 12 });
  assert.ok(byNumber.length > 0);
  assert.ok(byNumber.every((h) => h.date.startsWith(`${Y1}-12-`)));

  assert.deepEqual(
    w.getHolidays("BD", { year: Y1, month: "December" }),
    byNumber,
  );
  assert.deepEqual(w.getHolidays("BD", { year: Y1, month: "dec" }), byNumber);
  assert.deepEqual(w.getHolidays("BD", { year: Y1, month: "12" }), byNumber);
});

test("shortcuts match getHolidays", () => {
  assert.deepEqual(
    w.getYearHolidays("JP", Y2),
    w.getHolidays("JP", { year: Y2 }),
  );
  assert.deepEqual(
    w.getMonthHolidays("US", "dec", Y1),
    w.getHolidays("US", { year: Y1, month: 12 }),
  );
});

test("country code is case-insensitive and trimmed", () => {
  assert.deepEqual(w.getHolidays(" bd ", Y1), w.getHolidays("BD", Y1));
});

// ---------- holiday shape ----------

test("holiday shape: date, name, weekday (and nothing else)", () => {
  for (const h of w.getHolidays("DE", { year: Y1 })) {
    assert.deepEqual(Object.keys(h).sort(), ["date", "name", "weekday"]);
    assert.match(h.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(h.name.length > 0);
  }
});

test("weekday is correct", () => {
  // 25 Dec 2026 is a Friday, 16 Dec 2026 is a Wednesday
  if (Y1 === 2026) {
    assert.equal(w.isHoliday("US", "2026-12-25")?.weekday, "Friday");
    assert.equal(w.isHoliday("BD", "2026-12-16")?.weekday, "Wednesday");
  }
});

test("results are sorted by date", () => {
  const dates = w.getHolidays("GB", { year: "all" }).map((h) => h.date);
  assert.deepEqual(dates, [...dates].sort());
});

// ---------- isHoliday / next / upcoming ----------

test("isHoliday", () => {
  const xmas = w.isHoliday("US", `${Y1}-12-25`);
  assert.equal(xmas?.name, "Christmas Day");
  assert.equal(w.isHoliday("US", new Date(Y1, 11, 25))?.name, "Christmas Day"); // Date object
  assert.equal(
    w.isHoliday("US", `${Y1}-12-25T10:00:00Z`)?.name,
    "Christmas Day",
  ); // ISO string
  assert.equal(w.isHoliday("US", `${Y1}-12-24`), null);
});

test("getNextHoliday", () => {
  const next = w.getNextHoliday("US", `${Y1}-12-01`);
  assert.equal(next?.date, `${Y1}-12-25`);
  assert.equal(w.getNextHoliday("US", `${Y1}-12-25`)?.date, `${Y1}-12-25`); // same day counts
  assert.equal(w.getNextHoliday("US", "2999-01-01"), null); // nothing left
});

test("getUpcomingHolidays", () => {
  const list = w.getUpcomingHolidays("GB", 3, `${Y1}-12-01`);
  assert.equal(list.length, 3);
  assert.ok(list.every((h) => h.date >= `${Y1}-12-01`));
  assert.equal(w.getUpcomingHolidays("GB", 2, `${Y1}-01-01`).length, 2);
  assert.ok(w.getUpcomingHolidays("GB").length <= 5); // default limit
});

// ---------- whole world ----------

test("getWorldHolidays", () => {
  const world = w.getWorldHolidays({ year: Y1, month: 12 });
  assert.equal(world.length, w.getCountries().length);
  const bdEntry = world.find((c) => c.code === "BD");
  assert.ok(bdEntry && bdEntry.holidays.length > 0);
  assert.ok(
    world.every((c) => c.holidays.every((h) => h.date.startsWith(`${Y1}-12-`))),
  );
});

test("getAllHolidaysFlat", () => {
  const flat = w.getAllHolidaysFlat({ year: Y2, month: "January" });
  assert.ok(flat.length > 100);
  assert.ok(
    flat.every(
      (h) => h.country && h.countryName && h.date.startsWith(`${Y2}-01-`),
    ),
  );
  const dates = flat.map((h) => h.date);
  assert.deepEqual(dates, [...dates].sort());
  assert.ok(
    flat.some((h) => h.country === "US" && h.name === "New Year's Day"),
  );
});

// ---------- errors ----------

test("clear errors for bad input", () => {
  assert.throws(() => w.getHolidays("XX"), {
    message: /Unknown country code.*searchCountries/,
  });
  assert.throws(() => w.getHolidays("US", 2999), {
    name: "RangeError",
    message: /not covered/,
  });
  assert.throws(() => w.getHolidays("US", { year: 2020.5 }), {
    name: "RangeError",
  });
  assert.throws(() => w.getHolidays("US", { month: 13 }), {
    name: "RangeError",
    message: /Invalid month/,
  });
  assert.throws(() => w.getHolidays("US", { month: 0 }), {
    name: "RangeError",
  });
  assert.throws(() => w.getHolidays("US", { month: "foo" }), {
    name: "RangeError",
  });
  assert.throws(() => w.isHoliday("XX"), /Unknown country code/);
});

// ---------- per-country import ----------

test("per-country entry: shape and exports", () => {
  assert.equal(bd, bdNamed); // default === named
  assert.equal(bd.code, "BD");
  assert.match(bd.name, /Bangladesh/);
  assert.deepEqual(bd.years, w.years);
});

test("per-country entry gives the same answers as the full package", () => {
  assert.deepEqual(
    bd.getHolidays({ year: Y1, month: "Dec" }),
    w.getHolidays("BD", { year: Y1, month: "Dec" }),
  );
  assert.deepEqual(bd.getYearHolidays(Y2), w.getYearHolidays("BD", Y2));
  assert.deepEqual(
    bd.getMonthHolidays(12, Y1),
    w.getMonthHolidays("BD", 12, Y1),
  );
  assert.deepEqual(
    bd.isHoliday(`${Y1}-12-16`),
    w.isHoliday("BD", `${Y1}-12-16`),
  );
  assert.deepEqual(
    bd.getNextHoliday(`${Y1}-11-06`),
    w.getNextHoliday("BD", `${Y1}-11-06`),
  );
  assert.deepEqual(
    us.getUpcomingHolidays(3, `${Y1}-12-01`),
    w.getUpcomingHolidays("US", 3, `${Y1}-12-01`),
  );
});

test("per-country entry throws the same errors", () => {
  assert.throws(() => bd.getHolidays({ month: 13 }), { name: "RangeError" });
  assert.throws(() => bd.getHolidays(2999), { name: "RangeError" });
});
