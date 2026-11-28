import { createElement, useRef } from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExitWatch, captureSwap, planExit, planMorph, planSwap, useSizeMorph, type PanelBox, type Size } from "./morph";
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

describe("planExit", () => {
  it("keeps the pill visible and at its scale while it closes up, then scales it out, as the stylesheet times it", () => {
    // Act
    const plan = planExit({ scale: "1", content: "1" }, TIMINGS, 300);

    // Assert: 400ms of fade and size change, then 300ms of scaling out
    expect(plan?.pill.options).toMatchObject({ duration: 700 });
    expect(plan?.pill.keyframes).toEqual([
      { scale: "1", visibility: "visible" },
      { scale: "1", visibility: "visible", offset: 400 / 700, easing: "ease-in" },
      { scale: "0", visibility: "visible" },
    ]);
    expect(plan?.content).toEqual({
      keyframes: [{ opacity: "1" }, { opacity: "0" }],
      options: expect.objectContaining({ duration: 150, easing: "ease-in" }),
    });
  });

  it("ends at the scale the stylesheet asks for: a flag goes back into its sidebar at its own size", () => {
    // Act
    const plan = planExit({ scale: "1", content: "1", to: "1" }, TIMINGS, 300);

    // Assert
    expect(plan?.pill.keyframes[2]).toEqual({ scale: "1", visibility: "visible" });
  });

  it("starts from where an entry under way had got to", () => {
    // Act
    const plan = planExit({ scale: "0.6", content: "0.3" }, TIMINGS, 300);

    // Assert
    expect(plan?.pill.keyframes[0]).toMatchObject({ scale: "0.6" });
    expect(plan?.content?.keyframes[0]).toEqual({ opacity: "0.3" });
  });

  it("leaves content that is already out of sight alone (a circle leaving)", () => {
    // Act + Assert
    expect(planExit({ scale: "1" }, TIMINGS, 300)?.content).toBeUndefined();
  });

  it("has nothing to play without an exit duration", () => {
    // Act + Assert
    expect(planExit({ scale: "1" }, TIMINGS, 0)).toBeNull();
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

  it("turns the other way for a pill at the top: out through the bottom, in from the top", () => {
    // Act
    const plan = planSwap({ width: 147, height: 72 }, TALL, TIMINGS, "center", true)!;

    // Assert
    expect(plan.outgoing.keyframes[1]).toEqual({ transform: "translateY(72px)", opacity: 0 });
    expect(plan.incoming(314).keyframes[0]).toMatchObject({ transform: "translateY(-126px)", opacity: 0 });
  });

  it("holds the new content at its final width, so it doesn't rewrap while the pill resizes", () => {
    // Act
    const { keyframes } = planSwap(PILL, TALL, TIMINGS, "center")!.incoming(314);

    // Assert
    expect(keyframes.every((frame) => frame.width === "314px" && frame.flexShrink === 0)).toBe(true);
  });

  it("rounds the held width up, so the text never gets a hair too narrow", () => {
    // Act
    const { keyframes } = planSwap(PILL, TALL, TIMINGS, "center")!.incoming(140.123);

    // Assert
    expect(keyframes[0].width).toBe("140.13px");
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

  it.each([
    ["top", true],
    ["top-end", true],
    ["bottom", false],
    ["inline", false],
  ])("lays an inert copy over a %s pill, which turns down: %s", (placement, down) => {
    // Arrange
    Object.defineProperty(HTMLElement.prototype, "animate", { value: vi.fn(), configurable: true });
    const pill = document.createElement("div");
    pill.dataset.placement = placement;
    pill.innerHTML = '<span data-mp="message" id="m">Hi</span>';

    // Act
    const capture = captureSwap(pill)!;

    // Assert
    expect(capture.down).toBe(down);
    expect(capture.outgoing.parentElement).toBe(pill);
    expect(capture.outgoing.hasAttribute("inert")).toBe(true);
    expect(capture.outgoing.querySelector("[id]")).toBeNull();
  });

  it("freezes the copy's layout when asked, so it stays as it was while the pill turns", () => {
    // Arrange: a column, as in a sidebar
    Object.defineProperty(HTMLElement.prototype, "animate", { value: vi.fn(), configurable: true });
    const pill = document.createElement("div");
    pill.innerHTML = '<nav data-mp="navbar" style="display: flex; flex-direction: column"><a>Home</a></nav>';
    document.body.append(pill);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 44, height: 120 } as DOMRect);

    // Act
    const frozen = captureSwap(pill, { freeze: true })!.outgoing.firstElementChild as HTMLElement;
    const loose = captureSwap(pill)!.outgoing.firstElementChild as HTMLElement;

    // Assert
    expect(frozen.style.flexDirection).toBe("column");
    expect([frozen.style.width, frozen.style.height]).toEqual(["44px", "120px"]);
    expect(loose.style.width).toBe("");
    pill.remove();
    vi.restoreAllMocks();
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
    useSizeMorph(ref, presence, enabled, useRef<Size | null>(null));
    return createElement("div", { ref, "data-mp": "pill" }, createElement("span", { "data-mp": "message" }, "Saved"));
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

  it("starts from the observed size to the fraction of a pixel, rounded up, so a closing message doesn't wrap", () => {
    // Arrange: 327.404px on screen, which offsetWidth rounds down
    size = { width: 327, height: 72 };
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: (entries: unknown[]) => void) {}
        observe() {
          this.callback([{ borderBoxSize: [{ inlineSize: 327.404, blockSize: 72 }] }]);
        }
        disconnect() {}
      },
    );
    const { rerender } = render(createElement(Probe, { presence: "compact" }));
    size = CIRCLE;

    // Act
    rerender(createElement(Probe, { presence: "hidden" }));

    // Assert
    expect(animate.mock.calls[0][0][0]).toMatchObject({ width: "327.41px", height: "72px" });
  });

  it("animates from the size on screen to the new one when the presence changes", () => {
    // Arrange
    const { rerender } = render(createElement(Probe, { presence: "rest" }));
    size = { width: 342, height: 106 };

    // Act
    rerender(createElement(Probe, { presence: "compact" }));

    // Assert: the pill's own animation (its message is held too, see below)
    const pillCalls = animate.mock.calls.filter((_, index) => (animate.mock.contexts[index] as HTMLElement).dataset.mp === "pill");
    expect(pillCalls).toHaveLength(1);
    const [keyframes, options] = pillCalls[0];
    expect(keyframes).toEqual([
      expect.objectContaining({ width: "72px", height: "72px" }),
      expect.objectContaining({ width: "342px", height: "106px" }),
    ]);
    expect(options).toMatchObject({ duration: 250, delay: 0 });
  });

  it("holds the message at its final width while the pill grows, so it doesn't unwrap as it fades in", () => {
    // Arrange: once the pill's animation starts, it's back at the circle's size,
    // and the message would measure squeezed
    let pillAnimated = false;
    animate.mockImplementation(function (this: HTMLElement) {
      if (this.dataset.mp === "pill") pillAnimated = true;
      return { finished: new Promise(() => {}), cancel: vi.fn() };
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ width: pillAnimated ? 0 : 141.2 }) as DOMRect,
    );
    const { rerender } = render(createElement(Probe, { presence: "rest" }));
    size = PILL;

    // Act
    rerender(createElement(Probe, { presence: "compact" }));

    // Assert
    const call = animate.mock.calls.find((_, index) => (animate.mock.contexts[index] as HTMLElement).dataset.mp === "message");
    expect(call?.[0]).toEqual([
      { flexShrink: 0, width: "141.2px" },
      { flexShrink: 0, width: "141.2px" },
    ]);
  });

  it("lets the message go when the pill closes (it fades out first)", () => {
    // Arrange
    const { rerender } = render(createElement(Probe, { presence: "compact" }));
    size = CIRCLE;

    // Act
    rerender(createElement(Probe, { presence: "rest" }));

    // Assert
    expect(animate.mock.contexts.some((element) => (element as HTMLElement).dataset.mp === "message")).toBe(false);
  });

  it("plays the exit by script when the pill hides, so a restyle of the page can't cut it short", () => {
    // Arrange: a circle leaving, with no size to change
    const { rerender } = render(createElement(Probe, { presence: "rest" }));

    // Act
    rerender(createElement(Probe, { presence: "hidden" }));

    // Assert
    const pillCalls = animate.mock.calls.filter((_, index) => (animate.mock.contexts[index] as HTMLElement).dataset.mp === "pill");
    expect(pillCalls).toHaveLength(1);
    expect(pillCalls[0][0].at(-1)).toEqual({ scale: "0", visibility: "visible" });
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

describe("ExitWatch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  });

  it("stops the exit when the pill is asked back mid-way, and grows it back from where it was", () => {
    // Arrange: halfway through scaling out, with the stylesheet's transition left over
    const exit = { id: "mp-exit", cancel: vi.fn() };
    const leftover = { id: "", transitionProperty: "scale", cancel: vi.fn() };
    let running: object[] = [exit, leftover];
    exit.cancel.mockImplementation(() => (running = [leftover]));
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "getAnimations", { value: () => running, configurable: true });
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    // jsdom doesn't know the scale property
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ scale: "0.5", getPropertyValue: () => "" } as never);
    const element = document.createElement("div");
    const target = { current: element };
    const { rerender } = render(createElement(ExitWatch, { presence: "hidden", target }));

    // Act
    rerender(createElement(ExitWatch, { presence: "compact", target }));

    // Assert
    expect(exit.cancel).toHaveBeenCalled();
    expect(leftover.cancel).toHaveBeenCalled();
    expect(animate).toHaveBeenCalledWith([{ scale: "0.5" }, { scale: "1" }], expect.objectContaining({ duration: 250 }));
  });
});
