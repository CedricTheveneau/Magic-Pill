"use client"
import { forwardRef, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { both, useFormReset, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillTextareaProps extends FieldProps, Omit<ComponentPropsWithoutRef<"textarea">, "children"> {}

const lengthOf = (value: unknown) => String(value ?? "").length;

/** Several lines of text: it grows with them, and counts them with `maxLength`. */
export const PillTextarea = forwardRef<HTMLTextAreaElement, PillTextareaProps>(function PillTextarea(
  { label, hideLabel, hint, error, optional, className, rows = 3, onInput, onBlur, onInvalid, ...rest },
  forwardedRef,
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = useMemo(() => mergeRefs(textareaRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, textareaRef);
  const [ownLength, setOwnLength] = useState(lengthOf(rest.defaultValue));
  useFormReset(textareaRef, () => setOwnLength(lengthOf(textareaRef.current?.value)));

  const length = rest.value === undefined ? ownLength : lengthOf(rest.value);
  const handleInput: PillTextareaProps["onInput"] = (event) => {
    setOwnLength(event.currentTarget.value.length);
    validity.handlers.onInput(event);
    onInput?.(event);
  };

  return (
    <FieldShell
      {...{ label, hideLabel, hint, optional, className }}
      error={validity.error}
      aside={rest.maxLength ? `${length} / ${rest.maxLength}` : undefined}
      data-kind="area"
    >
      {(control) => (
        <div data-mp="field-box" data-type="textarea">
          <textarea
            {...rest}
            {...control}
            ref={ref}
            rows={rows}
            onInput={handleInput}
            onBlur={both(validity.handlers.onBlur, onBlur)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
        </div>
      )}
    </FieldShell>
  );
});
