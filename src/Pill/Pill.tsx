"use client"
import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

import { isOnBackdrop, useModal } from "./modal";
import { ExitWatch, PlacementWatch, useSizeMorph, type Size } from "./morph";
import { PillContext, type InternalPillContextValue } from "./PillContext";
import { SceneWatch, useScene } from "./scene";
import type { PillOrientation, PillPresence, PillProps } from "./types";
import { useThemed } from "./themed";
import { useZone } from "./zone";
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
    ladder = true,
    closeOnBackdropClick = false,
    backdrop,
    orientation,
    variant = "neutral",
    theme,
    scene,
    sceneChange = "circle",
    unstyled = false,
    children,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const [uncontrolledPresence, setUncontrolledPresence] = useState<PillPresence>(defaultPresence);
  const isControlled = presenceProp !== undefined;
  const askedPresence = isControlled ? presenceProp : uncontrolledPresence;
  const resolvedOrientation = orientation ?? defaultOrientation(placement);
  const isOverlay = placement === "overlay";

  const rootRef = useRef<HTMLElement | null>(null);
  const ref = useMemo(() => mergeRefs(rootRef, forwardedRef), [forwardedRef]);
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const [panel, setPanel] = useState<string | undefined>(undefined);
  // The size on screen, kept up to date between changes
  const lastSize = useRef<Size | null>(null);
  // Going from one scene to the next: the old content stays while the pill closes on it
  const closePanelRef = useRef(() => {});
  const shown = useScene(rootRef, {
    scene,
    change: sceneChange,
    presence: askedPresence,
    enabled: !unstyled,
    onClosed: () => closePanelRef.current(),
    children,
    variant,
  });
  const { presence } = shown;
  const isVisible = presence !== "hidden";
  // The overlay is a native modal <dialog>: focus trap, Escape and inert page for free
  useModal(rootRef, isOverlay, presence, lastSize);
  useSizeMorph(rootRef, presence, !unstyled, lastSize);
  // Pills with the same fixed placement make room for each other
  useZone(rootRef, ladder && !unstyled && !isOverlay && placement !== "inline" ? placement : undefined, presence);
  // For <PillOptics> to find
  useThemed(rootRef, unstyled ? undefined : theme, presence, isOverlay);

  // Where closing the panel goes back to: the last visible level other than the panel
  const returnPresenceRef = useRef<PillPresence>("compact");
  useEffect(() => {
    if (askedPresence !== "panel" && askedPresence !== "hidden") {
      returnPresenceRef.current = askedPresence;
    }
  }, [askedPresence]);

  const setPresence = useCallback(
    (next: PillPresence) => {
      if (next === askedPresence) return;
      if (!isControlled) setUncontrolledPresence(next);
      onPresenceChange?.(next);
    },
    [askedPresence, isControlled, onPresenceChange],
  );

  const openPanel = useCallback(
    (name?: string) => {
      setPanel(name);
      setPresence("panel");
    },
    [setPresence],
  );

  const closePanel = useCallback(() => {
    if (askedPresence === "panel") setPresence(returnPresenceRef.current);
  }, [askedPresence, setPresence]);
  closePanelRef.current = closePanel;

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

  // Escape on the modal (or a click on its backdrop, if asked for): close the
  // panel first, then the overlay. The state stays the source of truth, so the
  // browser's own closing is prevented.
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

  // A press that starts and ends on the backdrop: not a text selection dragged
  // out of the modal, nor the end of the press that opened it. Nor the second
  // click of a double-click on what opened it
  const pressedBackdrop = useRef(false);
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    rest.onPointerDown?.(event);
    pressedBackdrop.current = isOnBackdrop(event);
  };
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    rest.onClick?.(event);
    const pressed = pressedBackdrop.current;
    pressedBackdrop.current = false;
    if (pressed && event.detail < 2 && !event.defaultPrevented && isOnBackdrop(event)) handleCancel(event);
  };

  const context = useMemo<InternalPillContextValue>(
    () => ({
      presence,
      setPresence,
      panel,
      openPanel,
      closePanel,
      placement,
      orientation: resolvedOrientation,
      variant: shown.variant,
      panelIdOf: (name) => (name === undefined ? panelId : `${panelId}-${name}`),
      panelTriggerRef,
      rootRef,
    }),
    [presence, setPresence, panel, openPanel, closePanel, placement, resolvedOrientation, shown.variant, panelId],
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
        data-variant={shown.variant}
        {...(theme !== undefined && { "data-theme": theme })}
        {...(backdrop !== undefined && { "data-backdrop": backdrop })}
        data-unstyled={unstyled ? "" : undefined}
        // Hidden: out of the focus order and the accessibility tree at once,
        // while the exit animation plays (Y5)
        {...inertProps(!isVisible)}
        onKeyDown={handleKeyDown}
        {...(isOverlay && {
          onCancel: handleCancel,
          onClose: handleClose,
          ...(closeOnBackdropClick && { onPointerDown: handlePointerDown, onClick: handleClick }),
        })}
      >
        {/* Calls off its exit when it's asked back mid-way */}
        <ExitWatch presence={presence} target={rootRef} />
        {/* Moves the pill to a new placement instead of jumping there */}
        <PlacementWatch placement={`${placement} ${resolvedOrientation}`} target={rootRef} />
        {/* Slides the old scene out, and the new one in */}
        <SceneWatch scene={scene} slides={sceneChange === "slide"} target={rootRef} />
        {/* A scene of its own: its fields' state doesn't go over to the next one */}
        <Fragment key={shown.key}>{shown.children}</Fragment>
      </Element>
    </PillContext.Provider>
  );
});

export default Pill;
