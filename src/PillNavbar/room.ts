"use client"
// On a narrow screen, the pill may have no room for two labels: the current
// page's and the one of the item you point at. The pill would clip the last
// items, so the labels that were open fold while the other one is.
//
// Its `labels` say what shows at rest: the current page's label ("current"),
// none ("closed"), or the current one while it fits ("auto": it folds when
// the pill has no room for it, e.g. next to an electron).
import { useEffect, type RefObject } from "react";

const ACTION = '[data-mp="action"]';

/** Which labels a navbar shows at rest. */
export type NavLabels = "current" | "closed" | "auto";

/** A copy of the pill with its navbar, laid out next to it, hidden, to measure. Removed by the caller. */
function layOutCopy(pill: HTMLElement, prepare: (navbar: HTMLElement) => void): { copy: HTMLElement; navbar: HTMLElement } | null {
  const copy = pill.cloneNode(false) as HTMLElement;
  for (const child of pill.children) {
    if (child.getAttribute("data-mp") !== "panel") copy.append(child.cloneNode(true));
  }
  // No radio groups shared with the real content
  copy.querySelectorAll("[id], [name]").forEach((node) => {
    node.removeAttribute("id");
    node.removeAttribute("name");
  });
  const navbar = copy.querySelector<HTMLElement>('[data-mp="navbar"]');
  if (!navbar) return null;
  navbar.removeAttribute("data-tight");
  prepare(navbar);
  // At its full length: on screen, a label with no room is cut short
  copy.querySelectorAll<HTMLElement>('[data-mp="navbar"], [data-mp="actions"], [data-mp="action"]').forEach((node) => {
    node.style.flexShrink = "0";
  });
  copy.inert = true;
  copy.style.visibility = "hidden";
  pill.after(copy);
  return { copy, navbar };
}

/**
 * Whether the navbar still fits its pill with this item's label open (or as
 * it is at rest, with no item; `unfold`: with the current page's label open
 * even if it's folded). Laid out on a copy, removed before anything is
 * painted: the labels on screen may be moving, and the app's own styles count.
 */
export function fitsWith(navbar: HTMLElement, item: Element | null, { unfold = false } = {}): boolean {
  const pill = navbar.closest<HTMLElement>('[data-mp="pill"]');
  if (!pill) return true;
  const index = item ? [...navbar.querySelectorAll(ACTION)].indexOf(item) : -1;
  const laidOut = layOutCopy(pill, (copied) => {
    if (unfold) copied.removeAttribute("data-folded");
    if (index >= 0) copied.querySelectorAll(ACTION)[index]?.setAttribute("data-expanded", "");
  });
  if (!laidOut) return true;
  const fits = isInside(laidOut.navbar, laidOut.copy);
  laidOut.copy.remove();
  return fits;
}

/**
 * How wide the pill is with all its navbar's labels folded, or its own width
 * if it has no navbar that can fold them (`labels="current"`). The
 * satellites ask, to know whether an electron fits next to it.
 */
export function foldedWidth(pill: HTMLElement): number {
  const navbar = pill.querySelector<HTMLElement>('[data-mp="navbar"]');
  if (!navbar || navbar.dataset.labels === "current") return pill.offsetWidth;
  const laidOut = layOutCopy(pill, (copied) => copied.setAttribute("data-folded", ""));
  if (!laidOut) return pill.offsetWidth;
  const width = laidOut.copy.offsetWidth;
  laidOut.copy.remove();
  return width;
}

/** Whether the navbar ends before the pill's padding does. */
function isInside(navbar: HTMLElement, pill: HTMLElement): boolean {
  const style = getComputedStyle(pill);
  const room = pill.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  return navbar.scrollWidth <= room + 1;
}

const isHorizontal = (navbar: HTMLElement) => {
  const pill = navbar.closest<HTMLElement>('[data-mp="pill"]');
  return pill?.dataset.orientation === "horizontal" && pill.dataset.unstyled === undefined;
};

/**
 * Writes `data-tight` on the navbar while the item pointed at (or focused with
 * the keyboard) has no room for its label next to the open ones, and
 * `data-folded` while the current page's label folds at rest (`labels`).
 */
export function useRoom(ref: RefObject<HTMLElement | null>, labels: NavLabels = "auto") {
  useEffect(() => {
    const navbar = ref.current;
    if (!navbar) return;
    const fold = (folded: boolean) => {
      if (folded) navbar.setAttribute("data-folded", "");
      else navbar.removeAttribute("data-folded");
    };
    if (labels !== "auto") {
      fold(labels === "closed");
      return () => fold(false);
    }
    // Automatic: folded while the current page's label has no room, checked
    // again whenever the room may change (once per frame at most)
    const pill = navbar.closest<HTMLElement>('[data-mp="pill"]');
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fold(isHorizontal(navbar) && !fitsWith(navbar, null, { unfold: true })));
    };
    fold(isHorizontal(navbar) && !fitsWith(navbar, null, { unfold: true }));
    const mutations = new MutationObserver(update);
    mutations.observe(navbar, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    if (pill) mutations.observe(pill, { attributes: true, attributeFilter: ["style", "data-orientation", "data-presence"] });
    const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    if (pill) sizes?.observe(pill);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      sizes?.disconnect();
      window.removeEventListener("resize", update);
      fold(false);
    };
  }, [ref, labels]);

  useEffect(() => {
    const navbar = ref.current;
    if (!navbar) return;
    const release = () => navbar.removeAttribute("data-tight");
    const open = (target: EventTarget | null) => {
      const item = target instanceof Element ? target.closest(ACTION) : null;
      if (!item) return;
      const isAlreadyOpen = item.matches('[aria-current="page"], [aria-current="true"], [data-expanded]');
      if (isAlreadyOpen || !isHorizontal(navbar) || fitsWith(navbar, item)) release();
      else navbar.setAttribute("data-tight", "");
    };
    // A tap doesn't hover: it doesn't open the label either (L20)
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "touch") open(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) open(event.target);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!navbar.contains(event.relatedTarget as Node | null)) release();
    };
    navbar.addEventListener("pointerover", onPointerOver);
    navbar.addEventListener("pointerleave", release);
    navbar.addEventListener("focusin", onFocusIn);
    navbar.addEventListener("focusout", onFocusOut);
    return () => {
      navbar.removeEventListener("pointerover", onPointerOver);
      navbar.removeEventListener("pointerleave", release);
      navbar.removeEventListener("focusin", onFocusIn);
      navbar.removeEventListener("focusout", onFocusOut);
    };
  }, [ref]);
}
