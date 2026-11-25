"use client"
import { forwardRef, useMemo, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { both, useFormReset, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillCodeProps
  extends Omit<FieldProps, "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children" | "pattern" | "maxLength" | "value" | "defaultValue"> {
  /** How many digits. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  /** Called once they're all there. */
  onComplete?: (code: string) => void;
}

/** A one-time code: a single input, drawn as slots, so pasting and SMS autofill work. */
export const PillCode = forwardRef<HTMLInputElement, PillCodeProps>(function PillCode(
  { label, hideLabel, hint, error, length = 6, value, defaultValue = "", onComplete, className, onInput, onBlur, onInvalid, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);
  const [ownValue, setOwnValue] = useState(defaultValue);
  useFormReset(inputRef, () => setOwnValue(inputRef.current?.value ?? ""));
  const digits = value ?? ownValue;

  const handleInput: PillCodeProps["onInput"] = (event) => {
    const input = event.currentTarget;
    const clean = input.value.replace(/\D/g, "").slice(0, length);
    // Set as React knows it, so a controlled value doesn't come back
    if (clean !== input.value) input.value = clean;
    setOwnValue(clean);
    validity.handlers.onInput(event);
    onInput?.(event);
    if (clean.length === length && clean !== digits) onComplete?.(clean);
  };

  return (
    <FieldShell {...{ label, hideLabel, hint, className }} error={validity.error} data-kind="code">
      {(control) => (
        <div data-mp="field-control" data-type="code" style={{ "--_mp-count": length } as CSSProperties}>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            {...rest}
            {...control}
            ref={ref}
            type="text"
            pattern={`[0-9]{${length}}`}
            {...(value === undefined ? { defaultValue } : { value })}
            onInput={handleInput}
            onBlur={both(validity.handlers.onBlur, onBlur)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              data-mp="code-slot"
              data-next={index === Math.min(digits.length, length - 1) ? "" : undefined}
              aria-hidden="true"
            >
              {digits[index]}
            </span>
          ))}
        </div>
      )}
    </FieldShell>
  );
});
