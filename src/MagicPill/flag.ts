// A sidebar's flag (notificationLayout="flag"): a notification in a pill of
// its own, beside the sidebar, which stays. Where it goes, and the bridge
// between the two while they part or join. No React here, no state.
//
// The motion is the prototype's, and will follow the Electron's split and
// join once they're designed (docs/v9/sidebar-notifications-proposal.md, §6).
import { findActiveIndex } from "../PillNavbar/matchPath";
import { prefersReducedMotion } from "../utils/timing";

/** Where the flag goes: past the sidebar, and level with its section. */
export interface FlagSpot {
  /** From the screen edge's offset to the flag: the sidebar's width (and its own shift) */
  shift: number;
  /** The centre of the navbar item it's about, in the viewport; none: the middle */
  y?: number;
}

/** Measures the sidebar, and the navbar item whose `href` matches `at`, if any. */
export function measureFlagSpot(sidebar: HTMLElement, at: string | undefined): FlagSpot {
  const ownShift = Number.parseFloat(getComputedStyle(sidebar).getPropertyValue("--_mp-shift-x")) || 0;
  const spot: FlagSpot = { shift: sidebar.offsetWidth + ownShift };
  if (at === undefined) return spot;
  const links = [...sidebar.querySelectorAll<HTMLElement>('[data-mp="navbar"] [data-href]')];
  const index = findActiveIndex(
    at,
    links.map((link) => ({ href: link.dataset.href ?? "" })),
  );
  if (index >= 0) {
    const { top, height } = links[index].getBoundingClientRect();
    spot.y = top + height / 2;
  }
  return spot;
}

/**
 * The flag's style: past the sidebar by a short gap, and centred on its
 * section's item if it has one (between two edges as far from it on either
 * side, inside the screen's offset), in the middle otherwise, like the
 * sidebar. An open panel goes in the middle (`y` left out): it may be too
 * tall to centre on an item near an edge.
 */
export function flagStyle({ shift, y }: FlagSpot): Record<string, string> {
  const style: Record<string, string> = { "--_mp-shift-x": `calc(${shift}px + var(--_mp-gap) * 0.75)` };
  if (y !== undefined) {
    const half = `max(0px, min(${y}px - var(--_mp-offset), 100dvh - var(--_mp-offset) - ${y}px))`;
    style.insetBlockStart = `calc(${y}px - ${half})`;
    style.insetBlockEnd = `calc(100dvh - ${y}px - ${half})`;
  }
  return style;
}

/**
 * The bridge between the sidebar and its flag: it stretches out of the
 * sidebar as the flag pops out of it, then thins away as they part
 * (`split`), or the other way round as the flag goes back (`join`).
 */
export function playBridge(
  sidebar: HTMLElement,
  flag: HTMLElement,
  y: number | undefined,
  kind: "split" | "join",
  timing: { delay: number; duration: number },
) {
  if (timing.duration <= 0 || prefersReducedMotion() || typeof document.body.animate !== "function") return;
  const rect = sidebar.getBoundingClientRect();
  const flagStyles = getComputedStyle(flag);
  const gap = (Number.parseFloat(flagStyles.columnGap) || 16) * 0.75;
  const onRight = flag.dataset.placement === "right";
  const overlap = 8;
  const thickness = 22;
  const centre = y ?? rect.top + rect.height / 2;
  const bridge = document.createElement("div");
  bridge.setAttribute("data-mp", "flag-bridge");
  bridge.setAttribute("aria-hidden", "true");
  const from = getComputedStyle(sidebar).backgroundColor;
  const to = flagStyles.backgroundColor;
  bridge.style.cssText = [
    "position:fixed",
    "pointer-events:none",
    `z-index:${(Number.parseInt(flagStyles.zIndex, 10) || 50) - 1}`,
    `top:${centre - thickness / 2}px`,
    `left:${onRight ? rect.left - gap - overlap : rect.right - overlap}px`,
    `width:${gap + overlap * 2}px`,
    `height:${thickness}px`,
    `border-radius:${thickness / 2}px`,
    `background:linear-gradient(to ${onRight ? "left" : "right"}, ${from}, ${to})`,
    `transform-origin:${onRight ? "right" : "left"} center`,
    "transform:scaleX(0)",
  ].join(";");
  document.body.append(bridge);
  const out: Keyframe[] = [
    { transform: "scaleX(0)" },
    { transform: "scaleX(1)", offset: 0.35 },
    { transform: "scaleX(1) scaleY(0.35)", offset: 0.7 },
    { transform: "scaleX(1) scaleY(0)" },
  ];
  const remove = () => bridge.remove();
  bridge
    .animate(kind === "split" ? out : [...out].reverse().map((frame, index, all) => ({ ...frame, offset: index / (all.length - 1) })), {
      delay: timing.delay,
      duration: timing.duration,
      easing: "ease-out",
      fill: "both",
    })
    .finished.then(remove, remove);
}
