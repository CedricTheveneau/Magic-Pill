import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dropShadow, gooAmount, playSplit, splitEasing, springEasing, tuckedOffset } from "./goo";

describe("the curves", () => {
  it("bouncy is a spring that overshoots and settles at 1", () => {
    const curve = springEasing();
    const values = /^linear\((.*)\)$/.exec(curve)![1].split(", ").map(Number);
    expect(values[0]).toBe(0);
    expect(values[values.length - 1]).toBe(1);
    expect(Math.max(...values)).toBeGreaterThan(1);
  });

  it("reads --mp-ease-split: a name, or any easing", () => {
    expect(splitEasing("")).toBe(springEasing());
    expect(splitEasing(" bouncy ")).toBe(springEasing());
    expect(splitEasing("pop")).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
    expect(splitEasing("smooth")).toBe("cubic-bezier(0.42, 0, 0.58, 1)");
    expect(splitEasing("ease-out")).toBe("ease-out");
  });

  it("only needs goo while the neck forms, none at the ends", () => {
    expect(gooAmount(0)).toBe(0);
    expect(gooAmount(1)).toBe(0);
    expect(gooAmount(0.4)).toBe(1);
    expect(gooAmount(0.05)).toBeGreaterThan(0);
    expect(gooAmount(0.05)).toBeLessThan(1);
  });
});

describe("tuckedOffset", () => {
  const sidebar = { left: 24, top: 100, width: 72, height: 228 };

  it("hides a circle behind a left sidebar's edge, at full size", () => {
    const circle = { left: 24 + 72 + 16, top: 178, width: 72, height: 72 };
    expect(tuckedOffset(sidebar, circle)).toEqual({ x: -(16 + 72), y: 0, scale: 1 });
  });

  it("the other way for a right sidebar", () => {
    const right = { left: 900, top: 100, width: 72, height: 228 };
    const circle = { left: 900 - 16 - 72, top: 178, width: 72, height: 72 };
    expect(tuckedOffset(right, circle)).toEqual({ x: 16 + 72, y: 0, scale: 1 });
  });

  it("under a pill, it comes out of its bottom edge", () => {
    const pill = { left: 100, top: 100, width: 72, height: 228 };
    const below = { left: 100, top: 100 + 228 + 16, width: 72, height: 72 };
    expect(tuckedOffset(pill, below)).toEqual({ x: 0, y: -(16 + 72), scale: 1 });
  });

  it("starts smaller when asked, or when it's longer than the anchor is thick", () => {
    const circle = { left: 112, top: 178, width: 72, height: 72 };
    expect(tuckedOffset(sidebar, circle, 0.5)).toEqual({ x: 96 - 18 - 148, y: 0, scale: 0.5 });
    const long = { left: 112, top: 178, width: 300, height: 72 };
    expect(tuckedOffset(sidebar, long)).toEqual({ x: 96 - 36 - 262, y: 0, scale: 0.24 });
  });
});

describe("dropShadow", () => {
  it("reads the first outer shadow", () => {
    expect(dropShadow("rgba(20, 20, 20, 0.45) 0px 8px 8px 0px")).toEqual({ color: "rgba(20, 20, 20, 0.45)", x: 0, y: 8, blur: 8 });
  });

  it("skips a theme's inset rim", () => {
    expect(dropShadow("rgba(255, 255, 255, 0.3) 0px 0px 0px 1px inset, color(srgb 0.08 0.08 0.08 / 0.28) 0px 8px 20px 0px")).toEqual({
      color: "color(srgb 0.08 0.08 0.08 / 0.28)",
      x: 0,
      y: 8,
      blur: 20,
    });
  });

  it("none is none", () => {
    expect(dropShadow("none")).toBeNull();
    expect(dropShadow("")).toBeNull();
  });
});

describe("playSplit", () => {
  let animate: ReturnType<typeof vi.fn>;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const pills = () => {
    const anchor = document.createElement("div");
    const moving = document.createElement("div");
    moving.style.background = "rgb(20 20 20)";
    document.body.append(anchor, moving);
    return { anchor, moving };
  };

  beforeEach(() => {
    animate = vi.fn(() => ({ id: "", cancel() {} }));
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true, writable: true });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 8));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    document.body.innerHTML = "";
  });

  it("draws the moving pill in the overlay while it splits, then hands it back", async () => {
    const { anchor, moving } = pills();
    playSplit(anchor, moving, "split", { delay: 0, duration: 40 });
    expect(document.querySelector('[data-mp="goo"]')).not.toBeNull();
    expect(moving.style.getPropertyValue("background-color")).toBe("transparent");
    expect(moving.style.getPropertyPriority("background-color")).toBe("important");
    // Its own transitions would fade its fill out under the overlay, over the anchor
    expect(moving.style.getPropertyValue("transition")).toBe("none");
    expect(animate).toHaveBeenCalled();
    await sleep(120);
    expect(document.querySelector('[data-mp="goo"]')).toBeNull();
    expect(moving.style.getPropertyValue("background-color")).toBe("rgb(20, 20, 20)");
    expect(moving.style.getPropertyPriority("background-color")).toBe("");
    expect(moving.style.getPropertyValue("transition")).toBe("");
  });

  it("a join waits for its delay before it moves", async () => {
    const { anchor, moving } = pills();
    playSplit(anchor, moving, "join", { delay: 60, duration: 40 });
    expect(document.querySelector('[data-mp="goo"]')).toBeNull();
    expect(animate).not.toHaveBeenCalled();
    await sleep(80);
    expect(document.querySelector('[data-mp="goo"]')).not.toBeNull();
    expect(animate).toHaveBeenCalled();
    await sleep(100);
    expect(document.querySelector('[data-mp="goo"]')).toBeNull();
  });

  it("a new one stops the last one at once", () => {
    const { anchor, moving } = pills();
    playSplit(anchor, moving, "split", { delay: 0, duration: 1000 });
    playSplit(anchor, moving, "join", { delay: 500, duration: 300 });
    expect(document.querySelectorAll('[data-mp="goo"]')).toHaveLength(0);
    expect(moving.style.getPropertyValue("background-color")).toBe("rgb(20, 20, 20)");
  });

  it("without goo, it only moves", () => {
    const { anchor, moving } = pills();
    moving.style.setProperty("--mp-goo", "0");
    playSplit(anchor, moving, "split", { delay: 0, duration: 40 });
    expect(animate).toHaveBeenCalled();
    expect(document.querySelector('[data-mp="goo"]')).toBeNull();
  });

  it("does nothing with reduced motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    const { anchor, moving } = pills();
    playSplit(anchor, moving, "split", { delay: 0, duration: 40 });
    expect(animate).not.toHaveBeenCalled();
    expect(document.querySelector('[data-mp="goo"]')).toBeNull();
  });
});
