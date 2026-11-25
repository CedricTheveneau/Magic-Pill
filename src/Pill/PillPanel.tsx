"use client"
import { forwardRef, useEffect, useId, useMemo, useRef } from "react";

import PillAction from "./PillAction";
import { useInternalPill } from "./PillContext";
import type { PillPanelProps, PillPanelTriggerProps } from "./types";
import CloseIcon from "../icons/CloseIcon";
import { getInputModality, trackInputModality } from "../utils/inputModality";
import { mergeRefs } from "../utils/react";

/**
 * Content shown when the pill's presence is `panel`. One per pill, or several
 * with a `name` each. Labelled by its title, focused when it opens, gives focus back to its
 * trigger when it closes.
 */
export const PillPanel = forwardRef<HTMLDivElement, PillPanelProps>(function PillPanel(
  { name, title, titleAction, footer, closeLabel = "Close", closeIcon, closeExpanded = false, children, ...rest },
  forwardedRef,
) {
  const { presence, panel, closePanel, panelIdOf, panelTriggerRef, rootRef } = useInternalPill("<PillPanel>");
  const isOpen = presence === "panel" && panel === name;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const ref = useMemo(() => mergeRefs(panelRef, forwardedRef), [forwardedRef]);

  // Only on changes: a pill that starts as a panel doesn't steal the focus
  const wasOpenRef = useRef(isOpen);
  useEffect(trackInputModality, []);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (isOpen && !wasOpen) {
      panelRef.current?.focus({ preventScroll: true });
    } else if (!isOpen && wasOpen) {
      // Only when the focus would otherwise be lost (it was in the now hidden panel)
      const active = document.activeElement;
      if (!active || active === document.body || rootRef.current?.contains(active)) {
        // After a tap, it isn't keyboard focus: don't show it as such (L22)
        panelTriggerRef.current?.focus(getInputModality() === "pointer" ? { focusVisible: false } : undefined);
      }
    }
  }, [isOpen, panelTriggerRef, rootRef]);

  const hasTitle = title !== undefined && title !== null;

  return (
    <div
      {...rest}
      ref={ref}
      id={panelIdOf(name)}
      data-mp="panel"
      data-open={isOpen ? "" : undefined}
      role="region"
      aria-labelledby={hasTitle ? titleId : undefined}
      tabIndex={-1}
    >
      {hasTitle && (
        <div data-mp="panel-head">
          <div id={titleId} data-mp="panel-title">
            {title}
          </div>
          {titleAction && <div data-mp="panel-title-action">{titleAction}</div>}
        </div>
      )}
      <div data-mp="panel-body">{children}</div>
      <div data-mp="panel-footer">
        {footer}
        <PillAction
          icon={closeIcon ?? <CloseIcon />}
          label={closeLabel}
          onClick={closePanel}
          // The other actions of an open panel show their label
          data-collapsed={closeExpanded ? undefined : ""}
          // Next to a main action, it doesn't compete with it
          data-quiet={footer ? "" : undefined}
        />
      </div>
    </div>
  );
});

/** An action that opens (and closes) the pill's panel, or the one named `panel`. */
export const PillPanelTrigger = forwardRef<HTMLButtonElement, PillPanelTriggerProps>(
  function PillPanelTrigger({ panel: name, ...props }, forwardedRef) {
    const { presence, panel, openPanel, closePanel, panelIdOf, panelTriggerRef } =
      useInternalPill("<PillPanelTrigger>");
    const isOpen = presence === "panel" && panel === name;
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const ref = useMemo(() => mergeRefs(triggerRef, forwardedRef), [forwardedRef]);

    const toggle = () => {
      panelTriggerRef.current = triggerRef.current;
      if (isOpen) {
        closePanel();
      } else {
        openPanel(name);
      }
    };

    return (
      <PillAction {...props} ref={ref} aria-expanded={isOpen} aria-controls={panelIdOf(name)} onClick={toggle} />
    );
  },
);
