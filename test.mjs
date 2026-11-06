import * as w from "./dist/index.js";

console.log(w.getHolidays("BD").length);
console.log(w.getHolidays("BD", { year: 2026, month: "December" }));
console.log(w.searchCountries("bangla"));
console.log(w.getUpcomingHolidays("GB", 3));
