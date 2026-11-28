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
//
// When they don't all fit clear of everything, they're a wheel: the arc shows
// what fits, the next one peeking out at each end, and turns with the mouse
// wheel, a drag along it, or the arrow keys. A wheel stays open until a tap
// away or Escape.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";

import Pill from "../Pill/Pill";
import { playOrbit } from "../Pill/goo";
import type { Electron, Orbital } from "../store/store";
import { useIsomorphicLayoutEffect } from "../utils/react";
import { parseDuration } from "../utils/timing";
import { durations, toPixels } from "./measure";
import { orbitalAt, planOrbit, spotOn, wheelEnd, type Orbit } from "./orbits";
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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const focusFirst = useRef(false);
  // How far the wheel has turned, in orbitals (0 when they all fit)
  const turn = useRef(0);
  const snapping = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

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

  // Every orbital where the wheel puts it: fading past its ends, out of reach once faint
  const applyTurn = () => {
    const current = orbit.current;
    if (!current) return;
    items.forEach((_, index) => {
      const pill = pills.current.get(index);
      if (!pill) return;
      const spot = spotOn(current, index, turn.current);
      pill.style.left = `${spot.x - pill.offsetWidth / 2}px`;
      pill.style.top = `${spot.y - pill.offsetHeight / 2}px`;
      if (current.wheel) {
        pill.style.opacity = String(spot.shown);
        pill.style.scale = String((0.6 + 0.4 * spot.shown) * (api.current.hot === index ? 1.12 : 1));
        pill.style.pointerEvents = spot.shown < 0.5 || closing.current ? "none" : "auto";
      } else {
        pill.style.removeProperty("opacity");
        pill.style.removeProperty("scale");
        pill.style.pointerEvents = closing.current ? "none" : "auto";
      }
    });
    placeLabel();
  };

  // The label of the one under the finger: outwards from it, inside the screen
  const placeLabel = () => {
    const label = labelRef.current;
    const index = api.current.hot;
    if (!label || index < 0 || !orbit.current || !settings.current) return;
    const spot = spotOn(orbit.current, index, turn.current);
    const distance = settings.current.size / 2 + 22;
    const angle = (spot.angle * Math.PI) / 180;
    const width = label.offsetWidth;
    const height = label.offsetHeight;
    const x = Math.min(Math.max(spot.x + Math.cos(angle) * distance, width / 2 + 6), window.innerWidth - width / 2 - 6);
    const y = Math.min(Math.max(spot.y + Math.sin(angle) * distance, height / 2 + 6), window.innerHeight - height / 2 - 6);
    label.style.translate = `${x - width / 2}px ${y - height / 2}px`;
  };

  // The wheel turns to `to` (a little past its ends while dragging), easing there for a snap
  const turnTo = (to: number, ease = false) => {
    const current = orbit.current;
    if (!current?.wheel) return;
    const target = Math.min(Math.max(to, ease ? 0 : -0.35), wheelEnd(current) + (ease ? 0 : 0.35));
    cancelAnimationFrame(snapping.current);
    if (!ease) {
      turn.current = target;
      applyTurn();
      return;
    }
    const from = turn.current;
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / 180);
      turn.current = from + (target - from) * (1 - (1 - t) ** 3);
      applyTurn();
      if (t < 1) snapping.current = requestAnimationFrame(step);
    };
    snapping.current = requestAnimationFrame(step);
  };
  const snap = () => turnTo(Math.round(turn.current), true);

  // The motion of the moment, so that the next one stops it first
  const motion = useRef<() => void>(() => {});
  // They're on their way out: the next render plays their bulging out of the electron
  const opening = useRef(false);
  // On their way back in: out of reach, so that a pointer still over them can't hold them
  const closing = useRef(false);

  /** The orbitals that show, each with its delay: one after the other along the arc (or the other way round). */
  const sequence = (reverse: boolean, stagger: number) => {
    const current = orbit.current;
    const shownOnes = items
      .map((_, index) => ({ index, shown: current ? spotOn(current, index, turn.current).shown : 1 }))
      .filter(({ shown }) => shown > 0);
    return shownOnes.map(({ index, shown }, rank) => ({
      element: pills.current.get(index)!,
      shown,
      delay: (reverse ? shownOnes.length - 1 - rank : rank) * stagger,
    })).filter(({ element }) => element);
  };

  const open = (how: How) => {
    if (items.length === 0 || !out) return;
    window.dispatchEvent(new CustomEvent(OPENED, { detail: electron.id }));
    clearTimers();
    motion.current();
    if (!plan()) return;
    focusFirst.current = how === "key";
    turn.current = 0;
    opening.current = true;
    closing.current = false;
    setHot(-1);
    setRing({ how });
    setShown(items.map(() => true));
  };

  const close = (quick = false) => {
    if (!ring) return;
    clearTimers();
    setHot(-1);
    closing.current = true;
    for (const pill of pills.current.values()) pill.style.pointerEvents = "none";
    const element = getElement();
    const first = pills.current.get(0);
    const { fade, exit } = first ? durations(first) : { fade: 150, exit: 300 };
    // Snappier than they came out; at once when their electron goes (the stop of a timer)
    const duration = quick ? fade + 100 : exit * 0.8;
    const stagger = quick ? 0 : (settings.current?.stagger ?? 30) * 0.6;
    const steps = sequence(true, stagger);
    motion.current();
    if (element) motion.current = playOrbit(element, steps, "close", { duration });
    const longest = Math.max(0, ...steps.map(({ delay }) => delay)) + duration;
    timers.current.push(
      setTimeout(() => {
        setRing(null);
        setShown([]);
        closing.current = false;
      }, longest + 30),
    );
  };

  // The latest of everything, for the electron's listeners
  const api = useRef({ open, close, ring, items, hot, setHot, turnTo, snap });
  api.current = { open, close, ring, items, hot, setHot, turnTo, snap };

  // The electron: a long press, hovering it, a tap, the keyboard
  const hasItems = items.length > 0;
  useEffect(() => {
    const link = getElement()?.querySelector<HTMLElement>('[data-mp="electron"]');
    if (!link || !hasItems) return;
    link.setAttribute("aria-haspopup", "menu");
    let press: { x: number; y: number; opened: boolean; moved: boolean; already?: boolean; timer: ReturnType<typeof setTimeout> } | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let swallowClick = false;
    const hotAt = (event: PointerEvent) => {
      const element = getElement();
      if (!orbit.current || !settings.current || !element) return;
      api.current.setHot(orbitalAt(orbit.current, settings.current.size, element.offsetWidth / 2, event.clientX, event.clientY, turn.current));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      clearTimeout(hoverTimer);
      // Already open (they stay open after an action): no need to wait, the slide starts at once
      if (api.current.ring) {
        press = { x: event.clientX, y: event.clientY, opened: true, moved: false, already: true, timer: setTimeout(() => {}, 0) };
        try {
          link.setPointerCapture(event.pointerId);
        } catch {
          // Released already
        }
        return;
      }
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
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
        if (!press.opened) clearTimeout(press.timer);
        press.moved = true;
      }
      if (press.opened) hotAt(event);
    };
    const onPointerUp = () => {
      if (!press) return;
      clearTimeout(press.timer);
      const { opened, already, moved } = press;
      press = null;
      if (!opened) return;
      // They were open, and it didn't slide onto one: a plain tap (it goes back)
      if (already && !moved && api.current.hot < 0) return;
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
      if (ring.how !== "hover" || !orbit.current || !settings.current || orbit.current.wheel) return;
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
    // The wheel: the mouse wheel over it, or a drag along it from one of them
    const near = (x: number, y: number) =>
      !!orbit.current && !!settings.current && Math.hypot(x - orbit.current.x, y - orbit.current.y) <= orbit.current.radius + settings.current.size;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (event: WheelEvent) => {
      if (!orbit.current?.wheel || !(inside(event.target) || near(event.clientX, event.clientY))) return;
      event.preventDefault();
      api.current.turnTo(turn.current + (event.deltaY + event.deltaX) / 90);
      clearTimeout(settle);
      settle = setTimeout(() => api.current.snap(), 160);
    };
    const angleOf = (event: PointerEvent) =>
      orbit.current ? (Math.atan2(event.clientY - orbit.current.y, event.clientX - orbit.current.x) * 180) / Math.PI : 0;
    let drag: { angle: number; turn: number; x: number; y: number; moved: boolean } | null = null;
    const onDragStart = (event: PointerEvent) => {
      if (!orbit.current?.wheel || event.button !== 0 || !(event.target instanceof Node)) return;
      if (![...pills.current.values()].some((pill) => pill.contains(event.target as Node))) return;
      drag = { angle: angleOf(event), turn: turn.current, x: event.clientX, y: event.clientY, moved: false };
    };
    const onDragMove = (event: PointerEvent) => {
      if (!drag || !orbit.current) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <= 6) return;
      drag.moved = true;
      const turned = ((angleOf(event) - drag.angle + 540) % 360) - 180;
      api.current.turnTo(drag.turn + (orbit.current.rtl ? turned : -turned) / orbit.current.step);
    };
    const onDragEnd = () => {
      if (!drag) return;
      const { moved } = drag;
      drag = null;
      if (!moved) return;
      api.current.snap();
      // A drag isn't a tap: the orbital it started on doesn't run
      const swallow = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
      };
      document.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", swallow, { capture: true }), 0);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("pointerdown", onDragStart);
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
    window.addEventListener(OPENED, onOtherOpened);
    return () => {
      clearTimeout(leaving);
      clearTimeout(settle);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("pointerdown", onDragStart);
      document.removeEventListener("pointermove", onDragMove);
      document.removeEventListener("pointerup", onDragEnd);
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

  useEffect(
    () => () => {
      clearTimers();
      cancelAnimationFrame(snapping.current);
    },
    [],
  );

  // Into their spots; just opened, out of the electron's centre, one after the other
  useIsomorphicLayoutEffect(() => {
    const element = getElement();
    if (!ring || !element || !orbit.current) return;
    applyTurn();
    if (opening.current && pills.current.size >= items.length) {
      opening.current = false;
      const first = pills.current.get(0);
      const duration = (first ? durations(first).enter : 500) * 0.8;
      motion.current = playOrbit(element, sequence(false, settings.current?.stagger ?? 30), "open", { duration });
    }
    if (focusFirst.current && shown[0]) {
      focusFirst.current = false;
      pills.current.get(0)?.querySelector<HTMLElement>('[data-mp="orbital"]')?.focus();
    }
  });
  useEffect(() => {
    if (!ring) turn.current = 0;
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
      const current = orbit.current;
      if (current?.wheel) {
        // In view: the wheel turns so that it's between the arc's ends
        const wanted = Math.min(Math.max(turn.current, next - current.visible + 1), next);
        if (wanted !== turn.current) turnTo(wanted, true);
      }
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
            onPointerEnter={() => {
              if (!closing.current) setHot(index);
            }}
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
