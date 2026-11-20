// Durations the stylesheet hands to JavaScript through its private custom properties.

/** "500ms" or "0.5s" → 500 (minified CSS writes 150ms as .15s); anything else → the fallback. */
export function parseDuration(value: string, fallback: number): number {
  const match = /^\s*([\d.]+)(ms|s)\s*$/.exec(value);
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}

/** The user asked the system for less motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
