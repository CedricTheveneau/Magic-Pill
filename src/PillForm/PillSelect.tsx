"use client"
import {
  forwardRef,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { FieldShell, type FieldProps } from "./PillField";
import type { FieldLayout } from "./FormContext";
import { ChevronGlyph } from "./glyphs";
import { both, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PillOptionGroup {
  label: string;
  options: readonly (string | PillOption)[];
}

export interface PillSelectProps
  extends FieldProps,
    Omit<ComponentPropsWithoutRef<"select">, "children" | "multiple" | "size"> {
  /** A string is both the value and the label. */
  options: readonly (string | PillOption | PillOptionGroup)[];
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** Under its label (default), or a chip at the end of the row. */
  layout?: FieldLayout;
  icon?: ReactNode;
}

const renderOption = (option: string | PillOption | PillOptionGroup): ReactNode => {
  if (typeof option === "string") {
    return (
      <option key={option} value={option}>
        {option}
      </option>
    );
  }
  if ("options" in option) {
    return (
      <optgroup key={option.label} label={option.label}>
        {option.options.map(renderOption)}
      </optgroup>
    );
  }
  return (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
};

const isOpen = (select: HTMLSelectElement) => {
  try {
    return select.matches(":open");
  } catch {
    return false;
  }
};

/** One of several options, in a native `<select>`. Any other prop goes to it. */
export const PillSelect = forwardRef<HTMLSelectElement, PillSelectProps>(function PillSelect(
  {
    label,
    hideLabel,
    hint,
    error,
    optional,
    layout = "stacked",
    options,
    placeholder,
    icon,
    className,
    onInput,
    onBlur,
    onInvalid,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const ref = useMemo(() => mergeRefs(selectRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, selectRef);
  const startsEmpty = placeholder !== undefined && rest.value === undefined && rest.defaultValue === undefined;

  // Escape closes the open list: the panel mustn't close with it
  const handleKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    onKeyDown?.(event);
    if (event.key === "Escape" && isOpen(event.currentTarget)) event.stopPropagation();
  };

  return (
    <FieldShell {...{ label, hideLabel, hint, optional, layout, className }} error={validity.error} data-kind="select">
      {(control) => (
        <div data-mp="field-box" data-type="select">
          {icon && (
            <span data-mp="field-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <select
            {...rest}
            {...(startsEmpty && { defaultValue: "" })}
            {...control}
            ref={ref}
            onInput={both(validity.handlers.onInput, onInput)}
            onBlur={both(validity.handlers.onBlur, onBlur)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
            onKeyDown={handleKeyDown}
          >
            {placeholder !== undefined && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map(renderOption)}
          </select>
          <span data-mp="field-chevron" aria-hidden="true">
            <ChevronGlyph />
          </span>
        </div>
      )}
    </FieldShell>
  );
});
