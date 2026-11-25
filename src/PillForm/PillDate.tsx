"use client"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Calendar, CALENDAR_LABELS, type CalendarLabels } from "./Calendar";
import { dayOf, formatValue, timeOf, toValue, type DateType } from "./dates";
import type { FieldLayout } from "./FormContext";
import { CalendarGlyph, ClockGlyph } from "./glyphs";
import { FieldShell, type FieldProps } from "./PillField";
import { usePopover } from "./popover";
import { useFormReset, useValidity } from "./validity";
import { inertProps } from "../utils/react";

export interface PillDateProps extends FieldProps {
  /** Default `date`. */
  type?: DateType;
  name?: string;
  /** As the native input of this type writes it: `2026-12-24`, `2026-12`, `2026-W52`, `19:30`, `2026-12-24T19:30`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Same format as the value. */
  min?: string;
  max?: string;
  /** In seconds, as on the native input: how far apart the times are. Default: five minutes. */
  step?: number;
  /** Days that can't be chosen, e.g. weekends. */
  disabledDate?: (day: string) => boolean;
  required?: boolean;
  disabled?: boolean;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** Default: the browser's. */
  locale?: string;
  /** 0 for Sunday. Default: the locale's. Weeks always start on Monday. */
  firstDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** How the chosen value is written. Default: in full. */
  format?: Intl.DateTimeFormatOptions;
  /** The calendar's own words. Days and months are the locale's. */
  labels?: Partial<CalendarLabels>;
  /** Always there, under the label, instead of in a popover. */
  inline?: boolean;
  /** The label above the field, or beside it. Default: the form's, or above. */
  layout?: FieldLayout;
  icon?: ReactNode;
  className?: string;
}

const PLACEHOLDERS: Record<DateType, string> = {
  date: "Pick a date",
  month: "Pick a month",
  week: "Pick a week",
  time: "Pick a time",
  "datetime-local": "Pick a date and time",
};

const subscribe = () => () => {};
/** False on the server and as the page wakes up: dates are written in the reader's language, which the server doesn't know. */
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/**
 * A date, a month, a week, a time, or a date and time, chosen in a calendar of
 * the pill's. It sends what the native input of its type would.
 */
export const PillDate = forwardRef<HTMLButtonElement, PillDateProps>(function PillDate(
  {
    label,
    hideLabel,
    hint,
    error,
    optional,
    type = "date",
    name,
    value: controlled,
    defaultValue = "",
    onChange,
    min,
    max,
    step,
    disabledDate,
    required = false,
    disabled = false,
    placeholder = PLACEHOLDERS[type],
    locale,
    firstDay,
    format,
    labels,
    inline = false,
    layout,
    icon,
    className,
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
  const validity = useValidity(error, inputRef);
  const isClient = useIsClient();
  const [own, setOwn] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  // While a date waits for its time
  const [draft, setDraft] = useState<{ day: string; time: string } | null>(null);
  useFormReset(inputRef, () => setOwn(defaultValue));

  const value = controlled ?? own;
  const day = draft?.day ?? dayOf(value, type);
  const time = draft?.time ?? timeOf(value, type);

  // The native input behind it hears the change: it checks it, and so does the form
  const isFirst = useRef(true);
  useEffect(() => {
    if (!isFirst.current) inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    isFirst.current = false;
  }, [value]);

  const close = (focus: boolean) => {
    setIsOpen(false);
    setDraft(null);
    if (focus) triggerRef.current?.focus();
  };
  usePopover(popoverRef, boxRef, isOpen && !inline, () => close(false));

  const handleChoice = (nextDay: string, nextTime: string, isFinal: boolean) => {
    const next = nextDay || nextTime ? toValue(type, nextDay, nextTime) : "";
    setDraft(isFinal ? null : { day: nextDay, time: nextTime });
    if (next !== value) {
      setOwn(next);
      onChange?.(next);
    }
    if (isFinal && isOpen) close(true);
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      // Neither its panel nor its modal closes with it
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      const stops = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')].filter(
        (stop) => stop.tabIndex === 0,
      );
      const edge = event.shiftKey ? stops[0] : stops[stops.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? stops[stops.length - 1] : stops[0])?.focus();
      }
    }
  };

  const calendar = (isInline: boolean) => (
    <Calendar
      type={type}
      day={day}
      time={time}
      min={min}
      max={max}
      step={step}
      locale={locale}
      firstDay={firstDay}
      disabledDate={disabledDate}
      labels={{ ...CALENDAR_LABELS, ...labels }}
      canClear={!required}
      autoFocus={!isInline}
      onChoose={handleChoice}
      onDone={isInline ? undefined : () => close(true)}
    />
  );
  const TypeGlyph = type === "time" ? ClockGlyph : CalendarGlyph;

  return (
    <FieldShell {...{ label, hideLabel, hint, optional, layout, className }} error={validity.error} isText={!inline} data-kind="text">
      {(control) => {
        // Sent with the form, and checked by the browser, which the trigger can't be
        const native = (
          <input
            ref={inputRef}
            type={type}
            name={name}
            value={value}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            step="any"
            tabIndex={-1}
            aria-hidden="true"
            data-mp="date-value"
            onChange={() => {}}
            onFocus={() => (triggerRef.current ?? boxRef.current?.querySelector<HTMLElement>('[tabindex="0"]'))?.focus()}
            onInput={validity.handlers.onInput}
            onInvalid={validity.handlers.onInvalid}
          />
        );
        if (inline) {
          return (
            <div ref={boxRef} data-mp="calendar" data-inline="" role="group" aria-labelledby={`${control.id}label`} {...inertProps(disabled)}>
              {native}
              {isClient && calendar(true)}
            </div>
          );
        }
        return (
          <div ref={boxRef} data-mp="field-box" data-type="pill-date">
            {native}
            {icon && (
              <span data-mp="field-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            <button
              {...control}
              ref={triggerRef}
              type="button"
              data-mp="field-trigger"
              data-empty={value ? undefined : ""}
              disabled={disabled}
              aria-labelledby={`${control.id}label ${control.id}value`}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? close(false) : setIsOpen(true))}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setIsOpen(true);
                }
              }}
            >
              <span id={`${control.id}value`} dir="auto">
                {value ? (isClient ? formatValue(value, type, locale, format) : value) : placeholder}
              </span>
            </button>
            <span data-mp="field-icon" aria-hidden="true">
              <TypeGlyph />
            </span>
            <div
              ref={popoverRef}
              popover="manual"
              role="dialog"
              aria-labelledby={`${control.id}label`}
              data-mp="calendar"
              data-open={isOpen ? "" : undefined}
              onKeyDown={handleKeys}
            >
              {isOpen && calendar(false)}
            </div>
          </div>
        );
      }}
    </FieldShell>
  );
});
