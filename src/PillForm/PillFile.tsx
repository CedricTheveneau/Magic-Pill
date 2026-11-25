"use client"
import { forwardRef, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { FieldShell, type FieldProps } from "./PillField";
import { TickGlyph, UploadGlyph } from "./glyphs";
import { both, useFormReset, useValidity } from "./validity";
import { mergeRefs } from "../utils/react";

export interface PillFileProps
  extends FieldProps,
    Omit<ComponentPropsWithoutRef<"input">, "type" | "children" | "value" | "defaultValue"> {
  /** What the area says while it's empty. Default "Choose a file or drop it here". */
  prompt?: ReactNode;
}

/** One or more files: an area to click or to drop them on, which names them. */
export const PillFile = forwardRef<HTMLInputElement, PillFileProps>(function PillFile(
  { label, hideLabel, hint, error, optional, prompt = "Choose a file or drop it here", className, onInput, onChange, onInvalid, ...rest },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = useMemo(() => mergeRefs(inputRef, forwardedRef), [forwardedRef]);
  const validity = useValidity(error, inputRef);
  const [names, setNames] = useState<string[]>([]);
  const [isOver, setIsOver] = useState(false);
  const read = () => setNames([...(inputRef.current?.files ?? [])].map((file) => file.name));
  useFormReset(inputRef, read);

  return (
    <FieldShell {...{ label, hideLabel, hint, optional, className }} error={validity.error} data-kind="file">
      {(control) => (
        <div
          data-mp="field-control"
          data-type="file"
          data-over={isOver ? "" : undefined}
          // The native input covers it, and takes what's dropped
          onDragEnter={() => setIsOver(true)}
          onDragLeave={() => setIsOver(false)}
          onDrop={() => setIsOver(false)}
        >
          <input
            {...rest}
            {...control}
            ref={ref}
            type="file"
            onInput={both(validity.handlers.onInput, onInput)}
            onChange={both(read, onChange)}
            onInvalid={both(validity.handlers.onInvalid, onInvalid)}
          />
          <span data-mp="file-body" aria-hidden="true">
            <span data-mp="field-icon">{names.length > 0 ? <TickGlyph /> : <UploadGlyph />}</span>
            <span>{names.length > 0 ? names.join(", ") : prompt}</span>
          </span>
        </div>
      )}
    </FieldShell>
  );
});
