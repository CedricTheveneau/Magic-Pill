"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagicPill, PillNavbar } from "magic-pill";

import { SECTIONS } from "./sections";

/**
 * The docs' sections, in a pill on the left: only the current page shows its
 * label, the others on hover and focus. A named host, so the "Several pills"
 * page can notify it.
 */
export function DocsPill() {
  return (
    <MagicPill name="docs" placement="left" className="docs-pill" linkComponent={Link} aria-label="Documentation">
      <PillNavbar items={SECTIONS} pathname={usePathname()} linkComponent={Link} aria-label="Documentation sections" />
    </MagicPill>
  );
}
