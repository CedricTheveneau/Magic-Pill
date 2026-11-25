"use client"
import { useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { TickGlyph } from "./glyphs";
import { useFormReset, useValidity } from "./validity";

export interface PillChoice {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Under its label, in a list. */
  hint?: ReactNode;
  disabled?: boolean;
}

interface PillChoicesBase extends FieldProps {
  /** A string is both the value and the label. */
  options: readonly (string | PillChoice)[];
  /** The name they're sent with. */
  name?: string;
  /** One under the other (`list`, the default), in one bar (`segmented`), or as `chips`. */
  look?: "list" | "segmented" | "chips";
  disabled?: boolean;
  className?: string;
}

export interface PillSingleChoiceProps extends PillChoicesBase {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export interface PillMultipleChoiceProps extends PillChoicesBase {
  /** Several of them, on checkboxes. */
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: string[], event: ChangeEvent<HTMLInputElement>) => void;
  required?: undefined;
}

export type PillChoicesProps = PillSingleChoiceProps | PillMultipleChoiceProps;

const NONE: readonly string[] = [];
const toList = (value: string | readonly string[] | undefined): readonly string[] | undefined =>
  value === undefined || typeof value !== "string" ? value : [value];

/** One of several choices, or several of them. */
export function PillChoices(props: PillChoicesProps) {
  const { label, hideLabel, hint, error, optional, name, look = "list", multiple = false, disabled, className } = props;
  const id = useId();
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const validity = useValidity(error, firstInputRef);
  const options = props.options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  ) as PillChoice[];

  const controlled = toList(props.value);
  const initial = toList(props.defaultValue) ?? NONE;
  const [own, setOwn] = useState(initial);
  const chosen = controlled ?? own;
  useFormReset(firstInputRef, () => setOwn(initial));

  // In one bar, the choice slides from one to the next. The first one only
  // appears: it comes from nowhere
  const at = options.findIndex((option) => option.value === chosen[0]);
  const isSliding = look === "segmented" && !multiple;
  const previousAt = useRef(at);
  const isAppearing = previousAt.current < 0;
  useEffect(() => {
    previousAt.current = at;
  }, [at]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.currentTarget;
    if (props.multiple) {
      const next = options
        .map((option) => option.value)
        .filter((option) => (option === value ? checked : chosen.includes(option)));
      setOwn(next);
      props.onChange?.(next, event);
    } else {
      setOwn([value]);
      props.onChange?.(value, event);
    }
  };

  return (
    <FieldShell
      {...{ label, hideLabel, hint, optional, className }}
      error={validity.error}
      group={multiple ? "group" : "radiogroup"}
      data-kind="choices"
    >
      {() => (
        <div
          data-mp="choices"
          data-look={look}
          data-slides={isSliding ? "" : undefined}
          style={{ "--_mp-count": options.length, "--_mp-at": Math.max(0, at) } as CSSProperties}
        >
          {isSliding && (
            <span
              data-mp="choices-thumb"
              data-empty={at < 0 ? "" : undefined}
              data-appearing={isAppearing ? "" : undefined}
              aria-hidden="true"
            />
          )}
          {options.map((option, index) => (
            <label key={option.value} data-mp="choice" htmlFor={id + option.value}>
              <input
                ref={index === 0 ? firstInputRef : undefined}
                id={id + option.value}
                type={multiple ? "checkbox" : "radio"}
                name={name ?? id}
                value={option.value}
                disabled={disabled || option.disabled}
                required={!multiple && props.required}
                {...(controlled
                  ? { checked: controlled.includes(option.value) }
                  : { defaultChecked: initial.includes(option.value) })}
                onChange={handleChange}
                onInput={validity.handlers.onInput}
                onInvalid={validity.handlers.onInvalid}
              />
              {look === "list" && (
                <span data-mp={multiple ? "field-tick" : "field-dot"} aria-hidden="true">
                  {multiple && <TickGlyph />}
                </span>
              )}
              <span data-mp="choice-body">
                {option.icon && (
                  <span data-mp="field-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span>
                  {option.label}
                  {option.hint && look === "list" && <small>{option.hint}</small>}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </FieldShell>
  );
}
