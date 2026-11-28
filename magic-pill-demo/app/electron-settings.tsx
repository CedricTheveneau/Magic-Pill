"use client";
// The Electron's settings (beta), chosen on its docs page and applied to the
// main pill on every page, so that you can try each one anywhere in the
// site. Kept on this device.
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { MagicPillProps } from "magic-pill";

export interface ElectronSettings {
  /** Every motion this many times slower, to look at it closely (the motion tokens, scaled) */
  slowMotion: 1 | 3 | 6 | 12;
  theme: "plain" | "glass" | "liquid";
  labels: "auto" | "current" | "closed";
  electronSide: NonNullable<MagicPillProps["electronSide"]>;
  electronLine: NonNullable<MagicPillProps["electronLine"]>;
  keepElectronsOut: boolean;
  electronEnding: NonNullable<MagicPillProps["electronEnding"]>;
  arrange: NonNullable<MagicPillProps["arrange"]>;
  orbitalsOpenOn: NonNullable<MagicPillProps["orbitalsOpenOn"]>;
  orbitalLabels: boolean;
  orbitalsStayOpen: boolean;
  actionsStyle: NonNullable<MagicPillProps["actionsStyle"]>;
  actionsSide: NonNullable<MagicPillProps["actionsSide"]>;
  actionsOrientation: NonNullable<MagicPillProps["actionsOrientation"]>;
  actionsWheel: boolean;
  nearestToPill: NonNullable<MagicPillProps["nearestToPill"]>;
}

export const ELECTRON_DEFAULTS: ElectronSettings = {
  slowMotion: 1,
  theme: "plain",
  labels: "auto",
  electronSide: "after",
  electronLine: "along",
  keepElectronsOut: false,
  electronEnding: "join",
  arrange: "gather",
  orbitalsOpenOn: "press-hover",
  orbitalLabels: true,
  orbitalsStayOpen: true,
  actionsStyle: "detached",
  actionsSide: "start",
  actionsOrientation: "auto",
  actionsWheel: false,
  nearestToPill: "actions",
};

const KEY = "magic-pill-demo-electron";

// A small store over localStorage: the server (and hydration) gets the
// defaults, the client what this device kept, without a mismatch
let current: ElectronSettings | null = null;
const listeners = new Set<() => void>();
function read(): ElectronSettings {
  if (current) return current;
  try {
    current = { ...ELECTRON_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "null") };
  } catch {
    // A private window, or blocked storage: the defaults
    current = ELECTRON_DEFAULTS;
  }
  return current as ElectronSettings;
}
function write(patch: Partial<ElectronSettings> | null) {
  current = patch === null ? ELECTRON_DEFAULTS : { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Not kept, but applied
  }
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const Context = createContext<{ settings: ElectronSettings; set: (patch: Partial<ElectronSettings> | null) => void }>({
  settings: ELECTRON_DEFAULTS,
  set: () => {},
});

// The library's motion tokens and their defaults, in ms: slowed down together
const MOTION: [token: string, ms: number][] = [
  ["--mp-duration-enter", 500],
  ["--mp-duration-exit", 300],
  ["--mp-duration-change", 250],
  ["--mp-duration-fade", 150],
  ["--mp-duration-split", 500],
  ["--mp-duration-join", 300],
  ["--mp-orbital-stagger", 30],
];

export function ElectronSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(subscribe, read, () => ELECTRON_DEFAULTS);
  // Slow motion: on the whole page, so that every pill (and every satellite) slows down alike
  const slow = settings.slowMotion;
  useEffect(() => {
    const root = document.documentElement.style;
    for (const [token, ms] of MOTION) {
      if (slow === 1) root.removeProperty(token);
      else root.setProperty(token, `${ms * slow}ms`);
    }
  }, [slow]);
  return <Context.Provider value={{ settings, set: write }}>{children}</Context.Provider>;
}

export const useElectronSettings = () => useContext(Context);
