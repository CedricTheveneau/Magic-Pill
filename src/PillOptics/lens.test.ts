import { afterEach, describe, expect, it, vi } from "vitest";

import { BEND, canRefract, lensId, lensMap, makeLens } from "./lens";

const decode = (uri: string) => decodeURIComponent(uri.replace("data:image/svg+xml,", ""));

describe("BEND", () => {
  it("bends most near the edge, less and less inwards, and not at all on the flat top", () => {
    // Assert
    expect(Math.max(...BEND)).toBe(1);
    expect(BEND[BEND.length - 1]).toBeCloseTo(0, 2);
    for (let step = 3; step < BEND.length; step++) expect(BEND[step]).toBeLessThan(BEND[step - 1]);
  });
});

describe("makeLens", () => {
  it("turns the tokens into a lens", () => {
    // Assert
    expect(makeLens(36, 22, 0.55, 0.15)).toEqual({ radius: 36, edge: 22, depth: 49.5, fringe: 0.15 });
  });

  it("never has an edge wider than its corners", () => {
    // Assert
    expect(makeLens(20, 36, 0.5, 0)?.edge).toBe(20);
  });

  it.each([
    ["refraction", [36, 22, 0, 0]],
    ["negative refraction", [36, 22, -1, 0]],
    ["edge", [36, 0, 0.5, 0]],
    ["round corners", [0, 22, 0.5, 0]],
  ] as const)("is nothing without %s", (_, [radius, edge, refraction, fringe]) => {
    // Assert
    expect(makeLens(radius, edge, refraction, fringe)).toBeNull();
  });

  it("is shared by pills with about the same one, and its id is safe in url(#…)", () => {
    // Arrange
    const first = makeLens(36, 22, 0.55, 0.15)!;
    const second = makeLens(36.1, 22.1, 0.551, 0.152)!;

    // Assert
    expect(lensId(second)).toBe(lensId(first));
    expect(lensId(first)).toMatch(/^[\w-]+$/);
    expect(lensId(makeLens(40, 22, 0.55, 0.15)!)).not.toBe(lensId(first));
  });
});

describe("lensMap", () => {
  it("is a well-formed SVG laid out with percentages, so it follows the pill's size", () => {
    // Arrange
    const svg = decode(lensMap({ radius: 36, edge: 22 }));

    // Act
    const { documentElement } = new DOMParser().parseFromString(svg, "image/svg+xml");

    // Assert
    expect(documentElement.nodeName).toBe("svg");
    expect(documentElement.getAttribute("width")).toBe("100%");
    expect(documentElement.hasAttribute("viewBox")).toBe(false);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  });

  it("has no HTML in it (Chromium doesn't draw it in a filter) and loads nothing", () => {
    // Arrange
    const svg = decode(lensMap({ radius: 40, edge: 40 }));

    // Assert
    expect(svg).not.toMatch(/foreignObject|https?:(?!\/\/www\.w3\.org)/);
    expect(svg).not.toMatch(/NaN|Infinity/);
  });
});

describe("canRefract", () => {
  const stub = (supports: boolean, gl: unknown) => {
    vi.stubGlobal("CSS", { supports: () => supports });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as null);
  };
  afterEach(() => vi.unstubAllGlobals());

  it("is for Chromium with a GPU", () => {
    // Arrange
    const loseContext = vi.fn();
    stub(true, { getExtension: () => ({ loseContext }) });

    // Act
    const result = canRefract();

    // Assert: and the context it took to find out is given back
    expect(result).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it.each([
    ["Safari and Firefox", false, { getExtension: () => null }],
    ["Chromium without a GPU", true, null],
  ])("isn't for %s", (_, supports, gl) => {
    // Arrange
    stub(supports, gl);

    // Assert
    expect(canRefract()).toBe(false);
  });

  it("is false rather than an error where CSS.supports doesn't exist", () => {
    // Arrange
    vi.stubGlobal("CSS", undefined);

    // Assert
    expect(canRefract()).toBe(false);
  });
});
