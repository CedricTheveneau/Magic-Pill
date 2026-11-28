import { describe, expect, it } from "vitest";

import { orbitalAt, planOrbit, type OrbitInput } from "./orbits";

const input = (overrides: Partial<OrbitInput> = {}): OrbitInput => ({
  electron: { left: 400, top: 400, width: 72, height: 72 },
  count: 3,
  size: 44,
  distance: 14,
  spread: 0,
  away: -90,
  obstacles: [],
  viewport: { width: 1000, height: 800 },
  rtl: false,
  ...overrides,
});

const overlaps = (spot: { x: number; y: number }, box: { left: number; top: number; width: number; height: number }, size: number) =>
  Math.abs(spot.x - (box.left + box.width / 2)) < box.width / 2 + size / 2 &&
  Math.abs(spot.y - (box.top + box.height / 2)) < box.height / 2 + size / 2;

describe("planOrbit", () => {
  it("fans them out away from the edge, at the set distance, as tight as they fit", () => {
    const orbit = planOrbit(input());
    expect(orbit.clear).toBe(true);
    expect(orbit.radius).toBe(36 + 14 + 22);
    expect(orbit.spots[1].angle).toBeCloseTo(-90);
    expect(orbit.spots[0].angle).toBeLessThan(-90);
    expect(orbit.spots[2].angle).toBeGreaterThan(-90);
    for (const spot of orbit.spots) expect(Math.hypot(spot.x - 436, spot.y - 436)).toBeCloseTo(72);
  });

  it("keeps clear of the pill next to it and of the screen's edges, moving out if it must", () => {
    // A phone's bottom right corner: the electron, and the navbar on its left
    const navbar = { left: 31, top: 704, width: 240, height: 72 };
    const orbit = planOrbit(
      input({ electron: { left: 287, top: 704, width: 72, height: 72 }, obstacles: [navbar], viewport: { width: 390, height: 800 } }),
    );
    expect(orbit.clear).toBe(true);
    for (const spot of orbit.spots) {
      expect(overlaps(spot, navbar, 44)).toBe(false);
      expect(spot.x + 22).toBeLessThanOrEqual(390);
      expect(spot.y + 22).toBeLessThanOrEqual(800);
    }
  });

  it("follows the spread asked for when it fits", () => {
    const orbit = planOrbit(input({ spread: 120 }));
    expect(orbit.step).toBeCloseTo(60);
  });

  it("puts the first one on the right in a right-to-left page", () => {
    const orbit = planOrbit(input({ rtl: true }));
    expect(orbit.spots[0].x).toBeGreaterThan(orbit.spots[2].x);
  });

  it("says when they can't all be clear", () => {
    const orbit = planOrbit(input({ viewport: { width: 120, height: 120 }, electron: { left: 24, top: 24, width: 72, height: 72 } }));
    expect(orbit.clear).toBe(false);
    expect(orbit.spots).toHaveLength(3);
  });
});

describe("orbitalAt", () => {
  const orbit = planOrbit(input());

  it("finds the orbital under a point by its angle", () => {
    const [first, middle] = orbit.spots;
    expect(orbitalAt(orbit, 44, 36, middle.x, middle.y)).toBe(1);
    expect(orbitalAt(orbit, 44, 36, first.x, first.y)).toBe(0);
  });

  it("none in the middle of the electron, nor far away", () => {
    expect(orbitalAt(orbit, 44, 36, 436, 436)).toBe(-1);
    expect(orbitalAt(orbit, 44, 36, 436, 100)).toBe(-1);
  });
});
