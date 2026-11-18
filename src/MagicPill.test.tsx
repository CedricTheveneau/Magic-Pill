import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MagicPill from "./MagicPill";
import type { MagicPillType } from "./types";

// Characterisation tests of the v8 animation sequence:
// "out" (hidden) → "entry" → 2.5 s → "active" → 5 s → "out".

const ENTRY_DELAY = 2500;
const DISPLAY_DURATION = 5000;

const notification = (message = "Hello"): MagicPillType => ({
  mode: "notification",
  notification: { icon: "info", message },
});

const navbar: MagicPillType = {
  mode: "navbar",
  navbar: { navItems: [{ icon: "arrow", label: "Home", link: "/" }] },
};

const renderPill = (pillData: MagicPillType) => {
  const utils = render(<MagicPill pillData={pillData} />);
  const pill = () => utils.container.firstElementChild as HTMLElement;
  return { ...utils, pill };
};

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("MagicPill animation sequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("notification mode", () => {
    it("enters, becomes active after 2.5 s, then exits 5 s later", () => {
      const { pill } = renderPill(notification());
      expect(pill().className).toBe("magicPill entry");

      advance(ENTRY_DELAY - 1);
      expect(pill().className).toBe("magicPill entry");

      advance(1);
      expect(pill().className).toBe("magicPill active");

      advance(DISPLAY_DURATION - 1);
      expect(pill().className).toBe("magicPill active");

      advance(1);
      expect(pill().className).toBe("magicPill out");
    });

    it("stays active while hovered and exits 5 s after the pointer leaves", () => {
      const { pill } = renderPill(notification());
      advance(ENTRY_DELAY);

      fireEvent.mouseEnter(pill());
      advance(DISPLAY_DURATION * 3);
      expect(pill().className).toBe("magicPill active");

      fireEvent.mouseLeave(pill());
      advance(DISPLAY_DURATION - 1);
      expect(pill().className).toBe("magicPill active");
      advance(1);
      expect(pill().className).toBe("magicPill out");
    });

    it("stays active when hovered since the entry animation, then exits 5 s after the pointer leaves (L15)", () => {
      const { pill } = renderPill(notification());

      fireEvent.mouseEnter(pill());
      advance(ENTRY_DELAY + DISPLAY_DURATION * 3);
      expect(pill().className).toBe("magicPill active");

      fireEvent.mouseLeave(pill());
      advance(DISPLAY_DURATION - 1);
      expect(pill().className).toBe("magicPill active");
      advance(1);
      expect(pill().className).toBe("magicPill out");
    });

    it("starts the exit timer as usual when the pointer left before the pill became active", () => {
      const { pill } = renderPill(notification());

      fireEvent.mouseEnter(pill());
      advance(1000);
      fireEvent.mouseLeave(pill());
      advance(ENTRY_DELAY - 1000 + DISPLAY_DURATION);

      expect(pill().className).toBe("magicPill out");
    });

    it("replays the animation when a hidden pill gets new content (L1)", () => {
      const { pill, rerender } = renderPill(notification("First"));
      advance(ENTRY_DELAY + DISPLAY_DURATION);
      expect(pill().className).toBe("magicPill out");

      rerender(<MagicPill pillData={notification("Second")} />);
      expect(pill().className).toBe("magicPill entry");

      advance(ENTRY_DELAY);
      expect(pill().className).toBe("magicPill active");
      advance(DISPLAY_DURATION);
      expect(pill().className).toBe("magicPill out");
    });

    it("restarts the display time when a visible pill gets new content (L1)", () => {
      const { pill, rerender } = renderPill(notification("First"));
      advance(ENTRY_DELAY + DISPLAY_DURATION - 1000);

      rerender(<MagicPill pillData={notification("Second")} />);
      advance(ENTRY_DELAY + DISPLAY_DURATION - 1);
      expect(pill().className).toBe("magicPill active");

      advance(1);
      expect(pill().className).toBe("magicPill out");
    });

    it.each<[string, MagicPillType]>([
      ["icon", { mode: "notification", notification: { icon: "coupon", message: "Hello" } }],
      ["CTA label", { mode: "notification", notification: { icon: "info", message: "Hello", cta: { icon: "arrow", label: "Go" } } }],
      ["CTA link", { mode: "notification", notification: { icon: "info", message: "Hello", cta: { icon: "arrow", link: "/go" } } }],
      ["info title", { mode: "notification", notification: { icon: "info", message: "Hello", info: { title: "Hi", content: "", closeLabel: "" } } }],
    ])("replays the animation when the %s changes (L1)", (_field, next) => {
      const { pill, rerender } = renderPill(notification("Hello"));
      advance(ENTRY_DELAY + DISPLAY_DURATION);

      rerender(<MagicPill pillData={next} />);

      expect(pill().className).toBe("magicPill entry");
    });

    it("doesn't replay the animation when re-rendered with the same content in a new object", () => {
      const { pill, rerender } = renderPill(notification("Same"));
      advance(ENTRY_DELAY + DISPLAY_DURATION);

      rerender(<MagicPill pillData={notification("Same")} />);
      advance(ENTRY_DELAY);

      expect(pill().className).toBe("magicPill out");
    });
  });

  describe("navbar mode", () => {
    it("is active straight away and never exits", () => {
      const { pill } = renderPill(navbar);

      expect(pill().className).toBe("magicPill active");
      advance(60_000);
      expect(pill().className).toBe("magicPill active");
    });

    it("ignores hover", () => {
      const { pill } = renderPill(navbar);

      fireEvent.mouseEnter(pill());
      fireEvent.mouseLeave(pill());
      advance(60_000);

      expect(pill().className).toBe("magicPill active");
    });
  });

  describe("switching mode", () => {
    it("replays the entry animation when switching from navbar to notification", () => {
      const { pill, rerender } = renderPill(navbar);

      rerender(<MagicPill pillData={notification()} />);
      expect(pill().className).toBe("magicPill active");

      advance(ENTRY_DELAY + DISPLAY_DURATION);
      expect(pill().className).toBe("magicPill out");
    });

    it("keeps a navbar visible when it replaces a notification that was still entering (L5)", () => {
      const { pill, rerender } = renderPill(notification());
      advance(1000);

      rerender(<MagicPill pillData={navbar} />);
      advance(60_000);

      expect(pill().className).toBe("magicPill active");
    });

    it("doesn't auto-hide a notification that arrives while the pointer is already on the navbar (L15)", () => {
      const { pill, rerender } = renderPill(navbar);
      fireEvent.mouseEnter(pill());

      rerender(<MagicPill pillData={notification()} />);
      advance(ENTRY_DELAY + DISPLAY_DURATION * 3);

      expect(pill().className).toBe("magicPill active");
    });
  });

  it.each([
    ["during the entry animation", 1000],
    ["while active", ENTRY_DELAY + 1000],
  ])("clears its timers when unmounted %s (L5)", (_when, elapsed) => {
    const { unmount } = renderPill(notification());
    advance(elapsed);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
