"use client"
import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

import Pill from "../Pill/Pill";
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
import { devWarn, mergeRefs, useIsomorphicLayoutEffect } from "../utils/react";
import { prefersReducedMotion } from "../utils/timing";
import { VISUALLY_HIDDEN } from "../utils/visuallyHidden";
import { BASE, IDLE, NONE, isOpen, readTimings, type Displayed, type Scene, type SwapMode } from "./choreography";
import { flagStyle, measureFlagSpot, type FlagSpot } from "./flag";
import { playSplit } from "../Pill/goo";
import { useChoreography } from "./useChoreography";
import type {
  ActionsOrientation,
  ActionsSide,
  ActionsStyle,
  ElectronEnding,
  ElectronLine,
  ElectronSide,
  OrbitalsOpenOn,
  PillSatellites,
  SatelliteArrangement,
  SatelliteHost,
} from "../satellites/types";

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
   * How notifications are laid out: in one row (default), with their actions
   * under the message when they need the room (`rows`), or, in a sidebar
   * (`left`/`right`), as a card in its column (`card`) or in a flag out of its
   * edge, while the sidebar stays (`flag`). Elsewhere, a card and a flag show
   * in one row. A notification's own `layout` wins.
   */
  notificationLayout?: NotificationLayout;
  /** Passed to notification actions that have an `href`, and to electrons going back. */
  linkComponent?: LinkComponent;
  classNames?: PillNotificationClassNames;
  /**
   * The current path, as for the navbar: an electron is tucked in while the
   * person is on its page (beta).
   */
  pathname?: string;
  /**
   * The electrons and the other satellites (beta): `satellites` from
   * `magic-pill/satellites`. Without it, `pill().electron()` does nothing.
   */
  satellites?: PillSatellites;
  /** Where electrons go: further along the edge (default), before the pill, or beside it, one row towards the page (beta). */
  electronSide?: ElectronSide;
  /** Several electrons line up along the pill (default) or stack across it (beta). */
  electronLine?: ElectronLine;
  /** Electrons stay out while a notification shows. Default false: they tuck in (beta). */
  keepElectronsOut?: boolean;
  /** How an electron leaves when it ends: back into the pill (default) or scaling out (beta). */
  electronEnding?: ElectronEnding;
  /** Satellites gathered around the pill (default) or spread to the screen's edges (beta). */
  arrange?: SatelliteArrangement;
  /**
   * What opens an electron's orbitals: a long press, or hovering it with a
   * mouse (default); a long press only; or a tap, which then adds a first
   * orbital going back (beta).
   */
  orbitalsOpenOn?: OrbitalsOpenOn;
  /** The label of the orbital under the finger, the pointer or the focus shows next to it. Default true (beta). */
  orbitalLabels?: boolean;
  /** Orbitals stay open after one of them runs. Default true (beta). */
  orbitalsStayOpen?: boolean;
  /**
   * The current page's actions (`usePillActions()`): a pill of their own
   * (default), or in the pill itself, after a divider (beta).
   */
  actionsStyle?: ActionsStyle;
  /** Where the page's actions go: the start side (default), the end side, or beside the pill (beta). */
  actionsSide?: ActionsSide;
  /** The page's actions run like the pill, turning across when room runs out (default), or horizontal, or vertical (beta). */
  actionsOrientation?: ActionsOrientation;
  /** The page's actions' accessible name. Default "Page actions" (beta). */
  actionsLabel?: string;
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
 * Pauses a notification while it's pointed at or has the keyboard focus
 * (Y3, L22). The handlers go on the pill that shows it.
 */
function usePause(rootRef: RefObject<HTMLElement | null>, presence: PillPresence) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    // An inert pill loses focus without always firing blur
    if (presence === "hidden") {
      setHovered(false);
      setFocused(false);
    }
  }, [presence]);
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
  }, [rootRef, focused]);

  const handlers = {
    onPointerEnter: (event: PointerEvent<HTMLDivElement>) => {
      // A mouse or a pen: a tap also "enters" the pill, and on mobile the
      // matching leave only comes with the next tap elsewhere (L22)
      if (event.pointerType !== "touch") setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: () => {
      // Keyboard focus only: after a tap (e.g. closing the panel gives the
      // focus back to its trigger), the focus would keep the pill forever
      if (getInputModality() === "keyboard") setFocused(true);
    },
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      // Focus moving between elements inside the pill keeps it paused
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
    },
  };
  return { active: hovered || focused, handlers };
}

const notificationIn = ({ scene, presence }: Displayed): QueuedNotification | null =>
  scene.kind === "notification" && isOpen(presence) ? scene.item : null;

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
    pathname,
    satellites,
    electronSide = "after",
    electronLine = "along",
    keepElectronsOut = false,
    electronEnding = "join",
    arrange = "gather",
    orbitalsOpenOn = "press-hover",
    orbitalLabels = true,
    orbitalsStayOpen = true,
    actionsStyle = "detached",
    actionsSide = "start",
    actionsOrientation = "auto",
    actionsLabel = "Page actions",
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
  // A sidebar's flag: a notification in a pill of its own, beside it
  const flagRef = useRef<HTMLElement | null>(null);

  useEffect(() => store.registerHost(), [store]);
  useEffect(() => {
    if (satellites) return;
    const check = () => {
      if (store.getElectrons().length > 0) {
        devWarn(`pill("${name}").electron() needs the satellites: <MagicPill satellites={satellites}>, from "magic-pill/satellites".`);
        unsubscribe();
      }
    };
    const unsubscribe = store.subscribe(check);
    check();
    return unsubscribe;
  }, [store, satellites, name]);
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

  // A sidebar's notifications are pills like the others: it turns horizontal
  // for them, inside the circle, where nothing shows
  const onSide = placement === "left" || placement === "right";
  const isVertical = orientation === "vertical" || (orientation === undefined && onSide);
  // A notification's layout: its own, or the host's. A card is a sidebar's,
  // and a flag needs a sidebar on a side of the screen, with its base layer
  const layoutOf = (item: QueuedNotification): NotificationLayout => {
    const layout = item.input.layout ?? notificationLayout;
    if (layout === "card" && !isVertical) return "pill";
    if (layout === "flag" && !(isVertical && onSide && hasBase)) return "pill";
    return layout;
  };
  const sceneLayout = (shown: Scene) => (shown.kind === "notification" ? layoutOf(shown.item) : undefined);
  const isFlag = current !== null && current !== undefined && layoutOf(current) === "flag";

  const target = useMemo<Scene>(
    () =>
      current && !isWaiting && !isFlag
        ? { kind: "notification", item: current }
        : hasBase
          ? base
          : idle === "rest"
            ? IDLE
            : NONE,
    [current, isWaiting, isFlag, hasBase, base, idle],
  );
  // A flag's notification: the sidebar keeps its base layer meanwhile
  const flagTarget = useMemo<Scene>(
    () => (current && !isWaiting && isFlag ? { kind: "notification", item: current } : NONE),
    [current, isWaiting, isFlag],
  );

  // A sidebar turns horizontal for its notifications, but for a card, in its column
  const orientationOf = (shown: Scene) =>
    isVertical && shown.kind === "notification" && sceneLayout(shown) !== "card" ? "horizontal" : orientation;
  // The sidebar's width, which a card keeps (at least), measured as it leaves
  const sidebarWidth = useRef<number | undefined>(undefined);
  // The pill turns as the content slides: no trip through the circle then
  const [isSliding, setIsSliding] = useState(false);

  const { displayed, setDisplayed, displayedRef } = useChoreography(rootRef, target, {
    // A sidebar slides to and from a notification in rows or a card (the same
    // pill, laid out again), not to a plain one: that turns through the circle
    swapMode: (from, to): SwapMode => {
      if (!isVertical || swap !== "always") return swap;
      const layout = sceneLayout(to.kind === "notification" ? to : from);
      return layout === "rows" || layout === "card" ? "always" : "queue";
    },
    // A slide where the pill turns: the copy sliding out keeps its layout
    turns: (from, to) => (orientationOf(from) ?? "") !== (orientationOf(to) ?? ""),
    beforeApply: (from) => {
      if (from.scene.kind === "base" && isOpen(from.presence) && rootRef.current) {
        sidebarWidth.current = rootRef.current.getBoundingClientRect().width;
      }
    },
    onSlide: setIsSliding,
  });

  // The flag: where it goes is measured as it comes out, and again for each
  // notification, which may be about another section (it moves there)
  const [flagSpot, setFlagSpot] = useState<FlagSpot>({ shift: 0 });
  const flagFrom = useRef<DOMRect | null>(null);
  const {
    displayed: flagDisplayed,
    setDisplayed: setFlagDisplayed,
    displayedRef: flagDisplayedRef,
  } = useChoreography(flagRef, flagTarget, {
    // From one notification to the next, it slides, as a host does
    swapMode: () => (swap === "never" ? "never" : "queue"),
    beforeApply: (from, next) => {
      if (next.scene.kind !== "notification" || next.scene === from.scene || !rootRef.current) return;
      if (flagRef.current && isOpen(from.presence)) flagFrom.current = flagRef.current.getBoundingClientRect();
      setFlagSpot(measureFlagSpot(rootRef.current, next.scene.item.input.at));
    },
  });

  // Centred on its section, or in the middle while its panel is open
  const flagY = flagDisplayed.presence === "panel" ? undefined : flagSpot.y;

  // Moved to another section, or to the middle for its panel, while it shows: it travels there
  useIsomorphicLayoutEffect(() => {
    const from = flagFrom.current;
    flagFrom.current = null;
    const flag = flagRef.current;
    if (!from || !flag || typeof flag.animate !== "function" || prefersReducedMotion()) return;
    const to = flag.getBoundingClientRect();
    const shift = from.top + from.height / 2 - (to.top + to.height / 2);
    if (Math.abs(shift) < 1) return;
    const { fade, change } = readTimings(flag);
    flag.animate([{ translate: `0px ${shift}px` }, { translate: "0px 0px" }], {
      duration: fade + change,
      easing: "ease-in-out",
      composite: "add",
    });
  }, [flagSpot, flagY]);

  // The flag comes out of the sidebar's edge as a droplet, and goes back into
  // it once it has closed to a circle (Pill/goo.ts). Its enter and exit are
  // the split's and the join's durations (styles.css)
  const flagPresence = useRef(flagDisplayed.presence);
  useIsomorphicLayoutEffect(() => {
    const previous = flagPresence.current;
    flagPresence.current = flagDisplayed.presence;
    const sidebar = rootRef.current;
    const flag = flagRef.current;
    if (!sidebar || !flag || previous === flagDisplayed.presence) return;
    const { enter, fade, change, exit } = readTimings(flag);
    if (previous === "hidden" && flagDisplayed.presence === "rest") {
      playSplit(sidebar, flag, "split", { delay: 0, duration: enter });
    } else if (flagDisplayed.presence === "hidden") {
      playSplit(sidebar, flag, "join", { delay: fade + change, duration: exit });
    }
  }, [flagDisplayed.presence]);

  useEffect(() => {
    const hasForm = () => !!rootRef.current?.querySelector('[data-mp="panel"][data-open] form');
    setIsFillingIn(displayed.scene.kind === "base" && displayed.presence === "panel" && hasForm());
  }, [displayed]);

  // Pauses: pointer, keyboard focus, an open panel, a hidden tab (Y3, L22)
  const mainPause = usePause(rootRef, displayed.presence);
  const flagPause = usePause(flagRef, flagDisplayed.presence);
  const documentHidden = useDocumentHidden();
  const inFlag = notificationIn(flagDisplayed);
  const shown = notificationIn(displayed) ?? inFlag;
  const paused =
    documentHidden ||
    (shown !== null && shown === inFlag
      ? flagPause.active || flagDisplayed.presence === "panel"
      : mainPause.active || displayed.presence === "panel");

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
    const text = typeof announce === "string" ? announce : readMessage(shown === inFlag ? flagRef.current : rootRef.current);
    if (text) setAnnouncement((previous) => (previous?.key === shown ? previous : { key: shown, text }));
  }, [shown, inFlag]);

  const presenceHandler =
    (stateRef: { current: Displayed }, setState: Dispatch<SetStateAction<Displayed>>) => (next: PillPresence) => {
      const { scene: shownScene, presence } = stateRef.current;
      if (next === "hidden") {
        // Escape on an overlay, for instance: that's a dismissal
        if (shownScene.kind === "notification") store.dismiss(shownScene.item.id, "dismissed");
        return;
      }
      if (isOpen(next) && isOpen(presence)) {
        setState({ scene: shownScene, presence: next });
      }
    };

  // What the satellites see of the host (magic-pill/satellites)
  const satelliteHost: SatelliteHost | undefined = satellites
    ? {
        name,
        store,
        rootRef,
        placement,
        vertical: isVertical,
        pathname,
        // A notification has the pill, or it's still closing on one or reopening:
        // the electrons come out again once it's open with its base layer
        notifying:
          target.kind === "notification" ||
          displayed.scene.kind === "notification" ||
          (hasBase && !isOpen(displayed.presence)),
        linkComponent,
        variant,
        theme: rest.theme,
        electronSide,
        electronLine,
        keepElectronsOut,
        electronEnding,
        arrange,
        orbitalsOpenOn,
        orbitalLabels,
        orbitalsStayOpen,
        actionsStyle,
        actionsSide,
        actionsOrientation,
        actionsLabel,
      }
    : undefined;
  const inside = satellites && satelliteHost && actionsStyle === "inside" ? <satellites.Inside host={satelliteHost} /> : null;

  const renderScene = (shownScene: Scene): ReactNode => {
    switch (shownScene.kind) {
      case "base":
        // A scene of its own: its fields' state doesn't go over to the next one
        // The page's actions inside the pill: before its content or after it, past a divider
        return (
          <Fragment key={shownScene.key}>
            {actionsSide !== "end" && inside}
            {lastScenes.current.get(shownScene.key)?.children ?? lastBase.current}
            {actionsSide === "end" && inside}
          </Fragment>
        );
      case "idle":
        return <PillIcon>{idleIcon}</PillIcon>;
      case "notification": {
        const { id, input } = shownScene.item;
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
            layout={layoutOf(shownScene.item)}
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
  const mainLayout = sceneLayout(displayed.scene);

  return (
    <>
      <Pill
        {...rest}
        ref={ref}
        placement={placement}
        orientation={orientationOf(displayed.scene)}
        moveThroughCircle={moveThroughCircle !== false && !isSliding}
        data-layout={mainLayout}
        style={
          mainLayout === "card" && sidebarWidth.current
            ? ({ ...rest.style, "--_mp-sidebar-width": `${sidebarWidth.current}px` } as CSSProperties)
            : rest.style
        }
        variant={sceneVariant}
        presence={displayed.presence}
        onPresenceChange={presenceHandler(displayedRef, setDisplayed)}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          mainPause.handlers.onPointerEnter(event);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          mainPause.handlers.onPointerLeave();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          mainPause.handlers.onFocus();
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          onBlur?.(event);
          mainPause.handlers.onBlur(event);
        }}
      >
        {renderScene(displayed.scene)}
      </Pill>
      {/* On the page (hidden and inert) for as long as a flag can come out:
          like the host's own pill, it pops out of its closed state */}
      {((isVertical && onSide && hasBase) || flagDisplayed.presence !== "hidden") && (
        <Pill
          ref={flagRef}
          placement={placement}
          orientation="horizontal"
          ladder={false}
          moveThroughCircle={false}
          theme={rest.theme}
          variant={flagDisplayed.scene.kind === "notification" ? (flagDisplayed.scene.item.input.variant ?? variant) : variant}
          presence={flagDisplayed.presence}
          onPresenceChange={(next) => {
            // Where it is before it opens its panel (or closes it), to travel from there
            if (flagRef.current && isOpen(next)) flagFrom.current = flagRef.current.getBoundingClientRect();
            presenceHandler(flagDisplayedRef, setFlagDisplayed)(next);
          }}
          data-layout="flag"
          style={flagStyle({ shift: flagSpot.shift, y: flagY }) as CSSProperties}
          {...flagPause.handlers}
        >
          {renderScene(flagDisplayed.scene)}
        </Pill>
      )}
      {satellites && satelliteHost && <satellites.Layer host={satelliteHost} />}
      <div role="status" aria-live="polite" aria-atomic="true" data-mp="announcer" style={VISUALLY_HIDDEN}>
        {announcement && <span key={announcement.key.id + announcement.text}>{announcement.text}</span>}
      </div>
    </>
  );
});

export default MagicPill;
