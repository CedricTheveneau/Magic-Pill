"use client"
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import {
  addDays,
  addMonths,
  formatValue,
  isDayOutside,
  isOutside,
  localFirstDay,
  monthGrid,
  monthOf,
  parseDay,
  today,
  usesTwelveHours,
  weekOf,
  type DateType,
} from "./dates";
import { ChevronGlyph } from "./glyphs";

/** The calendar's own words. Days and months come from the browser, in the locale's language. */
export interface CalendarLabels {
  previous: string;
  next: string;
  /** Read with the month: what clicking it does. */
  zoomOut: string;
  today: string;
  now: string;
  clear: string;
  done: string;
  hours: string;
  minutes: string;
  period: string;
  week: string;
}

export const CALENDAR_LABELS: CalendarLabels = {
  previous: "Previous",
  next: "Next",
  zoomOut: "Choose a month",
  today: "Today",
  now: "Now",
  clear: "Clear",
  done: "Done",
  hours: "Hours",
  minutes: "Minutes",
  period: "AM or PM",
  week: "Week",
};

export interface CalendarProps {
  type: DateType;
  day: string;
  time: string;
  min?: string;
  max?: string;
  /** In seconds, as on the native input. */
  step?: number;
  locale?: string;
  firstDay?: number;
  disabledDate?: (day: string) => boolean;
  labels: CalendarLabels;
  /** Without it, there's no way to clear it. */
  canClear: boolean;
  /** Move the focus to the chosen day as it opens. */
  autoFocus: boolean;
  /** `isFinal`: nothing left to choose. */
  onChoose: (day: string, time: string, isFinal: boolean) => void;
  onDone?: () => void;
}

type View = "days" | "months" | "years";

const YEARS = 12;
const range = (length: number) => Array.from({ length }, (_, index) => index);
const startOfYears = (year: number) => year - (((year % YEARS) + YEARS) % YEARS);

/** Where a grid's focus goes with a key, in items; `undefined` for any other key. */
function gridStep(key: string, columns: number, isRtl: boolean): number | undefined {
  switch (key) {
    case "ArrowLeft":
      return isRtl ? 1 : -1;
    case "ArrowRight":
      return isRtl ? -1 : 1;
    case "ArrowUp":
      return -columns;
    case "ArrowDown":
      return columns;
    default:
      return undefined;
  }
}

const isRtl = (element: Element) => getComputedStyle(element).direction === "rtl";

/** A month of days, a year of months, a page of years, and the time: the part that's drawn. */
export function Calendar({
  type,
  day,
  time,
  min = "",
  max = "",
  step,
  locale,
  firstDay,
  disabledDate,
  labels,
  canClear,
  autoFocus,
  onChoose,
  onDone,
}: CalendarProps) {
  const now = useMemo(() => today(), []);
  const hasDays = type !== "time";
  const hasTime = type === "time" || type === "datetime-local";
  const [view, setView] = useState<View>(type === "month" ? "months" : "days");
  // The day the keyboard is on
  const [cursor, setCursor] = useState(day || (isOutside(now.day, min.slice(0, 10), max.slice(0, 10)) && parseDay(min.slice(0, 10)) ? min.slice(0, 10) : now.day));
  // Which way the page goes, for its movement
  const [direction, setDirection] = useState(0);
  const gridRef = useRef<HTMLTableElement | null>(null);
  const moveFocus = useRef(autoFocus);

  // It follows the value
  useEffect(() => {
    if (day) setCursor(day);
  }, [day]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true });
  });

  const goTo = (next: string, focus = true) => {
    setDirection(Math.sign(next.slice(0, 7).localeCompare(cursor.slice(0, 7))));
    setCursor(next);
    moveFocus.current = focus;
  };
  const choose = (chosen: string) => {
    setCursor(chosen);
    onChoose(chosen, time || (type === "datetime-local" ? roundTime(now.time, step) : ""), !hasTime);
  };
  const isDisabled = (candidate: string) => isDayOutside(candidate, type, min, max) || disabledDate?.(candidate) === true;

  const year = Number(cursor.slice(0, 4));
  const month = monthOf(cursor);
  const first = type === "week" ? 1 : (firstDay ?? localFirstDay(locale));
  const name = (candidate: string, options: Intl.DateTimeFormatOptions) => formatValue(candidate, "date", locale, options);

  // ── Pages
  const pageBy = (count: number) => goTo(addMonths(cursor, count * (view === "days" ? 1 : view === "months" ? 12 : 12 * YEARS)), false);
  const firstYear = startOfYears(year);
  const heading =
    view === "days"
      ? name(`${month}-01`, { month: "long", year: "numeric" })
      : view === "months"
        ? String(year)
        : `${firstYear} – ${firstYear + YEARS - 1}`;

  const handleKeys = (event: KeyboardEvent<HTMLTableElement>) => {
    const rtl = isRtl(event.currentTarget);
    const columns = view === "days" ? 7 : 3;
    const stepBy = gridStep(event.key, columns, rtl);
    const pages = view === "days" ? (event.shiftKey ? 12 : 1) : view === "months" ? 12 : 12 * YEARS;
    let next: string | undefined;
    if (stepBy !== undefined) next = view === "days" ? addDays(cursor, stepBy) : addMonths(cursor, stepBy * (view === "months" ? 1 : 12));
    else if (event.key === "PageUp") next = addMonths(cursor, -pages);
    else if (event.key === "PageDown") next = addMonths(cursor, pages);
    else if (view === "days" && (event.key === "Home" || event.key === "End")) {
      const weekday = ((parseDay(cursor)?.getUTCDay() ?? 0) - first + 7) % 7;
      next = addDays(cursor, event.key === "Home" ? -weekday : 6 - weekday);
    }
    if (next === undefined) return;
    event.preventDefault();
    goTo(next);
  };

  // ── Grids
  const cell = (
    key: string,
    content: ReactNode,
    { isChosen, isNow, isCursor, disabled, isOther, label, onClick }: CellOptions,
  ) => (
    <td key={key} role="gridcell" aria-selected={isChosen}>
      <button
        type="button"
        data-mp="calendar-cell"
        data-chosen={isChosen ? "" : undefined}
        data-other={isOther ? "" : undefined}
        aria-current={isNow ? "date" : undefined}
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={isCursor ? 0 : -1}
        onClick={disabled ? undefined : onClick}
      >
        {content}
      </button>
    </td>
  );

  const renderDays = () => {
    const weeks = monthGrid(month, first);
    return (
      <>
        <thead>
          <tr>
            {type === "week" && <th scope="col" aria-label={labels.week} />}
            {weeks[0].map((weekday) => (
              <th key={weekday} scope="col" abbr={name(weekday, { weekday: "long" })}>
                {name(weekday, { weekday: "narrow" })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const isChosenWeek = type === "week" && day !== "" && weekOf(week[0]) === weekOf(day);
            return (
              <tr key={week[0]} data-chosen={isChosenWeek ? "" : undefined}>
                {type === "week" && (
                  <th scope="row" data-mp="calendar-week">
                    {Number(weekOf(week[0]).slice(6))}
                  </th>
                )}
                {week.map((candidate) =>
                  cell(candidate, Number(candidate.slice(8)), {
                    isChosen: type === "week" ? isChosenWeek : candidate === day,
                    isNow: candidate === now.day,
                    isCursor: candidate === cursor,
                    disabled: isDisabled(candidate),
                    isOther: monthOf(candidate) !== month,
                    label: name(candidate, { dateStyle: "full" }),
                    onClick: () => choose(candidate),
                  }),
                )}
              </tr>
            );
          })}
        </tbody>
      </>
    );
  };

  const renderTiles = (tiles: { key: string; content: ReactNode; target: string; isChosen: boolean; isNow: boolean; disabled: boolean }[]) => (
    <tbody>
      {range(tiles.length / 3).map((row) => (
        <tr key={row}>
          {tiles.slice(row * 3, row * 3 + 3).map(({ key, content, target, isChosen, isNow, disabled }) =>
            cell(key, content, {
              isChosen,
              isNow,
              isCursor: key === (view === "months" ? month : String(year)),
              disabled,
              onClick: () => {
                if (view === "months" && type === "month") choose(target);
                else {
                  setView(view === "years" ? "months" : "days");
                  goTo(target);
                }
              },
            }),
          )}
        </tr>
      ))}
    </tbody>
  );

  const renderMonths = () =>
    renderTiles(
      range(12).map((index) => {
        const key = `${cursor.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`;
        return {
          key,
          content: name(`${key}-01`, { month: "short" }),
          target: addMonths(cursor, index + 1 - Number(cursor.slice(5, 7))),
          isChosen: type === "month" && day !== "" && monthOf(day) === key,
          isNow: monthOf(now.day) === key,
          disabled: isOutside(key, min.slice(0, 7), max.slice(0, 7)) && type !== "week",
        };
      }),
    );

  const renderYears = () =>
    renderTiles(
      range(YEARS).map((index) => {
        const key = String(firstYear + index);
        return {
          key,
          content: key,
          target: addMonths(cursor, (firstYear + index - year) * 12),
          isChosen: day !== "" && day.slice(0, 4) === key.padStart(4, "0"),
          isNow: now.day.slice(0, 4) === key,
          disabled: isOutside(key.padStart(4, "0"), min.slice(0, 4), max.slice(0, 4)),
        };
      }),
    );

  const isTodayDisabled = hasDays ? isDisabled(now.day) : isOutside(now.time, min, max);

  return (
    <div data-mp="calendar-body" data-type={type}>
      {hasDays && (
        <div data-mp="calendar-days">
          <div data-mp="calendar-head">
            <button type="button" data-mp="calendar-button" aria-label={labels.previous} onClick={() => pageBy(-1)}>
              <ChevronGlyph />
            </button>
            <button
              type="button"
              data-mp="calendar-heading"
              aria-live="polite"
              disabled={view === "years"}
              title={view === "years" ? undefined : labels.zoomOut}
              onClick={() => {
                setDirection(0);
                setView(view === "days" ? "months" : "years");
                moveFocus.current = true;
              }}
            >
              {heading}
            </button>
            <button type="button" data-mp="calendar-button" data-next="" aria-label={labels.next} onClick={() => pageBy(1)}>
              <ChevronGlyph />
            </button>
          </div>
          <table
            ref={gridRef}
            // A page of its own, so it comes in
            key={`${view} ${view === "days" ? month : view === "months" ? year : firstYear}`}
            role="grid"
            aria-label={heading}
            data-mp="calendar-grid"
            data-view={view}
            data-direction={direction || undefined}
            onKeyDown={handleKeys}
          >
            {view === "days" ? renderDays() : view === "months" ? renderMonths() : renderYears()}
          </table>
        </div>
      )}
      {hasTime && (
        <TimeColumns
          time={time}
          step={step}
          locale={locale}
          labels={labels}
          autoFocus={autoFocus && !hasDays}
          isDisabled={(candidate) =>
            type === "time" ? isOutside(candidate, min, max) : day !== "" && isOutside(`${day}T${candidate}`, min, max)
          }
          onChoose={(chosen) => onChoose(day || (hasDays ? cursor : ""), chosen, false)}
        />
      )}
      <div data-mp="calendar-foot">
        <button
          type="button"
          data-mp="calendar-button"
          disabled={isTodayDisabled}
          onClick={() => {
            if (hasDays) goTo(now.day, false);
            onChoose(hasDays ? now.day : "", hasTime ? now.time : "", !hasTime);
          }}
        >
          {hasDays ? labels.today : labels.now}
        </button>
        {canClear && (
          <button type="button" data-mp="calendar-button" onClick={() => onChoose("", "", true)}>
            {labels.clear}
          </button>
        )}
        {hasTime && onDone && (
          <button type="button" data-mp="calendar-button" data-main="" onClick={onDone}>
            {labels.done}
          </button>
        )}
      </div>
    </div>
  );
}

interface CellOptions {
  isChosen: boolean;
  isNow: boolean;
  isCursor: boolean;
  disabled: boolean;
  isOther?: boolean;
  label?: string;
  onClick: () => void;
}

/** Minutes between two choices: every five, unless the step asks for another. */
const minuteStep = (step: number | undefined) => (step && step >= 60 ? Math.max(1, Math.round(step / 60)) : 5);

/** A time one can choose, at or before this one. */
function roundTime(time: string, step: number | undefined): string {
  const [hours, minutes] = time.split(":").map(Number);
  const by = minuteStep(step);
  return `${String(hours).padStart(2, "0")}:${String(minutes - (minutes % by)).padStart(2, "0")}`;
}

interface TimeColumnsProps {
  time: string;
  step?: number;
  locale?: string;
  labels: CalendarLabels;
  autoFocus: boolean;
  isDisabled: (time: string) => boolean;
  onChoose: (time: string) => void;
}

function TimeColumns({ time, step, locale, labels, autoFocus, isDisabled, onChoose }: TimeColumnsProps) {
  const isTwelve = useMemo(() => usesTwelveHours(locale), [locale]);
  const [hours, minutes] = time ? time.split(":").map(Number) : [undefined, undefined];
  const by = minuteStep(step);
  const at = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const isAfternoon = (hours ?? 0) >= 12;
  const twoDigits = (value: number) => String(value).padStart(2, "0");
  const periods = useMemo(
    () =>
      [9, 15].map(
        (hour) =>
          new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true, timeZone: "UTC" })
            .formatToParts(new Date(Date.UTC(2000, 0, 1, hour)))
            .find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM"),
      ),
    [locale],
  );

  // A minute that isn't one of the choices is still shown
  const minuteChoices = [...new Set([...range(Math.ceil(60 / by)).map((index) => index * by), ...(minutes === undefined ? [] : [minutes])])].sort(
    (a, b) => a - b,
  );
  const hourChoices = isTwelve ? range(12).map((index) => index + (isAfternoon ? 12 : 0)) : range(24);

  return (
    <div data-mp="calendar-time">
      <Column
        label={labels.hours}
        autoFocus={autoFocus}
        chosen={hours}
        choices={hourChoices.map((hour) => ({
          value: hour,
          text: isTwelve ? String(hour % 12 || 12) : twoDigits(hour),
          disabled: minuteChoices.every((minute) => isDisabled(at(hour, minute))),
        }))}
        onChoose={(hour) => onChoose(at(hour, minutes ?? 0))}
      />
      <Column
        label={labels.minutes}
        chosen={minutes}
        choices={minuteChoices.map((minute) => ({
          value: minute,
          text: twoDigits(minute),
          disabled: hours !== undefined && isDisabled(at(hours, minute)),
        }))}
        onChoose={(minute) => onChoose(at(hours ?? 0, minute))}
      />
      {isTwelve && (
        <Column
          label={labels.period}
          chosen={hours === undefined ? undefined : isAfternoon ? 1 : 0}
          choices={periods.map((text, value) => ({
            value,
            text,
            disabled: hours !== undefined && isDisabled(at((hours % 12) + value * 12, minutes ?? 0)),
          }))}
          onChoose={(period) => onChoose(at(((hours ?? 0) % 12) + period * 12, minutes ?? 0))}
        />
      )}
    </div>
  );
}

interface ColumnProps {
  label: string;
  chosen: number | undefined;
  choices: { value: number; text: string; disabled: boolean }[];
  autoFocus?: boolean;
  onChoose: (value: number) => void;
}

/** A list to scroll, or to go through with the arrows. */
function Column({ label, chosen, choices, autoFocus, onChoose }: ColumnProps) {
  const id = useId();
  const listRef = useRef<HTMLDivElement | null>(null);

  // What's chosen is in the middle. Not a layout effect: its popover isn't shown yet
  useEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && option) list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
  }, [chosen, choices.length]);

  useEffect(() => {
    if (autoFocus) listRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = choices.filter((choice) => !choice.disabled);
    const index = enabled.findIndex((choice) => choice.value === chosen);
    const target = {
      ArrowDown: enabled[index + 1],
      ArrowUp: enabled[index < 0 ? enabled.length - 1 : index - 1],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    }[event.key];
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (target) onChoose(target.value);
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={chosen === undefined ? undefined : id + chosen}
      tabIndex={0}
      data-mp="calendar-column"
      onKeyDown={handleKeys}
    >
      {choices.map(({ value, text, disabled }) => (
        <div
          key={value}
          id={id + value}
          role="option"
          aria-selected={value === chosen}
          aria-disabled={disabled || undefined}
          data-mp="calendar-option"
          onClick={disabled ? undefined : () => onChoose(value)}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
