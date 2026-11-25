"use client"
import { forwardRef, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { AddGlyph, MinusGlyph } from "./glyphs";
import { useFormReset, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillStepperProps
  extends Omit<FieldProps, "hideLabel" | "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children" | "min" | "max" | "value" | "defaultValue"> {
  min?: number;
  max?: number;
  value?: number | "";
  /** Default: `min`, or 0. */
  defaultValue?: number;
  /** After the number. */
  unit?: ReactNode;
}

/** A number, one step at a time. */
export const PillStepper = forwardRef<HTMLInputElement, PillStepperProps>(function PillStepper(
  { label, hint, error, className, min, max, value, defaultValue = min ?? 0, unit, onInput, onBlur, onInvalid, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);
  const [ownValue, setOwnValue] = useState<number | "">(defaultValue);
  const read = () => {
    const text = inputRef.current?.value ?? "";
    setOwnValue(text === "" ? "" : Number(text));
  };
  useFormReset(inputRef, read);
  const shown = value ?? ownValue;

  const handleInput: PillStepperProps["onInput"] = (event) => {
    read();
    validity.handlers.onInput(event);
    onInput?.(event);
  };
  const step = (direction: 1 | -1) => () => {
    const input = inputRef.current;
    if (!input) return;
    if (direction > 0) input.stepUp();
    else input.stepDown();
    // As if it had been typed: the app's handlers hear it
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // For the pointer: with the keyboard, the arrows do it in the field itself
  const renderButton = (direction: 1 | -1, isAtLimit: boolean) => (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      data-mp="stepper-button"
      disabled={rest.disabled || rest.readOnly || isAtLimit}
      onClick={step(direction)}
    >
      <span>{direction > 0 ? <AddGlyph /> : <MinusGlyph />}</span>
    </button>
  );

  return (
    <FieldShell {...{ label, hint, className }} error={validity.error} layout="inline" data-kind="stepper">
      {(control) => (
        <div data-mp="field-control" data-type="stepper">
          {renderButton(-1, min !== undefined && shown !== "" && shown <= min)}
          <span data-mp="stepper-value">
            <input
              inputMode="numeric"
              {...rest}
              {...control}
              ref={ref}
              type="number"
              min={min}
              max={max}
              {...(value === undefined ? { defaultValue } : { value })}
              onInput={handleInput}
              onBlur={(event) => {
                validity.handlers.onBlur(event);
                onBlur?.(event);
              }}
              onInvalid={(event) => {
                validity.handlers.onInvalid(event);
                onInvalid?.(event);
              }}
            />
            {unit && <span>{unit}</span>}
          </span>
          {renderButton(1, max !== undefined && shown !== "" && shown >= max)}
        </div>
      )}
    </FieldShell>
  );
});
