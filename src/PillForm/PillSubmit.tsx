"use client"
import { forwardRef, useContext, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { FormContext } from "./FormContext";
import PillAction from "../Pill/PillAction";
import type { PillButtonActionProps } from "../Pill/types";
import CheckIcon from "../icons/CheckIcon";
import { mergeRefs, useIsomorphicLayoutEffect } from "../utils/react";
import { prefersReducedMotion } from "../utils/timing";
import { VISUALLY_HIDDEN } from "../utils/visuallyHidden";

export interface PillSubmitProps extends Omit<PillButtonActionProps, "type" | "href"> {
  /**
   * The label while the form is sending, or several, one after the other: the
   * last one stays. Default "Just a moment…".
   */
  busyLabel?: string | readonly string[];
  /** How long each label stays, in ms. Default 2500. */
  busyInterval?: number;
  /** Default: whether the <PillForm> it's in is sending. */
  busy?: boolean;
}

export const BUSY_LABEL = "Just a moment…";

/** The label to show, moving to the next one every `interval` ms while it's busy. */
function useBusyLabel(busyLabel: string | readonly string[], interval: number, isBusy: boolean): string | undefined {
  const labels = typeof busyLabel === "string" ? [busyLabel] : busyLabel;
  const last = labels.length - 1;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isBusy) {
      setIndex(0);
    } else if (index < last) {
      const timer = setTimeout(() => setIndex(index + 1), interval);
      return () => clearTimeout(timer);
    }
  }, [isBusy, index, last, interval]);

  return isBusy ? labels[Math.min(index, last)] : undefined;
}

/** One label replacing another: the action widens or narrows with it. */
function useLabelMorph(buttonRef: RefObject<HTMLElement | null>, label: string) {
  const previous = useRef<{ label: string; width: number } | null>(null);
  useIsomorphicLayoutEffect(() => {
    const text = buttonRef.current?.querySelector<HTMLElement>('[data-mp="label"] > span');
    if (!text) return;
    text.getAnimations?.().forEach((animation) => animation.cancel());
    const width = text.offsetWidth;
    const from = previous.current;
    previous.current = { label, width };
    if (!from || from.label === label || !from.width || !text.animate || prefersReducedMotion()) return;
    text.animate(
      [
        { width: `${from.width}px`, opacity: 0, transform: "translateY(40%)" },
        { width: `${width}px`, opacity: 1, transform: "none" },
      ],
      { duration: 250, easing: "ease-out" },
    );
  }, [buttonRef, label]);
}

/** The action that sends a form, and says it's doing so. */
export const PillSubmit = forwardRef<HTMLButtonElement, PillSubmitProps>(function PillSubmit(
  { label, icon = <CheckIcon />, busyLabel = BUSY_LABEL, busyInterval = 2500, busy, onClick, ...rest },
  forwardedRef,
) {
  const form = useContext(FormContext);
  const isBusy = busy ?? form.isBusy ?? false;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const ref = useMemo(() => mergeRefs(buttonRef, forwardedRef), [forwardedRef]);
  const current = useBusyLabel(busyLabel, busyInterval, isBusy);
  const shown = current ?? label;
  useLabelMorph(buttonRef, shown);

  return (
    <>
      <PillAction
        {...rest}
        ref={ref}
        type="submit"
        icon={icon}
        label={shown}
        expanded={rest.expanded || isBusy}
        // Not `disabled`: it keeps the focus
        aria-disabled={isBusy || rest["aria-disabled"] || undefined}
        onClick={(event) => {
          if (isBusy) event.preventDefault();
          else onClick?.(event);
        }}
      />
      <span role="status" style={VISUALLY_HIDDEN}>
        {current}
      </span>
    </>
  );
});
