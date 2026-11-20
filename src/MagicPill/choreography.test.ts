import { describe, expect, it } from "vitest";

import { BASE, IDLE, NONE, batchSteps, parseDuration, planSteps, type Displayed, type Scene, type Timings } from "./choreography";

const timings: Timings = { enter: 500, change: 250, exit: 300, reduced: false };
const reduced: Timings = { enter: 0, change: 0, exit: 150, reduced: true };
const note = (id: string): Scene => ({ kind: "notification", item: { id, input: { message: id } } });

// [delay, presence, scene kind or notification id]
const summary = (steps: ReturnType<typeof planSteps>) =>
  steps.map((step) => [step.delay, step.presence, step.scene.kind === "notification" ? step.scene.item.id : step.scene.kind]);

describe("planSteps", () => {
  it("pops a notification in as a circle, then grows it into the pill", () => {
    // Act
    const steps = planSteps({ scene: NONE, presence: "hidden" }, note("a"), timings);

    // Assert
    expect(summary(steps)).toEqual([
      [0, "hidden", "a"],
      [0, "rest", "a"],
      [500, "compact", "a"],
    ]);
  });

  it("swaps content at the circle: collapse, swap after the shape change, grow back", () => {
    // Act
    const steps = planSteps({ scene: BASE, presence: "compact" }, note("a"), timings);

    // Assert
    expect(summary(steps)).toEqual([
      [0, "rest", "base"],
      [250, "rest", "a"],
      [0, "compact", "a"],
    ]);
  });

  it("hides, then drops the content once it's out of sight", () => {
    // Act
    const steps = planSteps({ scene: note("a"), presence: "expanded" }, NONE, timings);

    // Assert
    expect(summary(steps)).toEqual([
      [0, "hidden", "a"],
      [550, "hidden", "none"],
    ]);
  });

  it("rests as a circle when idle", () => {
    // Act
    const steps = planSteps({ scene: note("a"), presence: "compact" }, IDLE, timings);

    // Assert
    expect(summary(steps)).toEqual([
      [0, "rest", "a"],
      [250, "rest", "idle"],
    ]);
  });

  it("swaps updated content in place and keeps the level the user chose", () => {
    // Arrange
    const before = note("a");
    const after = note("a");

    // Act
    const steps = planSteps({ scene: before, presence: "panel" }, after, timings);

    // Assert
    expect(steps).toEqual([{ delay: 0, presence: "panel", scene: after }]);
  });

  it("does nothing when the target is already displayed", () => {
    // Act + Assert
    expect(planSteps({ scene: BASE, presence: "expanded" }, BASE, timings)).toEqual([]);
    expect(planSteps({ scene: NONE, presence: "hidden" }, NONE, timings)).toEqual([]);
  });

  it("only fades with reduced motion: no circle step", () => {
    // Act
    const enter = planSteps({ scene: NONE, presence: "hidden" }, note("a"), reduced);
    const swap = planSteps({ scene: note("a"), presence: "compact" }, note("b"), reduced);

    // Assert
    expect(summary(enter)).toEqual([
      [0, "hidden", "a"],
      [0, "compact", "a"],
    ]);
    expect(summary(swap)).toEqual([
      [0, "hidden", "a"],
      [150, "hidden", "b"],
      [0, "compact", "b"],
    ]);
  });
});

describe("batchSteps", () => {
  // [at, [presence, scene kind or notification id] per state]
  const batches = (current: Displayed, target: Scene, timing: Timings = timings) =>
    batchSteps(current, planSteps(current, target, timing)).map(({ at, states }) => [
      at,
      states.map(({ presence, scene }) => [presence, scene.kind === "notification" ? scene.item.id : scene.kind]),
    ]);

  it("shows new content closed before the pill grows around it (L21)", () => {
    // Act
    const steps = batches({ scene: BASE, presence: "compact" }, note("a"));

    // Assert
    expect(steps).toEqual([
      [0, [["rest", "base"]]],
      [
        250,
        [
          ["rest", "a"],
          ["compact", "a"],
        ],
      ],
    ]);
  });

  it("does the same with reduced motion, where the swap happens hidden", () => {
    // Act
    const enter = batches({ scene: NONE, presence: "hidden" }, note("a"), reduced);

    // Assert
    expect(enter).toEqual([
      [
        0,
        [
          ["hidden", "a"],
          ["compact", "a"],
        ],
      ],
    ]);
  });

  it("collapses steps due at the same time when nothing new opens", () => {
    // Act
    const enter = batches({ scene: NONE, presence: "hidden" }, note("a"));
    const before = note("a");
    const update = batchSteps({ scene: before, presence: "expanded" }, [
      { delay: 0, presence: "expanded", scene: note("a") },
    ]);

    // Assert: popping in already shows the content closed, at the circle
    expect(enter).toEqual([
      [0, [["rest", "a"]]],
      [500, [["compact", "a"]]],
    ]);
    // Content updated while open: swapped in place, in one render
    expect(update).toHaveLength(1);
    expect(update[0].states).toHaveLength(1);
  });
});

describe("parseDuration", () => {
  it.each([
    ["500ms", 500],
    [" 0.25s ", 250],
    ["", 42],
    ["fast", 42],
  ])("reads %j as %d", (value, expected) => {
    // Act + Assert
    expect(parseDuration(value, 42)).toBe(expected);
  });
});
