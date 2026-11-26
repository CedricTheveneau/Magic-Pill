"use client"
// The overlay's native modal <dialog>, opened and closed with the pill's own
// animations. Browsers show and remove a dialog at once: it's shown in its
// closed state first, then opened, and it only closes once its exit has
// played (CSS alone can't keep it in the top layer outside Chromium).
import { useEffect, type MouseEvent, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../utils/react";
import type { Size } from "./morph";
import type { PillPresence } from "./types";

/**
 * Whether the pointer is on the backdrop: its events target the <dialog>, as
 * those on the pill's own padding do, but fall outside its box.
 */
export function isOnBackdrop({ target, currentTarget, clientX, clientY }: MouseEvent): boolean {
  const { left, right, top, bottom } = currentTarget.getBoundingClientRect();
  return target === currentTarget && (clientX < left || clientX > right || clientY < top || clientY > bottom);
}

/**
 * Keeps the overlay's <dialog> in step with the presence. Call it before
 * `useSizeMorph`, which then animates from the closed size measured here.
 */
export function useModal(
  rootRef: RefObject<HTMLElement | null>,
  isOverlay: boolean,
  presence: PillPresence,
  lastSize: RefObject<Size | null>,
) {
  const isVisible = presence !== "hidden";

  const show = () => {
    const dialog = rootRef.current as HTMLDialogElement | null;
    if (!isOverlay || !isVisible || !dialog?.isConnected || typeof dialog.showModal !== "function") return;
    if (!dialog.open) {
      // Styled closed (reading the size forces that), so it transitions open
      dialog.dataset.presence = "hidden";
      dialog.showModal();
      lastSize.current = { width: dialog.offsetWidth, height: dialog.offsetHeight };
      dialog.dataset.presence = presence;
    }
    // A circle hides the action that just took the focus; a modal that opens
    // again before its exit is over had lost it
    if (presence === "rest" || !dialog.contains(document.activeElement)) dialog.focus();
  };

  // A layout effect: opening again must call off the closing at once, before
  // the exit's animations report that they were cancelled
  useIsomorphicLayoutEffect(() => {
    show();
    const dialog = rootRef.current as HTMLDialogElement | null;
    if (!isOverlay || isVisible || !dialog?.open) return;
    let reopened = false;
    const close = () => {
      if (!reopened && dialog.open) dialog.close();
    };
    // The exit's animations (but not a loop of the app's), if there are any
    const exit = (dialog.getAnimations?.() ?? []).filter(
      ({ effect }) => effect?.getComputedTiming().endTime !== Infinity,
    );
    if (exit.length === 0) close();
    else void Promise.allSettled(exit.map(({ finished }) => finished)).then(close);
    return () => {
      reopened = true;
    };
  }, [isOverlay, isVisible]);

  // For a dialog that wasn't on the page yet above (e.g. in a portal whose
  // container its parent has just attached)
  useEffect(() => {
    if (!(rootRef.current as HTMLDialogElement | null)?.open) show();
  }, [isOverlay, isVisible]);
}
