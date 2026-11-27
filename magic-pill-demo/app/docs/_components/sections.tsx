import type { ReactNode } from "react";

import {
  BellIcon,
  CalendarIcon,
  CapsuleIcon,
  CompassIcon,
  DropIcon,
  FormIcon,
  LayersIcon,
  ModalIcon,
  PaletteIcon,
  PanelIcon,
  PillsIcon,
  ShapesIcon,
  SparkIcon,
} from "../../icons";

export interface Section {
  href: string;
  label: string;
  icon: ReactNode;
  /** One line, for the overview and the links between pages. */
  summary: string;
}

/** The docs' pages, in the README's order: the left pill's navbar and the links between pages. */
export const SECTIONS: readonly Section[] = [
  { href: "/docs/", label: "Getting started", icon: <SparkIcon />, summary: "Install it, mount the pill, send a first notification." },
  { href: "/docs/notifications/", label: "Notifications", icon: <BellIcon />, summary: "Messages, actions, panels, the queue and the controller." },
  { href: "/docs/host/", label: "The host", icon: <LayersIcon />, summary: "<MagicPill>: the base layer, resting, swapping and scenes." },
  { href: "/docs/navbar/", label: "Navbar", icon: <CompassIcon />, summary: "Links, actions and panels, with any router." },
  { href: "/docs/pill/", label: "The pill", icon: <CapsuleIcon />, summary: "The primitive: presence, placements, parts and scenes." },
  { href: "/docs/panels/", label: "Panels", icon: <PanelIcon />, summary: "Grow the pill into a panel, one or several." },
  { href: "/docs/modal/", label: "Modal", icon: <ModalIcon />, summary: "A native modal <dialog>, and what's behind it." },
  { href: "/docs/several-pills/", label: "Several pills", icon: <PillsIcon />, summary: "Named hosts, and pills that share a spot." },
  { href: "/docs/forms/", label: "Forms", icon: <FormIcon />, summary: "Every field, on native controls, in a panel or in the pill." },
  { href: "/docs/calendar/", label: "Calendar", icon: <CalendarIcon />, summary: "PillDate: dates, months, weeks and times in the pill's language." },
  { href: "/docs/icons/", label: "Icons", icon: <ShapesIcon />, summary: "Bring your own: any SVG, image, font icon or icon library." },
  { href: "/docs/styling/", label: "Styling", icon: <PaletteIcon />, summary: "Tokens, your own variants, classes and layers." },
  { href: "/docs/themes/", label: "Themes", icon: <DropIcon />, summary: "Glass and Liquid Glass, refraction and adaptive tinting." },
];
