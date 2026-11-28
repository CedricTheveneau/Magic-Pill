"use client"
// An electron's orbitals (beta): its quick actions, small round pills that
// bulge out of it with the goo, on an arc away from the screen's edge.
//
// A long press opens them (hovering with a mouse too, by default; or a tap,
// with a first orbital going back). Keep pressing, slide to one and release
// to run it: it's picked by its angle from the electron's centre. Released on
// none, they stay open until a tap away. The keyboard opens them with the
// arrow pointing away from the edge (or Shift+F10, or the context-menu key),
// and moves around them with the arrows: an ARIA menu.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";

import Pill from "../Pill/Pill";
import { playSplit } from "../Pill/goo";
import type { Electron, Orbital } from "../store/store";
import { useIsomorphicLayoutEffect } from "../utils/react";
import { parseDuration } from "../utils/timing";
import { durations, toPixels } from "./measure";
import { orbitalAt, planOrbit, type Orbit } from "./orbits";
import type { SatelliteHost } from "./types";

const MENU_STYLE = { position: "fixed", inset: 0, pointerEvents: "none", zIndex: "var(--mp-z-index, 50)" } as CSSProperties;
const ORBITAL_STYLE = { position: "fixed", left: 0, top: 0, margin: 0, pointerEvents: "auto" } as CSSProperties;
const LABEL_STYLE = { position: "fixed", left: 0, top: 0 } as CSSProperties;
/** Another electron opened its orbitals: these close */
const OPENED = "mp-orbitals-open";
/** The direction away from the screen's edge, by the host's placement */
const AWAY: Record<string, number> = { bottom: -90, top: 90, left: 0, right: 180 };

type How = "hover" | "press" | "tap" | "key";

const BACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 6.5 4.5 12l5.5 5.5M5 12h14.5" />
  </svg>
);

interface Settings {
  size: number;
  distance: number;
  spread: number;
  stagger: number;
  hoverDelay: number;
  longPress: number;
}

/** The orbitals' tokens, read on the electron. */
function readSettings(element: HTMLElement): Settings {
  const style = getComputedStyle(element);
  const action = toPixels(style.getPropertyValue("--_mp-action-size"), element, 44);
  const spread = Number.parseFloat(style.getPropertyValue("--mp-orbital-spread"));
  return {
    size: toPixels(style.getPropertyValue("--mp-orbital-size"), element, action),
    distance: toPixels(style.getPropertyValue("--mp-orbital-distance"), element, 14),
    spread: Number.isFinite(spread) ? spread : 0,
    stagger: parseDuration(style.getPropertyValue("--mp-orbital-stagger"), 30),
    hoverDelay: parseDuration(style.getPropertyValue("--mp-hover-delay"), 300),
    longPress: parseDuration(style.getPropertyValue("--mp-long-press"), 450),
  };
}

export function Orbitals({
  electron,
  getElement,
  host,
  out,
}: {
  electron: Electron;
  /** The electron's pill */
  getElement: () => HTMLElement | undefined;
  host: SatelliteHost;
  /** The electron is out (not tucked in, not leaving) */
  out: boolean;
}) {
  const tap = host.orbitalsOpenOn === "tap";
  const own = electron.input.orbitals ?? [];
  const items: Orbital[] =
    own.length === 0
      ? []
      : [
          ...(tap
            ? [{ id: "back", icon: BACK_ICON, label: electron.input.backLabel ?? "Back", href: electron.input.onClick ? undefined : electron.origin, onClick: electron.input.onClick }]
            : []),
          ...own,
        ];

  const [ring, setRing] = useState<{ how: How } | null>(null);
  const [shown, setShown] = useState<boolean[]>([]);
  const [hot, setHot] = useState(-1);
  const orbit = useRef<Orbit | null>(null);
  const settings = useRef<Settings | null>(null);
  const pills = useRef(new Map<number, HTMLElement>());
  const was = useRef<boolean[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const focusFirst = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const showAt = (index: number, value: boolean) =>
    setShown((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });

  // Where they go: measured as they open, from the electron and what's around it
  const plan = () => {
    const element = getElement();
    const root = host.rootRef.current;
    if (!element || !root) return null;
    const read = readSettings(element);
    settings.current = read;
    const obstacles = [root, ...document.querySelectorAll<HTMLElement>('[data-mp="pill"][data-satellite="electron"]')]
      .filter((other) => other !== element && other.dataset.presence !== "hidden")
      .map((other) => other.getBoundingClientRect());
    orbit.current = planOrbit({
      electron: element.getBoundingClientRect(),
      count: items.length,
      size: read.size,
      distance: read.distance,
      spread: read.spread,
      away: AWAY[host.placement.split("-")[0]] ?? -90,
      obstacles,
      viewport: { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight },
      rtl: getComputedStyle(root).direction === "rtl",
    });
    return read;
  };

  const open = (how: How) => {
    if (items.length === 0 || !out) return;
    window.dispatchEvent(new CustomEvent(OPENED, { detail: electron.id }));
    clearTimers();
    const read = plan();
    if (!read) return;
    focusFirst.current = how === "key";
    setHot(-1);
    setRing({ how });
    items.forEach((_, index) => timers.current.push(setTimeout(() => showAt(index, true), index * read.stagger)));
  };

  const close = (quick = false) => {
    if (!ring) return;
    clearTimers();
    setHot(-1);
    const element = pills.current.get(0);
    const { fade, exit } = element ? durations(element) : { fade: 150, exit: 300 };
    const stagger = quick ? 0 : (settings.current?.stagger ?? 30) * 0.6;
    const count = items.length;
    items.forEach((_, index) => timers.current.push(setTimeout(() => showAt(index, false), (count - 1 - index) * stagger)));
    timers.current.push(setTimeout(() => setRing(null), (count - 1) * stagger + fade + exit + 50));
  };

  // The latest of everything, for the electron's listeners
  const api = useRef({ open, close, ring, items, hot, setHot });
  api.current = { open, close, ring, items, hot, setHot };

  // The electron: a long press, hovering it, a tap, the keyboard
  const hasItems = items.length > 0;
  useEffect(() => {
    const link = getElement()?.querySelector<HTMLElement>('[data-mp="electron"]');
    if (!link || !hasItems) return;
    link.setAttribute("aria-haspopup", "menu");
    let press: { x: number; y: number; opened: boolean; moved: boolean; timer: ReturnType<typeof setTimeout> } | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let swallowClick = false;
    const hotAt = (event: PointerEvent) => {
      const element = getElement();
      if (!orbit.current || !settings.current || !element) return;
      api.current.setHot(orbitalAt(orbit.current, settings.current.size, element.offsetWidth / 2, event.clientX, event.clientY));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      clearTimeout(hoverTimer);
      const longPress = settings.current?.longPress ?? readSettings(getElement()!).longPress;
      press = {
        x: event.clientX,
        y: event.clientY,
        opened: false,
        moved: false,
        timer: setTimeout(() => {
          if (!press || press.moved) return;
          press.opened = true;
          if (!api.current.ring) api.current.open("press");
          try {
            link.setPointerCapture(event.pointerId);
          } catch {
            // Released already
          }
        }, longPress),
      };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!press) return;
      if (!press.opened && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
        press.moved = true;
        clearTimeout(press.timer);
      }
      if (press.opened) hotAt(event);
    };
    const onPointerUp = () => {
      if (!press) return;
      clearTimeout(press.timer);
      const { opened } = press;
      press = null;
      if (!opened) return;
      // A long press: no tap after it. Released on an orbital: it runs; on none: they stay open
      swallowClick = true;
      const { hot: index } = api.current;
      if (index >= 0) pills.current.get(index)?.querySelector<HTMLElement>('[data-mp="orbital"]')?.click();
      api.current.setHot(-1);
    };
    const onPointerCancel = () => {
      if (press) clearTimeout(press.timer);
      press = null;
    };
    const onClick = (event: MouseEvent) => {
      if (swallowClick) {
        swallowClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (tap) {
        // A tap opens them (Enter too, focusing the first); the first one goes back
        event.preventDefault();
        event.stopPropagation();
        if (api.current.ring) api.current.close();
        else api.current.open(event.detail === 0 ? "key" : "tap");
      } else if (api.current.ring) api.current.close(true);
    };
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || host.orbitalsOpenOn !== "press-hover" || press) return;
      const { hoverDelay } = settings.current ?? readSettings(getElement()!);
      hoverTimer = setTimeout(() => {
        if (!press && !api.current.ring) api.current.open("hover");
      }, hoverDelay);
    };
    const onPointerLeave = () => clearTimeout(hoverTimer);
    const onKeyDown = (event: KeyboardEvent) => {
      const away = { bottom: "ArrowUp", top: "ArrowDown", left: "ArrowRight", right: "ArrowLeft" }[host.placement.split("-")[0]];
      if (event.key === away || event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
        event.preventDefault();
        api.current.open("key");
      } else if (event.key === "Escape" && api.current.ring) {
        event.preventDefault();
        api.current.close();
      }
    };
    const onContextMenu = (event: Event) => event.preventDefault();
    link.addEventListener("pointerdown", onPointerDown);
    link.addEventListener("pointermove", onPointerMove);
    link.addEventListener("pointerup", onPointerUp);
    link.addEventListener("pointercancel", onPointerCancel);
    link.addEventListener("click", onClick);
    link.addEventListener("pointerenter", onPointerEnter);
    link.addEventListener("pointerleave", onPointerLeave);
    link.addEventListener("keydown", onKeyDown);
    link.addEventListener("contextmenu", onContextMenu);
    return () => {
      clearTimeout(hoverTimer);
      if (press) clearTimeout(press.timer);
      link.removeAttribute("aria-haspopup");
      link.removeEventListener("pointerdown", onPointerDown);
      link.removeEventListener("pointermove", onPointerMove);
      link.removeEventListener("pointerup", onPointerUp);
      link.removeEventListener("pointercancel", onPointerCancel);
      link.removeEventListener("click", onClick);
      link.removeEventListener("pointerenter", onPointerEnter);
      link.removeEventListener("pointerleave", onPointerLeave);
      link.removeEventListener("keydown", onKeyDown);
      link.removeEventListener("contextmenu", onContextMenu);
    };
  }, [hasItems, tap, host.orbitalsOpenOn, host.placement, electron.id]);

  // Open: aria-expanded on the electron; a tap away closes them; a mouse leaving them, if hovering opened them
  useEffect(() => {
    const link = getElement()?.querySelector<HTMLElement>('[data-mp="electron"]');
    if (!ring) {
      link?.setAttribute("aria-expanded", "false");
      return;
    }
    link?.setAttribute("aria-expanded", "true");
    const inside = (target: EventTarget | null) =>
      target instanceof Node && ([...pills.current.values()].some((pill) => pill.contains(target)) || !!link?.contains(target));
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) api.current.close();
    };
    let leaving: ReturnType<typeof setTimeout> | undefined;
    const onPointerMove = (event: PointerEvent) => {
      if (ring.how !== "hover" || !orbit.current || !settings.current) return;
      const far = Math.hypot(event.clientX - orbit.current.x, event.clientY - orbit.current.y) > orbit.current.radius + settings.current.size / 2 + 26;
      if (far && leaving === undefined) leaving = setTimeout(() => api.current.close(), 220);
      if (!far) {
        clearTimeout(leaving);
        leaving = undefined;
      }
    };
    const onOtherOpened = (event: Event) => {
      if ((event as CustomEvent).detail !== electron.id) api.current.close(true);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove);
    window.addEventListener(OPENED, onOtherOpened);
    return () => {
      clearTimeout(leaving);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener(OPENED, onOtherOpened);
    };
  }, [ring, electron.id]);

  // Tucked in, leaving, or the person went to another page: they close
  useEffect(() => {
    if (ring && !out) api.current.close(true);
  }, [out]);
  useEffect(() => {
    if (ring) api.current.close(true);
  }, [host.pathname]);

  useEffect(() => clearTimers, []);

  // Into their spots, out of the electron (or back into it) as each one shows or hides
  useIsomorphicLayoutEffect(() => {
    const element = getElement();
    if (!ring || !element || !orbit.current) return;
    items.forEach((_, index) => {
      const pill = pills.current.get(index);
      const spot = orbit.current?.spots[index];
      if (!pill || !spot) return;
      pill.style.left = `${spot.x - pill.offsetWidth / 2}px`;
      pill.style.top = `${spot.y - pill.offsetHeight / 2}px`;
      const now = !!shown[index];
      if (now && !was.current[index]) playSplit(element, pill, "split", { delay: 0, duration: durations(pill).enter });
      if (!now && was.current[index]) {
        const { fade, exit } = durations(pill);
        playSplit(element, pill, "join", { delay: fade, duration: exit });
      }
      was.current[index] = now;
    });
    if (focusFirst.current && shown[0]) {
      focusFirst.current = false;
      pills.current.get(0)?.querySelector<HTMLElement>('[data-mp="orbital"]')?.focus();
    }
    // The label of the one under the finger: outwards from it, inside the screen
    const label = labelRef.current;
    const spot = hot >= 0 ? orbit.current.spots[hot] : undefined;
    if (label && spot && settings.current) {
      const distance = settings.current.size / 2 + 22;
      const angle = (spot.angle * Math.PI) / 180;
      const width = label.offsetWidth;
      const height = label.offsetHeight;
      const x = Math.min(Math.max(spot.x + Math.cos(angle) * distance, width / 2 + 6), window.innerWidth - width / 2 - 6);
      const y = Math.min(Math.max(spot.y + Math.sin(angle) * distance, height / 2 + 6), window.innerHeight - height / 2 - 6);
      label.style.translate = `${x - width / 2}px ${y - height / 2}px`;
    }
  });
  useEffect(() => {
    if (!ring) was.current = [];
  }, [ring]);

  if (!ring || items.length === 0) return null;

  const run = (item: Orbital) => (event: { preventDefault(): void }) => {
    item.onClick?.(event);
    if (!host.orbitalsStayOpen) close();
  };
  const onKeyDown = (index: number) => (event: ReactKeyboardEvent) => {
    const count = items.length;
    const focus = (next: number) => {
      event.preventDefault();
      setHot(next);
      pills.current.get(next)?.querySelector<HTMLElement>('[data-mp="orbital"]')?.focus();
    };
    if (["ArrowRight", "ArrowDown"].includes(event.key)) focus((index + 1) % count);
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) focus((index - 1 + count) % count);
    else if (event.key === "Home") focus(0);
    else if (event.key === "End") focus(count - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      close();
      getElement()?.querySelector<HTMLElement>('[data-mp="electron"]')?.focus();
    } else if (event.key === "Tab") close();
  };
  const Link = host.linkComponent ?? "a";

  return (
    <div role="menu" aria-label={electron.input.label} data-mp="orbitals" data-orbitals={electron.id} style={MENU_STYLE}>
      {items.map((item, index) => {
        const common = {
          role: "menuitem",
          tabIndex: -1,
          "data-mp": "orbital",
          "aria-label": item.label,
          onClick: run(item),
          onKeyDown: onKeyDown(index),
          onFocus: () => setHot(index),
        };
        return (
          <Pill
            key={item.id ?? index}
            ref={(element: HTMLElement | null) => {
              if (element) pills.current.set(index, element);
              else pills.current.delete(index);
            }}
            placement="inline"
            ladder={false}
            moveThroughCircle={false}
            theme={host.theme}
            variant={electron.input.variant ?? host.variant}
            presence={shown[index] ? "compact" : "hidden"}
            data-satellite="orbital"
            data-index={index}
            data-hot={hot === index ? "" : undefined}
            style={ORBITAL_STYLE}
            onPointerEnter={() => setHot(index)}
            onPointerLeave={() => setHot(-1)}
          >
            {item.href !== undefined ? (
              <Link href={item.href} {...common}>
                {item.icon}
              </Link>
            ) : (
              <button type="button" {...common}>
                {item.icon}
              </button>
            )}
          </Pill>
        );
      })}
      {host.orbitalLabels && hot >= 0 && items[hot] && (
        <span ref={labelRef} data-mp="orbital-label" aria-hidden="true" style={LABEL_STYLE}>
          {items[hot].label}
        </span>
      )}
    </div>
  );
}
