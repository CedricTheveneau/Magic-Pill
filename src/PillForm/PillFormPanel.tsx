"use client"
import { forwardRef, useId, useRef, type ReactNode } from "react";

import { FormError, PillForm, type PillFormProps } from "./PillForm";
import { PillSubmit, type PillSubmitProps } from "./PillSubmit";
import { useSend, type SendHandler } from "./send";
import PillAction from "../Pill/PillAction";
import { useInternalPill } from "../Pill/PillContext";
import { PillPanel } from "../Pill/PillPanel";
import type { PillPanelProps } from "../Pill/types";

export interface PillFormPanelProps
  extends Pick<PillPanelProps, "name" | "title" | "titleAction" | "closeLabel" | "closeIcon" | "closeExpanded">,
    Pick<PillFormProps, "look" | "layout" | "errors" | "disabled" | "errorLabel">,
    Pick<PillSubmitProps, "busyLabel" | "busyInterval"> {
  children?: ReactNode;
  /**
   * Called once every field is valid. The panel closes after it, unless it
   * returns `false`. While the promise it returns is pending, the fields wait;
   * if it's rejected, the panel stays open and shows the error's message.
   */
  onSubmit?: SendHandler;
  /** The main action, e.g. "Save". Without it there's none: settings that apply at once. */
  submitLabel?: string;
  /** Default <CheckIcon />. */
  submitIcon?: ReactNode;
  /** An action in the title's row that resets the fields, e.g. "Default". */
  resetLabel?: string;
  /** For the panel. */
  className?: string;
}

/** A panel that is a form: it sends, waits, and closes. The ref is the form's. */
export const PillFormPanel = forwardRef<HTMLFormElement, PillFormPanelProps>(function PillFormPanel(
  {
    title,
    titleAction,
    children,
    onSubmit,
    submitLabel,
    submitIcon,
    busyLabel,
    busyInterval,
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
  const { send, isBusy, failure, forget } = useSend(onSubmit, errorLabel, () => close.current());

  return (
    <PillPanel
      {...panel}
      title={title}
      titleAction={titleAction ?? (resetLabel && <PillAction type="reset" form={formId} label={resetLabel} />)}
      footer={
        submitLabel && (
          <PillSubmit
            form={formId}
            icon={submitIcon}
            label={submitLabel}
            busy={isBusy}
            busyLabel={busyLabel}
            busyInterval={busyInterval}
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
        onSubmit={(event) => void send(event)}
        onReset={forget}
      >
        {children}
        <FormError>{failure}</FormError>
      </PillForm>
    </PillPanel>
  );
});
