"use client"
// magic-pill/satellites (beta): the Electron, and later its orbitals and the
// page's actions. Optional: pass `satellites` to the host, and apps that don't
// pay nothing for them.
//
//   import { satellites } from "magic-pill/satellites";
//   <MagicPill pathname={pathname} satellites={satellites}>…</MagicPill>
import { SatellitesLayer } from "./Satellites";
import type { PillSatellites } from "./types";

export const satellites: PillSatellites = { Layer: SatellitesLayer };

export type {
  ElectronEnding,
  ElectronLine,
  ElectronSide,
  PillSatellites,
  SatelliteArrangement,
} from "./types";
export type { ElectronOptions, Electron } from "../store/store";
