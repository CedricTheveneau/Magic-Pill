"use client"
// The satellites' layer (beta): the host's electrons, each a small round pill
// that splits out of the host with the goo, tucks back in on its own page and
// while a notification has the pill, and goes back (or pops away) when its
// activity ends. Where they go is planned by layout.ts; this file measures,
// moves and animates.
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import Pill from "../Pill/Pill";
import { atEdgeOf, atPoint, playNecks, playOrbit, type Inside } from "../Pill/goo";
import { cancel, MORPH } from "../Pill/morph";
import { PillProgress } from "../Pill/PillProgress";
import type { PillPresence } from "../Pill/types";
import { findActiveIndex } from "../PillNavbar/matchPath";
import { foldedWidth } from "../PillNavbar/room";
import { NO_ELECTRONS, type Electron } from "../store/store";
import { useIsomorphicLayoutEffect } from "../utils/react";
import { prefersReducedMotion } from "../utils/timing";
import { VISUALLY_HIDDEN } from "../utils/visuallyHidden";
import { planSatellites, type Box } from "./layout";
import { durations, toPixels } from "./measure";
import { Orbitals } from "./Orbitals";
import { ActionList, useHostActions } from "./Actions";
import type { SatelliteHost } from "./types";

// Fixed on the screen, placed by script; the stylesheet's inline placement gives it no z-index
const ELECTRON_STYLE = { position: "fixed", zIndex: "var(--mp-z-index, 50)", margin: 0 } as CSSProperties;
const SHIFT = "mp-satellite-shift";
/** The page's actions' entry among the satellites' presences */
const ACTIONS = "\u0000actions";
const SIDE_PLACEMENTS = new Set(["left", "right"]);

/** The page's actions' box along the pill, with all of them, and what a wheel needs to cut it short. */
interface AlongBox {
  width: number;
  height: number;
  /** How many there are, the pill's length with one, what each next one adds, and one action's length */
  wheel: { count: number; first: number; step: number; action: number };
}

/**
 * The page's actions' box along the pill, whichever way their pill runs now
 * and even while its size animates: laid out on a hidden copy, turned along,
 * with all of them (not cut short by a wheel).
 */
function alongBox(atom: HTMLElement, vertical: boolean): AlongBox {
  const copy = atom.cloneNode(true) as HTMLElement;
  copy.setAttribute("data-orientation", vertical ? "vertical" : "horizontal");
  copy.removeAttribute("id");
  copy.inert = true;
  copy.style.visibility = "hidden";
  copy.style.pointerEvents = "none";
  copy.style.translate = "none";
  copy.style.scale = "none";
  copy.querySelector('[data-mp="actions"]')?.removeAttribute("data-wheel");
  atom.after(copy);
  const width = copy.offsetWidth;
  const height = copy.offsetHeight;
  const actions = [...copy.querySelectorAll<HTMLElement>('[data-mp="actions"] > *')];
  const along = (element: HTMLElement) => (vertical ? element.offsetTop : element.offsetLeft);
  const action = actions[0] ? (vertical ? actions[0].offsetHeight : actions[0].offsetWidth) : 0;
  const step = actions.length > 1 ? Math.abs(along(actions[1]) - along(actions[0])) : action;
  const length = vertical ? height : width;
  copy.remove();
  return { width, height, wheel: { count: actions.length, first: length - Math.max(0, actions.length - 1) * step, step, action } };
}

/**
 * Out of the anchor (or back into it) with the goo, drawing itself the whole
 * way, as the orbitals do: from inside it at its nearest edge by default.
 */
const bud = (anchor: HTMLElement, element: HTMLElement, kind: "split" | "join", delay: number, duration: number, from?: Inside, opaque = false) =>
  playOrbit(anchor, [{ element, delay, from: from ?? atEdgeOf(anchor), opaque }], kind === "split" ? "open" : "close", { duration });

/** The screen's length along the host's edge, less its offsets. */
const mainRoom = (vertical: boolean, offset: number) =>
  (vertical ? window.innerHeight : document.documentElement.clientWidth || window.innerWidth) - offset * 2;

/**
 * The length of the page's actions inside the pill when they must be cut
 * short to leave it `room` (undefined: all of them fit). `least`: how short
 * the host gets with its navbar's labels folded.
 */
function insideWheelLength(track: HTMLElement, root: HTMLElement, vertical: boolean, room: number, least?: number): number | undefined {
  const actions = [...track.children] as HTMLElement[];
  if (actions.length < 2) return undefined;
  const along = (element: HTMLElement) => (vertical ? element.offsetTop : element.offsetLeft);
  const action = vertical ? actions[0].offsetHeight : actions[0].offsetWidth;
  const step = Math.abs(along(actions[1]) - along(actions[0]));
  const all = action + (actions.length - 1) * step;
  const now = vertical ? track.clientHeight : track.clientWidth;
  const host = vertical ? root.offsetHeight : Math.min(root.offsetWidth, least ?? Infinity);
  // What the pill holds besides them, and what that leaves them
  const left = room - (host - now);
  if (left >= all - 0.5 || step <= 0) return undefined;
  const fit = Math.max(1, Math.min(actions.length, 1 + Math.floor((left - action) / step)));
  return action + (fit - 1) * step;
}

/** Two boxes side by side, a gap apart: the second can come out of the first. */
const nextTo = (a: Box, b: Box, gap: number) => {
  const sideBySide = Math.abs(a.top - b.top) < 2 && Math.abs(Math.abs(a.left - b.left) - (a.width + gap)) < 2;
  const stacked = Math.abs(a.left - b.left) < 2 && Math.abs(Math.abs(a.top - b.top) - (a.height + gap)) < 2;
  return sideBySide || stacked;
};

/** What an electron shows: the ring and its value or icon, the value alone, or the app's own. */
function ElectronContent({ electron }: { electron: Electron }): ReactNode {
  const { input } = electron;
  if (input.render) return input.render();
  const inner =
    input.value !== undefined ? (
      <span data-mp="electron-value">{input.value}</span>
    ) : input.icon !== undefined ? (
      <span data-mp="electron-icon" aria-hidden="true">
        {input.icon}
      </span>
    ) : null;
  return input.progress !== undefined ? <PillProgress value={input.progress}>{inner}</PillProgress> : inner;
}

/** All of the circle is a link back to where it came from, or a button for its `onClick`. */
function ElectronBody({ electron, host }: { electron: Electron; host: SatelliteHost }) {
  const { input, origin } = electron;
  const valueText = input.valueText ?? input.value;
  const name = valueText ? `${input.label}, ${valueText}` : input.label;
  const content = <ElectronContent electron={electron} />;
  if (input.onClick) {
    return (
      <button type="button" data-mp="electron" aria-label={name} onClick={(event) => input.onClick?.(event)}>
        {content}
      </button>
    );
  }
  if (origin !== undefined) {
    const Link = host.linkComponent ?? "a";
    return (
      <Link href={origin} data-mp="electron" aria-label={name} draggable={false}>
        {content}
      </Link>
    );
  }
  return (
    <span data-mp="electron" role="img" aria-label={name}>
      {content}
    </span>
  );
}

interface Shown {
  electron: Electron;
  /** It has ended: it stays on the page while it leaves */
  leaving?: boolean;
}

export function SatellitesLayer({ host }: { host: SatelliteHost }) {
  const electrons = useSyncExternalStore(host.store.subscribe, host.store.getElectrons, () => NO_ELECTRONS);
  const [, refresh] = useReducer((count: number) => count + 1, 0);

  // Every electron seen, in the order it was started; the ones that ended stay while they leave
  const shown = useRef(new Map<string, Shown>());
  for (const electron of electrons) shown.current.set(electron.id, { electron });
  for (const [id, entry] of shown.current) {
    if (!entry.leaving && !electrons.some((electron) => electron.id === id)) shown.current.set(id, { ...entry, leaving: true });
  }

  // The host travels to another placement (or turns) through the circle: the satellites tuck in
  // meanwhile, and come out at its new place once it's open again
  const [travelling, setTravelling] = useState(false);
  const spot = `${host.placement} ${host.vertical}`;
  const lastSpot = useRef(spot);
  useIsomorphicLayoutEffect(() => {
    if (lastSpot.current === spot) return;
    lastSpot.current = spot;
    setTravelling(true);
  }, [spot]);
  useEffect(() => {
    const root = host.rootRef.current;
    if (!travelling || !root) return;
    let closed = false;
    const watch = new MutationObserver(() => {
      const presence = root.dataset.presence;
      if (presence === "rest" || presence === "hidden") closed = true;
      else if (closed) setTravelling(false);
    });
    watch.observe(root, { attributes: true, attributeFilter: ["data-presence"] });
    // A pill that travels without closing (reduced motion, moveThroughCircle={false})
    const fallback = setTimeout(() => setTravelling(false), 1500);
    return () => {
      watch.disconnect();
      clearTimeout(fallback);
    };
  }, [travelling, host.rootRef]);
  // Back from a notification (or a trip), the host grows to its base layer first: they come out
  // once it has. Held in from the render it ends on (a frame out would start a split and a join)
  const wanted = (host.notifying && !host.keepElectronsOut) || travelling;
  const wasTucked = useRef(wanted);
  const holding = useRef(false);
  if (wasTucked.current && !wanted) holding.current = true;
  wasTucked.current = wanted;
  useIsomorphicLayoutEffect(() => {
    const root = host.rootRef.current;
    if (wanted || !holding.current) return;
    const release = () => {
      holding.current = false;
      refresh();
    };
    const morphs = (root?.getAnimations?.() ?? []).filter((animation) => animation.id === MORPH);
    if (morphs.length === 0) return release();
    let cancelled = false;
    void Promise.allSettled(morphs.map((animation) => animation.finished)).then(() => {
      if (!cancelled) release();
    });
    return () => {
      cancelled = true;
    };
  }, [wanted]);
  const tucked = wanted || holding.current;

  // The page's actions, in a pill of their own: out while there are some, the last ones kept while they go back
  const actions = useHostActions(host);
  const lastActions = useRef<typeof actions>(null);
  if (actions) lastActions.current = actions;
  const detached = host.actionsStyle === "detached";
  const actionsPresence: PillPresence = detached && actions && !tucked ? "compact" : "hidden";
  const shownActions = detached ? (actions ?? lastActions.current) : null;
  const atom = useRef<HTMLElement | null>(null);
  const [actionsAcross, setActionsAcross] = useState(false);
  // With a wheel, short of room: how long their row of actions is, showing what fits
  const [wheelLength, setWheelLength] = useState<number | undefined>(undefined);
  // Measured after each render, on a copy: a turned pill whose size animates would mislead the layout
  const actionsBox = useRef<AlongBox | null>(null);
  const across = useRef(actionsAcross);
  across.current = actionsAcross;
  const presenceOf = ({ electron, leaving }: Shown): PillPresence => {
    if (leaving || tucked) return "hidden";
    const onOrigin =
      electron.input.hideOnOrigin !== false &&
      electron.origin !== undefined &&
      findActiveIndex(host.pathname, [{ href: electron.origin }]) === 0;
    return onOrigin ? "hidden" : "compact";
  };
  const entries = [...shown.current.values()].map((entry) => ({ ...entry, presence: presenceOf(entry) }));

  const elements = useRef(new Map<string, HTMLElement>());
  const presences = useRef(new Map<string, PillPresence>());
  const applied = useRef({ shift: 0, reserve: 0 });
  // How short the host gets with its navbar's labels folded, measured after each render
  const hostMin = useRef<number | undefined>(undefined);
  // The row each electron was in: one that changes rows moves there, even while following the host
  const rows = useRef(new Map<string, string>());
  // Where each one was, next to the host (its side and row): one that changes goes back in and out again
  const spots = useRef(new Map<string, string>());
  const rejoining = useRef(new Set<string>());
  // Back in, to come out at their new spot on the next pass
  const splitNext = useRef(new Set<string>());
  // The page's actions in the pill (actionsStyle="inside"): where they were last, for their own pill
  // to come out of there (and go back there) when the style changes
  const insideSpot = useRef<{ x: number; y: number } | null>(null);
  const lastStyle = useRef(host.actionsStyle);

  // Measures, places, and moves: animated after a render, at once while the host resizes
  const arrange = useRef<(animate: boolean) => void>(() => {});
  arrange.current = (animate: boolean) => {
    const root = host.rootRef.current;
    if (!root) return;
    const vertical = SIDE_PLACEMENTS.has(host.placement);
    const style = getComputedStyle(root);
    const gap = toPixels(style.getPropertyValue("--mp-electron-gap"), root, Number.parseFloat(style.columnGap) || 16);
    const offset = toPixels(style.getPropertyValue("--_mp-offset"), root, 24);
    const out = entries.filter((entry) => entry.presence !== "hidden" && elements.current.get(entry.electron.id));
    if (animate && !vertical) hostMin.current = foldedWidth(root);
    // The actions' box along the pill (turned back if they run across it now)
    const atomElement = atom.current;
    const atomOut = actionsPresence !== "hidden" && atomElement;
    if (atomOut && (animate || !actionsBox.current)) actionsBox.current = alongBox(atomElement, vertical);
    const turn =
      host.actionsOrientation === "auto"
        ? ("auto" as const)
        : (host.actionsOrientation === "vertical") === vertical
          ? ("along" as const)
          : ("across" as const);
    const layout = planSatellites({
      viewport: { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight },
      host: { left: root.offsetLeft, top: root.offsetTop, width: root.offsetWidth, height: root.offsetHeight },
      hostMin: vertical ? undefined : hostMin.current,
      placement: host.placement,
      vertical,
      rtl: style.direction === "rtl",
      electrons: out.map(({ electron }) => {
        const element = elements.current.get(electron.id)!;
        return { id: electron.id, width: element.offsetWidth || 72, height: element.offsetHeight || 72 };
      }),
      actions:
        atomOut && actionsBox.current
          ? {
              width: actionsBox.current.width,
              height: actionsBox.current.height,
              side: host.actionsSide,
              turn,
              ...(host.actionsWheel ? { wheel: actionsBox.current.wheel } : {}),
            }
          : undefined,
      nearest: host.nearestToPill,
      side: host.electronSide,
      line: host.electronLine,
      arrange: host.arrange,
      gap,
      offset,
    });
    // In the pill itself, with a wheel: cut short to the room the pill has, at the divider
    if (animate && host.actionsStyle === "inside") {
      const track = root.querySelector<HTMLElement>('[data-mp="actions"][data-inside]');
      if (track) {
        const length = host.actionsWheel ? insideWheelLength(track, root, vertical, mainRoom(vertical, offset) - layout.reserve, hostMin.current) : undefined;
        if (length === undefined) {
          track.removeAttribute("data-wheel");
          track.style.removeProperty("--_mp-wheel-length");
        } else {
          track.setAttribute("data-wheel", "");
          track.style.setProperty("--_mp-wheel-length", `${length}px`);
        }
      }
    }
    const reduced = prefersReducedMotion();
    const moving = animate && !reduced && typeof root.animate === "function";
    const timings = durations(out[0] ? elements.current.get(out[0].electron.id)! : root);

    const boxes = layout.boxes;
    // Along the host's edge: where its centre will be, and which side of it a box is on, in which row
    const hostAlong = (vertical ? root.offsetTop : root.offsetLeft) + layout.shift + (vertical ? root.offsetHeight : root.offsetWidth) / 2;
    const alongOf = (box: Box) => (vertical ? box.top + box.height / 2 : box.left + box.width / 2);
    const spotOf = (box: Box) => `${alongOf(box) < hostAlong ? "before" : "after"} ${Math.round(vertical ? box.left : box.top)}`;
    // The host's centre at its spot: where it closes to a circle
    const hostCentre = () =>
      vertical
        ? atPoint(root.offsetLeft + root.offsetWidth / 2, hostAlong)
        : atPoint(hostAlong, root.offsetTop + root.offsetHeight / 2);
    // One that changes side or row (or actions that turn) goes back into the host first: meanwhile,
    // the host and the others stay where they are; then the host moves as it comes out at its new spot
    const changing = (id: string, box: Box | undefined) =>
      !!box && presences.current.get(id) === "compact" && spots.current.has(id) && spots.current.get(id) !== spotOf(box);
    const turning = !!atomElement && !!atomOut && layout.actionsAcross !== across.current && presences.current.get(ACTIONS) === "compact";
    const startsRejoin =
      animate &&
      !reduced &&
      (out.some(({ electron }) => !rejoining.current.has(electron.id) && changing(electron.id, boxes[electron.id])) ||
        (!!atomOut && !rejoining.current.has(ACTIONS) && (turning || changing(ACTIONS, boxes.actions))));
    const holding = startsRejoin || rejoining.current.size > 0;

    // The host moves to keep the group where its placement says, and leaves the satellites their room
    const previous = applied.current;
    if (!holding && Math.abs(layout.shift - previous.shift) > 0.5) {
      const along = (value: number) => (vertical ? `0px ${value}px` : `${value}px 0px`);
      if (layout.shift) root.style.setProperty("translate", along(layout.shift));
      else root.style.removeProperty("translate");
      if (moving) {
        root.animate([{ translate: along(previous.shift - layout.shift) }, { translate: "0px 0px" }], {
          id: SHIFT,
          duration: timings.change,
          easing: "ease-in-out",
          composite: "add",
        });
      }
    }
    if (!holding && !vertical && layout.reserve !== previous.reserve) {
      if (layout.reserve) root.style.setProperty("--_mp-shift-x", `${layout.reserve}px`);
      else root.style.removeProperty("--_mp-shift-x");
    }
    if (!holding) applied.current = { shift: layout.shift, reserve: layout.reserve };

    // Back into the host now, out again at its new spot once it's in
    const rejoin = (id: string, element: HTMLElement, then: () => void) => {
      rejoining.current.add(id);
      const { exit } = durations(element);
      bud(root, element, "join", 0, exit);
      setTimeout(() => {
        rejoining.current.delete(id);
        then();
      }, exit + 20);
    };

    // The page's actions in the pill: where they are, at the host's spot (not where an animation has it)
    const styleChanged = lastStyle.current !== host.actionsStyle;
    if (animate) {
      const track = host.actionsStyle === "inside" ? root.querySelector<HTMLElement>('[data-mp="actions"][data-inside]') : null;
      if (track) {
        const hostLeft = root.offsetLeft + (vertical ? 0 : layout.shift);
        const hostTop = root.offsetTop + (vertical ? layout.shift : 0);
        insideSpot.current = { x: hostLeft + track.offsetLeft + track.offsetWidth / 2, y: hostTop + track.offsetTop + track.offsetHeight / 2 };
      }
      lastStyle.current = host.actionsStyle;
    }
    // While the satellites slide: each one's start and end along the edge, for the ones that pass each other
    const slides: { element: HTMLElement; from: number; to: number }[] = [];

    // The actions: into their spot, out of the host as they come, back into it as they go
    if (atomElement) {
      const was = presences.current.get(ACTIONS);
      const box = boxes.actions;
      // Turning across: placed (and coming out) on the next pass, once it has turned
      const settled = layout.actionsAcross === across.current;
      const moved = !!box && spots.current.has(ACTIONS) && spots.current.get(ACTIONS) !== spotOf(box);
      if (animate && atomOut && was === "compact" && (!settled || moved) && !reduced && !rejoining.current.has(ACTIONS)) {
        // Turning, or changing sides: back into the host, then out again, turned or on its new side
        const turnTo = layout.actionsAcross;
        rejoin(ACTIONS, atomElement, () => {
          presences.current.set(ACTIONS, "hidden");
          spots.current.delete(ACTIONS);
          setActionsAcross(turnTo);
          refresh();
        });
      } else if (animate && atomOut && !settled && !rejoining.current.has(ACTIONS)) {
        // They turn after a render only, never while following the host as it resizes (no back and forth)
        setActionsAcross(layout.actionsAcross);
      }
      // With a wheel, short of room: their row cut short to what shows (set after a render only, like turning)
      if (animate && atomOut && actionsBox.current) {
        const { wheel } = actionsBox.current;
        const length = layout.actionsShown !== undefined ? wheel.action + (layout.actionsShown - 1) * wheel.step : undefined;
        if (length !== wheelLength) setWheelLength(length);
      }
      if (box && atomOut && settled && !rejoining.current.has(ACTIONS) && !holding) {
        // By the edge that faces the host: an action's label opening on hover grows away from it
        const before = alongOf(box) < hostAlong;
        const width = atomElement.offsetWidth || box.width;
        const height = atomElement.offsetHeight || box.height;
        // From where it was placed, not where an animation has it now
        const from = { left: Number.parseFloat(atomElement.style.left), top: Number.parseFloat(atomElement.style.top) };
        const left = !vertical && before ? box.left + box.width - width : box.left;
        const top = vertical && before ? box.top + box.height - height : box.top;
        atomElement.style.left = `${left}px`;
        atomElement.style.top = `${top}px`;
        spots.current.set(ACTIONS, spotOf(box));
        if (animate && was !== "compact") {
          // Out of the pill: from where they were in it when they've just left it, seen the whole way
          const fromInside = styleChanged && insideSpot.current ? atPoint(insideSpot.current.x, insideSpot.current.y, 1) : undefined;
          // At their size as they are now: turned while they were in, they don't grow from their old shape
          cancel(atomElement, MORPH, true);
          bud(root, atomElement, "split", 0, durations(atomElement).enter, fromInside, !!fromInside);
        } else if (moving && was === "compact" && Number.isFinite(from.left) && Number.isFinite(from.top)) {
          // Moving with the group (gathered or spread, another one coming or going): it slides there
          if (Math.abs(from.left - left) > 0.5 || Math.abs(from.top - top) > 0.5) {
            slides.push({ element: atomElement, from: vertical ? from.top : from.left, to: vertical ? top : left });
            atomElement.animate([{ translate: `${from.left - left}px ${from.top - top}px` }, { translate: "0px 0px" }], {
              id: SHIFT,
              duration: timings.change,
              easing: "ease-in-out",
              composite: "add",
            });
          }
        }
      } else if (animate && !atomOut && was === "compact") {
        const { fade, exit } = durations(atomElement);
        if (styleChanged && host.actionsStyle === "inside" && insideSpot.current) {
          // Into the pill, where they now are in it, seen the whole way (their content too)
          for (const child of atomElement.children) (child as HTMLElement).style.opacity = "1";
          bud(root, atomElement, "join", 0, exit, atPoint(insideSpot.current.x, insideSpot.current.y, 1), true);
          setTimeout(() => {
            for (const child of atomElement.children) (child as HTMLElement).style.removeProperty("opacity");
          }, exit + 20);
        } else if (tucked) {
          bud(root, atomElement, "join", 0, Math.max(exit, fade + durations(atomElement).change), hostCentre());
        } else {
          bud(root, atomElement, "join", fade, exit);
        }
        spots.current.delete(ACTIONS);
      }
      if (animate && !rejoining.current.has(ACTIONS) && !holding && (settled || !atomOut)) presences.current.set(ACTIONS, actionsPresence);
    }
    const crossOf = (box: Box) => Math.round(vertical ? box.left : box.top);
    out.forEach(({ electron }, index) => {
      const element = elements.current.get(electron.id)!;
      const box = boxes[electron.id];
      const was = presences.current.get(electron.id);
      // On its way back in, to come out elsewhere: it stays where it was meanwhile
      if (rejoining.current.has(electron.id)) return;
      if (splitNext.current.delete(electron.id)) {
        // Back in: out at its new spot, as the host moves
        element.style.left = `${box.left}px`;
        element.style.top = `${box.top}px`;
        rows.current.set(electron.id, String(crossOf(box)));
        bud(root, element, "split", 0, durations(element).enter);
        return;
      }
      const moved = was === "compact" && spots.current.has(electron.id) && spots.current.get(electron.id) !== spotOf(box);
      if (animate && moved && !reduced) {
        spots.current.set(electron.id, spotOf(box));
        rejoin(electron.id, element, () => {
          splitNext.current.add(electron.id);
          arrange.current(true);
        });
        return;
      }
      // Another one is going back in: this one waits with the host
      if (holding) return;
      spots.current.set(electron.id, spotOf(box));
      // From where it was placed, not where an animation (a split, a slide) has it now
      const from = { left: Number.parseFloat(element.style.left), top: Number.parseFloat(element.style.top) };
      element.style.left = `${box.left}px`;
      element.style.top = `${box.top}px`;
      const row = String(crossOf(box));
      const changedRow = rows.current.has(electron.id) && rows.current.get(electron.id) !== row;
      rows.current.set(electron.id, row);
      const placed = Number.isFinite(from.left) && Number.isFinite(from.top);
      if (!animate) {
        if (changedRow && placed && !reduced && typeof element.animate === "function") {
          element.animate([{ translate: `${from.left - box.left}px ${from.top - box.top}px` }, { translate: "0px 0px" }], {
            id: SHIFT,
            duration: timings.change,
            easing: "ease-in-out",
            composite: "add",
          });
        }
        return;
      }
      if (was === undefined || was === "hidden") {
        // Out of the one next to it, or of the host
        const before = out[index - 1];
        const neighbour = before ? elements.current.get(before.electron.id) : undefined;
        const anchor = neighbour && before && nextTo(boxes[before.electron.id], box, gap) ? neighbour : root;
        bud(anchor, element, "split", 0, durations(element).enter);
      } else if (moving && placed && (Math.abs(from.left - box.left) > 0.5 || Math.abs(from.top - box.top) > 0.5)) {
        slides.push({ element, from: vertical ? from.top : from.left, to: vertical ? box.top : box.left });
        element.animate([{ translate: `${from.left - box.left}px ${from.top - box.top}px` }, { translate: "0px 0px" }], {
          id: SHIFT,
          duration: timings.change,
          easing: "ease-in-out",
          composite: "add",
        });
      }
    });
    // Two that pass each other (the actions and an electron swapping places): they melt together as they meet
    const passing = new Set<HTMLElement>();
    slides.forEach((a, i) =>
      slides.slice(i + 1).forEach((b) => {
        if (Math.sign(a.from - b.from) !== Math.sign(a.to - b.to)) {
          passing.add(a.element);
          passing.add(b.element);
        }
      }),
    );
    if (passing.size > 1) playNecks([...passing], timings.change);

    // Holding: the next pass, once it's back in, takes the others' changes
    if (animate && !holding) {
      for (const entry of entries) {
        const element = elements.current.get(entry.electron.id);
        if (!element || entry.presence !== "hidden" || presences.current.get(entry.electron.id) !== "compact") continue;
        const ending = entry.leaving ? (entry.electron.input.ending ?? host.electronEnding) : "join";
        spots.current.delete(entry.electron.id);
        if (ending === "pop") continue; // the stylesheet scales it out
        const { fade, change, exit } = durations(element);
        if (tucked && !entry.leaving) {
          // For a notification (or a trip): with the host as it closes, into its centre, where it ends as a circle
          bud(root, element, "join", 0, Math.max(exit, fade + change), hostCentre());
        } else {
          bud(root, element, "join", fade, exit);
        }
      }
      for (const entry of entries) presences.current.set(entry.electron.id, entry.presence);
    }
  };

  useIsomorphicLayoutEffect(() => arrange.current(true));

  // The electrons follow the host's edge at every frame as it resizes, and the screen's
  useEffect(() => {
    const root = host.rootRef.current;
    if (!root) return;
    // Once it has settled, everything is decided again (turning, a row, a wheel), as after a render
    let settle: ReturnType<typeof setTimeout> | undefined;
    const follow = () => {
      arrange.current(false);
      clearTimeout(settle);
      settle = setTimeout(() => arrange.current(true), 200);
    };
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(follow);
    observer?.observe(root);
    // The actions' pill too: it resizes as the page's actions change
    if (atom.current) observer?.observe(atom.current);
    window.addEventListener("resize", follow);
    return () => {
      clearTimeout(settle);
      observer?.disconnect();
      window.removeEventListener("resize", follow);
      root.style.removeProperty("translate");
      if (!SIDE_PLACEMENTS.has(host.placement)) root.style.removeProperty("--_mp-shift-x");
      applied.current = { shift: 0, reserve: 0 };
    };
  }, [host.rootRef, host.placement, !!shownActions]);

  // The ones that ended leave the page once they've gone
  const leavingIds = entries.filter((entry) => entry.leaving).map((entry) => entry.electron.id);
  useEffect(() => {
    if (leavingIds.length === 0) return;
    const timers = leavingIds.map((id) => {
      const element = elements.current.get(id);
      const { fade, change, exit } = element ? durations(element) : { fade: 150, change: 250, exit: 300 };
      return setTimeout(() => {
        shown.current.delete(id);
        presences.current.delete(id);
        rows.current.delete(id);
        spots.current.delete(id);
        refresh();
      }, fade + change + exit + 100);
    });
    return () => timers.forEach(clearTimeout);
  }, [leavingIds.join(" ")]);

  // Milestones, said once
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef(new Map<string, string | undefined>());
  useEffect(() => {
    for (const electron of electrons) {
      const text = electron.input.announce;
      if (text && announced.current.get(electron.id) !== text) setAnnouncement(text);
      announced.current.set(electron.id, text);
    }
  }, [electrons]);

  return (
    <>
      {entries.map(({ electron, presence, leaving }) => {
        const ending = electron.input.ending ?? host.electronEnding;
        return (
          <Pill
            key={electron.id}
            ref={(element: HTMLElement | null) => {
              if (element) elements.current.set(electron.id, element);
              else elements.current.delete(electron.id);
            }}
            placement="inline"
            ladder={false}
            moveThroughCircle={false}
            theme={host.theme}
            variant={electron.input.variant ?? host.variant}
            presence={presence}
            data-satellite="electron"
            data-ending={leaving && ending === "pop" ? "pop" : undefined}
            style={ELECTRON_STYLE}
          >
            <ElectronBody electron={electron} host={host} />
          </Pill>
        );
      })}
      {shownActions && (
        <Pill
          ref={atom}
          placement="inline"
          ladder={false}
          moveThroughCircle={false}
          theme={host.theme}
          variant={host.variant}
          orientation={(host.vertical !== actionsAcross) ? "vertical" : "horizontal"}
          presence={actionsPresence}
          scene={shownActions.map((item) => item.id ?? item.label).join("\n")}
          role="group"
          aria-label={host.actionsLabel}
          data-satellite="actions"
          style={ELECTRON_STYLE}
        >
          <ActionList items={shownActions} host={host} wheel={wheelLength} />
        </Pill>
      )}
      {entries.map(({ electron, presence }) =>
        electron.input.orbitals?.length ? (
          <Orbitals
            key={`orbitals ${electron.id}`}
            electron={electron}
            getElement={() => elements.current.get(electron.id)}
            host={host}
            out={presence !== "hidden"}
          />
        ) : null,
      )}
      <div role="status" aria-live="polite" aria-atomic="true" data-mp="announcer" style={VISUALLY_HIDDEN}>
        {announcement}
      </div>
    </>
  );
}
