"use client"
// The pill's size animation. A pill's size follows its content, and CSS
// transitions don't run on content-driven size changes (a message wrapping to
// three lines, a panel opening): the pill would jump. So when the presence
// changes, the pill is animated from the size it had on screen to its new
// natural size, with its real width and height (never a scale(), which would
// distort the corners). The corners follow by themselves: the stylesheet gives
// the pill a fixed radius, and the browser shrinks it to half the height while
// the pill is smaller than that.
import { Component, useLayoutEffect, useRef, type RefObject } from "react";

import type { PillPresence } from "./types";
import { parseDuration, prefersReducedMotion } from "../utils/timing";

export interface Size {
  width: number;
  height: number;
}

export interface MorphTimings {
  /** The content fading out before the pill shrinks */
  fade: number;
  /** The size change itself */
  change: number;
}

/** Where a panel sits in the pill, to reveal its content as the pill grows. */
export interface PanelBox {
  /** From the pill's top edge to the panel's */
  top: number;
  /** The panel's width once open (kept during the animation, so it doesn't reflow) */
  width: number;
  /** Right-to-left: the clipped side is the left one */
  rtl: boolean;
}

export interface MorphPlan {
  pill: Keyframe[];
  panel?: Keyframe[];
  options: KeyframeAnimationOptions;
  /** The pill's other content, back from behind a closing panel: hidden until the pill has shrunk */
  content?: { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
}

const CLOSED: ReadonlySet<PillPresence> = new Set(["rest", "hidden"]);
/** Tags this module's animations, so a size change can stop the one before it. */
export const MORPH = "mp-morph";
/** The length of the fading edge over the panel's clipped content. */
const EDGE = 48;
export const EASING = "ease-in-out";

/** Rounded up: a hair narrower, and a message that just fits would wrap. */
const px = (value: number) => `${Math.max(0, Math.ceil(value * 100) / 100)}px`;
/**
 * The pill at a size. Nothing in the stylesheet may cap it meanwhile (the
 * circle clamps both axes, a panel scrolls past a maximum height).
 */
const sized = (size: Size): Keyframe => ({
  minWidth: "0px",
  minHeight: "0px",
  maxWidth: "none",
  maxHeight: "none",
  overflow: "hidden",
  width: px(size.width),
  height: px(size.height),
});
/**
 * A part held at its final width while the pill resizes, so a message doesn't
 * rewrap at every frame.
 */
const held = (width: number): Keyframe => ({ flexShrink: 0, width: px(width) });

/**
 * Measures the pill's messages now (at their final width: before the pill's
 * own animation starts), to hold them there during an animation.
 */
function holdMessages(element: HTMLElement): (options: KeyframeAnimationOptions) => Animation[] {
  const messages = [...element.querySelectorAll<HTMLElement>(':scope > [data-mp="message"]')].map(
    (message) => [message, held(message.getBoundingClientRect().width)] as const,
  );
  return (options) => messages.map(([message, frame]) => message.animate([frame, frame], options));
}
const sameSize = (a: Size, b: Size) => Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;

/**
 * The panel's content, cut by the pill's edges while it grows or shrinks: a
 * mask that shows what's inside the pill, and fades it out along the bottom
 * and the inline-end edges instead of cutting it (the corner stays hidden).
 */
function revealMask(panel: PanelBox, size: Size, edges: number): Keyframe {
  const visibleHeight = Math.max(0, size.height - panel.top);
  const visibleWidth = Math.min(panel.width, size.width);
  const fadeY = Math.min(edges, visibleHeight);
  const fadeX = visibleWidth < panel.width ? Math.min(edges, visibleWidth) : 0;
  const solidW = visibleWidth - fadeX;
  const solidH = visibleHeight - fadeY;
  // Physical positions: the solid block and the bottom fade start on the
  // inline-start side, the side fade sits on the inline-end one
  const startX = panel.rtl ? panel.width - visibleWidth : 0;
  const solidX = panel.rtl ? startX + fadeX : startX;
  const sideX = panel.rtl ? startX : startX + solidW;
  return {
    width: px(panel.width),
    maskImage: `linear-gradient(#000,#000),linear-gradient(to top,transparent,#000),linear-gradient(to ${panel.rtl ? "right" : "left"},transparent,#000)`,
    maskRepeat: "no-repeat",
    maskSize: `${px(solidW)} ${px(solidH)},${px(solidW)} ${px(fadeY)},${px(fadeX)} ${px(solidH)}`,
    maskPosition: `${px(solidX)} 0px,${px(solidX)} ${px(solidH)},${px(sideX)} 0px`,
  };
}

/**
 * How the pill goes from `from` (on screen) to `to` (its new natural size),
 * or null when there's nothing to animate. Pure, so it can be tested.
 */
export function planMorph(
  from: Size,
  to: Size,
  previous: PillPresence,
  next: PillPresence,
  timings: MorphTimings,
  panel?: PanelBox,
): MorphPlan | null {
  if (timings.change <= 0 || sameSize(from, to)) return null;
  // Closing to the circle: the content fades out first, then the pill shrinks
  const delay = CLOSED.has(next) && !CLOSED.has(previous) ? timings.fade : 0;
  const plan: MorphPlan = {
    pill: [sized(from), sized(to)],
    options: { duration: timings.change, delay, easing: EASING, fill: "backwards" },
  };
  // A panel opening (or closing): its content shows as the pill grows (or
  // hides as it shrinks), behind an edge that fades out as it settles
  const opening = next === "panel" && previous !== "panel";
  const closing = previous === "panel" && next !== "panel";
  if (panel && (opening || closing)) {
    plan.panel = opening
      ? [revealMask(panel, from, EDGE), revealMask(panel, to, 0)]
      : [revealMask(panel, from, 0), revealMask(panel, to, EDGE)];
  }
  // Back to the pill's own content (not when it closes altogether)
  if (closing && !CLOSED.has(next)) {
    const total = timings.change + timings.fade;
    plan.content = {
      keyframes: [{ opacity: 0 }, { opacity: 0, offset: timings.change / total }, { opacity: 1 }],
      options: { duration: total, easing: "ease-out" },
    };
  }
  return plan;
}

const readSize = (element: HTMLElement): Size => ({ width: element.offsetWidth, height: element.offsetHeight });

/** Stops the pill's animations with this id (and the ones in it). Returns whether anything ran. */
export function cancel(element: HTMLElement, id: string, subtree?: boolean): boolean {
  let cancelled = false;
  for (const animation of element.getAnimations?.({ subtree }) ?? []) {
    if (animation.id === id) {
      animation.cancel();
      cancelled = true;
    }
  }
  return cancelled;
}

/**
 * Stops the size animations running on the pill (and in it), and drops the
 * copy of the content a swap slides out (but `keep`). Returns whether anything ran.
 */
function stopMorphs(element: HTMLElement, keep?: Element): boolean {
  let stopped = cancel(element, MORPH, true);
  for (const outgoing of element.querySelectorAll(':scope > [data-mp="outgoing"]')) {
    if (outgoing !== keep) {
      outgoing.remove();
      stopped = true;
    }
  }
  return stopped;
}

/**
 * The size to the fraction of a pixel (offsetWidth rounds it): the copy of a
 * message that just fits would wrap otherwise. An open pill isn't scaled.
 */
const readExactSize = (element: HTMLElement): Size => {
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
};

/** Where the content sits along the pill's inline axis while it resizes: the side that stays put. */
export type SwapAnchor = "start" | "center" | "end";

export interface SwapPlan {
  pill: { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
  outgoing: { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
  /** For each incoming child, from its natural (final) width */
  incoming: (width: number) => { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
}

/**
 * One content replacing another in an open pill, in one overlapping movement
 * (the "rubik's cube"): the old content slides out through the top, the pill
 * resizes, the new content comes in from the bottom (`down`: the other way
 * round, for a pill at the top of the screen). A row's content lines up on
 * the anchor side (`undefined`: a column, left alone). Pure, so it can be tested.
 */
export function planSwap(
  from: Size,
  to: Size,
  timings: MorphTimings,
  anchor?: SwapAnchor,
  down = false,
): SwapPlan | null {
  const total = timings.fade + timings.change;
  if (total <= 0) return null;
  const out = down ? "" : "-";
  const into = down ? "-" : "";
  const justify = anchor && { justifyContent: anchor === "center" ? anchor : `flex-${anchor}` };
  // Each content travels its own height; the new one is held at its final width
  return {
    pill: {
      keyframes: [{ ...sized(from), ...justify }, { ...sized(to), ...justify }],
      options: { id: MORPH, duration: total * 0.6, delay: total * 0.15, easing: EASING, fill: "backwards" },
    },
    outgoing: {
      keyframes: [{}, { transform: `translateY(${out}${px(from.height)})`, opacity: 0 }],
      options: { id: MORPH, duration: total * 0.45, easing: "ease-in", fill: "forwards" },
    },
    incoming: (width) => ({
      keyframes: [
        { ...held(width), transform: `translateY(${into}${px(to.height)})`, opacity: 0 },
        { ...held(width), transform: "none", opacity: 1 },
      ],
      options: { id: MORPH, duration: total * 0.65, delay: total * 0.35, easing: "ease-out", fill: "backwards" },
    }),
  };
}

/** The content a swap slides out, the pill's size when it left, the side that stays put, and the way it goes. */
export interface SwapCapture {
  from: Size;
  outgoing: HTMLElement;
  anchor?: SwapAnchor;
  down: boolean;
}

const CONTROLS = "input, textarea, select";

/** What was typed or chosen: a copied control starts from its default value. */
function copyValues(from: HTMLElement, to: HTMLElement) {
  const copies = to.querySelectorAll<HTMLInputElement>(CONTROLS);
  const originals = [...from.querySelectorAll<HTMLInputElement>(CONTROLS)].filter(
    (control) => !to.contains(control) && !control.closest('[data-mp="outgoing"]'),
  );
  originals.forEach((control, index) => {
    const copy = copies[index];
    if (!copy || control.type === "file") return;
    if (control.type === "checkbox" || control.type === "radio") copy.checked = control.checked;
    else copy.value = control.value;
  });
}

/**
 * Before new content replaces the pill's: a still copy of what's on screen,
 * laid over it, to slide out once the new content is in. Null when there's
 * nothing to animate (unstyled, reduced motion, no Web Animations API).
 */
export function captureSwap(element: HTMLElement | null): SwapCapture | null {
  if (!element || element.hasAttribute("data-unstyled") || !element.animate || prefersReducedMotion()) return null;
  const from = readExactSize(element);
  const outgoing = document.createElement("div");
  for (const child of element.children) {
    if (child.getAttribute("data-mp") !== "outgoing") outgoing.append(child.cloneNode(true));
  }
  stopMorphs(element);
  copyValues(element, outgoing);
  // For the eyes only: no ids or radio groups shared with the real content
  for (const node of outgoing.querySelectorAll("[id], [name]")) {
    node.removeAttribute("id");
    node.removeAttribute("name");
  }
  outgoing.setAttribute("data-mp", "outgoing");
  outgoing.setAttribute("aria-hidden", "true");
  outgoing.setAttribute("inert", "");
  // A row stays put on the side its placement pins; a column, where its items line up
  const style = getComputedStyle(element);
  const row = style.flexDirection.startsWith("row");
  const placement = element.dataset.placement ?? "";
  const side = row ? placement.replace("inline", "-start") : style.alignItems;
  const anchor: SwapAnchor = /start$/.test(side) ? "start" : /end$/.test(side) ? "end" : "center";
  // Laid out like the pill, at the size it had, on that side
  outgoing.style.cssText = `position:absolute;inset-block:0;margin-block:auto;${
    anchor === "center" ? "inset-inline:0;margin-inline:auto" : `inset-inline-${anchor}:0`
  };box-sizing:border-box;width:${held(from.width).width};height:${px(from.height)};display:flex;flex-direction:inherit;align-items:inherit;justify-content:inherit;gap:inherit;padding:inherit;pointer-events:none`;
  element.append(outgoing);
  // A pill at the top of the screen turns the other way: out through its bottom edge, in from the top
  return { from, outgoing, anchor: row ? anchor : undefined, down: placement.startsWith("top") };
}

/** Once the new content is in: the swap prepared by `captureSwap`, played. */
export function playSwap(element: HTMLElement, { from, outgoing, anchor, down }: SwapCapture) {
  // Its natural size, free of an animation still running (e.g. the pill growing)
  stopMorphs(element, outgoing);
  const plan = planSwap(from, readExactSize(element), readMorphTimings(element), anchor, down);
  const done = () => outgoing.remove();
  if (!plan) return done();
  const incoming = [...element.children].filter((child) => child !== outgoing);
  const widths = incoming.map((child) => child.getBoundingClientRect().width);
  element.animate(plan.pill.keyframes, plan.pill.options);
  incoming.forEach((child, index) => {
    const { keyframes, options } = plan.incoming(widths[index]);
    child.animate(keyframes, options);
  });
  outgoing.animate(plan.outgoing.keyframes, plan.outgoing.options).finished.then(done, done);
}

export function readMorphTimings(element: HTMLElement): MorphTimings {
  const style = getComputedStyle(element);
  return {
    fade: parseDuration(style.getPropertyValue("--_mp-fade"), 150),
    change: parseDuration(style.getPropertyValue("--_mp-change"), 250),
  };
}

function readPanel(pill: HTMLElement): { element: HTMLElement; box: PanelBox } | undefined {
  // The open one, or the one closing: it's still displayed while it fades
  const shown = [...pill.querySelectorAll<HTMLElement>(':scope > [data-mp="panel"]')].filter(
    (panel) => getComputedStyle(panel).display !== "none",
  );
  const element = shown.find((panel) => panel.hasAttribute("data-open")) ?? shown[0];
  if (!element) return undefined;
  const pillRect = pill.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    element,
    box: { top: rect.top - pillRect.top, width: rect.width, rtl: getComputedStyle(pill).direction === "rtl" },
  };
}

/**
 * Animates the pill's size on each presence change. Off for `unstyled` pills,
 * with reduced motion, and where the Web Animations API is missing.
 */
export function useSizeMorph(
  rootRef: RefObject<HTMLElement | null>,
  presence: PillPresence,
  enabled: boolean,
  /** The size on screen, kept up to date between changes */
  lastSize: RefObject<Size | null>,
) {
  const lastPresence = useRef(presence);
  const running = useRef<Animation[]>([]);
  // The open panel's box: once it closes, it's out of the flow and can't be measured as it was
  const openPanel = useRef<PanelBox | undefined>(undefined);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      // To the fraction of a pixel: rounded down, a closing pill would wrap
      // the message it still shows (not in vertical writing, whose box is turned)
      const size = readSize(element);
      const box = entries?.[0]?.borderBoxSize?.[0];
      const exact = box && { width: box.inlineSize, height: box.blockSize };
      lastSize.current = exact && sameSize(exact, size) ? exact : size;
      if (lastPresence.current === "panel" && running.current.length === 0) openPanel.current = readPanel(element)?.box;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      running.current.forEach((animation) => animation.cancel());
    };
  }, [rootRef, lastSize]);

  useLayoutEffect(() => {
    const element = rootRef.current;
    const previous = lastPresence.current;
    lastPresence.current = presence;
    if (!element || previous === presence) return;
    if (!enabled || typeof element.animate !== "function" || prefersReducedMotion()) {
      running.current.forEach((animation) => animation.cancel());
      running.current = [];
      return;
    }

    // Interrupted mid-way (by this or a swap): start again from where it is now
    const current = readSize(element);
    const interrupted = stopMorphs(element) || running.current.length > 0;
    const from = interrupted ? current : lastSize.current;
    running.current.forEach((animation) => animation.cancel());
    running.current = [];
    const to = readSize(element);
    lastSize.current = to;
    if (!from) return;

    const panel = readPanel(element);
    if (presence === "panel") openPanel.current = panel?.box;
    const panelBox = previous === "panel" ? openPanel.current : panel?.box;
    const plan = planMorph(from, to, previous, presence, readMorphTimings(element), panelBox);
    if (!plan) return;
    const hold = holdMessages(element);
    const options = { ...plan.options, id: MORPH };
    const animations = [element.animate(plan.pill, options)];
    if (plan.panel && panel) {
      animations.push(panel.element.animate(plan.panel, options));
      // The close button sticks to the bottom of a scrolling panel: while the
      // pill resizes, it stays with the content instead of riding the edge
      const footer = panel.element.querySelector<HTMLElement>('[data-mp="panel-footer"]');
      if (footer) animations.push(footer.animate([{ position: "relative" }, { position: "relative" }], options));
    }
    // Growing into an open pill: its message is laid out at its final width
    // from the start (the pill clips it), instead of wrapping on many lines
    // in the narrow pill and unwrapping just as it fades in
    if (!CLOSED.has(presence) && presence !== "panel") animations.push(...hold(options));
    if (plan.content) {
      const { keyframes, options } = plan.content;
      for (const child of element.children) {
        if (child !== panel?.element) animations.push(child.animate(keyframes, { ...options, id: MORPH }));
      }
    }
    running.current = animations;
    void animations[0].finished
      .then(() => {
        if (running.current === animations) running.current = [];
      })
      .catch(() => {
        // Cancelled by the next change
      });
  }, [rootRef, presence, enabled, lastSize]);
}

/** Tags the placement animation, which runs alongside the size ones. */
const MOVE = "mp-move";

/**
 * The pill moved to another placement (or orientation): it travels there
 * from where it was (`from`), resizing on the way if its size changed.
 */
export function animateMove(element: HTMLElement, from: DOMRect) {
  if (!from.width || element.hasAttribute("data-unstyled") || !element.animate || prefersReducedMotion()) return;
  cancel(element, MOVE);
  const to = readExactSize(element);
  const resized = !sameSize(from, to);
  const hold = holdMessages(element);
  // Where its new placement puts it at its former size: the move starts there
  const style = element.style.cssText;
  if (resized) Object.assign(element.style, sized(from));
  const start = element.getBoundingClientRect();
  element.style.cssText = style;
  const shift = `${from.left - start.left}px ${from.top - start.top}px`;
  const { fade, change } = readMorphTimings(element);
  const options: KeyframeAnimationOptions = { id: MOVE, duration: fade + change, easing: EASING };
  element.animate(
    [
      { translate: shift, ...(resized && sized(from)) },
      { translate: "0px 0px", ...(resized && sized(to)) },
    ],
    options,
  );
  if (resized) hold(options);
}

/**
 * Remembers where the pill is just before its placement changes (React calls
 * this before it updates the page), then moves it from there.
 */
export class PlacementWatch extends Component<{ placement: string; target: RefObject<HTMLElement | null> }> {
  getSnapshotBeforeUpdate(previous: Readonly<{ placement: string }>): DOMRect | null {
    return previous.placement !== this.props.placement ? (this.props.target.current?.getBoundingClientRect() ?? null) : null;
  }

  componentDidUpdate(_props: unknown, _state: unknown, from: DOMRect | null) {
    const element = this.props.target.current;
    if (from && element) animateMove(element, from);
  }

  render() {
    return null;
  }
}
