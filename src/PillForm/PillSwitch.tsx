"use client"
import { forwardRef, useMemo, useRef, type ComponentPropsWithoutRef } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { both, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillSwitchProps
  extends Omit<FieldProps, "hideLabel" | "optional">,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children"> {}

/** On or off, at once: a native checkbox with the switch role. */
export const PillSwitch = forwardRef<HTMLInputElement, PillSwitchProps>(function PillSwitch(
  { label, hint, error, className, onInput, onInvalid, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);

  return (
    <FieldShell {...{ label, hint, className }} error={validity.error} layout="inline" data-kind="switch">
      {(control) => (
        <span data-mp="field-control" data-type="switch">
          <input
            {...rest}
            {...control}
            ref={ref}
            type="checkbox"
            role="switch"
            onInput={both(validity.handlers.onInput, onInput)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
          <span aria-hidden="true" />
        </span>
      )}
    </FieldShell>
  );
});
