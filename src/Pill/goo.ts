// The goo: a pill splits out of another as a droplet (a neck forms between
// them, stretches and snaps), or joins back into it the other way round.
// Used by a sidebar's flag, and by the Electron and its satellites
// (docs/v9/electron-proposal.md, §7).
//
// The goo only runs while the pills move. At rest every pill is drawn by the
// stylesheet as usual: a goo layer left on melts shapes that sit close
// together and rounds their corners. While they move, an overlay just under
// the pills draws the moving pill's fill and the neck through an SVG filter
// (a blur, then an alpha threshold), with the moving pill's own fill and
// shadow made transparent. The anchor (the pill it comes out of) keeps
// drawing itself: the filter cuts its inside out of the overlay, so its glass,
// rim and shadow never change. The blur rises and falls with the motion, so
// the overlay starts and ends exactly as the pills look at rest.
import { parseDuration, prefersReducedMotion } from "../utils/timing";

/** The id of the moving pill's animations, so that a new split or join can stop the last one. */
export const SPLIT = "mp-split";

/** How sticky the goo is by default: the blur behind the neck, in px (`--mp-goo`). */
const DEFAULT_GOO = 12;

const POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const SMOOTH = "cubic-bezier(0.42, 0, 0.58, 1)";

/**
 * A spring as a CSS `linear()` curve: it overshoots, then settles with a
 * little wobble. The prototype's "bouncy" curve, the default for a split.
 */
export function springEasing(points = 40): string {
  const values: string[] = [];
  for (let index = 0; index <= points; index++) {
    const t = index / points;
    const value = t === 1 ? 1 : 1 - Math.exp(-6 * t) * Math.cos(2 * Math.PI * 1.35 * t);
    values.push(String(Number(value.toFixed(4))));
  }
  return `linear(${values.join(", ")})`;
}

const BOUNCY = springEasing();

/** `--mp-ease-split`: `bouncy` (default), `pop`, `smooth`, or any CSS easing. */
export function splitEasing(token: string): string {
  const value = token.trim();
  if (value === "" || value === "bouncy") return BOUNCY;
  if (value === "pop") return POP;
  if (value === "smooth") return SMOOTH;
  return value;
}

/** How much goo the motion needs at progress `k` (0 to 1): none at the ends, all of it while the neck forms. */
export function gooAmount(k: number): number {
  const step = (from: number, to: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  return step(0, 0.12, k) * (1 - step(0.72, 1, k));
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the moving pill hides: behind the anchor's edge, on its own side. */
export interface Tucked {
  /** Its offset from where it sits, in px */
  x: number;
  y: number;
  /** Its scale there */
  scale: number;
}

/**
 * Where the moving pill is tucked in: centred on the anchor's edge minus half
 * its own size, so that it's hidden behind the anchor's end and comes out of
 * it. It starts at `start` of its size (`--mp-electron-start`, 1 by default),
 * smaller when it wouldn't fit inside the anchor (a flag, wider than the
 * sidebar it comes out of), so that it can hide there. Pure, so it can be tested.
 */
export function tuckedOffset(anchor: Box, moving: Box, start = 1): Tucked {
  const anchorX = anchor.left + anchor.width / 2;
  const anchorY = anchor.top + anchor.height / 2;
  const movingX = moving.left + moving.width / 2;
  const movingY = moving.top + moving.height / 2;
  const dx = movingX - anchorX;
  const dy = movingY - anchorY;
  // Inside the anchor on both axes (a little over is fine: the goo covers it)
  const fits = (size: number, room: number) => size * start <= room * 1.05;
  let scale = start;
  if (!fits(moving.width, anchor.width)) scale = Math.min(scale, anchor.width / moving.width);
  if (!fits(moving.height, anchor.height)) scale = Math.min(scale, anchor.height / moving.height);
  scale = Math.max(0.2, scale);
  const sideways = Math.abs(dx) / (anchor.width / 2 + moving.width / 2) >= Math.abs(dy) / (anchor.height / 2 + moving.height / 2);
  if (sideways) {
    const sign = Math.sign(dx) || 1;
    const edge = anchorX + (sign * anchor.width) / 2;
    return { x: edge - (sign * moving.width * scale) / 2 - movingX, y: 0, scale };
  }
  const sign = Math.sign(dy) || 1;
  const edge = anchorY + (sign * anchor.height) / 2;
  return { x: 0, y: edge - (sign * moving.height * scale) / 2 - movingY, scale };
}

export interface Shadow {
  color: string;
  x: number;
  y: number;
  blur: number;
}

/** The first outer shadow of a computed `box-shadow` (a theme's rim is inset, and skipped). */
export function dropShadow(boxShadow: string): Shadow | null {
  if (!boxShadow || boxShadow === "none") return null;
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of boxShadow) {
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += character;
  }
  parts.push(current.trim());
  for (const part of parts) {
    if (/\binset\b/.test(part)) continue;
    const color = /[a-z-]+\([^)]*\)|#[0-9a-f]{3,8}\b/i.exec(part)?.[0] ?? "rgb(0 0 0 / 0.3)";
    const lengths = part.replace(color, "").match(/-?[\d.]+px/g)?.map((length) => Number.parseFloat(length)) ?? [];
    if (lengths.length < 2) continue;
    return { color, x: lengths[0], y: lengths[1], blur: lengths[2] ?? 0 };
  }
  return null;
}

export interface SplitTiming {
  /** Before it starts moving: a join waits for the pill to close to a circle */
  delay: number;
  duration: number;
}

// The motion running on each moving pill, so that the next one stops it first
const running = new WeakMap<HTMLElement, () => void>();
let overlays = 0;

const SVG = "http://www.w3.org/2000/svg";

/** The overlay: a filter (blur, threshold, the anchor's inside cut out, a fill, a shadow) and two shapes. */
function createOverlay(zIndex: number, color: string, shadow: Shadow | null) {
  const id = `mp-goo-${++overlays}`;
  // Only as big as the two pills, plus room for the blur and the shadow (placed at every frame):
  // a filter over the whole screen, once per orbital, made opening them stutter
  const root = document.createElement("div");
  root.setAttribute("data-mp", "goo");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:${zIndex};`;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const filter = document.createElementNS(SVG, "filter");
  filter.id = id;
  for (const [name, value] of Object.entries({ x: "-50%", y: "-50%", width: "200%", height: "200%", "color-interpolation-filters": "sRGB" })) {
    filter.setAttribute(name, value);
  }
  // The anchor is drawn blue and the moving pill red: blue tells the
  // anchor's inside apart, to cut it out (the anchor draws itself)
  filter.innerHTML = `
    <feGaussianBlur in="SourceAlpha" stdDeviation="0" result="blur"/>
    <feComponentTransfer in="blur" result="goo"><feFuncA type="linear" slope="24" intercept="-12"/></feComponentTransfer>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0" result="anchor"/>
    <feMorphology in="anchor" operator="erode" radius="1" result="inside"/>
    <feComposite in="goo" in2="inside" operator="out" result="cut"/>
    <feFlood result="color"/>
    <feComposite in="color" in2="cut" operator="in" result="fill"/>
    <feGaussianBlur in="cut" stdDeviation="${shadow ? shadow.blur / 2 : 0}" result="spread"/>
    <feOffset in="spread" dx="${shadow?.x ?? 0}" dy="${shadow?.y ?? 0}" result="offset"/>
    <feFlood result="shade"/>
    <feComposite in="shade" in2="offset" operator="in" result="shadow"/>
    <feComposite in="shadow" in2="cut" operator="out" result="outside"/>
    <feMerge><feMergeNode in="outside"/><feMergeNode in="fill"/></feMerge>`;
  const [fill, shade] = filter.querySelectorAll("feFlood");
  // As CSS properties, so that any colour the stylesheet computes works (color(), oklch())
  (fill as SVGElement).style.setProperty("flood-color", color);
  (shade as SVGElement).style.setProperty("flood-color", shadow?.color ?? "transparent");
  svg.append(filter);
  const layer = document.createElement("div");
  layer.style.cssText = `position:absolute;inset:0;filter:url(#${id});`;
  const shape = (marker: string) => {
    const element = document.createElement("div");
    element.style.cssText = `position:absolute;left:0;top:0;background:${marker};`;
    layer.append(element);
    return element;
  };
  const anchor = shape("rgb(0 0 255)");
  const moving = shape("rgb(255 0 0)");
  root.append(svg, layer);
  document.body.append(root);
  return { root, layer, blur: filter.querySelector("feGaussianBlur")!, anchor, moving };
}

/**
 * Puts the overlay around the two pills (with `margin` for the blur and the
 * shadow), and each shape where its pill is, with its rounded corners at its
 * current scale (`radius`: read once, at its full size).
 */
function placeAll(
  overlay: { root: HTMLElement; anchor: HTMLElement; moving: HTMLElement },
  pills: { anchor: HTMLElement; moving: HTMLElement },
  radii: { anchor: number; moving: number },
  margin: number,
) {
  const a = pills.anchor.getBoundingClientRect();
  const m = pills.moving.getBoundingClientRect();
  const left = Math.min(a.left, m.left) - margin;
  const top = Math.min(a.top, m.top) - margin;
  const root = overlay.root.style;
  root.transform = `translate(${left}px, ${top}px)`;
  root.width = `${Math.max(a.right, m.right) + margin - left}px`;
  root.height = `${Math.max(a.bottom, m.bottom) + margin - top}px`;
  const put = (shape: HTMLElement, rect: DOMRect, element: HTMLElement, radius: number) => {
    const scale = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
    shape.style.width = `${rect.width}px`;
    shape.style.height = `${rect.height}px`;
    shape.style.transform = `translate(${rect.left - left}px, ${rect.top - top}px)`;
    shape.style.borderRadius = `${Math.min(radius * scale, rect.width / 2, rect.height / 2)}px`;
  };
  put(overlay.anchor, a, pills.anchor, radii.anchor);
  put(overlay.moving, m, pills.moving, radii.moving);
}

// The moving pill's own look, transparent while the overlay draws it. Its
// transitions go too: a running transition beats even an !important
// declaration, so its fill would take its time to fade out under the overlay
const OWN_LOOK: Record<string, string> = {
  transition: "none",
  "background-color": "transparent",
  "background-image": "none",
  "box-shadow": "none",
};
// A glass pill's blur, which the overlay can't draw: off only while the
// moving pill overlaps the anchor (it would blur the anchor's own content)
const BLUR = ["backdrop-filter", "-webkit-backdrop-filter"];
const GLASS_FADE = 120;

const overlaps = (a: DOMRect, b: DOMRect) =>
  a.left < b.right + 1 && a.right > b.left - 1 && a.top < b.bottom + 1 && a.bottom > b.top - 1;

const readNumber = (style: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

/**
 * Plays a split (the moving pill comes out of the anchor's edge, from where
 * it's tucked in to where it sits) or a join (the other way, after `delay`).
 * Reads `--mp-goo`, `--mp-electron-start` and `--mp-ease-split` on the
 * moving pill. Does nothing with reduced motion. Returns a function that
 * stops it at once.
 */
export function playSplit(anchor: HTMLElement, moving: HTMLElement, kind: "split" | "join", timing: SplitTiming): () => void {
  running.get(moving)?.();
  for (const animation of moving.getAnimations?.({ subtree: true }) ?? []) if (animation.id === SPLIT) animation.cancel();
  if (timing.duration <= 0 || prefersReducedMotion() || typeof moving.animate !== "function") return () => {};

  const style = getComputedStyle(moving);
  const goo = readNumber(style, "--mp-goo", DEFAULT_GOO);
  const start = readNumber(style, "--mp-electron-start", 1);
  const fade = parseDuration(style.getPropertyValue("--_mp-fade"), 150);
  const easing = kind === "split" ? splitEasing(style.getPropertyValue("--mp-ease-split")) : SMOOTH;

  let overlay: ReturnType<typeof createOverlay> | null = null;
  const radii = { anchor: 0, moving: 0 };
  let margin = 0;
  const placeShapes = () => {
    if (overlay) placeAll(overlay, { anchor, moving }, radii, margin);
  };
  // A join starts apart, with its blur; a split starts inside the anchor, without
  let glass = kind === "join";
  const saved = new Map<string, [string, string]>();
  let frame = 0;
  let begun = false;
  let stopped = false;

  const hideOwnLook = () => {
    for (const [name, value] of Object.entries(OWN_LOOK)) {
      if (!saved.has(name)) saved.set(name, [moving.style.getPropertyValue(name), moving.style.getPropertyPriority(name)]);
      moving.style.setProperty(name, value, "important");
    }
  };
  const setGlass = (on: boolean) => {
    if (on === glass) return;
    glass = on;
    if (on) {
      for (const name of BLUR) restore(name);
      moving.animate([{ backdropFilter: "none", offset: 0 }], { id: SPLIT, duration: GLASS_FADE, easing: "ease-out" });
    } else {
      moving.animate([{ backdropFilter: "none", offset: 1 }], { id: SPLIT, duration: GLASS_FADE, easing: "ease-in", fill: "forwards" });
    }
  };
  const restore = (name: string) => {
    const [value, priority] = saved.get(name) ?? ["", ""];
    if (value) moving.style.setProperty(name, value, priority);
    else moving.style.removeProperty(name);
  };
  // Its fill comes back at once (no transition yet), the transitions only once that style is applied
  const restoreOwnLook = () => {
    if (saved.size === 0) return;
    for (const name of saved.keys()) if (name !== "transition") restore(name);
    void getComputedStyle(moving).backgroundColor;
    restore("transition");
    saved.clear();
  };

  // The motion: from where it's tucked in, measured once it's a circle at its spot
  const move = () => {
    const tucked = tuckedOffset(anchor.getBoundingClientRect(), moving.getBoundingClientRect(), start);
    const out = { translate: "0px 0px", scale: "1", transformOrigin: "center" };
    const tuck = { translate: `${tucked.x}px ${tucked.y}px`, scale: String(tucked.scale), transformOrigin: "center" };
    const options: KeyframeAnimationOptions = { id: SPLIT, duration: timing.duration, fill: kind === "split" ? "backwards" : "forwards" };
    try {
      moving.animate(kind === "split" ? [tuck, out] : [out, tuck], { ...options, easing });
    } catch {
      // A browser without linear() curves: the library's own pop
      moving.animate(kind === "split" ? [tuck, out] : [out, tuck], { ...options, easing: POP });
    }
    // Its content (a flag's icon) comes in once it's out, and goes first on the way back:
    // tucked in, it would show over the anchor's own
    const content = [...moving.children].filter(
      (child) => !["panel", "outgoing"].includes(child.getAttribute("data-mp") ?? ""),
    );
    const total = timing.duration + fade;
    for (const child of content) {
      if (kind === "split") {
        child.animate([{ opacity: 0 }, { opacity: 0, offset: (timing.duration * 0.8) / total }, { opacity: 1 }], {
          id: SPLIT,
          duration: total,
        });
      } else {
        child.animate([{ opacity: 1 }, { opacity: 0 }], { id: SPLIT, duration: Math.max(1, fade), fill: "forwards" });
      }
    }
  };

  const begin = () => {
    begun = true;
    move();
    if (goo <= 0) return;
    const zIndex = (Number.parseInt(style.zIndex, 10) || 50) - 1;
    // Its colours as they end up, not as a transition under way has them (a
    // flag coming out still has its hidden colours for a moment)
    saved.set("transition", [moving.style.getPropertyValue("transition"), moving.style.getPropertyPriority("transition")]);
    moving.style.setProperty("transition", "none", "important");
    const own = getComputedStyle(moving);
    const shadow = dropShadow(own.boxShadow);
    overlay = createOverlay(zIndex, own.backgroundColor, shadow);
    radii.anchor = Number.parseFloat(getComputedStyle(anchor).borderTopLeftRadius) || 0;
    radii.moving = Number.parseFloat(own.borderTopLeftRadius) || 0;
    margin = goo * 3 + (shadow ? shadow.blur + Math.max(Math.abs(shadow.x), Math.abs(shadow.y)) : 0) + 8;
    placeShapes();
    hideOwnLook();
    if (kind === "split") {
      for (const name of BLUR) {
        saved.set(name, [moving.style.getPropertyValue(name), moving.style.getPropertyPriority(name)]);
        moving.style.setProperty(name, "none", "important");
      }
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    overlay?.root.remove();
    overlay = null;
    restoreOwnLook();
    running.delete(moving);
  };

  const startedAt = performance.now();
  const draw = (now: number) => {
    if (stopped) return;
    const elapsed = now - startedAt;
    if (!begun && elapsed >= timing.delay) begin();
    if (begun && overlay) {
      const k = Math.min(1, Math.max(0, (elapsed - timing.delay) / timing.duration));
      overlay.blur.setAttribute("stdDeviation", (goo * gooAmount(k)).toFixed(2));
      placeShapes();
      setGlass(!overlaps(moving.getBoundingClientRect(), anchor.getBoundingClientRect()));
    }
    if (elapsed >= timing.delay + timing.duration) {
      stop();
      return;
    }
    frame = requestAnimationFrame(draw);
  };
  if (timing.delay <= 0) begin();
  frame = requestAnimationFrame(draw);
  running.set(moving, stop);
  return stop;
}

/** Where a pill starts (or ends) inside another, from its spot: an offset, and a scale. */
export type Inside = (rect: DOMRect, element: HTMLElement) => { x: number; y: number; scale: number };

export interface BudItem {
  element: HTMLElement;
  delay: number;
  /** How much of it shows at its spot (a wheel's faint ends). Default 1 */
  shown?: number;
  /** Where it's inside the anchor. Default: the anchor's centre, at 0.3 */
  from?: Inside;
  /** It's seen the whole way (the page's actions moving out of the pill): no fade */
  opaque?: boolean;
}

/** Inside the anchor at its nearest edge, as a flag goes into its sidebar (`--mp-electron-start`). */
export const atEdgeOf =
  (anchor: HTMLElement): Inside =>
  (rect, element) =>
    tuckedOffset(anchor.getBoundingClientRect(), rect, readNumber(getComputedStyle(element), "--mp-electron-start", 1));

/** Inside the anchor at a point of the screen (where a pill closing to a circle ends), small. */
export const atPoint =
  (x: number, y: number, scale = 0.3): Inside =>
  (rect) => ({ x: x - (rect.left + rect.width / 2), y: y - (rect.top + rect.height / 2), scale });

// The motion each pill is in, so that the next one stops it first
const budding = new WeakMap<HTMLElement, () => void>();

/**
 * Pills budding out of another (or going back into it), one after the other,
 * as the concept drew an electron's orbitals: from inside it, small and
 * see-through, to their spot. The pills draw themselves the whole time (their
 * glass, rim and shadow stay, no colour switch at the end); one overlay under
 * them draws only the necks between them and the anchor: the goo of the
 * moment, every pill's inside cut out of it. An electron's orbitals, an
 * electron out of its host or out of the one next to it, the page's actions.
 */
export function playOrbit(electron: HTMLElement, items: BudItem[], kind: "open" | "close", timing: { duration: number }): () => void {
  for (const { element } of items) {
    budding.get(element)?.();
    for (const animation of element.getAnimations?.() ?? []) if (animation.id === SPLIT) animation.cancel();
  }
  if (timing.duration <= 0 || prefersReducedMotion() || typeof electron.animate !== "function" || items.length === 0) return () => {};

  const style = getComputedStyle(electron);
  const easing = kind === "open" ? splitEasing(style.getPropertyValue("--mp-ease-split")) : SMOOTH;
  const centre = electron.getBoundingClientRect();
  const cx = centre.left + centre.width / 2;
  const cy = centre.top + centre.height / 2;
  const longest = Math.max(...items.map(({ delay }) => delay)) + timing.duration;

  // Each one from inside the anchor, small and see-through, to its spot (or back)
  for (const { element, delay, shown = 1, from = atPoint(cx, cy), opaque = false } of items) {
    if (shown <= 0) continue;
    const rect = element.getBoundingClientRect();
    const start = from(rect, element);
    const end = getComputedStyle(element).scale;
    type Frame = { translate: string; scale: string; opacity: number; offset?: number };
    const inside: Frame = { translate: `${start.x}px ${start.y}px`, scale: String(start.scale), opacity: opaque ? shown : 0 };
    const out: Frame = { translate: "0px 0px", scale: end === "none" ? "1" : end, opacity: shown };
    // Opaque once out of the electron (and until it's back in): it shows only outside it
    const frames: Frame[] = kind === "open" ? [inside, { ...out, offset: 0.35 }, out] : [out, { ...out, offset: 0.65 }, inside];
    const options: KeyframeAnimationOptions = { id: SPLIT, duration: timing.duration, delay, fill: kind === "open" ? "backwards" : "forwards" };
    // Opacity and position on their own curves: the overshoot is the position's
    const ends = (kind === "open" ? [inside, out] : [out, inside]).map(({ translate, scale }) => ({ translate, scale }));
    try {
      element.animate(ends, { ...options, easing });
    } catch {
      element.animate(ends, { ...options, easing: POP });
    }
    if (!opaque) {
      element.animate(frames.map(({ opacity, offset }) => (offset === undefined ? { opacity } : { opacity, offset })), { ...options, easing: "linear" });
    } else if (kind === "close") {
      // Seen the whole way, and gone as it gets there (what it went into shows it from then on)
      element.animate([{ opacity: shown }, { opacity: shown, offset: 0.85 }, { opacity: 0 }], { ...options, easing: "linear" });
    }
  }
  const stop = playNecks([electron, ...items.filter(({ shown = 1 }) => shown > 0).map(({ element }) => element)], longest);
  const stopAll = () => {
    stop();
    for (const { element } of items) if (budding.get(element) === stopAll) budding.delete(element);
  };
  for (const { element } of items) budding.set(element, stopAll);
  return stopAll;
}

/**
 * The necks between pills, for `duration` ms: the goo of the moment under
 * them, every pill's inside cut out of it, in the first one's colour. The
 * pills draw themselves. Pills sliding past each other (or out of one
 * another) seem to melt together as they meet and part.
 */
export function playNecks(pills: HTMLElement[], duration: number): () => void {
  if (pills.length < 2 || duration <= 0 || prefersReducedMotion() || typeof document === "undefined") return () => {};
  const style = getComputedStyle(pills[0]);
  const goo = readNumber(style, "--mp-goo", DEFAULT_GOO);
  if (goo <= 0) return () => {};
  const longest = duration;

  // The necks: the goo of every pill, with every pill's inside cut out
  const id = `mp-goo-${++overlays}`;
  const root = document.createElement("div");
  root.setAttribute("data-mp", "goo");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:${(Number.parseInt(style.zIndex, 10) || 50) - 1};`;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const filter = document.createElementNS(SVG, "filter");
  filter.id = id;
  for (const [name, value] of Object.entries({ x: "-50%", y: "-50%", width: "200%", height: "200%", "color-interpolation-filters": "sRGB" })) {
    filter.setAttribute(name, value);
  }
  filter.innerHTML = `
    <feGaussianBlur in="SourceAlpha" stdDeviation="0" result="blur"/>
    <feComponentTransfer in="blur" result="goo"><feFuncA type="linear" slope="24" intercept="-12"/></feComponentTransfer>
    <feMorphology in="SourceAlpha" operator="erode" radius="1" result="inside"/>
    <feComposite in="goo" in2="inside" operator="out" result="necks"/>
    <feFlood result="color"/>
    <feComposite in="color" in2="necks" operator="in"/>`;
  (filter.querySelector("feFlood") as SVGElement).style.setProperty("flood-color", style.backgroundColor);
  svg.append(filter);
  const layer = document.createElement("div");
  layer.style.cssText = `position:absolute;inset:0;filter:url(#${id});`;
  const radii = pills.map((pill) => Number.parseFloat(getComputedStyle(pill).borderTopLeftRadius) || 0);
  const shapes = pills.map(() => {
    const shape = document.createElement("div");
    shape.style.cssText = "position:absolute;left:0;top:0;background:#000;";
    layer.append(shape);
    return shape;
  });
  root.append(svg, layer);
  document.body.append(root);
  const blur = filter.querySelector("feGaussianBlur")!;
  const margin = goo * 3 + 8;

  let frame = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    root.remove();
  };
  const startedAt = performance.now();
  const draw = (now: number) => {
    if (stopped) return;
    const elapsed = now - startedAt;
    const rects = pills.map((pill) => pill.getBoundingClientRect());
    const left = Math.min(...rects.map((rect) => rect.left)) - margin;
    const top = Math.min(...rects.map((rect) => rect.top)) - margin;
    root.style.transform = `translate(${left}px, ${top}px)`;
    root.style.width = `${Math.max(...rects.map((rect) => rect.right)) + margin - left}px`;
    root.style.height = `${Math.max(...rects.map((rect) => rect.bottom)) + margin - top}px`;
    rects.forEach((rect, index) => {
      const scale = pills[index].offsetWidth > 0 ? rect.width / pills[index].offsetWidth : 1;
      const shape = shapes[index].style;
      shape.width = `${rect.width}px`;
      shape.height = `${rect.height}px`;
      shape.transform = `translate(${rect.left - left}px, ${rect.top - top}px)`;
      shape.borderRadius = `${Math.min(radii[index] * scale, rect.width / 2, rect.height / 2)}px`;
    });
    blur.setAttribute("stdDeviation", (goo * gooAmount(Math.min(1, elapsed / longest))).toFixed(2));
    if (elapsed >= longest) return stop();
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return stop;
}
