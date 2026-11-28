// Reading the stylesheet's values from script: a custom property's computed
// value keeps its unit ("1.5rem"), and durations come as "500ms" or ".5s".
import { parseDuration } from "../utils/timing";

/** "1.5rem", "24px", "0.875em" → px; anything else → the fallback. */
export function toPixels(value: string, element: HTMLElement, fallback: number): number {
  const match = /^\s*(-?[\d.]+)(px|rem|em)?\s*$/.exec(value);
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  if (match[2] === "rem") return amount * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  if (match[2] === "em") return amount * (Number.parseFloat(getComputedStyle(element).fontSize) || 16);
  return amount;
}

/** A pill's timings, as the stylesheet sets them for it. */
export function durations(element: HTMLElement) {
  const style = getComputedStyle(element);
  return {
    enter: parseDuration(style.getPropertyValue("--_mp-enter"), 500),
    exit: parseDuration(style.getPropertyValue("--_mp-exit"), 300),
    fade: parseDuration(style.getPropertyValue("--_mp-fade"), 150),
    change: parseDuration(style.getPropertyValue("--_mp-change"), 250),
  };
}
