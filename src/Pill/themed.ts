"use client"
// The themed pills on the page, for <PillOptics> to find. Plain pills aren't in it.
import { useEffect, type RefObject } from "react";

import type { PillPresence, PillTheme } from "./types";

const pills = new Set<HTMLElement>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const themedPills: ReadonlySet<HTMLElement> = pills;

/** Called when a themed pill comes, goes, or changes theme or level. Returns the unsubscribe. */
export function onThemedPills(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Lists the pill while it has a theme. `isOverlay`: its element is another one. */
export function useThemed(
  rootRef: RefObject<HTMLElement | null>,
  theme: PillTheme | undefined,
  presence: PillPresence,
  isOverlay: boolean,
) {
  useEffect(() => {
    const element = rootRef.current;
    if (!element || theme === undefined || theme === "plain") return;
    pills.add(element);
    notify();
    return () => {
      pills.delete(element);
      notify();
    };
  }, [rootRef, theme, presence, isOverlay]);
}
