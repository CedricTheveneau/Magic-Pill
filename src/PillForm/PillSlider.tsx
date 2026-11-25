"use client"
import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { useFormReset } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillSliderProps
  extends Omit<FieldProps, "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children" | "min" | "max" | "step" | "value" | "defaultValue"> {
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** Default 1. */
  step?: number | "any";
  value?: number;
  /** Default: halfway. */
  defaultValue?: number;
  /** How its value reads, e.g. `(minutes) => `${minutes} min``. */
  format?: (value: number) => string;
}

/** A value between two others, on a native range input. */
export const PillSlider = forwardRef<HTMLInputElement, PillSliderProps>(function PillSlider(
  {
    label,
    hideLabel,
    hint,
    error,
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue = (min + max) / 2,
    format = String,
    className,
    onChange,
    ...rest
  },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const [ownValue, setOwnValue] = useState(defaultValue);
  useFormReset(inputRef, () => setOwnValue(Number(inputRef.current?.value)));

  const shown = value ?? ownValue;
  const text = format(shown);
  const position = max > min ? Math.min(1, Math.max(0, (shown - min) / (max - min))) : 0;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOwnValue(Number(event.currentTarget.value));
    onChange?.(event);
  };

  return (
    <FieldShell {...{ label, hideLabel, hint, error, className }} aside={text} data-kind="slider">
      {(control) => (
        <div data-mp="field-control" data-type="slider" style={{ "--_mp-at": position } as CSSProperties}>
          <input
            {...rest}
            {...control}
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            {...(value === undefined ? { defaultValue } : { value })}
            aria-valuetext={text}
            onChange={handleChange}
          />
          <span data-mp="slider-track" aria-hidden="true" />
          <span data-mp="slider-thumb" aria-hidden="true" />
        </div>
      )}
    </FieldShell>
  );
});
