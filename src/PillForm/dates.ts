// Dates as the native inputs write them ("2026-12-24", "2026-12", "2026-W52",
// "19:30", "2026-12-24T19:30"). These sort as text, so they're compared as it.
// Days are handled in UTC: no time zone, no daylight saving.

export type DateType = "date" | "month" | "week" | "time" | "datetime-local";

const DAY = 86_400_000;

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** A day as a date, at midnight UTC; undefined if it isn't one. */
export function parseDay(day: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return undefined;
  const [year, month, date] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  // Years under 100 would be 19xx
  parsed.setUTCFullYear(year);
  return formatDay(parsed) === day ? parsed : undefined;
}

export const formatDay = (date: Date): string =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export const addDays = (day: string, count: number): string => {
  const date = parseDay(day);
  return date ? formatDay(new Date(date.getTime() + count * DAY)) : day;
};

/** The same day in another month, or that month's last one. */
export function addMonths(day: string, count: number): string {
  const date = parseDay(day);
  if (!date) return day;
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
  target.setUTCDate(Math.min(date.getUTCDate(), daysInMonth(target)));
  return formatDay(target);
}

const daysInMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

export const monthOf = (day: string): string => day.slice(0, 7);

/** The ISO week a day is in: the one its Thursday is in. */
export function weekOf(day: string): string {
  const date = parseDay(day);
  if (!date) return "";
  const thursday = new Date(date.getTime() + (4 - (date.getUTCDay() || 7)) * DAY);
  const year = thursday.getUTCFullYear();
  const firstDay = Date.UTC(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - firstDay) / DAY + 1) / 7);
  return `${pad(year, 4)}-W${pad(week)}`;
}

/** The Monday of an ISO week. */
export function firstDayOfWeek(week: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) return "";
  const [year, number] = match.slice(1).map(Number);
  // January 4th is always in the first week
  const fourth = new Date(Date.UTC(year, 0, 4));
  const monday = fourth.getTime() - ((fourth.getUTCDay() || 7) - 1) * DAY;
  return formatDay(new Date(monday + (number - 1) * 7 * DAY));
}

/** Six weeks of days around a month, so its calendar never changes height. `firstDay`: 0 for Sunday. */
export function monthGrid(month: string, firstDay: number): string[][] {
  const first = `${month}-01`;
  const date = parseDay(first);
  if (!date) return [];
  const start = addDays(first, -((date.getUTCDay() - firstDay + 7) % 7));
  return Array.from({ length: 6 }, (_, week) => Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)));
}

/** The day a value is about: what its calendar opens on. */
export function dayOf(value: string, type: DateType): string {
  switch (type) {
    case "month":
      return parseDay(`${value}-01`) ? `${value}-01` : "";
    case "week":
      return firstDayOfWeek(value);
    case "time":
      return "";
    default:
      return parseDay(value.slice(0, 10)) ? value.slice(0, 10) : "";
  }
}

export const timeOf = (value: string, type: DateType): string =>
  (/(\d{2}:\d{2})/.exec(type === "time" ? value : type === "datetime-local" ? value.slice(11) : "") ?? [""])[0];

/** A day (and a time) as a value of this type. */
export function toValue(type: DateType, day: string, time = ""): string {
  switch (type) {
    case "month":
      return monthOf(day);
    case "week":
      return weekOf(day);
    case "time":
      return time;
    case "datetime-local":
      return day ? `${day}T${time || "00:00"}` : "";
    default:
      return day;
  }
}

/** Whether a whole day (or the month, or the week it's in) is out of bounds. */
export function isDayOutside(day: string, type: DateType, min = "", max = ""): boolean {
  const value = type === "month" || type === "week" ? toValue(type, day) : day;
  // Of a date and time, the day alone
  const [from, to] = type === "datetime-local" ? [min.slice(0, 10), max.slice(0, 10)] : [min, max];
  return (from !== "" && value < from) || (to !== "" && value > to);
}

export const isOutside = (value: string, min = "", max = ""): boolean =>
  (min !== "" && value < min) || (max !== "" && value > max);

/** Today and now, where the person is. */
export function today(now = new Date()): { day: string; time: string } {
  return {
    day: `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

/** The first day of the week there, 0 for Sunday; Monday where the browser doesn't know. */
export function localFirstDay(locale: string | undefined): number {
  try {
    const language = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const info = new Intl.Locale(language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    return ((info.getWeekInfo?.() ?? info.weekInfo)?.firstDay ?? 1) % 7;
  } catch {
    return 1;
  }
}

/** Whether the clock there goes to 12. */
export function usesTwelveHours(locale: string | undefined): boolean {
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12 === true;
}

const FORMATS: Record<Exclude<DateType, "week">, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "long" },
  month: { month: "long", year: "numeric" },
  time: { timeStyle: "short" },
  "datetime-local": { dateStyle: "medium", timeStyle: "short" },
};

/** A value, as it's written there. */
export function formatValue(
  value: string,
  type: DateType,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  const formatter = new Intl.DateTimeFormat(locale, {
    ...(options ?? (type === "week" ? { day: "numeric", month: "long", year: "numeric" } : FORMATS[type])),
    timeZone: "UTC",
  });
  const day = dayOf(value, type);
  if (type === "week") {
    const monday = parseDay(day);
    const sunday = parseDay(addDays(day, 6));
    // Typed in ES2021's Intl, which browsers had by then
    const range = formatter as Intl.DateTimeFormat & { formatRange: (start: Date, end: Date) => string };
    return monday && sunday ? range.formatRange(monday, sunday) : value;
  }
  const date = parseDay(day || "2000-01-01");
  if (!date || (!day && type !== "time")) return value;
  const [hours, minutes] = timeOf(value, type).split(":").map(Number);
  date.setUTCHours(hours || 0, minutes || 0);
  return formatter.format(date);
}
