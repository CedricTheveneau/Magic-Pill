"use client"
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import Pill from "../Pill/Pill";
import { captureSwap, playSwap, type SwapCapture } from "../Pill/morph";
import { PillIcon } from "../Pill/parts";
import type { LinkComponent, PillPresence, PillProps } from "../Pill/types";
import { NotificationContent, type PillNotificationClassNames } from "../PillNotification/PillNotification";
import { getStore, type QueuedNotification } from "../store/store";
import { getInputModality, trackInputModality } from "../utils/inputModality";
import { usePillQueue } from "../store/usePillQueue";
import { mergeRefs } from "../utils/react";
import { VISUALLY_HIDDEN } from "../utils/visuallyHidden";
import {
  BASE,
  IDLE,
  NONE,
  batchSteps,
  isOpen,
  isSwap,
  planSteps,
  readTimings,
  type Displayed,
  type Scene,
  type SwapMode,
} from "./choreography";

export interface MagicPillProps
  extends Omit<PillProps, "presence" | "defaultPresence" | "onPresenceChange" | "children"> {
  /** Default "main". Two hosts with the same name warn in development. */
  name?: string;
  /**
   * The base layer (e.g. a <PillNavbar>), shown whenever no notification is.
   * Notifications take the pill over, then it returns to this content.
   */
  children?: ReactNode;
  /** Default display time for notifications, in ms. Default 5000. */
  duration?: number;
  /** With no base layer and nothing queued: hide (default) or rest as a circle. */
  idle?: "hidden" | "rest";
  /** The icon shown when `idle="rest"`. */
  idleIcon?: ReactNode;
  /**
   * Where new content slides into the open pill instead of closing it to a
   * circle and growing back: between queued notifications (default), also
   * between the base layer and notifications ("always"), or nowhere ("never").
   */
  swap?: SwapMode;
  /** Passed to notification actions that have an `href`. */
  linkComponent?: LinkComponent;
  classNames?: PillNotificationClassNames;
}

const DEFAULT_DURATION = 5000;

// What the pill says, leaving out the copy of the previous notification sliding out
const isCurrent = (element: Element) => !element.closest('[data-mp="outgoing"]');
function readMessage(root: HTMLElement | null): string {
  if (!root) return "";
  const message = [...root.querySelectorAll('[data-mp="message"]')].find(isCurrent);
  const parts = message ? [message] : [...root.children].filter(isCurrent);
  return parts.map((part) => part.textContent).join("").trim();
}

const hasContent = (node: ReactNode) => node !== undefined && node !== null && node !== false;

function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return hidden;
}

/**
 * The batteries-included pill: a <Pill> with a base layer, a queue of
 * notifications fed by pill(name), and a live region that announces them.
 */
const MagicPill = forwardRef<HTMLElement, MagicPillProps>(function MagicPill(
  {
    name = "main",
    children,
    duration = DEFAULT_DURATION,
    idle = "hidden",
    idleIcon,
    swap = "queue",
    linkComponent,
    classNames,
    placement = "bottom",
    variant,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...rest
  },
  forwardedRef,
) {
  const store = getStore(name);
  const { current } = usePillQueue(name);
  const rootRef = useRef<HTMLElement | null>(null);
  const ref = useMemo(() => mergeRefs(rootRef, forwardedRef), [forwardedRef]);

  useEffect(() => store.registerHost(), [store]);
  useEffect(trackInputModality, []);

  // What the pill should show now. Stable objects, so a re-render isn't a change.
  const hasBase = hasContent(children);
  // The base layer as last given: when the app removes it, the pill still
  // shows it while it closes, instead of collapsing around nothing
  const lastBase = useRef<ReactNode>(children);
  if (hasBase) lastBase.current = children;
  // Someone filling in a form of the base layer: notifications wait until its
  // panel closes, rather than taking what was typed away
  const [isFillingIn, setIsFillingIn] = useState(false);
  const isWaiting = isFillingIn && hasBase;
  const target = useMemo<Scene>(
    () =>
      current && !isWaiting
        ? { kind: "notification", item: current }
        : hasBase
          ? BASE
          : idle === "rest"
            ? IDLE
            : NONE,
    [current, isWaiting, hasBase, idle],
  );

  // What it shows, moved towards the target one timed step at a time
  const [displayed, setDisplayed] = useState<Displayed>(() => ({
    scene: target.kind === "notification" ? NONE : target,
    presence: target.kind === "base" ? "compact" : target.kind === "idle" ? "rest" : "hidden",
  }));
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;
  // States to show one render after another
  const followUps = useRef<Displayed[]>([]);
  // The content on screen as the next one replaces it, to slide it out
  const capture = useRef<SwapCapture | null>(null);
  // Read when planning, so changing it doesn't interrupt a change under way
  const swapMode = useRef(swap);
  swapMode.current = swap;

  useLayoutEffect(() => {
    const swapped = capture.current;
    capture.current = null;
    if (swapped && rootRef.current) playSwap(rootRef.current, swapped);
  }, [displayed]);

  useEffect(() => {
    const hasForm = () => !!rootRef.current?.querySelector('[data-mp="panel"][data-open] form');
    setIsFillingIn(displayed.scene.kind === "base" && displayed.presence === "panel" && hasForm());
  }, [displayed]);

  // New content is on the page in its closed state: have the browser style it
  // (reading a layout value forces that), then open the pill, so the content
  // transitions open instead of appearing open at the circle's width (L21).
  // Declared before the effect below: when both run after one commit, the
  // follow-ups it clears must not be applied first.
  useEffect(() => {
    const next = followUps.current.shift();
    if (!next) return;
    void rootRef.current?.offsetWidth;
    setDisplayed(next);
  }, [displayed]);

  useEffect(() => {
    const current = displayedRef.current;
    const batches = batchSteps(current, planSteps(current, target, readTimings(rootRef.current), swapMode.current));
    const timers = batches.map(({ at, states }) => {
      const apply = () => {
        if (isSwap(displayedRef.current, states[0], swapMode.current)) capture.current = captureSwap(rootRef.current);
        followUps.current = states.slice(1);
        setDisplayed(states[0]);
      };
      if (at > 0) return setTimeout(apply, at);
      apply();
      return undefined;
    });
    return () => {
      timers.forEach(clearTimeout);
      followUps.current = [];
    };
  }, [target]);

  // Pauses: pointer, keyboard focus, an open panel, a hidden tab (Y3, L22)
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const documentHidden = useDocumentHidden();
  useEffect(() => {
    // An inert pill loses focus without always firing blur
    if (displayed.presence === "hidden") {
      setHovered(false);
      setFocused(false);
    }
  }, [displayed.presence]);
  // Content that leaves takes the focus with it (a base layer's action that
  // notifies, a form that closes), and React hears no blur for an element it
  // removes itself: without this, the pill would stay paused (L29)
  useEffect(() => {
    const root = rootRef.current;
    if (!focused || !root) return;
    const update = () => {
      if (!root.contains(document.activeElement)) setFocused(false);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [focused]);

  const shown: QueuedNotification | null =
    displayed.scene.kind === "notification" && isOpen(displayed.presence) ? displayed.scene.item : null;
  const paused = hovered || focused || documentHidden || displayed.presence === "panel";

  // The countdown starts once the notification is fully shown, and again from
  // the full duration after each pause, or when its content is updated
  useEffect(() => {
    if (!shown || paused) return;
    const ms = shown.input.duration ?? duration;
    if (!Number.isFinite(ms)) return;
    const timer = setTimeout(() => store.dismiss(shown.id, "timeout"), ms);
    return () => clearTimeout(timer);
  }, [shown, paused, duration, store]);

  // Announcements go through a separate live region, so the pill itself can
  // leave the accessibility tree when hidden (Y1, Y5)
  const [announcement, setAnnouncement] = useState<{ key: QueuedNotification; text: string } | null>(null);
  useEffect(() => {
    if (!shown) return;
    const { announce } = shown.input;
    if (announce === false) return;
    const text = typeof announce === "string" ? announce : readMessage(rootRef.current);
    if (text) setAnnouncement((previous) => (previous?.key === shown ? previous : { key: shown, text }));
  }, [shown]);

  const handlePresenceChange = (next: PillPresence) => {
    const { scene, presence } = displayedRef.current;
    if (next === "hidden") {
      // Escape on an overlay, for instance: that's a dismissal
      if (scene.kind === "notification") store.dismiss(scene.item.id, "dismissed");
      return;
    }
    if (isOpen(next) && isOpen(presence)) {
      setDisplayed({ scene, presence: next });
    }
  };

  const renderScene = (scene: Scene): ReactNode => {
    switch (scene.kind) {
      case "base":
        return hasBase ? children : lastBase.current;
      case "idle":
        return <PillIcon>{idleIcon}</PillIcon>;
      case "notification": {
        const { id, input } = scene.item;
        if (input.render) {
          return input.render({ id, dismiss: () => store.dismiss(id, "dismissed") });
        }
        return (
          <NotificationContent
            key={id}
            icon={input.icon}
            message={input.message}
            action={input.action}
            panel={input.panel}
            linkComponent={linkComponent}
            classNames={classNames}
            onAction={(event: MouseEvent<HTMLElement>) => {
              if (!event.defaultPrevented) store.dismiss(id, "action");
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  const sceneVariant =
    displayed.scene.kind === "notification" ? (displayed.scene.item.input.variant ?? variant) : variant;

  return (
    <>
      <Pill
        {...rest}
        ref={ref}
        placement={placement}
        variant={sceneVariant}
        presence={displayed.presence}
        onPresenceChange={handlePresenceChange}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          // A mouse or a pen: a tap also "enters" the pill, and on mobile the
          // matching leave only comes with the next tap elsewhere (L22)
          if (event.pointerType !== "touch") setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          setHovered(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          // Keyboard focus only: after a tap (e.g. closing the panel gives the
          // focus back to its trigger), the focus would keep the pill forever
          if (getInputModality() === "keyboard") setFocused(true);
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          onBlur?.(event);
          // Focus moving between elements inside the pill keeps it paused
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {renderScene(displayed.scene)}
      </Pill>
      <div role="status" aria-live="polite" aria-atomic="true" data-mp="announcer" style={VISUALLY_HIDDEN}>
        {announcement && <span key={announcement.key.id + announcement.text}>{announcement.text}</span>}
      </div>
    </>
  );
});

export default MagicPill;
