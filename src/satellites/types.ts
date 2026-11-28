// What the host hands to its satellites (magic-pill/satellites): types only,
// so the host costs nothing more for apps that don't use them.
import type { ComponentType, RefObject } from "react";

import type { LinkComponent, PillPlacement, PillTheme, PillVariant } from "../Pill/types";
import type { PillStore } from "../store/store";

/** Where electrons go: further along the edge, before the pill, or one row towards the page. */
export type ElectronSide = "after" | "before" | "beside";
/** Several electrons line up along the pill, or stack across it. */
export type ElectronLine = "along" | "across";
/** The satellites gathered around the pill, or spread to the screen's edges. */
export type SatelliteArrangement = "gather" | "spread";
export type ElectronEnding = "join" | "pop";
/** What opens an electron's orbitals: a long press or hovering it with a mouse, a long press only, or a tap. */
export type OrbitalsOpenOn = "press-hover" | "press" | "tap";

/** The host, as its satellites see it. */
export interface SatelliteHost {
  name: string;
  store: PillStore;
  rootRef: RefObject<HTMLElement | null>;
  placement: PillPlacement;
  vertical: boolean;
  pathname?: string;
  /** A notification has the pill, or it's on its way to or from one (the electrons tuck in, unless kept out) */
  notifying: boolean;
  linkComponent?: LinkComponent;
  variant?: PillVariant;
  theme?: PillTheme;
  electronSide: ElectronSide;
  electronLine: ElectronLine;
  keepElectronsOut: boolean;
  electronEnding: ElectronEnding;
  arrange: SatelliteArrangement;
  orbitalsOpenOn: OrbitalsOpenOn;
  orbitalLabels: boolean;
  orbitalsStayOpen: boolean;
}

/** `satellites` from `magic-pill/satellites`, passed to `<MagicPill satellites={satellites}>`. */
export interface PillSatellites {
  Layer: ComponentType<{ host: SatelliteHost }>;
}
