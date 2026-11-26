"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { MagicPillProps } from "magic-pill";

/**
 * What an example of the docs puts in the main pill when you try it: its own
 * content instead of the navbar (or none, to keep the navbar), and the host's
 * props it needs (a theme, a placement, a variant…).
 */
export interface Stage {
  /** Unique per example: the pill's scene, and how a card knows it's the one on stage. */
  id: string;
  /** Takes the navbar’s place (`null`: nothing in its place). Without it, the navbar stays, with the props below. */
  content?: ReactNode;
  /** Props for the main <MagicPill>, e.g. `{ theme: "glass" }` or `{ placement: "top" }`. */
  pill?: Omit<MagicPillProps, "name" | "children">;
}

interface StageContextValue {
  stage: Stage | null;
  setStage: (stage: Stage | null) => void;
}

const StageContext = createContext<StageContextValue>({ stage: null, setStage: () => {} });

/** Holds what's on the main pill's stage. A new page brings the navbar back. */
export function StageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The stage belongs to the page that set it: on any other page, the navbar is back
  const [entry, setEntry] = useState<{ stage: Stage; pathname: string } | null>(null);
  const stage = entry && entry.pathname === pathname ? entry.stage : null;

  const setStage = useCallback((next: Stage | null) => setEntry(next ? { stage: next, pathname } : null), [pathname]);
  const value = useMemo(() => ({ stage, setStage }), [stage, setStage]);
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export const useStage = () => useContext(StageContext);
