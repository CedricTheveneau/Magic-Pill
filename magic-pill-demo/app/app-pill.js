"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, DocumentIcon, InfoIcon, MagicPill, PillNavbar } from "magic-pill";
// The Electron (beta): the docs' timer and upload come out of this pill
import { satellites } from "magic-pill/satellites";

import { useDemo } from "./demo-context";
import { BookIcon } from "./icons";
import { useStage } from "./stage";

export const NAV_ITEMS = [
  { href: "/", label: "Playground", icon: <InfoIcon /> },
  { href: "/templates/", label: "Templates", icon: <DocumentIcon /> },
  { href: "/building-blocks/", label: "Building blocks", icon: <BoxIcon /> },
  { href: "/docs/", label: "Docs", icon: <BookIcon /> },
];

/**
 * The main pill: a navbar base layer that notifications take over. On the docs
 * pages, the example you try takes the navbar's place (the stage) and brings
 * the host props it needs.
 */
export function AppPill() {
  const { showNavbar } = useDemo();
  const { stage } = useStage();
  const pathname = usePathname();
  const navbar = showNavbar && <PillNavbar items={NAV_ITEMS} pathname={pathname} linkComponent={Link} />;
  // `content: null` is a stage too: no base layer at all
  const staged = stage !== null && stage.content !== undefined;

  return (
    <MagicPill
      linkComponent={Link}
      pathname={pathname}
      satellites={satellites}
      {...stage?.pill}
      className={stage?.pill?.className ? `app-pill ${stage.pill.className}` : "app-pill"}
      scene={staged ? stage.id : "navbar"}
    >
      {staged ? stage.content : navbar}
    </MagicPill>
  );
}
