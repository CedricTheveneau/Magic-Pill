import { version, type Ref, type RefCallback } from "react";

// Bundlers replace `process.env.NODE_ENV`; the typeof guard covers the rest.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/** Warn in development builds only. */
export function devWarn(message: string): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[magic-pill] ${message}`);
  }
}

// React 19 knows `inert` as a boolean attribute. React 18 doesn't: it drops
// `true` with a warning, so it needs an empty string, which React 19 treats as false.
const INERT_VALUE = Number.parseInt(version, 10) >= 19 ? true : "";

/** Spread on an element to make it inert (unfocusable, hidden from assistive technology). */
export function inertProps(inert: boolean): { inert?: boolean } {
  return inert ? ({ inert: INERT_VALUE } as { inert: boolean }) : {};
}

/** Combine refs (React 18 compatible: no ref cleanup functions). */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }
  };
}
