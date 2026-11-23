"use client"
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";

import { useModal } from "./modal";
import { PlacementWatch, useSizeMorph, type Size } from "./morph";
import { PillContext, type InternalPillContextValue } from "./PillContext";
import type { PillOrientation, PillPresence, PillProps } from "./types";
import { inertProps, mergeRefs } from "../utils/react";

const defaultOrientation = (placement: PillProps["placement"]): PillOrientation =>
  placement === "left" || placement === "right" ? "vertical" : "horizontal";

/**
 * The pill: a container with the Magic Pill design language. Put any parts
 * (or anything else) inside. Its look and animations follow its data attributes.
 */
const Pill = forwardRef<HTMLElement, PillProps>(function Pill(
  {
    presence: presenceProp,
    defaultPresence = "compact",
    onPresenceChange,
    placement = "inline",
    orientation,
    variant = "neutral",
    unstyled = false,
    children,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const [uncontrolledPresence, setUncontrolledPresence] = useState<PillPresence>(defaultPresence);
  const isControlled = presenceProp !== undefined;
  const presence = isControlled ? presenceProp : uncontrolledPresence;
  const resolvedOrientation = orientation ?? defaultOrientation(placement);
  const isOverlay = placement === "overlay";
  const isVisible = presence !== "hidden";

  const rootRef = useRef<HTMLElement | null>(null);
  const ref = useMemo(() => mergeRefs(rootRef, forwardedRef), [forwardedRef]);
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  // The size on screen, kept up to date between changes
  const lastSize = useRef<Size | null>(null);
  // The overlay is a native modal <dialog>: focus trap, Escape and inert page for free
  useModal(rootRef, isOverlay, presence, lastSize);
  useSizeMorph(rootRef, presence, !unstyled, lastSize);

  // Where closing the panel goes back to: the last visible level other than the panel
  const returnPresenceRef = useRef<PillPresence>("compact");
  useEffect(() => {
    if (presence !== "panel" && presence !== "hidden") {
      returnPresenceRef.current = presence;
    }
  }, [presence]);

  const setPresence = useCallback(
    (next: PillPresence) => {
      if (next === presence) return;
      if (!isControlled) setUncontrolledPresence(next);
      onPresenceChange?.(next);
    },
    [presence, isControlled, onPresenceChange],
  );

  const closePanel = useCallback(() => {
    if (presence === "panel") setPresence(returnPresenceRef.current);
  }, [presence, setPresence]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // A <dialog> reports Escape through its cancel event instead
    if (event.defaultPrevented || isOverlay) return;
    if (event.key === "Escape" && presence === "panel") {
      event.preventDefault();
      event.stopPropagation();
      closePanel();
    }
  };

  // Escape on the modal: close the panel first, then the overlay. The state
  // stays the source of truth, so the browser's own closing is prevented.
  const handleCancel = (event: SyntheticEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (presence === "panel") {
      closePanel();
    } else {
      setPresence("hidden");
    }
  };

  // The browser may still close the dialog itself (e.g. a repeated Escape).
  // The event comes late: the dialog may be open again by then
  const handleClose = (event: SyntheticEvent<HTMLDivElement>) => {
    if (!(event.currentTarget as HTMLElement as HTMLDialogElement).open) setPresence("hidden");
  };

  const context = useMemo<InternalPillContextValue>(
    () => ({
      presence,
      setPresence,
      closePanel,
      placement,
      orientation: resolvedOrientation,
      variant,
      panelId,
      panelTriggerRef,
      rootRef,
    }),
    [presence, setPresence, closePanel, placement, resolvedOrientation, variant, panelId],
  );

  // Typed as a <div>: the <dialog> only adds the cancel/close events used above
  const Element = (isOverlay ? "dialog" : "div") as "div";

  return (
    <PillContext.Provider value={context}>
      <Element
        {...rest}
        ref={ref}
        data-mp="pill"
        data-presence={presence}
        data-placement={placement}
        data-orientation={resolvedOrientation}
        data-variant={variant}
        data-unstyled={unstyled ? "" : undefined}
        // Hidden: out of the focus order and the accessibility tree at once,
        // while the exit animation plays (Y5)
        {...inertProps(!isVisible)}
        onKeyDown={handleKeyDown}
        {...(isOverlay ? { onCancel: handleCancel, onClose: handleClose } : {})}
      >
        {/* Moves the pill to a new placement instead of jumping there */}
        <PlacementWatch placement={`${placement} ${resolvedOrientation}`} target={rootRef} />
        {children}
      </Element>
    </PillContext.Provider>
  );
});

export default Pill;
