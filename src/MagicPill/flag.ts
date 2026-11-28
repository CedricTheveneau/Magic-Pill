// A sidebar's flag (notificationLayout="flag"): a notification in a pill of
// its own, beside the sidebar, which stays. Where it goes. No React here, no
// state. It comes out of the sidebar's edge and goes back into it with the
// goo, like the Electron (Pill/goo.ts).
import { findActiveIndex } from "../PillNavbar/matchPath";

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
