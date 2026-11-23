// Pure planning of the host's shape changes, so it can be tested without timers.
import type { PillPresence } from "../Pill/types";
import type { QueuedNotification } from "../store/store";
import { parseDuration, prefersReducedMotion } from "../utils/timing";

export { parseDuration };

/** What the host's pill shows. */
export type Scene =
  | { kind: "none" }
  | { kind: "base" }
  | { kind: "idle" }
  | { kind: "notification"; item: QueuedNotification };

export const NONE: Scene = Object.freeze({ kind: "none" });
export const BASE: Scene = Object.freeze({ kind: "base" });
export const IDLE: Scene = Object.freeze({ kind: "idle" });

export interface Displayed {
  scene: Scene;
  presence: PillPresence;
}

export interface Timings {
  /** hidden → rest: the pop */
  enter: number;
  /** The content fading out before the pill shrinks (and in once it has grown) */
  fade: number;
  /** rest ↔ compact: the shape change */
  change: number;
  /** rest → hidden: the scale out */
  exit: number;
  /** With prefers-reduced-motion: no circle step, only fades of `exit` ms */
  reduced: boolean;
}

/** A state to apply `delay` ms after the previous step. */
export interface Step extends Displayed {
  delay: number;
}

const OPEN_LEVELS: ReadonlySet<PillPresence> = new Set(["compact", "expanded", "panel"]);
export const isOpen = (presence: PillPresence) => OPEN_LEVELS.has(presence);

const sceneKey = (scene: Scene) => (scene.kind === "notification" ? `notification:${scene.item.id}` : scene.kind);

/**
 * Where new content slides into the open pill (the "rubik's cube") instead of
 * going through the circle: between queued notifications (`queue`), also
 * between the base layer and notifications (`always`), or nowhere (`never`).
 */
export type SwapMode = "queue" | "always" | "never";

/** New content the host slides in, without closing the pill. */
export const isSwap = (from: Displayed, to: Displayed, mode: SwapMode = "queue") =>
  mode !== "never" &&
  from.presence === "compact" &&
  to.presence === "compact" &&
  sceneKey(from.scene) !== sceneKey(to.scene) &&
  [from.scene.kind, to.scene.kind].every((kind) => kind === "notification" || (mode === "always" && kind === "base"));

/** Where each scene settles: the base and notifications are pills, idle is a circle. */
const settledPresence = (scene: Scene): PillPresence =>
  scene.kind === "none" ? "hidden" : scene.kind === "idle" ? "rest" : "compact";

/**
 * The steps from what's displayed to the target scene:
 * - the next notification in the queue (with `always`, the base layer too): swap it in place (the host animates it);
 * - other new content: fade it out, collapse to the circle, swap the content there, grow back;
 * - nothing left to show: hide (the stylesheet shrinks, then scales out), then drop the content;
 * - from hidden: pop in as a circle, then grow into the pill.
 * Open levels the user chose (expanded, panel) are kept while the scene stays the same.
 */
export function planSteps(current: Displayed, target: Scene, timings: Timings, swap?: SwapMode): Step[] {
  const steps: Step[] = [];
  let { scene, presence } = current;
  const go = (delay: number, nextPresence: PillPresence, nextScene: Scene = scene) => {
    steps.push({ delay, presence: nextPresence, scene: nextScene });
    presence = nextPresence;
    scene = nextScene;
  };

  if (sceneKey(scene) !== sceneKey(target)) {
    if (target.kind === "none") {
      if (presence !== "hidden") go(0, "hidden");
      // Keep the old content on screen until it's out of sight
      go(timings.reduced ? timings.exit : timings.fade + timings.change + timings.exit, "hidden", target);
      return steps;
    }
    if (!timings.reduced && isSwap({ scene, presence }, { scene: target, presence: "compact" }, swap)) {
      go(0, presence, target);
    } else if (isOpen(presence)) {
      if (timings.reduced) {
        go(0, "hidden");
        go(timings.exit, "hidden", target);
      } else {
        go(0, "rest");
        go(timings.fade + timings.change, "rest", target);
      }
    } else {
      go(0, presence, target);
    }
  } else if (scene !== target) {
    // Same notification, new content (update or same id): swap in place
    go(0, presence, target);
  }

  const settled = settledPresence(target);
  if (settled === "hidden" || settled === "rest") {
    if (presence !== settled) go(0, settled);
  } else if (!isOpen(presence)) {
    if (presence === "hidden" && !timings.reduced) {
      go(0, "rest");
      go(timings.enter, "compact");
    } else {
      go(0, "compact");
    }
  }
  return steps;
}

/** States to apply at `at` ms: the first at once, each next one a render later. */
export interface Batch {
  at: number;
  states: Displayed[];
}

/**
 * Groups the steps by the time they're due. Steps due at the same time
 * collapse into the last one, except new content swapped in while the pill
 * is closed: it's shown closed first, so the stylesheet can transition it
 * open (otherwise it appears at the circle's width and wraps word by word).
 */
export function batchSteps(current: Displayed, steps: readonly Step[]): Batch[] {
  const batches: Batch[] = [];
  let at = 0;
  let scene = current.scene;
  // The batch's last state brings content that hasn't been shown closed yet
  let unshown = false;
  for (const { delay, scene: nextScene, presence } of steps) {
    at += delay;
    const state: Displayed = { scene: nextScene, presence };
    const swapped = nextScene !== scene;
    scene = nextScene;
    const batch = batches[batches.length - 1];
    if (batch && batch.at === at) {
      if (unshown && isOpen(presence)) {
        batch.states.push(state);
        unshown = false;
      } else {
        batch.states[batch.states.length - 1] = state;
        unshown = (unshown || swapped) && !isOpen(presence);
      }
    } else {
      batches.push({ at, states: [state] });
      unshown = swapped && !isOpen(presence);
    }
  }
  return batches;
}

/** The timings the stylesheet uses for this pill, or its defaults (e.g. when unstyled). */
export function readTimings(element: HTMLElement | null): Timings {
  const style = element ? getComputedStyle(element) : null;
  const read = (name: string, fallback: number) => parseDuration(style?.getPropertyValue(name) ?? "", fallback);
  const reduced = prefersReducedMotion();
  return reduced
    ? { enter: 0, fade: 0, change: 0, exit: 150, reduced }
    : {
        enter: read("--_mp-enter", 500),
        fade: read("--_mp-fade", 150),
        change: read("--_mp-change", 250),
        exit: read("--_mp-exit", 300),
        reduced,
      };
}
