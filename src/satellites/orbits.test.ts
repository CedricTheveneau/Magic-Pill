import { describe, expect, it } from "vitest";

import { orbitalAt, planOrbit, spotOn, wheelEnd, type OrbitInput } from "./orbits";

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

describe("the wheel", () => {
  // Eight orbitals in a phone's bottom right corner, next to the navbar
  const navbar = { left: 31, top: 704, width: 240, height: 72 };
  const corner = (overrides: Partial<OrbitInput> = {}) =>
    planOrbit(
      input({
        electron: { left: 287, top: 704, width: 72, height: 72 },
        count: 8,
        obstacles: [navbar],
        viewport: { width: 390, height: 800 },
        ...overrides,
      }),
    );

  it("shows what fits, clear of everything, when they don't all fit", () => {
    const orbit = corner();
    expect(orbit.wheel).toBe(true);
    expect(orbit.clear).toBe(true);
    expect(orbit.visible).toBeGreaterThan(1);
    expect(orbit.visible).toBeLessThan(8);
    expect(wheelEnd(orbit)).toBe(8 - orbit.visible);
    for (let index = 0; index < orbit.visible; index++) {
      const spot = spotOn(orbit, index);
      expect(spot.shown).toBe(1);
      expect(overlaps(spot, navbar, 44)).toBe(false);
    }
  });

  it("lets the next one peek out faintly where its spot is clear, and hides the rest", () => {
    const orbit = corner();
    const next = spotOn(orbit, orbit.visible);
    expect(next.shown).toBeCloseTo(orbit.peek.high ? 0.2 : 0);
    expect(spotOn(orbit, orbit.visible + 1).shown).toBe(0);
    // Turned, the one before the arc's start peeks out only if it's clear of the navbar
    const before = spotOn(orbit, 0, 1);
    expect(before.shown).toBeCloseTo(orbit.peek.low ? 0.2 : 0);
    if (before.shown > 0) expect(overlaps(before, navbar, 44)).toBe(false);
  });

  it("doesn't peek over the first ones on a wheel that goes all the way round", () => {
    const orbit = planOrbit(input({ count: 20 }));
    expect(orbit.wheel).toBe(true);
    expect(orbit.peek).toEqual({ low: false, high: false });
    expect(spotOn(orbit, orbit.visible).shown).toBe(0);
  });

  it("turns: the next ones take the slots, the first ones fade out", () => {
    const orbit = corner();
    const turned = spotOn(orbit, 2, 2);
    expect(turned.angle).toBeCloseTo(spotOn(orbit, 0).angle);
    expect(turned.shown).toBe(1);
    expect(spotOn(orbit, 0, 2).shown).toBe(0);
  });

  it("starts from the right in a right-to-left page", () => {
    const orbit = corner({ rtl: true });
    const first = spotOn(orbit, 0);
    const second = spotOn(orbit, 1);
    expect(first.shown).toBe(1);
    expect(first.x).toBeGreaterThan(second.x);
  });

  it("only picks the ones that show", () => {
    const orbit = corner();
    const hidden = spotOn(orbit, 4, 0);
    expect(hidden.shown).toBe(0);
    expect(orbitalAt(orbit, 44, 36, hidden.x, hidden.y)).not.toBe(4);
  });

  it("isn't one when they fit", () => {
    const orbit = planOrbit(input());
    expect(orbit.wheel).toBe(false);
    expect(orbit.visible).toBe(3);
  });
});
