"use client"
import { forwardRef, useMemo, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { useFormReset } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillColorProps
  extends Omit<FieldProps, "hideLabel" | "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children" | "value" | "defaultValue"> {
  /** `#rrggbb`. */
  value?: string;
  /** Default `#d5d2e8`. */
  defaultValue?: string;
}

/** A colour, from the browser's own picker. */
export const PillColor = forwardRef<HTMLInputElement, PillColorProps>(function PillColor(
  { label, hint, error, className, value, defaultValue = "#d5d2e8", onInput, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const [ownValue, setOwnValue] = useState(defaultValue);
  const read = () => setOwnValue(inputRef.current?.value ?? defaultValue);
  useFormReset(inputRef, read);
  const color = value ?? ownValue;

  const handleInput: PillColorProps["onInput"] = (event) => {
    read();
    onInput?.(event);
  };

  return (
    <FieldShell {...{ label, hint, error, className }} layout="inline" data-kind="color">
      {(control) => (
        <span data-mp="field-control" data-type="color" style={{ "--_mp-color": color } as CSSProperties}>
          <input
            {...rest}
            {...control}
            ref={ref}
            type="color"
            {...(value === undefined ? { defaultValue } : { value })}
            onInput={handleInput}
          />
          <span data-mp="color-value" aria-hidden="true">
            {color}
          </span>
          <span data-mp="color-swatch" aria-hidden="true" />
        </span>
      )}
    </FieldShell>
  );
});
