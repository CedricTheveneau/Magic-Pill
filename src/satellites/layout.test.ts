import { describe, expect, it } from "vitest";

import { planSatellites, type SatelliteLayoutInput } from "./layout";

const electron = (id: string) => ({ id, width: 72, height: 72 });

// A phone: 375 × 720, a navbar pill 228 px wide, centred at the bottom
const phone = (overrides: Partial<SatelliteLayoutInput> = {}): SatelliteLayoutInput => ({
  viewport: { width: 375, height: 720 },
  host: { left: (375 - 228) / 2, top: 720 - 24 - 72, width: 228, height: 72 },
  placement: "bottom",
  vertical: false,
  rtl: false,
  electrons: [electron("e1")],
  side: "after",
  line: "along",
  arrange: "gather",
  gap: 16,
  offset: 24,
  ...overrides,
});

describe("planSatellites", () => {
  it("centres the pill and its electron as a group, the electron after the pill", () => {
    const layout = planSatellites(phone());
    // The group is 228 + 16 + 72 = 316 px wide: it starts at (375 - 316) / 2
    expect(layout.shift).toBe(29.5 - 73.5);
    expect(layout.boxes.e1).toEqual({ left: 29.5 + 228 + 16, top: 624, width: 72, height: 72 });
    expect(layout.reserve).toBe(16 + 72);
  });

  it("mirrors it in a right-to-left page", () => {
    const layout = planSatellites(phone({ rtl: true }));
    expect(layout.shift).toBe(44);
    expect(layout.boxes.e1.left).toBe(29.5);
  });

  it("puts it before the pill", () => {
    const layout = planSatellites(phone({ side: "before" }));
    expect(layout.boxes.e1.left).toBe(29.5);
    expect(layout.shift).toBe(29.5 + 72 + 16 - 73.5);
  });

  it("puts it beside the pill, a row towards the page, at the pill's end: the pill stays put", () => {
    const layout = planSatellites(phone({ side: "beside" }));
    expect(layout.shift).toBe(0);
    expect(layout.boxes.e1).toEqual({ left: 73.5 + 228 - 72, top: 624 - 16 - 72, width: 72, height: 72 });
    expect(layout.reserve).toBe(0);
  });

  it("short of room, moves the last ones beside the pill", () => {
    const layout = planSatellites(phone({ electrons: [electron("e1"), electron("e2")] }));
    expect(layout.movedBeside).toEqual(["e2"]);
    expect(layout.boxes.e1.top).toBe(624);
    expect(layout.boxes.e2.top).toBe(624 - 16 - 72);
  });

  it("keeps it in the row when the navbar can fold its labels to make room", () => {
    // 298 px with its current page's label, 228 px folded: 228 + 16 + 72 fits the 342 px a phone leaves
    const layout = planSatellites(phone({ host: { left: 46, top: 624, width: 298, height: 72 }, hostMin: 228 }));
    expect(layout.movedBeside).toEqual([]);
    expect(layout.boxes.e1.top).toBe(624);
    expect(layout.reserve).toBe(88);
    // Not even folded: above it, as before
    expect(planSatellites(phone({ host: { left: 30, top: 624, width: 330, height: 72 }, hostMin: 300 })).movedBeside).toEqual(["e1"]);
  });

  it("stacks several across, on the first one", () => {
    const layout = planSatellites(phone({ electrons: [electron("e1"), electron("e2")], line: "across" }));
    expect(layout.boxes.e2).toEqual({ ...layout.boxes.e1, top: layout.boxes.e1.top - 16 - 72 });
    expect(layout.movedBeside).toEqual([]);
  });

  it("spreads them to the screen's edges, the pill staying where it is", () => {
    const tablet = phone({
      viewport: { width: 960, height: 580 },
      host: { left: 340, top: 580 - 24 - 72, width: 280, height: 72 },
      arrange: "spread",
      side: "before",
    });
    const layout = planSatellites(tablet);
    expect(layout.shift).toBe(0);
    expect(layout.boxes.e1.left).toBe(24);
    expect(planSatellites({ ...tablet, side: "after" }).boxes.e1.left).toBe(960 - 24 - 72);
  });

  it("keeps a -end placement's group at the end", () => {
    const layout = planSatellites(
      phone({
        viewport: { width: 960, height: 580 },
        host: { left: 960 - 24 - 280, top: 484, width: 280, height: 72 },
        placement: "bottom-end",
      }),
    );
    expect(layout.boxes.e1.left).toBe(960 - 24 - 72);
    expect(layout.shift).toBe(-(16 + 72));
  });

  it("goes under a sidebar, which moves up to keep the group centred", () => {
    const layout = planSatellites(
      phone({ host: { left: 24, top: (720 - 228) / 2, width: 72, height: 228 }, placement: "left", vertical: true }),
    );
    expect(layout.shift).toBe(-44);
    expect(layout.boxes.e1).toEqual({ left: 24, top: 202 + 228 + 16, width: 72, height: 72 });
    expect(layout.reserve).toBe(0);
  });

  it("goes next to a sidebar with `beside`", () => {
    const layout = planSatellites(
      phone({ host: { left: 24, top: 246, width: 72, height: 228 }, placement: "left", vertical: true, side: "beside" }),
    );
    expect(layout.boxes.e1).toEqual({ left: 24 + 72 + 16, top: 246 + 228 - 72, width: 72, height: 72 });
  });
});

describe("planSatellites, with the page's actions", () => {
  const two = { width: 14 * 2 + 44 * 2 + 8, height: 72 };
  const laptop = (overrides: Partial<SatelliteLayoutInput> = {}) =>
    phone({ viewport: { width: 960, height: 580 }, host: { left: 340, top: 484, width: 280, height: 72 }, ...overrides });

  it("puts them on the start side, the electron after: the group centred", () => {
    const layout = planSatellites(laptop({ actions: { ...two, side: "start", turn: "auto" } }));
    const total = 124 + 16 + 280 + 16 + 72;
    const start = 480 - total / 2;
    expect(layout.boxes.actions).toEqual({ left: start, top: 484, width: 124, height: 72 });
    expect(layout.shift).toBe(start + 124 + 16 - 340);
    expect(layout.boxes.e1.left).toBe(start + 124 + 16 + 280 + 16);
    expect(layout.actionsAcross).toBe(false);
  });

  it("puts them on the end side, after the electron", () => {
    const layout = planSatellites(laptop({ actions: { ...two, side: "end", turn: "auto" } }));
    expect(layout.boxes.actions.left).toBeGreaterThan(layout.boxes.e1.left);
  });

  it("short of room, turns automatic ones across first, then moves them beside the pill, along it again", () => {
    // A phone: 124 + 16 + 228 + 16 + 72 doesn't fit, nor does 72 + 16 + 228 + 16 + 72
    const layout = planSatellites(phone({ actions: { ...two, side: "start", turn: "auto" } }));
    expect(layout.movedBeside).toEqual(["actions"]);
    expect(layout.actionsAcross).toBe(false);
    // From the pill's start, the pill having moved to keep it and its electron centred
    expect(layout.boxes.actions).toEqual({ left: 29.5, top: 624 - 16 - 72, width: 124, height: 72 });
    expect(layout.boxes.e1.top).toBe(624);
  });

  it("keeps them turned across when that's enough", () => {
    // Without an electron, on a 380 px screen (332 px of room): 72 + 16 + 228 fits where 124 + 16 + 228 doesn't
    const layout = planSatellites(
      phone({ electrons: [], viewport: { width: 380, height: 720 }, host: { left: 76, top: 624, width: 228, height: 72 }, actions: { ...two, side: "start", turn: "auto" } }),
    );
    expect(layout.actionsAcross).toBe(true);
    expect(layout.boxes.actions).toMatchObject({ width: 72, height: 124 });
    // On the edge line: their bottom is the pill's
    expect(layout.boxes.actions.top + 124).toBe(624 + 72);
  });

  it("turns them across when asked, even with room", () => {
    const layout = planSatellites(laptop({ actions: { ...two, side: "start", turn: "across" } }));
    expect(layout.actionsAcross).toBe(true);
    expect(layout.boxes.actions).toMatchObject({ width: 72, height: 124 });
  });

  const four = { width: 14 * 2 + 44 * 4 + 8 * 3, height: 72 }; // 228
  const overlaps = (a: { left: number; top: number; width: number; height: number }, b: typeof a) =>
    a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

  it("beside the pill, keeps the actions and the electrons clear of each other and on the screen", () => {
    // A 390 px phone: four actions (228) and the second electron go above the pill, in a row of their own
    const layout = planSatellites(
      phone({ viewport: { width: 390, height: 720 }, electrons: [electron("e1"), electron("e2")], actions: { ...four, side: "start", turn: "auto" } }),
    );
    expect(layout.movedBeside).toEqual(["e2", "actions"]);
    const { actions, e2 } = layout.boxes;
    expect(overlaps(actions, e2)).toBe(false);
    expect(actions.top).toBe(e2.top);
    for (const box of [actions, e2]) {
      expect(box.left).toBeGreaterThanOrEqual(24);
      expect(box.left + box.width).toBeLessThanOrEqual(390 - 24);
    }
    expect(layout.actionsAcross).toBe(false);
  });

  it("turns automatic ones across beside the pill when their row is too long along it", () => {
    const six = { width: 14 * 2 + 44 * 6 + 8 * 5, height: 72 }; // 332
    const layout = planSatellites(phone({ electrons: [electron("e1"), electron("e2")], actions: { ...six, side: "start", turn: "auto" } }));
    expect(layout.actionsAcross).toBe(true);
    expect(overlaps(layout.boxes.actions, layout.boxes.e2)).toBe(false);
    // Against the pill's side of their row: their bottom one gap above the pill
    expect(layout.boxes.actions.top + layout.boxes.actions.height).toBe(624 - 16);
  });

  it("wraps into a further row when even that doesn't fit", () => {
    const six = { width: 332, height: 72 };
    const layout = planSatellites(phone({ electrons: [electron("e1"), electron("e2")], actions: { ...six, side: "start", turn: "along" } }));
    expect(layout.boxes.actions.top).toBe(624 - 16 - 72);
    expect(layout.boxes.e2.top).toBe(624 - 2 * (16 + 72));
  });

  it("with a wheel, shows what fits instead of turning across", () => {
    const wheel = { count: 4, first: 14 * 2 + 44, step: 44 + 8 };
    // A narrow window: the four actions don't fit in the pill's row, two of them do
    const tight = laptop({ viewport: { width: 560, height: 580 }, host: { left: 140, top: 484, width: 280, height: 72 } });
    const layout = planSatellites({ ...tight, actions: { ...four, side: "start", turn: "auto", wheel } });
    // 560 − 48 − 280 − 16 − 72 − 16 = 128 px: the pill with one (72) and one more (52)
    expect(layout.actionsShown).toBe(2);
    expect(layout.actionsAcross).toBe(false);
    expect(layout.boxes.actions.width).toBe(72 + 52);
    expect(layout.movedBeside).toEqual([]);
    // All of them where there's room
    expect(planSatellites(laptop({ actions: { ...four, side: "start", turn: "auto", wheel } })).actionsShown).toBeUndefined();
  });

  it("puts the actions nearer the pill than the electrons when asked", () => {
    const sameSide = laptop({ electrons: [electron("e1")], actions: { ...two, side: "end", turn: "auto" } });
    const electronsNearer = planSatellites(sameSide);
    expect(electronsNearer.boxes.e1.left).toBeLessThan(electronsNearer.boxes.actions.left);
    const actionsNearer = planSatellites({ ...sameSide, nearest: "actions" });
    expect(actionsNearer.boxes.actions.left).toBeLessThan(actionsNearer.boxes.e1.left);
  });
});
