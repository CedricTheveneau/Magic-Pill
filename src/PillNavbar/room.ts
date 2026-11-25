"use client"
// On a narrow screen, the pill may have no room for two labels: the current
// page's and the one of the item you point at. The pill would clip the last
// items, so the labels that were open fold while the other one is.
import { useEffect, type RefObject } from "react";

const ACTION = '[data-mp="action"]';

/**
 * Whether the navbar still fits its pill with this item's label open. Laid out
 * on a copy, removed before anything is painted: the labels on screen may be
 * moving, and the app's own styles count.
 */
export function fitsWith(navbar: HTMLElement, item: Element): boolean {
  const pill = navbar.closest<HTMLElement>('[data-mp="pill"]');
  if (!pill) return true;
  const index = [...navbar.querySelectorAll(ACTION)].indexOf(item);
  const copy = pill.cloneNode(false) as HTMLElement;
  for (const child of pill.children) {
    if (child.getAttribute("data-mp") !== "panel") copy.append(child.cloneNode(true));
  }
  // No radio groups shared with the real content
  copy.querySelectorAll("[id], [name]").forEach((node) => {
    node.removeAttribute("id");
    node.removeAttribute("name");
  });
  const copiedNavbar = copy.querySelector<HTMLElement>('[data-mp="navbar"]');
  if (!copiedNavbar) return true;
  copiedNavbar.removeAttribute("data-tight");
  copiedNavbar.querySelectorAll(ACTION)[index]?.setAttribute("data-expanded", "");
  // At its full length: on screen, a label with no room is cut short
  copy.querySelectorAll<HTMLElement>('[data-mp="navbar"], [data-mp="actions"], [data-mp="action"]').forEach((node) => {
    node.style.flexShrink = "0";
  });
  copy.inert = true;
  copy.style.visibility = "hidden";
  pill.after(copy);
  const fits = isInside(copiedNavbar, copy);
  copy.remove();
  return fits;
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
 * the keyboard) has no room for its label next to the open ones.
 */
export function useRoom(ref: RefObject<HTMLElement | null>) {
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
