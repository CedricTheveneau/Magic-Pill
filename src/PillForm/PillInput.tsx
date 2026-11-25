"use client"
import { forwardRef, useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import type { FieldLayout } from "./FormContext";
import { both, useValidity } from "./validity";
import { CalendarGlyph, ClockGlyph, EyeGlyph, SearchGlyph } from "./glyphs";
import { mergeRefs } from "../utils/react";

export type PillInputType =
  | "text"
  | "email"
  | "password"
  | "search"
  | "tel"
  | "url"
  | "number"
  | "date"
  | "time"
  | "datetime-local"
  | "month"
  | "week";

export interface PillInputProps extends FieldProps, Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> {
  /** Default `text`. */
  type?: PillInputType;
  /** The label above the control, or beside it. Default: the form's, or above. */
  layout?: FieldLayout;
  /** Before the text. `search` has its own. */
  icon?: ReactNode;
  /** After the text, e.g. a unit. */
  suffix?: ReactNode;
  /** A native list of suggestions. */
  suggestions?: readonly string[];
  /** `password` only: the name of the button that shows it. Default "Show the password". */
  revealLabel?: string;
}

/** The sign of what the browser opens */
const PICKERS: Partial<Record<PillInputType, () => ReactNode>> = {
  date: CalendarGlyph,
  "datetime-local": CalendarGlyph,
  month: CalendarGlyph,
  week: CalendarGlyph,
  time: ClockGlyph,
};

/** A line of text, a number or a date. Any other prop goes to the native `<input>`. */
export const PillInput = forwardRef<HTMLInputElement, PillInputProps>(function PillInput(
  {
    label,
    hideLabel,
    hint,
    error,
    optional,
    layout,
    type = "text",
    icon,
    suffix,
    suggestions,
    revealLabel = "Show the password",
    className,
    onInput,
    onBlur,
    onInvalid,
    ...rest
  },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);
  const [isRevealed, setIsRevealed] = useState(false);
  const listId = useId();
  const PickerGlyph = PICKERS[type];
  const leading = icon ?? (type === "search" ? <SearchGlyph /> : undefined);

  return (
    <FieldShell {...{ label, hideLabel, hint, optional, layout, className }} error={validity.error} isText data-kind="text">
      {(control) => (
        <div data-mp="field-box" data-type={type}>
          {leading && (
            <span data-mp="field-icon" aria-hidden="true">
              {leading}
            </span>
          )}
          <input
            {...rest}
            {...control}
            ref={ref}
            type={type === "password" && isRevealed ? "text" : type}
            list={suggestions ? listId : rest.list}
            onInput={both(validity.handlers.onInput, onInput)}
            onBlur={both(validity.handlers.onBlur, onBlur)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
          {suffix && <span data-mp="field-suffix">{suffix}</span>}
          {PickerGlyph && (
            <span data-mp="field-icon" aria-hidden="true">
              <PickerGlyph />
            </span>
          )}
          {type === "password" && (
            <button
              type="button"
              data-mp="field-button"
              aria-label={revealLabel}
              aria-pressed={isRevealed}
              disabled={rest.disabled}
              onClick={() => setIsRevealed(!isRevealed)}
            >
              <EyeGlyph crossed={isRevealed} />
            </button>
          )}
          {suggestions && (
            <datalist id={listId}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
        </div>
      )}
    </FieldShell>
  );
});
