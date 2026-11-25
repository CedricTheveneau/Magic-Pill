"use client"
import { forwardRef, useEffect, useMemo, useRef, type ComponentPropsWithoutRef } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { TickGlyph } from "./glyphs";
import { both, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillCheckboxProps
  extends Omit<FieldProps, "hideLabel" | "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> {
  /** Neither checked nor not: some of what it stands for is. */
  indeterminate?: boolean;
}

/** Something to agree to, sent with the form. */
export const PillCheckbox = forwardRef<HTMLInputElement, PillCheckboxProps>(function PillCheckbox(
  { label, hint, error, className, indeterminate = false, onInput, onInvalid, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);

  // Not an attribute: only a script can set it
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <FieldShell {...{ label, hint, className }} error={validity.error} layout="leading" data-kind="checkbox">
      {(control) => (
        <span data-mp="field-control" data-type="checkbox">
          <input
            {...rest}
            {...control}
            ref={ref}
            type="checkbox"
            onInput={both(validity.handlers.onInput, onInput)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
          <span data-mp="field-tick" aria-hidden="true">
            <TickGlyph />
          </span>
        </span>
      )}
    </FieldShell>
  );
});
