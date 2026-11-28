"use client"
// The satellites' layer (beta): the host's electrons, each a small round pill
// that splits out of the host with the goo, tucks back in on its own page and
// while a notification has the pill, and goes back (or pops away) when its
// activity ends. Where they go is planned by layout.ts; this file measures,
// moves and animates.
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import Pill from "../Pill/Pill";
import { playSplit } from "../Pill/goo";
import { PillProgress } from "../Pill/PillProgress";
import type { PillPresence } from "../Pill/types";
import { findActiveIndex } from "../PillNavbar/matchPath";
import { NO_ELECTRONS, type Electron } from "../store/store";
import { useIsomorphicLayoutEffect } from "../utils/react";
import { parseDuration, prefersReducedMotion } from "../utils/timing";
import { VISUALLY_HIDDEN } from "../utils/visuallyHidden";
import { planSatellites, type Box } from "./layout";
import type { SatelliteHost } from "./types";

// Fixed on the screen, placed by script; the stylesheet's inline placement gives it no z-index
const ELECTRON_STYLE = { position: "fixed", zIndex: "var(--mp-z-index, 50)", margin: 0 } as CSSProperties;
const SHIFT = "mp-satellite-shift";
const SIDE_PLACEMENTS = new Set(["left", "right"]);

/** "1.5rem", "24px" → px (a custom property's computed value keeps its unit). */
function toPixels(value: string, element: HTMLElement, fallback: number): number {
  const match = /^\s*(-?[\d.]+)(px|rem|em)?\s*$/.exec(value);
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  if (match[2] === "rem") return amount * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  if (match[2] === "em") return amount * (Number.parseFloat(getComputedStyle(element).fontSize) || 16);
  return amount;
}

const durations = (element: HTMLElement) => {
  const style = getComputedStyle(element);
  return {
    enter: parseDuration(style.getPropertyValue("--_mp-enter"), 500),
    exit: parseDuration(style.getPropertyValue("--_mp-exit"), 300),
    fade: parseDuration(style.getPropertyValue("--_mp-fade"), 150),
    change: parseDuration(style.getPropertyValue("--_mp-change"), 250),
  };
};

/** Two boxes side by side, a gap apart: the second can come out of the first. */
const nextTo = (a: Box, b: Box, gap: number) => {
  const sideBySide = Math.abs(a.top - b.top) < 2 && Math.abs(Math.abs(a.left - b.left) - (a.width + gap)) < 2;
  const stacked = Math.abs(a.left - b.left) < 2 && Math.abs(Math.abs(a.top - b.top) - (a.height + gap)) < 2;
  return sideBySide || stacked;
};

/** What an electron shows: the ring and its value or icon, the value alone, or the app's own. */
function ElectronContent({ electron }: { electron: Electron }): ReactNode {
  const { input } = electron;
  if (input.render) return input.render();
  const inner =
    input.value !== undefined ? (
      <span data-mp="electron-value">{input.value}</span>
    ) : input.icon !== undefined ? (
      <span data-mp="electron-icon" aria-hidden="true">
        {input.icon}
      </span>
    ) : null;
  return input.progress !== undefined ? <PillProgress value={input.progress}>{inner}</PillProgress> : inner;
}

/** All of the circle is a link back to where it came from, or a button for its `onClick`. */
function ElectronBody({ electron, host }: { electron: Electron; host: SatelliteHost }) {
  const { input, origin } = electron;
  const valueText = input.valueText ?? input.value;
  const name = valueText ? `${input.label}, ${valueText}` : input.label;
  const content = <ElectronContent electron={electron} />;
  if (input.onClick) {
    return (
      <button type="button" data-mp="electron" aria-label={name} onClick={(event) => input.onClick?.(event)}>
        {content}
      </button>
    );
  }
  if (origin !== undefined) {
    const Link = host.linkComponent ?? "a";
    return (
      <Link href={origin} data-mp="electron" aria-label={name} draggable={false}>
        {content}
      </Link>
    );
  }
  return (
    <span data-mp="electron" role="img" aria-label={name}>
      {content}
    </span>
  );
}

interface Shown {
  electron: Electron;
  /** It has ended: it stays on the page while it leaves */
  leaving?: boolean;
}

export function SatellitesLayer({ host }: { host: SatelliteHost }) {
  const electrons = useSyncExternalStore(host.store.subscribe, host.store.getElectrons, () => NO_ELECTRONS);
  const [, refresh] = useReducer((count: number) => count + 1, 0);

  // Every electron seen, in the order it was started; the ones that ended stay while they leave
  const shown = useRef(new Map<string, Shown>());
  for (const electron of electrons) shown.current.set(electron.id, { electron });
  for (const [id, entry] of shown.current) {
    if (!entry.leaving && !electrons.some((electron) => electron.id === id)) shown.current.set(id, { ...entry, leaving: true });
  }

  const tucked = host.notifying && !host.keepElectronsOut;
  const presenceOf = ({ electron, leaving }: Shown): PillPresence => {
    if (leaving || tucked) return "hidden";
    const onOrigin =
      electron.input.hideOnOrigin !== false &&
      electron.origin !== undefined &&
      findActiveIndex(host.pathname, [{ href: electron.origin }]) === 0;
    return onOrigin ? "hidden" : "compact";
  };
  const entries = [...shown.current.values()].map((entry) => ({ ...entry, presence: presenceOf(entry) }));

  const elements = useRef(new Map<string, HTMLElement>());
  const presences = useRef(new Map<string, PillPresence>());
  const applied = useRef({ shift: 0, reserve: 0 });
  // The row each electron was in: one that changes rows moves there, even while following the host
  const rows = useRef(new Map<string, string>());

  // Measures, places, and moves: animated after a render, at once while the host resizes
  const arrange = useRef<(animate: boolean) => void>(() => {});
  arrange.current = (animate: boolean) => {
    const root = host.rootRef.current;
    if (!root) return;
    const vertical = SIDE_PLACEMENTS.has(host.placement);
    const style = getComputedStyle(root);
    const gap = toPixels(style.getPropertyValue("--mp-electron-gap"), root, Number.parseFloat(style.columnGap) || 16);
    const offset = toPixels(style.getPropertyValue("--_mp-offset"), root, 24);
    const out = entries.filter((entry) => entry.presence !== "hidden" && elements.current.get(entry.electron.id));
    const layout = planSatellites({
      viewport: { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight },
      host: { left: root.offsetLeft, top: root.offsetTop, width: root.offsetWidth, height: root.offsetHeight },
      placement: host.placement,
      vertical,
      rtl: style.direction === "rtl",
      electrons: out.map(({ electron }) => {
        const element = elements.current.get(electron.id)!;
        return { id: electron.id, width: element.offsetWidth || 72, height: element.offsetHeight || 72 };
      }),
      side: host.electronSide,
      line: host.electronLine,
      arrange: host.arrange,
      gap,
      offset,
    });
    const reduced = prefersReducedMotion();
    const moving = animate && !reduced && typeof root.animate === "function";
    const timings = durations(out[0] ? elements.current.get(out[0].electron.id)! : root);

    // The host moves to keep the group where its placement says, and leaves the satellites their room
    const previous = applied.current;
    if (Math.abs(layout.shift - previous.shift) > 0.5) {
      const along = (value: number) => (vertical ? `0px ${value}px` : `${value}px 0px`);
      if (layout.shift) root.style.setProperty("translate", along(layout.shift));
      else root.style.removeProperty("translate");
      if (moving) {
        root.animate([{ translate: along(previous.shift - layout.shift) }, { translate: "0px 0px" }], {
          id: SHIFT,
          duration: timings.change,
          easing: "ease-in-out",
          composite: "add",
        });
      }
    }
    if (!vertical && layout.reserve !== previous.reserve) {
      if (layout.reserve) root.style.setProperty("--_mp-shift-x", `${layout.reserve}px`);
      else root.style.removeProperty("--_mp-shift-x");
    }
    applied.current = { shift: layout.shift, reserve: layout.reserve };

    // The electrons: into their spots, and out of the host (or back into it) when that changes
    const boxes = layout.boxes;
    const crossOf = (box: Box) => Math.round(vertical ? box.left : box.top);
    out.forEach(({ electron }, index) => {
      const element = elements.current.get(electron.id)!;
      const box = boxes[electron.id];
      const was = presences.current.get(electron.id);
      const from = element.getBoundingClientRect();
      element.style.left = `${box.left}px`;
      element.style.top = `${box.top}px`;
      const row = String(crossOf(box));
      const changedRow = rows.current.has(electron.id) && rows.current.get(electron.id) !== row;
      rows.current.set(electron.id, row);
      if (!animate) {
        if (changedRow && !reduced && typeof element.animate === "function") {
          const to = element.getBoundingClientRect();
          element.animate([{ translate: `${from.left - to.left}px ${from.top - to.top}px` }, { translate: "0px 0px" }], {
            id: SHIFT,
            duration: timings.change,
            easing: "ease-in-out",
            composite: "add",
          });
        }
        return;
      }
      if (was === undefined || was === "hidden") {
        // Out of the one next to it, or of the host
        const before = out[index - 1];
        const neighbour = before ? elements.current.get(before.electron.id) : undefined;
        const anchor = neighbour && before && nextTo(boxes[before.electron.id], box, gap) ? neighbour : root;
        playSplit(anchor, element, "split", { delay: 0, duration: durations(element).enter });
      } else if (moving && (Math.abs(from.left - box.left) > 0.5 || Math.abs(from.top - box.top) > 0.5)) {
        const to = element.getBoundingClientRect();
        element.animate([{ translate: `${from.left - to.left}px ${from.top - to.top}px` }, { translate: "0px 0px" }], {
          id: SHIFT,
          duration: timings.change,
          easing: "ease-in-out",
          composite: "add",
        });
      }
    });
    if (animate) {
      for (const entry of entries) {
        const element = elements.current.get(entry.electron.id);
        if (!element || entry.presence !== "hidden" || presences.current.get(entry.electron.id) !== "compact") continue;
        const ending = entry.leaving ? (entry.electron.input.ending ?? host.electronEnding) : "join";
        if (ending === "pop") continue; // the stylesheet scales it out
        const { fade, change, exit } = durations(element);
        playSplit(root, element, "join", { delay: fade + change, duration: exit });
      }
      for (const entry of entries) presences.current.set(entry.electron.id, entry.presence);
    }
  };

  useIsomorphicLayoutEffect(() => arrange.current(true));

  // The electrons follow the host's edge at every frame as it resizes, and the screen's
  useEffect(() => {
    const root = host.rootRef.current;
    if (!root) return;
    const follow = () => arrange.current(false);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(follow);
    observer?.observe(root);
    window.addEventListener("resize", follow);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", follow);
      root.style.removeProperty("translate");
      if (!SIDE_PLACEMENTS.has(host.placement)) root.style.removeProperty("--_mp-shift-x");
      applied.current = { shift: 0, reserve: 0 };
    };
  }, [host.rootRef, host.placement]);

  // The ones that ended leave the page once they've gone
  const leavingIds = entries.filter((entry) => entry.leaving).map((entry) => entry.electron.id);
  useEffect(() => {
    if (leavingIds.length === 0) return;
    const timers = leavingIds.map((id) => {
      const element = elements.current.get(id);
      const { fade, change, exit } = element ? durations(element) : { fade: 150, change: 250, exit: 300 };
      return setTimeout(() => {
        shown.current.delete(id);
        presences.current.delete(id);
        rows.current.delete(id);
        refresh();
      }, fade + change + exit + 100);
    });
    return () => timers.forEach(clearTimeout);
  }, [leavingIds.join(" ")]);

  // Milestones, said once
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef(new Map<string, string | undefined>());
  useEffect(() => {
    for (const electron of electrons) {
      const text = electron.input.announce;
      if (text && announced.current.get(electron.id) !== text) setAnnouncement(text);
      announced.current.set(electron.id, text);
    }
  }, [electrons]);

  return (
    <>
      {entries.map(({ electron, presence, leaving }) => {
        const ending = electron.input.ending ?? host.electronEnding;
        return (
          <Pill
            key={electron.id}
            ref={(element: HTMLElement | null) => {
              if (element) elements.current.set(electron.id, element);
              else elements.current.delete(electron.id);
            }}
            placement="inline"
            ladder={false}
            moveThroughCircle={false}
            theme={host.theme}
            variant={electron.input.variant ?? host.variant}
            presence={presence}
            data-satellite="electron"
            data-ending={leaving && ending === "pop" ? "pop" : undefined}
            style={ELECTRON_STYLE}
          >
            <ElectronBody electron={electron} host={host} />
          </Pill>
        );
      })}
      <div role="status" aria-live="polite" aria-atomic="true" data-mp="announcer" style={VISUALLY_HIDDEN}>
        {announcement}
      </div>
    </>
  );
}
