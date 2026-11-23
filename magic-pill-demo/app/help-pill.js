"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocumentIcon, HelpIcon, Pill, PillAction, PillActions, PillMessage, PillPanel, PillPanelTrigger } from "magic-pill";

import { MIGRATION_PATH } from "./paths";

/** A second pill, for the people coming from 8.x. It leaves as the page scrolls, and on the guide itself. */
export function HelpPill() {
  const onGuide = usePathname().startsWith(MIGRATION_PATH.slice(0, -1));
  const [panelOpen, setPanelOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wide, setWide] = useState(false);

  // Room for the guide's label next to the message
  useEffect(() => {
    const query = window.matchMedia("(min-width: 40rem)");
    const onChange = () => setWide(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closePanel = () => setPanelOpen(false);
  const presence = onGuide ? "hidden" : panelOpen ? "panel" : scrolled ? "hidden" : "compact";

  return (
    <Pill
      className="help-pill"
      placement="top-end"
      presence={presence}
      onPresenceChange={(next) => setPanelOpen(next === "panel")}
      role="group"
      aria-label="Migrating from 8.x"
    >
      <PillMessage>Migrating from 8.x?</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<HelpIcon />} label="Why migrate?" />
        <PillAction
          icon={<DocumentIcon />}
          label="Check out our guide!"
          expanded={wide}
          href={MIGRATION_PATH}
          linkComponent={Link}
          onClick={closePanel}
        />
      </PillActions>
      <PillPanel title="Why migrate?">
        <p>
          Magic Pill 9 is the first stable release. Earlier versions are deprecated: they won’t get fixes any more.
        </p>
        <p>
          Most apps get shorter: the Context, Provider and Initializer that 8.x asked you to write (about 135 lines) go
          away. Notifications queue on top of your navbar, and contents are React, never raw HTML.
        </p>
        <p>
          <Link href={MIGRATION_PATH} onClick={closePanel}>
            Follow the guide, step by step
          </Link>
        </p>
      </PillPanel>
    </Pill>
  );
}
