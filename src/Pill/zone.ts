"use client"
// Zones: pills that share a fixed placement make room for each other. The
// first one set up keeps its spot, the next ones line up after it like the
// rungs of a ladder: below it at the top of the screen, above it at the
// bottom, further in from the edge on the sides. When one hides or leaves,
// the ones after it take its place.
import { useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../utils/react";
import { EASING, MORPH, cancel, readMorphTimings } from "./morph";
import type { PillPlacement, PillPresence } from "./types";
import { parseDuration, prefersReducedMotion } from "../utils/timing";

/** What a pill takes of its zone, in px along the zone's axis. */
export interface RungBox {
  /** From the screen edge to the pill's own spot */
  offset: number;
  size: number;
  /** Kept between this pill and the one before it */
  gap: number;
  /** Takes room: a hidden pill doesn't */
  visible: boolean;
}

/** How far each pill moves from its own spot. Pure, so it can be tested. */
export function planLadder(boxes: RungBox[]): number[] {
  let edge: number | undefined;
  return boxes.map(({ offset, size, gap, visible }) => {
    const shift = edge === undefined ? 0 : Math.max(0, edge + gap - offset);
    if (visible && size > 0) edge = Math.max(edge ?? 0, offset + shift + size);
    return shift;
  });
}

interface Rung {
  element: HTMLElement | null;
  zone?: PillPlacement;
  presence: PillPresence;
  size: number;
  /** Its panel covers the other pills: it keeps the room it had before opening */
  frozen: boolean;
}

interface Motion {
  delay?: number;
  duration: number;
  easing?: string;
  /** Goes straight to its spot: it has just appeared */
  except?: Rung;
}

/** Tags the ladder's animations, which run alongside the size and placement ones. */
const SHIFT = "mp-shift";
/** Read by the stylesheet, which adds them to the placement's inset. */
const SHIFTS = { x: "--_mp-shift-x", y: "--_mp-shift-y" };

/** The pills of each zone, in the order they were set up. */
const zones = new Map<PillPlacement, Rung[]>();

/** Where a zone's pills are measured from, and along which axis. */
function axisOf(zone: PillPlacement) {
  if (zone === "left" || zone === "right") return { shift: SHIFTS.x, inset: zone, size: "width" } as const;
  return {
    shift: SHIFTS.y,
    inset: zone.startsWith("top") ? "insetBlockStart" : "insetBlockEnd",
    size: "blockSize",
  } as const;
}

const number = (value: string) => Number.parseFloat(value) || 0;

function measure(rung: Rung, element: HTMLElement, zone: PillPlacement) {
  if (!rung.frozen) rung.size = element.offsetWidth ? number(getComputedStyle(element)[axisOf(zone).size]) : 0;
}

/** Puts a zone's pills in their spots, moving there if a motion is given. */
function arrange(zone: PillPlacement, planMotion?: () => Motion) {
  const { shift, inset } = axisOf(zone);
  const rungs = zones.get(zone) ?? [];
  const elements = rungs.map((rung) => rung.element as HTMLElement);
  // Alone in its spot: nothing to measure
  if (rungs.length < 2 && !elements[0]?.style.getPropertyValue(shift)) return;
  const motion = prefersReducedMotion() ? undefined : planMotion?.();
  const before = motion ? elements.map((element) => element.getBoundingClientRect()) : [];

  // Their own spots first, then the shifts they need
  for (const element of elements) element.style.removeProperty(shift);
  const boxes = rungs.map((rung, index) => {
    measure(rung, elements[index], zone);
    const style = getComputedStyle(elements[index]);
    return {
      offset: number(style[inset]),
      size: rung.size,
      gap: number(style.rowGap),
      // An app's own CSS may take the pill out of its fixed spot
      visible: rung.presence !== "hidden" && style.position === "fixed",
    };
  });
  planLadder(boxes).forEach((value, index) => {
    if (value) elements[index].style.setProperty(shift, `${value}px`);
  });
  if (!motion) return;

  elements.forEach((element, index) => {
    if (!element.animate) return;
    cancel(element, SHIFT);
    if (rungs[index] === motion.except || getComputedStyle(element).visibility === "hidden") return;
    const from = before[index];
    const to = element.getBoundingClientRect();
    const x = from.left - to.left;
    const y = from.top - to.top;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;
    const { delay = 0, duration, easing = EASING } = motion;
    // Added to a placement move that may be running
    element.animate([{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }], {
      id: SHIFT,
      delay,
      duration,
      easing,
      fill: "backwards",
      composite: "add",
    });
  });
}

const travel = (element: HTMLElement): Motion => {
  const { fade, change } = readMorphTimings(element);
  return { duration: fade + change };
};

/**
 * Gives the pill its place among the ones that share its placement.
 * `zone`: its placement, or nothing for a pill that keeps to itself.
 */
export function useZone(
  rootRef: RefObject<HTMLElement | null>,
  zone: PillPlacement | undefined,
  presence: PillPresence,
) {
  const rungRef = useRef<Rung>({ element: null, presence, size: 0, frozen: presence === "panel" });

  useIsomorphicLayoutEffect(() => {
    const rung = rungRef.current;
    const element = rootRef.current;
    if (!zone || !element) return;
    const rungs = zones.get(zone) ?? [];
    zones.set(zone, rungs);
    rungs.push(rung);
    rung.element = element;
    // Coming from another zone: on its way here (PlacementWatch), so it heads for its rung
    const moved = rung.zone !== undefined && rung.zone !== zone;
    rung.zone = zone;
    arrange(zone, () => ({ ...travel(element), except: moved ? undefined : rung }));

    // The next ones follow its edge at every frame as it resizes
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            measure(rung, element, zone);
            if (rungs.length > 1) arrange(zone);
          });
    observer?.observe(element);

    return () => {
      observer?.disconnect();
      rungs.splice(rungs.indexOf(rung), 1);
      element.style.removeProperty(SHIFTS.x);
      element.style.removeProperty(SHIFTS.y);
      arrange(zone, () => travel(element));
    };
  }, [rootRef, zone]);

  useIsomorphicLayoutEffect(() => {
    const rung = rungRef.current;
    const previous = rung.presence;
    const { element } = rung;
    rung.presence = presence;
    if (presence === "panel") rung.frozen = true;
    if (previous === presence || !element || !rung.zone) return;

    if (previous === "panel") {
      // It takes its own room again once it has closed back
      const closing = (element.getAnimations?.() ?? []).filter(({ id }) => id === MORPH);
      void Promise.allSettled(closing.map(({ finished }) => finished)).then(() => {
        if (rung.presence === "panel") return;
        rung.frozen = false;
        if (rung.zone) arrange(rung.zone, () => travel(element));
      });
    }
    if (presence === "hidden") {
      // The next ones set off once it's small enough for them not to run into it
      arrange(rung.zone, () => {
        const { fade, change } = readMorphTimings(element);
        const exit = parseDuration(getComputedStyle(element).getPropertyValue("--_mp-exit"), 300);
        return { delay: fade + change + exit / 3, duration: fade + change, except: rung };
      });
    } else if (previous === "hidden") {
      // Quickly out of its way
      arrange(rung.zone, () => ({ duration: readMorphTimings(element).change, easing: "ease-out", except: rung }));
    }
  }, [presence]);
}
