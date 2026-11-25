"use client"
// The on-screen keyboard covers the bottom of the page (on iOS always, on
// Android unless the page asks to be resized). While a field of the pill has
// the focus, the pill stays above it (--_mp-keyboard, in forms.css).
import { useEffect, type RefObject } from "react";

/** Smaller than any keyboard: a toolbar that came back, a zoomed page… */
const MIN_HEIGHT = 120;

const opensKeyboard = (element: Element | null) =>
  !!element?.matches("input:not([type=checkbox], [type=radio], [type=range], [type=color], [type=file]), textarea");

export function useKeyboard(pillRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const pill = pillRef.current;
    const viewport = window.visualViewport;
    if (!pill || !viewport) return;
    const update = () => {
      const isTyping = pill.contains(document.activeElement) && opensKeyboard(document.activeElement);
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      if (isTyping && viewport.scale === 1 && covered > MIN_HEIGHT) {
        pill.style.setProperty("--_mp-keyboard", `${Math.round(covered)}px`);
      } else {
        pill.style.removeProperty("--_mp-keyboard");
      }
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    pill.addEventListener("focusin", update);
    pill.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      pill.removeEventListener("focusin", update);
      pill.removeEventListener("focusout", update);
      pill.style.removeProperty("--_mp-keyboard");
    };
  }, [pillRef]);
}
