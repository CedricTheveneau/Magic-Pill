"use client";
// The Electron's settings (beta), chosen on its docs page and applied to the
// main pill on every page, so that you can try each one anywhere in the
// site. Kept on this device.
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { MagicPillProps } from "magic-pill";

export interface ElectronSettings {
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
}

export const ELECTRON_DEFAULTS: ElectronSettings = {
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

export function ElectronSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(subscribe, read, () => ELECTRON_DEFAULTS);
  return <Context.Provider value={{ settings, set: write }}>{children}</Context.Provider>;
}

export const useElectronSettings = () => useContext(Context);
