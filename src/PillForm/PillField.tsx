"use client"
import { forwardRef, useContext, useId, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";

import { FormContext, type FieldLayout } from "./FormContext";
import { AlertGlyph } from "./glyphs";

/** What every field takes. */
export interface FieldProps {
  /** Always required: it's the accessible name. */
  label: ReactNode;
  /** Keep the label for assistive technology only. */
  hideLabel?: boolean;
  /** Under the control, and read with it. */
  hint?: ReactNode;
  /** Your own error, e.g. from the server. It wins over the browser's. */
  error?: ReactNode;
  /** Writes "optional" after the label, or your own word. */
  optional?: boolean | string;
}

/** To spread on the control. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

export interface PillFieldProps
  extends FieldProps,
    Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  /** The control, wired: `{(control) => <input {...control} />}`. */
  children: (control: FieldControlProps) => ReactNode;
  /** The label above the control (default), or beside it. */
  layout?: FieldLayout;
  /** At the end of the label's line, e.g. a slider's value. */
  aside?: ReactNode;
  /** Several controls under one label: the field is a group (a `<fieldset>`). */
  group?: "group" | "radiogroup";
}

interface InternalFieldProps extends Omit<PillFieldProps, "layout"> {
  layout?: FieldLayout | "leading";
  /** Follows the layout of its form. */
  isText?: boolean;
}

/** The shell, with the options only our own fields use. */
export const FieldShell = forwardRef<HTMLElement, InternalFieldProps & { [data: `data-${string}`]: unknown }>(
  function FieldShell(
    { label, hideLabel, hint, error, optional, layout, aside, group, isText, children, ...rest },
    ref,
  ) {
    const form = useContext(FormContext);
    const id = useId();
    const hintId = `${id}hint`;
    const errorId = `${id}error`;
    const control: FieldControlProps = {
      id,
      "aria-describedby": [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined,
      "aria-invalid": error ? true : undefined,
    };
    // Typed as their simplest form: a <fieldset> and its <legend> only add semantics
    const Root = (group ? "fieldset" : "div") as "div";
    const Label = (group ? "legend" : "label") as "label";

    return (
      <Root
        {...rest}
        {...(group && {
          role: group,
          "aria-describedby": control["aria-describedby"],
          "aria-invalid": group === "radiogroup" ? control["aria-invalid"] : undefined,
        })}
        ref={ref as Ref<HTMLDivElement>}
        data-mp="field"
        data-layout={layout ?? ((isText && form.layout) || "stacked")}
        data-invalid={error ? "" : undefined}
      >
        <Label id={`${id}label`} {...(!group && { htmlFor: id })} data-mp="field-label" data-hidden={hideLabel ? "" : undefined}>
          {label}
          {optional && (
            <>
              {" "}
              <span data-mp="field-optional">{optional === true ? "optional" : optional}</span>
            </>
          )}
        </Label>
        {aside !== undefined && (
          <output data-mp="field-aside" htmlFor={id}>
            {aside}
          </output>
        )}
        {children(control)}
        {hint && (
          <div id={hintId} data-mp="field-hint">
            {hint}
          </div>
        )}
        {/* Always there, so assistive technology hears what appears in it */}
        <div id={errorId} data-mp="field-error" aria-live="polite">
          <div>
            {error && (
              <span>
                <i aria-hidden="true">
                  <AlertGlyph />
                </i>
                {error}
              </span>
            )}
          </div>
        </div>
      </Root>
    );
  },
);

/**
 * A label, a hint and an error, wired to a control of yours.
 *
 * @example
 * <PillField label="Rating">{(control) => <StarRating {...control} />}</PillField>
 */
export const PillField = forwardRef<HTMLElement, PillFieldProps>(function PillField(props, ref) {
  return <FieldShell {...props} ref={ref} />;
});
