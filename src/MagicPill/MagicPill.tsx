"use client"
import {
  Fragment,
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
import {
  NotificationContent,
  type NotificationLayout,
  type PillNotificationClassNames,
} from "../PillNotification/PillNotification";
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
  extends Omit<PillProps, "presence" | "defaultPresence" | "onPresenceChange" | "children" | "scene" | "sceneChange"> {
  /** Default "main". Two hosts with the same name warn in development. */
  name?: string;
  /**
   * The base layer (e.g. a <PillNavbar>), shown whenever no notification is.
   * Notifications take the pill over, then it returns to this content.
   */
  children?: ReactNode;
  /**
   * A name for what the base layer shows. When it changes, the pill goes from
   * the old content to the new one as it does to a notification (see `swap`),
   * instead of jumping.
   */
  scene?: string | number;
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
  /**
   * How notifications are laid out: in one row (default), or with their
   * actions under the message when they need the room (`rows`). A
   * notification's own `layout` wins.
   */
  notificationLayout?: NotificationLayout;
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
    scene,
    duration = DEFAULT_DURATION,
    idle = "hidden",
    idleIcon,
    swap = "queue",
    notificationLayout = "pill",
    linkComponent,
    classNames,
    placement = "bottom",
    orientation,
    moveThroughCircle,
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
  const base = useMemo<Scene>(() => (scene === undefined ? BASE : { kind: "base", key: scene }), [scene]);
  // Its scenes as last given: the one that leaves stays while the pill closes on it
  const lastScenes = useRef(new Map<string | number | undefined, { children: ReactNode; variant: PillProps["variant"] }>());
  lastScenes.current.set(scene, { children: lastBase.current, variant });
  // Someone filling in a form of the base layer: notifications wait until its
  // panel closes, rather than taking what was typed away
  const [isFillingIn, setIsFillingIn] = useState(false);
  const isWaiting = isFillingIn && hasBase;
  const target = useMemo<Scene>(
    () =>
      current && !isWaiting
        ? { kind: "notification", item: current }
        : hasBase
          ? base
          : idle === "rest"
            ? IDLE
            : NONE,
    [current, isWaiting, hasBase, base, idle],
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
  // A sidebar's notifications are pills like the others: it turns horizontal
  // for them, inside the circle, where nothing shows. Sliding can't turn it,
  // so between its base layer and a notification it goes through the circle
  const onSide = placement === "left" || placement === "right";
  const isVertical = orientation === "vertical" || (orientation === undefined && onSide);
  // A notification's layout: its own, or the host's
  const layoutOf = (scene: Scene): NotificationLayout | undefined =>
    scene.kind === "notification" ? (scene.item.input.layout ?? notificationLayout) : undefined;
  // Read when planning, so changing it doesn't interrupt a change under way.
  // A sidebar slides to and from a notification in rows (the same pill, laid
  // out again), not to a plain one: that turns through the circle
  const swapMode = useRef((_from: Scene, _to: Scene): SwapMode => swap);
  swapMode.current = (from, to) => {
    if (!isVertical || swap !== "always") return swap;
    const notification = to.kind === "notification" ? to : from;
    return layoutOf(notification) === "rows" ? "always" : "queue";
  };
  // A slide where the pill turns: the copy sliding out keeps its layout
  const turns = (from: Scene, to: Scene) => isVertical && (from.kind === "notification") !== (to.kind === "notification");
  // The pill turns as the content slides: no trip through the circle then
  const [isSliding, setIsSliding] = useState(false);

  useLayoutEffect(() => {
    const swapped = capture.current;
    capture.current = null;
    if (swapped && rootRef.current) playSwap(rootRef.current, swapped);
    setIsSliding(false);
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
    const mode = swapMode.current(current.scene, target);
    const batches = batchSteps(current, planSteps(current, target, readTimings(rootRef.current), mode));
    const timers = batches.map(({ at, states }) => {
      const apply = () => {
        const from = displayedRef.current;
        if (isSwap(from, states[0], mode)) {
          const freeze = turns(from.scene, states[0].scene);
          capture.current = captureSwap(rootRef.current, { freeze });
          setIsSliding(freeze);
        }
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
        // A scene of its own: its fields' state doesn't go over to the next one
        return <Fragment key={scene.key}>{lastScenes.current.get(scene.key)?.children ?? lastBase.current}</Fragment>;
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
            layout={layoutOf(scene)}
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

  // Only the base layer's current scene, and the one still shown, are kept
  const displayedKey = displayed.scene.kind === "base" ? displayed.scene.key : scene;
  for (const key of lastScenes.current.keys()) {
    if (key !== scene && key !== displayedKey) lastScenes.current.delete(key);
  }
  const sceneVariant =
    displayed.scene.kind === "notification"
      ? (displayed.scene.item.input.variant ?? variant)
      : (lastScenes.current.get(displayedKey) ?? { variant }).variant;

  return (
    <>
      <Pill
        {...rest}
        ref={ref}
        placement={placement}
        orientation={isVertical && displayed.scene.kind === "notification" ? "horizontal" : orientation}
        moveThroughCircle={moveThroughCircle !== false && !isSliding}
        data-layout={layoutOf(displayed.scene)}
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
