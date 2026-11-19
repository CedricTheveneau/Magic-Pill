"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, DocumentIcon, InfoIcon, MagicPill, PillNavbar } from "magic-pill";

import { useDemo } from "./demo-context";

export const NAV_ITEMS = [
  { href: "/", label: "Playground", icon: <InfoIcon /> },
  { href: "/templates/", label: "Templates", icon: <DocumentIcon /> },
  { href: "/building-blocks/", label: "Building blocks", icon: <BoxIcon /> },
];

/** The main pill: a navbar base layer that notifications take over. */
export function AppPill() {
  const { showNavbar } = useDemo();
  const pathname = usePathname();

  return (
    <MagicPill linkComponent={Link}>
      {showNavbar && <PillNavbar items={NAV_ITEMS} pathname={pathname} linkComponent={Link} />}
    </MagicPill>
  );
}
