import { createElement, useRef } from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureSwap, planMorph, planSwap, useSizeMorph, type PanelBox, type Size } from "./morph";
import type { PillPresence } from "./types";

const TIMINGS = { fade: 150, change: 250 };
const PILL: Size = { width: 342, height: 72 };
const CIRCLE: Size = { width: 72, height: 72 };
const PANEL_SIZE: Size = { width: 342, height: 438 };
const PANEL: PanelBox = { top: 35, width: 272, rtl: false };

describe("planMorph", () => {
  it("has nothing to animate when the size doesn't change", () => {
    // Act
    const plan = planMorph(PILL, { width: 342.4, height: 72 }, "compact", "expanded", TIMINGS);

    // Assert
    expect(plan).toBeNull();
  });

  it("has nothing to animate without a duration", () => {
    // Act
    const plan = planMorph(CIRCLE, PILL, "rest", "compact", { fade: 0, change: 0 });

    // Assert
    expect(plan).toBeNull();
  });

  it("animates the real width and height, free of the stylesheet's caps", () => {
    // Act
    const plan = planMorph(CIRCLE, { width: 342, height: 106 }, "rest", "compact", TIMINGS);

    // Assert
    expect(plan?.pill).toEqual([
      expect.objectContaining({ width: "72px", height: "72px", maxWidth: "none", maxHeight: "none", minHeight: "0px" }),
      expect.objectContaining({ width: "342px", height: "106px", maxWidth: "none", maxHeight: "none", minHeight: "0px" }),
    ]);
    expect(plan?.options).toMatchObject({ duration: 250, delay: 0, fill: "backwards" });
  });

  it.each(["rest", "hidden"] as const)("waits for the content to fade out before shrinking to %s", (next) => {
    // Act
    const plan = planMorph({ width: 342, height: 106 }, CIRCLE, "compact", next, TIMINGS);

    // Assert
    expect(plan?.options.delay).toBe(150);
  });

  it("reveals an opening panel behind a fading edge that is gone once it's open", () => {
    // Act
    const plan = planMorph(PILL, PANEL_SIZE, "compact", "panel", TIMINGS, PANEL);

    // Assert: the panel keeps its open width, and only shows what's inside the pill
    const [start, end] = plan!.panel!;
    expect(start.width).toBe("272px");
    // 72 - 35 = 37px visible, all of it inside the fading edge
    expect(start.maskSize).toBe("272px 0px,272px 37px,0px 0px");
    expect(end.maskSize).toBe("272px 403px,272px 0px,0px 403px");
    expect(end.maskPosition).toBe("0px 0px,0px 403px,272px 0px");
  });

  it("fades the panel's side that the pill cuts while it's narrower", () => {
    // Act
    const plan = planMorph({ width: 184, height: 72 }, PANEL_SIZE, "compact", "panel", TIMINGS, PANEL);

    // Assert: 184px of 272px visible, the last 48px fading
    expect(plan!.panel![0].maskSize).toBe("136px 0px,136px 37px,48px 0px");
    expect(plan!.panel![0].maskPosition).toBe("0px 0px,0px 0px,136px 0px");
  });

  it("puts the side fade on the left in right-to-left pages", () => {
    // Act
    const plan = planMorph({ width: 184, height: 72 }, PANEL_SIZE, "compact", "panel", TIMINGS, { ...PANEL, rtl: true });

    // Assert: the visible part is the right one (88px to 272px), fading on its left
    expect(plan!.panel![0].maskPosition).toBe("136px 0px,136px 0px,88px 0px");
    expect(plan!.panel![0].maskImage).toContain("to right");
  });

  it("hides a closing panel behind a fading edge, and brings the pill's content back once it has shrunk", () => {
    // Act
    const plan = planMorph(PANEL_SIZE, PILL, "panel", "compact", TIMINGS, PANEL);

    // Assert
    expect(plan?.options.delay).toBe(0);
    expect(plan!.panel![0].maskSize).toBe("272px 403px,272px 0px,0px 403px");
    expect(plan!.panel![1].maskSize).toBe("272px 0px,272px 37px,0px 0px");
    expect(plan?.content).toEqual({
      keyframes: [{ opacity: 0 }, { opacity: 0, offset: 250 / 400 }, { opacity: 1 }],
      options: { duration: 400, easing: "ease-out" },
    });
  });

  it("doesn't bring the content back when the pill closes from its panel", () => {
    // Act
    const plan = planMorph(PANEL_SIZE, CIRCLE, "panel", "hidden", TIMINGS, PANEL);

    // Assert
    expect(plan?.content).toBeUndefined();
  });
});

describe("planSwap", () => {
  const TALL: Size = { width: 342, height: 126 };

  it("has nothing to animate without a duration", () => {
    // Act + Assert
    expect(planSwap(PILL, TALL, { fade: 0, change: 0 }, "center")).toBeNull();
  });

  it("slides the old content out through the top while the pill resizes, then the new one in from the bottom", () => {
    // Act
    const plan = planSwap({ width: 147, height: 72 }, TALL, TIMINGS, "center")!;

    // Assert: one overlapping movement of fade + change (400ms): out, resize, in
    expect(plan.outgoing.options).toMatchObject({ duration: 180, fill: "forwards" });
    expect(plan.outgoing.keyframes[1]).toEqual({ transform: "translateY(-72px)", opacity: 0 });
    expect(plan.pill.options).toMatchObject({ delay: 60, duration: 240, fill: "backwards" });
    expect(plan.pill.keyframes).toEqual([
      expect.objectContaining({ width: "147px", height: "72px", maxWidth: "none", maxHeight: "none", overflow: "hidden" }),
      expect.objectContaining({ width: "342px", height: "126px" }),
    ]);
    const incoming = plan.incoming(314);
    expect(incoming.options).toMatchObject({ delay: 140, duration: 260, fill: "backwards" });
    expect(incoming.keyframes).toEqual([
      expect.objectContaining({ transform: "translateY(126px)", opacity: 0 }),
      expect.objectContaining({ transform: "none", opacity: 1 }),
    ]);
  });

  it("holds the new content at its final width, so it doesn't rewrap while the pill resizes", () => {
    // Act
    const { keyframes } = planSwap(PILL, TALL, TIMINGS, "center")!.incoming(314);

    // Assert
    expect(keyframes.every((frame) => frame.width === "314px" && frame.flexShrink === 0)).toBe(true);
  });

  it.each([
    ["start", "flex-start"],
    ["center", "center"],
    ["end", "flex-end"],
  ] as const)("keeps a row's content on the %s side, which stays put", (anchor, justify) => {
    // Act
    const { keyframes } = planSwap(PILL, TALL, TIMINGS, anchor)!.pill;

    // Assert
    expect(keyframes.every((frame) => frame.justifyContent === justify)).toBe(true);
  });

  it("leaves a column's alignment alone", () => {
    // Act
    const { keyframes } = planSwap(PILL, TALL, TIMINGS)!.pill;

    // Assert
    expect(keyframes[0].justifyContent).toBeUndefined();
  });
});

describe("captureSwap", () => {
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  it("does nothing for unstyled pills or without the Web Animations API", () => {
    // Arrange
    const pill = document.createElement("div");
    pill.innerHTML = '<span data-mp="message">Hi</span>';

    // Act + Assert: no animate() in jsdom
    expect(captureSwap(pill)).toBeNull();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: vi.fn(), configurable: true });
    pill.setAttribute("data-unstyled", "");
    expect(captureSwap(pill)).toBeNull();
    expect(pill.children).toHaveLength(1);
  });
});

describe("useSizeMorph", () => {
  let size: Size;
  let animate: ReturnType<typeof vi.fn>;

  function Probe({ presence, enabled = true }: { presence: PillPresence; enabled?: boolean }) {
    const ref = useRef<HTMLDivElement | null>(null);
    useSizeMorph(ref, presence, enabled);
    return createElement("div", { ref, "data-mp": "pill" });
  }

  beforeEach(() => {
    size = CIRCLE;
    animate = vi.fn(() => ({ finished: new Promise(() => {}), cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => size.width);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => size.height);
    // jsdom has no ResizeObserver: report the size once, on observe
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: () => void) {}
        observe() {
          this.callback();
        }
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  it("animates from the size on screen to the new one when the presence changes", () => {
    // Arrange
    const { rerender } = render(createElement(Probe, { presence: "rest" }));
    size = { width: 342, height: 106 };

    // Act
    rerender(createElement(Probe, { presence: "compact" }));

    // Assert
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, options] = animate.mock.calls[0];
    expect(keyframes).toEqual([
      expect.objectContaining({ width: "72px", height: "72px" }),
      expect.objectContaining({ width: "342px", height: "106px" }),
    ]);
    expect(options).toMatchObject({ duration: 250, delay: 0 });
  });

  it("leaves re-renders at the same presence alone", () => {
    // Arrange
    const { rerender } = render(createElement(Probe, { presence: "compact" }));
    size = { width: 342, height: 106 };

    // Act
    rerender(createElement(Probe, { presence: "compact" }));

    // Assert
    expect(animate).not.toHaveBeenCalled();
  });

  it("does nothing for unstyled pills", () => {
    // Arrange
    const { rerender } = render(createElement(Probe, { presence: "rest", enabled: false }));
    size = PILL;

    // Act
    rerender(createElement(Probe, { presence: "compact", enabled: false }));

    // Assert
    expect(animate).not.toHaveBeenCalled();
  });

  it("does nothing with reduced motion", () => {
    // Arrange
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" }));
    const { rerender } = render(createElement(Probe, { presence: "rest" }));
    size = PILL;

    // Act
    rerender(createElement(Probe, { presence: "compact" }));

    // Assert
    expect(animate).not.toHaveBeenCalled();
  });
});
