"use client"
import { forwardRef, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { PillForm, type PillFormProps } from "./PillForm";
import { AlertGlyph } from "./glyphs";
import PillAction from "../Pill/PillAction";
import { useInternalPill } from "../Pill/PillContext";
import { PillPanel } from "../Pill/PillPanel";
import type { PillPanelProps } from "../Pill/types";
import CheckIcon from "../icons/CheckIcon";

export interface PillFormPanelProps
  extends Pick<PillPanelProps, "name" | "title" | "titleAction" | "closeLabel" | "closeIcon" | "closeExpanded">,
    Pick<PillFormProps, "look" | "layout" | "errors" | "disabled"> {
  children?: ReactNode;
  /**
   * Called once every field is valid. The panel closes after it, unless it
   * returns `false`. While the promise it returns is pending, the fields wait;
   * if it's rejected, the panel stays open and shows the error's message.
   */
  onSubmit?: (data: FormData, event: FormEvent<HTMLFormElement>) => unknown;
  /** The main action, e.g. "Save". Without it there's none: settings that apply at once. */
  submitLabel?: string;
  /** Default <CheckIcon />. */
  submitIcon?: ReactNode;
  /** The main action's label while it waits. Default: the same. */
  busyLabel?: string;
  /** An action in the title's row that resets the fields, e.g. "Default". */
  resetLabel?: string;
  /** Shown when the error has no message. Default "Something went wrong." */
  errorLabel?: string;
  /** For the panel. */
  className?: string;
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : typeof error === "string" ? error : "");

/** A panel that is a form: it sends, waits, and closes. The ref is the form's. */
export const PillFormPanel = forwardRef<HTMLFormElement, PillFormPanelProps>(function PillFormPanel(
  {
    title,
    titleAction,
    children,
    onSubmit,
    submitLabel,
    submitIcon,
    busyLabel = submitLabel,
    resetLabel,
    errorLabel = "Something went wrong.",
    look,
    layout,
    errors,
    disabled,
    ...panel
  },
  ref,
) {
  const formId = useId();
  const { presence, panel: openPanel, closePanel } = useInternalPill("<PillFormPanel>");
  // By the time it's sent, the pill may be showing something else
  const close = useRef(closePanel);
  close.current = () => {
    if (presence === "panel" && openPanel === panel.name) closePanel();
  };
  const isSending = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending.current) return;
    isSending.current = true;
    setFailure("");
    // Disabled fields lose the focus: it comes back to the same one
    const focused = document.activeElement;
    try {
      const result = onSubmit?.(new FormData(event.currentTarget), event);
      if (result instanceof Promise) setIsBusy(true);
      if ((await result) !== false) close.current();
    } catch (error) {
      setFailure(messageOf(error) || errorLabel);
      // Once the fields are enabled again
      setTimeout(() => {
        if (focused instanceof HTMLElement && document.activeElement === document.body) focused.focus();
      });
    } finally {
      isSending.current = false;
      setIsBusy(false);
    }
  };

  return (
    <PillPanel
      {...panel}
      title={title}
      titleAction={titleAction ?? (resetLabel && <PillAction type="reset" form={formId} label={resetLabel} />)}
      footer={
        submitLabel && (
          <PillAction
            type="submit"
            form={formId}
            icon={submitIcon ?? <CheckIcon />}
            label={(isBusy && busyLabel) || submitLabel}
            aria-disabled={isBusy || undefined}
          />
        )
      }
    >
      <PillForm
        ref={ref}
        id={formId}
        look={look}
        layout={layout}
        errors={errors}
        disabled={disabled}
        busy={isBusy}
        onSubmit={(event) => void handleSubmit(event)}
        onReset={() => setFailure("")}
      >
        {children}
        {/* Always there, so assistive technology hears what appears in it */}
        <div data-mp="form-error" role="alert">
          {failure && (
            <>
              <i aria-hidden="true">
                <AlertGlyph />
              </i>
              {failure}
            </>
          )}
        </div>
      </PillForm>
    </PillPanel>
  );
});
