"use client"
// The host's timed steps from what a pill shows to what it should show,
// played on one pill: the host's own, and a sidebar's flag beside it.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { batchSteps, isSwap, planSteps, readTimings, type Displayed, type Scene, type SwapMode } from "./choreography";
import { captureSwap, playSwap, type SwapCapture } from "../Pill/morph";

export interface ChoreographyOptions {
  /** How new content goes in, from one scene to the next. Read when planning. */
  swapMode: (from: Scene, to: Scene) => SwapMode;
  /** Whether a slide turns the pill: its copy then keeps its layout. */
  turns?: (from: Scene, to: Scene) => boolean;
  /** Just before a state is shown (e.g. to measure what leaves). */
  beforeApply?: (from: Displayed, next: Displayed) => void;
  /** A slide that turns the pill starts (`true`), or has been played (`false`). */
  onSlide?: (turning: boolean) => void;
}

/** Where a pill starts: its target already, but a notification pops in. */
const initial = (target: Scene): Displayed => ({
  scene: target.kind === "notification" ? { kind: "none" } : target,
  presence: target.kind === "base" ? "compact" : target.kind === "idle" ? "rest" : "hidden",
});

/** What the pill shows, moved towards `target` one timed step at a time. */
export function useChoreography(rootRef: RefObject<HTMLElement | null>, target: Scene, options: ChoreographyOptions) {
  const [displayed, setDisplayed] = useState<Displayed>(() => initial(target));
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;
  // Read when a step is applied, so new options don't interrupt a change under way
  const optionsRef = useRef(options);
  optionsRef.current = options;
  // States to show one render after another
  const followUps = useRef<Displayed[]>([]);
  // The content on screen as the next one replaces it, to slide it out
  const capture = useRef<SwapCapture | null>(null);

  useLayoutEffect(() => {
    const swapped = capture.current;
    capture.current = null;
    if (swapped && rootRef.current) playSwap(rootRef.current, swapped);
    optionsRef.current.onSlide?.(false);
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
    const mode = optionsRef.current.swapMode(current.scene, target);
    const batches = batchSteps(current, planSteps(current, target, readTimings(rootRef.current), mode));
    const timers = batches.map(({ at, states }) => {
      const apply = () => {
        const from = displayedRef.current;
        const { beforeApply, turns, onSlide } = optionsRef.current;
        beforeApply?.(from, states[0]);
        if (isSwap(from, states[0], mode)) {
          const freeze = turns?.(from.scene, states[0].scene) ?? false;
          capture.current = captureSwap(rootRef.current, { freeze });
          if (freeze) onSlide?.(true);
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

  return { displayed, setDisplayed, displayedRef };
}
