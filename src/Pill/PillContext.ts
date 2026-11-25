"use client"
import { createContext, useContext } from "react";

import type { PillContextValue } from "./types";

/** What the parts need on top of the public value. */
export interface InternalPillContextValue extends PillContextValue {
  /** The name of the panel that is open, or was last. */
  panel: string | undefined;
  /** A panel's id, from its name. */
  panelIdOf: (name?: string) => string;
  /** The trigger that opened the panel, to give focus back to on close. */
  panelTriggerRef: { current: HTMLElement | null };
  rootRef: { current: HTMLElement | null };
}

export const PillContext = createContext<InternalPillContextValue | null>(null);

export function useInternalPill(component: string): InternalPillContextValue {
  const context = useContext(PillContext);
  if (!context) {
    throw new Error(`[magic-pill] ${component} must be rendered inside a <Pill>.`);
  }
  return context;
}

/** Read and drive the enclosing <Pill>: what you need to write your own template. */
export function usePill(): PillContextValue {
  const { presence, setPresence, openPanel, closePanel, placement, orientation, variant } =
    useInternalPill("usePill()");
  return { presence, setPresence, openPanel, closePanel, placement, orientation, variant };
}
