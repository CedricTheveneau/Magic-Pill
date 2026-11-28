// No "use client": a ring holds no state, so Server Components can render it.
// A file of its own, so that only the apps that use it ship it.
import { forwardRef, type ComponentPropsWithoutRef } from "react";

export interface PillProgressProps extends ComponentPropsWithoutRef<"span"> {
  /** 0 to 1: how much of the ring is drawn. */
  value: number;
  /**
   * What it measures, for screen readers ("Upload"). Without it, the ring is
   * decorative: the pill around it says what it is (an electron's name).
   */
  label?: string;
}

/** A progress ring around its content (a value, an icon), in the text colour. */
export const PillProgress = forwardRef<HTMLSpanElement, PillProgressProps>(function PillProgress(
  { value, label, children, ...rest },
  ref,
) {
  const amount = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const a11y = label
    ? { role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(amount * 100) }
    : {};
  return (
    <span {...a11y} {...rest} ref={ref} data-mp="progress">
      <svg viewBox="0 0 54 54" aria-hidden="true" focusable="false">
        <circle data-mp="progress-track" cx="27" cy="27" r="24" pathLength="100" />
        <circle data-mp="progress-bar" cx="27" cy="27" r="24" pathLength="100" strokeDasharray={`${amount * 100} 100`} />
      </svg>
      {children}
    </span>
  );
});
