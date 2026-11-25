"use client"
// A popover over everything (the top layer), next to the field that opened it.
// Placed by script: CSS anchor positioning isn't everywhere yet.
import { useEffect, useLayoutEffect, type RefObject } from "react";

/** From the field, and from the screen's edges */
const GAP = 6;
const MARGIN = 8;

const supportsPopover = () => typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

/** Where it goes: under the field, or above it when there's more room there. Pure, so it can be tested. */
export function placePopover(
  field: { top: number; bottom: number; left: number; right: number },
  popover: { width: number; height: number },
  viewport: { width: number; height: number },
  isRtl: boolean,
): { left: number; top: number; maxHeight: number; above: boolean } {
  const below = viewport.height - field.bottom - GAP - MARGIN;
  const over = field.top - GAP - MARGIN;
  const above = popover.height > below && over > below;
  const maxHeight = Math.max(0, above ? over : below);
  const height = Math.min(popover.height, maxHeight);
  const wanted = isRtl ? field.right - popover.width : field.left;
  return {
    left: Math.max(MARGIN, Math.min(wanted, viewport.width - popover.width - MARGIN)),
    top: above ? field.top - GAP - height : field.bottom + GAP,
    maxHeight,
    above,
  };
}

/**
 * Shows the popover while it's open, next to its field, and follows it. A press
 * elsewhere closes it. Without popovers, it's shown in the page, under the field.
 */
export function usePopover(
  popoverRef: RefObject<HTMLElement | null>,
  fieldRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const field = fieldRef.current;
    if (!isOpen || !popover || !field || !supportsPopover()) return;
    popover.showPopover();
    const place = () => {
      popover.style.maxHeight = "";
      const { left, top, maxHeight, above } = placePopover(
        field.getBoundingClientRect(),
        { width: popover.offsetWidth, height: popover.scrollHeight },
        { width: document.documentElement.clientWidth, height: window.innerHeight },
        getComputedStyle(field).direction === "rtl",
      );
      Object.assign(popover.style, { left: `${left}px`, top: `${top}px`, maxHeight: `${maxHeight}px` });
      popover.toggleAttribute("data-above", above);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { capture: true, passive: true });
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(place);
    observer?.observe(field);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, { capture: true });
      observer?.disconnect();
      try {
        popover.hidePopover();
      } catch {
        // It left the page with its field
      }
    };
  }, [popoverRef, fieldRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !fieldRef.current?.contains(target)) onClose();
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  });
}
