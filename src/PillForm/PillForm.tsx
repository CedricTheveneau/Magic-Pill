"use client"
import { forwardRef, useMemo, type ComponentPropsWithoutRef } from "react";

import { FormContext, type FieldLayout, type FormErrors } from "./FormContext";
import { useKeyboard } from "./keyboard";
import { useInternalPill } from "../Pill/PillContext";

export interface PillFormProps extends ComponentPropsWithoutRef<"form"> {
  /**
   * How its fields look: filled like the actions (`solid`, the default), with a
   * hint of the pill's text (`soft`), or an `outline`. Any other string is
   * written to `data-look`, for one of your own.
   */
  look?: "solid" | "soft" | "outline" | (string & {});
  /** The label of its text fields, above (default) or beside them. */
  layout?: FieldLayout;
  /** The browser's validation messages, under the fields (default) or in its own bubbles. */
  errors?: FormErrors;
  /** Disables every field. */
  disabled?: boolean;
  /** The same, while something is being sent. */
  busy?: boolean;
}

/** A form: its fields stacked in a panel, in a row in the pill itself. */
export const PillForm = forwardRef<HTMLFormElement, PillFormProps>(function PillForm(
  { look, layout, errors = "inline", disabled = false, busy = false, children, ...rest },
  ref,
) {
  const { rootRef } = useInternalPill("<PillForm>");
  useKeyboard(rootRef);
  const context = useMemo(() => ({ layout, errors }), [layout, errors]);

  return (
    <FormContext.Provider value={context}>
      <form {...rest} ref={ref} data-mp="form" data-look={look} aria-busy={busy || undefined}>
        {/* For `disabled` only: it isn't a group of its own */}
        <fieldset role="none" data-mp="form-body" disabled={disabled || busy}>
          {children}
        </fieldset>
      </form>
    </FormContext.Provider>
  );
});
