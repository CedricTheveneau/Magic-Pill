"use client"
// The current page's actions (beta), the design's wide atom: one or more
// actions next to the pill, set by the page that shows (usePillActions), in a
// pill of their own (the satellites' layer places it) or in the pill itself,
// after a divider.
import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import PillAction from "../Pill/PillAction";
import { PillActions, PillDivider } from "../Pill/parts";
import { getStore, type PillActionItem } from "../store/store";
import type { SatelliteHost } from "./types";

/**
 * Sets the current page's actions while the calling component is mounted:
 * call it in a page, and they show next to the pill there, and go when the
 * page goes. `null` or none: no actions. Give a stable array (a constant or
 * `useMemo`), or they're set again at every render.
 */
export function usePillActions(items: readonly PillActionItem[] | null, options: { pill?: string } = {}): void {
  const store = getStore(options.pill ?? "main");
  useEffect(() => {
    store.setActions(items);
    // Only if they're still this page's: the next page may have set its own already
    return () => {
      if (store.getActions() === items) store.setActions(null);
    };
  }, [store, items]);
}

/** The host's page actions, as they change. */
export function useHostActions(host: SatelliteHost): readonly PillActionItem[] | null {
  return useSyncExternalStore(host.store.subscribe, host.store.getActions, () => null);
}

/**
 * A row of actions cut short (`data-wheel`) turns like a wheel: a mouse
 * wheel, a drag, a swipe or the arrow keys bring the others in, each one
 * snapping into place, and the ends that hide some fade out.
 */
export function useActionsWheel(track: { current: HTMLElement | null }): void {
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const vertical = () => getComputedStyle(element).flexDirection.startsWith("column");
    const cut = () => element.hasAttribute("data-wheel");
    // Which ends hide some: they fade there
    const ends = () => {
      const along = vertical();
      const position = Math.abs(along ? element.scrollTop : element.scrollLeft);
      const room = along ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
      element.toggleAttribute("data-more-start", cut() && position > 1);
      element.toggleAttribute("data-more-end", cut() && position < room - 1);
    };
    const onWheel = (event: WheelEvent) => {
      if (!cut() || vertical()) return;
      // A vertical mouse wheel turns a row too
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      element.scrollBy({ left: event.deltaY });
    };
    // A mouse drag turns it; a click doesn't follow a drag
    let drag: { x: number; y: number; start: number; moved: boolean } | null = null;
    let swallowClick = false;
    const onPointerDown = (event: PointerEvent) => {
      if (!cut() || event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, start: vertical() ? element.scrollTop : element.scrollLeft, moved: false };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return;
      const along = vertical();
      const delta = along ? event.clientY - drag.y : event.clientX - drag.x;
      if (!drag.moved && Math.abs(delta) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        element.style.scrollSnapType = "none";
      }
      if (along) element.scrollTop = drag.start - delta;
      else element.scrollLeft = drag.start - delta;
    };
    const onPointerUp = () => {
      if (!drag) return;
      if (drag.moved) {
        swallowClick = true;
        element.style.removeProperty("scroll-snap-type");
        setTimeout(() => (swallowClick = false), 0);
      }
      drag = null;
    };
    const onClick = (event: MouseEvent) => {
      if (!swallowClick) return;
      event.preventDefault();
      event.stopPropagation();
      swallowClick = false;
    };
    // The arrows go from one action to the next, the wheel turning to show it
    const onKeyDown = (event: KeyboardEvent) => {
      if (!cut()) return;
      const along = vertical();
      const rtl = getComputedStyle(element).direction === "rtl";
      const next = along ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const previous = along ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      if (event.key !== next && event.key !== previous) return;
      const actions = [...element.children] as HTMLElement[];
      const index = actions.findIndex((action) => action.contains(document.activeElement));
      if (index < 0) return;
      const target = actions[index + (event.key === next ? 1 : -1)];
      const focusable = target?.matches("a, button") ? target : target?.querySelector<HTMLElement>("a, button");
      if (!focusable) return;
      event.preventDefault();
      focusable.focus({ preventScroll: true });
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    };
    const observer = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(ends);
    observer?.observe(element, { attributes: true, attributeFilter: ["data-wheel", "style"] });
    element.addEventListener("scroll", ends, { passive: true });
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    element.addEventListener("click", onClick, true);
    element.addEventListener("keydown", onKeyDown);
    ends();
    return () => {
      observer?.disconnect();
      element.removeEventListener("scroll", ends);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("keydown", onKeyDown);
    };
  }, [track]);
}

/**
 * The actions themselves, as the pill's own: their label on hover and focus,
 * a link or a button. `wheel`: cut short to that length, in px, turning to
 * show the others.
 */
export function ActionList({ items, host, wheel, inside }: { items: readonly PillActionItem[]; host: SatelliteHost; wheel?: number; inside?: boolean }): ReactNode {
  const track = useRef<HTMLDivElement | null>(null);
  useActionsWheel(track);
  return (
    <PillActions
      ref={track}
      data-inside={inside ? "" : undefined}
      data-wheel={wheel !== undefined ? "" : undefined}
      style={wheel !== undefined ? ({ "--_mp-wheel-length": `${wheel}px` } as CSSProperties) : undefined}
    >
      {items.map((item) =>
        item.href !== undefined ? (
          <PillAction
            key={item.id ?? item.label}
            icon={item.icon}
            label={item.label}
            expanded={item.expanded}
            href={item.href}
            linkComponent={host.linkComponent}
            onClick={item.onClick}
          />
        ) : (
          <PillAction key={item.id ?? item.label} icon={item.icon} label={item.label} expanded={item.expanded} onClick={item.onClick} />
        ),
      )}
    </PillActions>
  );
}

/** In the pill itself (`actionsStyle="inside"`): the actions, then a divider (the other way round on the end side). */
export function InsideActions({ host }: { host: SatelliteHost }) {
  const items = useHostActions(host);
  if (!items) return null;
  const list = <ActionList items={items} host={host} inside />;
  return host.actionsSide === "end" ? (
    <>
      <PillDivider />
      {list}
    </>
  ) : (
    <>
      {list}
      <PillDivider />
    </>
  );
}
