"use client"
// magic-pill/satellites (beta): the Electron (electrons and their orbitals)
// and the page's actions. Optional: pass `satellites` to the host, and apps that don't
// pay nothing for them.
//
//   import { satellites } from "magic-pill/satellites";
//   <MagicPill pathname={pathname} satellites={satellites}>…</MagicPill>
import { InsideActions } from "./Actions";
import { SatellitesLayer } from "./Satellites";
import type { PillSatellites } from "./types";

export const satellites: PillSatellites = { Layer: SatellitesLayer, Inside: InsideActions };
export { usePillActions } from "./Actions";

export type {
  ActionsOrientation,
  ActionsSide,
  ActionsStyle,
  ElectronEnding,
  ElectronLine,
  ElectronSide,
  NearestToPill,
  OrbitalsOpenOn,
  PillSatellites,
  SatelliteArrangement,
} from "./types";
export type { ElectronOptions, Electron, Orbital, PillActionItem } from "../store/store";
