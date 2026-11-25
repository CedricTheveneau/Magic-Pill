"use client"
import { useContext, useEffect, useState, type ReactNode, type RefObject, type SyntheticEvent } from "react";

import { FormContext } from "./FormContext";

export type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const isControl = (element: unknown): element is Control =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement;

/** Whether the person has changed this control (or tried to submit it) and it's wrong. */
function isUserInvalid(control: Control): boolean {
  try {
    return control.matches(":user-invalid");
  } catch {
    // Browsers from before :user-invalid wait for the submission
    return false;
  }
}

/** Runs after the form this control belongs to has been reset. */
export function useFormReset(controlRef: RefObject<Control | null>, onReset: () => void) {
  useEffect(() => {
    const form = controlRef.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout>;
    // The event comes before the values change back
    const listener = () => {
      timer = setTimeout(onReset);
    };
    form.addEventListener("reset", listener);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("reset", listener);
    };
  });
}

/**
 * The browser's own validation, to show in the page rather than in its bubble:
 * on an attempt to submit, or on leaving a field that was changed and is wrong.
 * The message goes as soon as the value is right. The app's own error wins.
 */
export function useValidity(error: ReactNode, controlRef: RefObject<Control | null>) {
  const { errors } = useContext(FormContext);
  const [message, setMessage] = useState("");
  useFormReset(controlRef, () => setMessage(""));

  const handlers = {
    onInvalid: (event: SyntheticEvent) => {
      const control = event.target;
      if (errors === "native" || !isControl(control)) return;
      event.preventDefault();
      setMessage(control.validationMessage);
      // Without its bubble, the browser doesn't move the focus either
      const first = [...(control.form?.elements ?? [])].find(
        (element) => isControl(element) && element.willValidate && !element.validity.valid,
      );
      if (first === control) control.focus();
    },
    onInput: (event: SyntheticEvent) => {
      const control = event.target;
      if (!isControl(control)) return;
      setMessage((shown) => (shown && !control.validity.valid ? control.validationMessage : ""));
    },
    onBlur: (event: SyntheticEvent) => {
      const control = event.target;
      if (errors === "native" || !isControl(control)) return;
      if (isUserInvalid(control)) setMessage(control.validationMessage);
    },
  };

  return { error: error || message || undefined, handlers };
}

/** Both handlers, the app's after ours. */
export function both<E>(ours: ((event: E) => void) | undefined, theirs: ((event: E) => void) | undefined) {
  return (event: E) => {
    ours?.(event);
    theirs?.(event);
  };
}
