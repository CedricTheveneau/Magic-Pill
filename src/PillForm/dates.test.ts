import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  dayOf,
  firstDayOfWeek,
  formatValue,
  isDayOutside,
  localFirstDay,
  monthGrid,
  parseDay,
  timeOf,
  today,
  toValue,
  usesTwelveHours,
  weekOf,
  type DateType,
} from "./dates";

describe("days", () => {
  it.each([["2026-02-29"], ["2026-13-01"], ["2026-1-1"], [""], ["tomorrow"]])("aren't anything else (%s)", (day) => {
    // Assert
    expect(parseDay(day)).toBeUndefined();
  });

  it.each([
    ["2026-12-31", 1, "2027-01-01"],
    ["2028-02-28", 1, "2028-02-29"],
    ["2026-03-29", 1, "2026-03-30"], // a 23-hour day in Paris
    ["2026-01-01", -1, "2025-12-31"],
  ])("%s plus %i is %s", (day, count, expected) => {
    // Assert
    expect(addDays(day, count)).toBe(expected);
  });

  it.each([
    ["2026-01-31", 1, "2026-02-28"],
    ["2026-12-15", 1, "2027-01-15"],
    ["2028-02-29", 12, "2029-02-28"],
    ["2026-01-15", -1, "2025-12-15"],
  ])("%s, %i months later, is %s", (day, count, expected) => {
    // Assert
    expect(addMonths(day, count)).toBe(expected);
  });

  it("knows the local day and time", () => {
    // Assert
    expect(today(new Date(2026, 10, 5, 9, 7))).toEqual({ day: "2026-11-05", time: "09:07" });
  });
});

describe("ISO weeks", () => {
  it.each([
    ["2026-01-01", "2026-W01", "2025-12-29"],
    ["2027-01-01", "2026-W53", "2026-12-28"],
    ["2024-12-30", "2025-W01", "2024-12-30"],
    ["2026-12-27", "2026-W52", "2026-12-21"],
  ])("%s is in %s, from %s", (day, week, monday) => {
    // Assert
    expect(weekOf(day)).toBe(week);
    expect(firstDayOfWeek(week)).toBe(monday);
  });
});

describe("a month's grid", () => {
  it.each([
    [1, "2026-10-26"],
    [0, "2026-11-01"],
  ])("has six weeks, from its first one's day %i", (firstDay, first) => {
    // Act
    const grid = monthGrid("2026-11", firstDay);

    // Assert
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0][0]).toBe(first);
  });
});

describe("values", () => {
  const cases: [DateType, string, string, string][] = [
    ["date", "2026-12-24", "2026-12-24", ""],
    ["month", "2026-12", "2026-12-01", ""],
    ["week", "2026-W52", "2026-12-21", ""],
    ["time", "19:30", "", "19:30"],
    ["datetime-local", "2026-12-24T19:30", "2026-12-24", "19:30"],
  ];

  it.each(cases)("of a %s (%s) are read and written as the native input does", (type, value, day, time) => {
    // Assert
    expect(dayOf(value, type)).toBe(day);
    expect(timeOf(value, type)).toBe(time);
    expect(toValue(type, day, time)).toBe(value);
  });

  it.each([
    ["date", "2026-12-24", "December 24, 2026", "24 décembre 2026"],
    ["month", "2026-12", "December 2026", "décembre 2026"],
    ["time", "19:30", "7:30 PM", "19:30"],
    ["datetime-local", "2026-12-24T19:30", "Dec 24, 2026, 7:30 PM", "24 déc. 2026, 19:30"],
  ] as [DateType, string, string, string][])("of a %s are written as they are there", (type, value, english, french) => {
    // Act: some engines use narrow spaces
    const plain = (text: string) => text.replace(/\s/g, " ");

    // Assert
    expect(plain(formatValue(value, type, "en-US"))).toBe(english);
    expect(plain(formatValue(value, type, "fr-FR"))).toBe(french);
  });

  it("of a week are written as its days, and any of them as asked", () => {
    // Assert
    expect(formatValue("2026-W52", "week", "en-US")).toMatch(/December 21\s–\s27, 2026/);
    expect(formatValue("2026-12-24", "date", "en-GB", { dateStyle: "short" })).toBe("24/12/2026");
    expect(formatValue("", "date", "en-US")).toBe("");
    expect(formatValue("nonsense", "date", "en-US")).toBe("nonsense");
  });

  it.each([
    ["date", "2026-12-24", "2026-12-25", "", true],
    ["date", "2026-12-25", "2026-12-25", "2026-12-25", false],
    ["month", "2026-12-31", "", "2026-12", false],
    ["week", "2026-12-27", "", "2026-W51", true],
    ["datetime-local", "2026-12-24", "2026-12-24T19:30", "", false],
    ["datetime-local", "2026-12-23", "2026-12-24T19:30", "", true],
  ] as [DateType, string, string, string, boolean][])("of a %s know their bounds (%s, from %s to %s)", (type, day, min, max, expected) => {
    // Assert
    expect(isDayOutside(day, type, min, max)).toBe(expected);
  });
});

describe("local habits", () => {
  it("are the browser's", () => {
    // Assert
    expect(usesTwelveHours("en-US")).toBe(true);
    expect(usesTwelveHours("fr-FR")).toBe(false);
    expect(localFirstDay("fr-FR")).toBe(1);
    expect(localFirstDay("not a locale")).toBe(1);
  });
});
