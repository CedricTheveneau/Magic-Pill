"use client"
import { forwardRef, useEffect, useId, useMemo, useRef } from "react";

import PillAction from "./PillAction";
import { useInternalPill } from "./PillContext";
import type { PillButtonActionProps, PillPanelProps } from "./types";
import CloseIcon from "../icons/CloseIcon";
import { mergeRefs } from "../utils/react";

/**
 * Content shown when the pill's presence is `panel` (one panel per pill).
 * Labelled by its title, focused when it opens, gives focus back to its
 * trigger when it closes.
 */
export const PillPanel = forwardRef<HTMLDivElement, PillPanelProps>(function PillPanel(
  { title, closeLabel = "Close", closeIcon, children, ...rest },
  forwardedRef,
) {
  const { presence, closePanel, panelId, panelTriggerRef, rootRef } = useInternalPill("<PillPanel>");
  const isOpen = presence === "panel";
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const ref = useMemo(() => mergeRefs(panelRef, forwardedRef), [forwardedRef]);

  // Only on changes: a pill that starts as a panel doesn't steal the focus
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (isOpen && !wasOpen) {
      panelRef.current?.focus({ preventScroll: true });
    } else if (!isOpen && wasOpen) {
      // Only when the focus would otherwise be lost (it was in the now hidden panel)
      const active = document.activeElement;
      if (!active || active === document.body || rootRef.current?.contains(active)) {
        panelTriggerRef.current?.focus();
      }
    }
  }, [isOpen, panelTriggerRef, rootRef]);

  const hasTitle = title !== undefined && title !== null;

  return (
    <div
      {...rest}
      ref={ref}
      id={panelId}
      data-mp="panel"
      data-open={isOpen ? "" : undefined}
      role="region"
      aria-labelledby={hasTitle ? titleId : undefined}
      tabIndex={-1}
    >
      {hasTitle && (
        <div id={titleId} data-mp="panel-title">
          {title}
        </div>
      )}
      <div data-mp="panel-body">{children}</div>
      <div data-mp="panel-footer">
        <PillAction icon={closeIcon ?? <CloseIcon />} label={closeLabel} onClick={closePanel} />
      </div>
    </div>
  );
});

/** An action that opens (and closes) the pill's panel. */
export const PillPanelTrigger = forwardRef<HTMLButtonElement, Omit<PillButtonActionProps, "onClick">>(
  function PillPanelTrigger(props, forwardedRef) {
    const { presence, setPresence, closePanel, panelId, panelTriggerRef } = useInternalPill("<PillPanelTrigger>");
    const isOpen = presence === "panel";
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const ref = useMemo(() => mergeRefs(triggerRef, forwardedRef), [forwardedRef]);

    const toggle = () => {
      panelTriggerRef.current = triggerRef.current;
      if (isOpen) {
        closePanel();
      } else {
        setPresence("panel");
      }
    };

    return (
      <PillAction {...props} ref={ref} aria-expanded={isOpen} aria-controls={panelId} onClick={toggle} />
    );
  },
);
