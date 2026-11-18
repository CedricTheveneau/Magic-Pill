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

    it("still starts the exit timer when the pointer entered during the entry animation (quirk)", () => {
      const { pill } = renderPill(notification());

      fireEvent.mouseEnter(pill());
      advance(ENTRY_DELAY + DISPLAY_DURATION);

      expect(pill().className).toBe("magicPill out");
    });

    it("doesn't replay the animation when only the content changes (L1)", () => {
      const { pill, rerender } = renderPill(notification("First"));
      advance(ENTRY_DELAY + DISPLAY_DURATION);
      expect(pill().className).toBe("magicPill out");

      rerender(<MagicPill pillData={notification("Second")} />);
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

    it("lets a pending notification timer hide the navbar it was replaced by (L5)", () => {
      const { pill, rerender } = renderPill(notification());
      advance(1000);

      rerender(<MagicPill pillData={navbar} />);
      expect(pill().className).toBe("magicPill active");

      // The 2.5 s entry timer was never cleared and still sees mode "notification"
      advance(ENTRY_DELAY - 1000 + DISPLAY_DURATION);
      expect(pill().className).toBe("magicPill out");
    });
  });

  it("leaves the 2.5 s entry timer running after unmount (L5)", () => {
    const { unmount } = renderPill(notification());

    unmount();

    expect(vi.getTimerCount()).toBe(1);
  });
});
