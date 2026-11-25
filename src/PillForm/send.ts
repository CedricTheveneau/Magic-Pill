"use client"
import { useRef, useState, type FormEvent } from "react";

/**
 * Called once every field is valid. While the promise it returns is pending,
 * the fields wait. If it's rejected, the error's message is shown.
 */
export type SendHandler = (data: FormData, event: FormEvent<HTMLFormElement>) => unknown;

const messageOf = (error: unknown) => (error instanceof Error ? error.message : typeof error === "string" ? error : "");

/**
 * What a form does once it's valid: it sends its data (once at a time), waits,
 * then tells whether it went through. `onSent` isn't called if the handler
 * returned `false`.
 */
export function useSend(onSend: SendHandler | undefined, errorLabel: string, onSent?: () => void) {
  const isSending = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending.current) return;
    isSending.current = true;
    setFailure("");
    // Disabled fields lose the focus: it comes back to the same one
    const focused = document.activeElement;
    try {
      const result = onSend?.(new FormData(event.currentTarget), event);
      if (result instanceof Promise) setIsBusy(true);
      if ((await result) !== false) onSent?.();
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

  return { send, isBusy, failure, forget: () => setFailure("") };
}
