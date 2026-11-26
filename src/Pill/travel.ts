"use client"
// A pill that changes placement (or orientation) goes there through the
// circle: it closes to a circle where it is, the circle travels, and it opens
// again at its new place. Its content never has to be laid out on the way, so
// nothing jumps, even from the bottom of the screen to a side, where the pill
// turns vertical.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { readMorphTimings } from "./morph";
import type { PillOrientation, PillPlacement, PillPresence } from "./types";
import { prefersReducedMotion } from "../utils/timing";

const CLOSED: ReadonlySet<PillPresence> = new Set(["rest", "hidden"]);

/** Where the pill is, and which way its content runs. */
export interface Spot {
  placement: PillPlacement;
  orientation: PillOrientation;
}

const sameSpot = (a: Spot, b: Spot) => a.placement === b.placement && a.orientation === b.orientation;

/**
 * Whether the pill goes from one spot to the other through the circle. Not
 * into or out of the page's flow, nor into or out of the modal (another
 * element): those change at once, as before. Pure, so it can be tested.
 */
export function travelsThroughCircle(from: Spot, to: Spot): boolean {
  const fixed = (placement: PillPlacement) => placement !== "inline" && placement !== "overlay";
  return !sameSpot(from, to) && fixed(from.placement) && fixed(to.placement);
}

/**
 * The steps of a move. `closing`: at its old spot, closing to the circle;
 * `travelling`: a circle on its way (the placement animation, morph.ts).
 */
type Phase = "still" | "closing" | "travelling";

interface TravelOptions extends Spot {
  presence: PillPresence;
  /** Off: the pill changes spot at once, and moves there at full size (`moveThroughCircle={false}`, unstyled pills). */
  enabled: boolean;
}

/** The spot to show, and the level to show it at. */
export function useTravel(
  rootRef: RefObject<HTMLElement | null>,
  { placement, orientation, presence, enabled }: TravelOptions,
): Spot & { presence: PillPresence } {
  const [shown, setShown] = useState<Spot>({ placement, orientation });
  const [phase, setPhase] = useState<Phase>("still");
  const target: Spot = { placement, orientation };
  // Read when a step ends: the app may have asked for another spot meanwhile
  const targetRef = useRef(target);
  targetRef.current = target;
  // What had the focus, which the circle hides
  const focused = useRef<HTMLElement | null>(null);

  const moving = !sameSpot(shown, target);
  if (moving && phase === "still") {
    // A new spot: close where it is first, or go at once (in this same render).
    // A circle (or a hidden pill) travels as it is; the rest moves as before
    const throughCircle =
      enabled && travelsThroughCircle(shown, target) && !CLOSED.has(presence) && !prefersReducedMotion();
    if (throughCircle) setPhase("closing");
    else setShown(target);
  }

  // Before the circle hides it from the page
  useLayoutEffect(() => {
    if (phase !== "closing") return;
    const root = rootRef.current;
    const active = document.activeElement;
    focused.current = root && active instanceof HTMLElement && root.contains(active) ? active : null;
  }, [rootRef, phase]);

  // Each step's end: closed, the circle sets off; arrived, it opens
  useEffect(() => {
    const root = rootRef.current;
    if (phase === "still" || !root) return;
    const { fade, change } = readMorphTimings(root);
    const timer = setTimeout(() => {
      if (phase === "closing") {
        setShown(targetRef.current);
        setPhase("travelling");
      } else {
        setPhase("still");
      }
    }, fade + change);
    return () => clearTimeout(timer);
  }, [rootRef, phase, shown]);

  // Another spot asked for on the way: the circle heads there
  useEffect(() => {
    if (phase === "travelling" && moving) setShown(targetRef.current);
  }, [phase, moving]);

  // Open again: what had the focus gets it back, if the circle took it away
  useEffect(() => {
    const element = focused.current;
    if (phase !== "still" || !element) return;
    focused.current = null;
    if (document.activeElement === document.body && element.isConnected) element.focus({ preventScroll: true });
  }, [phase]);

  return {
    ...shown,
    presence: phase !== "still" && !CLOSED.has(presence) ? "rest" : presence,
  };
}
