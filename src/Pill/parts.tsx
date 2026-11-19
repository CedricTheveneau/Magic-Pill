// No "use client": these parts hold no state, so Server Components can render
// them, and they add no client JavaScript there.
import { forwardRef, type ComponentPropsWithoutRef } from "react";

/** The leading icon. Decorative (`aria-hidden`) unless you give it a `label`. */
export const PillIcon = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span"> & { label?: string }>(
  function PillIcon({ label, ...rest }, ref) {
    const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
    return <span {...a11y} {...rest} ref={ref} data-mp="icon" />;
  },
);

/** The thin line between the icon and the message. */
export const PillDivider = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
  function PillDivider(props, ref) {
    return <span aria-hidden="true" {...props} ref={ref} data-mp="divider" />;
  },
);

/** The message, in the italic serif. Accepts any content. */
export const PillMessage = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function PillMessage(props, ref) {
    return <div {...props} ref={ref} data-mp="message" />;
  },
);

/** A row (or a column, in a vertical pill) of actions. */
export const PillActions = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function PillActions(props, ref) {
    return <div {...props} ref={ref} data-mp="actions" />;
  },
);
