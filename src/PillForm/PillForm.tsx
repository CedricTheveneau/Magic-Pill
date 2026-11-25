"use client"
import { forwardRef, useMemo, type ComponentPropsWithoutRef } from "react";

import { AlertGlyph } from "./glyphs";
import { useSend, type SendHandler } from "./send";
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
  /** The same, while something is being sent. `onSend` does it for you. */
  busy?: boolean;
  /**
   * Instead of `onSubmit`: called with the form's data once every field is
   * valid, with no page load. While the promise it returns is pending, the form
   * is busy; if it's rejected, the error's message shows under the fields.
   */
  onSend?: SendHandler;
  /** Shown when that error has no message. Default "Something went wrong." */
  errorLabel?: string;
}

/** A form: its fields stacked in a panel, in a row in the pill itself. */
export const PillForm = forwardRef<HTMLFormElement, PillFormProps>(function PillForm(
  {
    look,
    layout,
    errors = "inline",
    disabled = false,
    busy = false,
    onSend,
    errorLabel = "Something went wrong.",
    onSubmit,
    onReset,
    children,
    ...rest
  },
  ref,
) {
  const { rootRef } = useInternalPill("<PillForm>");
  useKeyboard(rootRef);
  const sending = useSend(onSend, errorLabel);
  const isBusy = busy || sending.isBusy;
  const context = useMemo(() => ({ layout, errors, isBusy }), [layout, errors, isBusy]);

  return (
    <FormContext.Provider value={context}>
      <form
        {...rest}
        ref={ref}
        data-mp="form"
        data-look={look}
        data-failed={sending.failure ? "" : undefined}
        aria-busy={isBusy || undefined}
        onSubmit={(event) => {
          onSubmit?.(event);
          if (onSend && !event.defaultPrevented) void sending.send(event);
        }}
        onReset={(event) => {
          sending.forget();
          onReset?.(event);
        }}
      >
        {/* For `disabled` only: it isn't a group of its own */}
        <fieldset role="none" data-mp="form-body" disabled={disabled || isBusy}>
          {children}
          {onSend && <FormError>{sending.failure}</FormError>}
        </fieldset>
      </form>
    </FormContext.Provider>
  );
});

/** What went wrong. Always there, so assistive technology hears what appears in it. */
export function FormError({ children }: { children: string }) {
  return (
    <div data-mp="form-error" role="alert">
      {children && (
        <>
          <i aria-hidden="true">
            <AlertGlyph />
          </i>
          {children}
        </>
      )}
    </div>
  );
}
