import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aim, followPointer } from "./light";

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height }) as DOMRect;
const move = (clientX: number, clientY: number, pointerType = "mouse") =>
  fireEvent(document, Object.assign(new Event("pointermove"), { clientX, clientY, pointerType }));

describe("aim", () => {
  it.each([
    ["right", 400, 50, "0rad"],
    ["below", 200, 500, `${Math.PI / 2}rad`],
    ["above", 200, -500, `${-Math.PI / 2}rad`],
  ])("points at a pointer on the %s, from the pill's centre", (_, x, y, angle) => {
    // Assert
    expect(aim(x, y, rect(100, 0, 200, 100))[0]).toBe(angle);
  });

  it("puts the highlight where the pointer is, from the pill's corner", () => {
    // Assert
    expect(aim(130, 20, rect(100, 0, 200, 100)).slice(1)).toEqual(["30px", "20px"]);
  });
});

describe("followPointer", () => {
  let pill: HTMLElement;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    pill = document.createElement("div");
    vi.spyOn(pill, "getBoundingClientRect").mockReturnValue(rect(100, 0, 200, 100));
  });
  afterEach(() => vi.useRealTimers());

  it("aims the pill at the pointer, once per frame", () => {
    // Arrange
    const stop = followPointer(new Set([pill]));

    // Act
    move(0, 0);
    move(400, 50);
    vi.advanceTimersToNextFrame();

    // Assert
    expect(pill.style.getPropertyValue("--_mp-angle")).toBe("0rad");
    expect(pill.getBoundingClientRect).toHaveBeenCalledOnce();
    stop();
  });

  it("ignores fingers", () => {
    // Arrange
    const stop = followPointer(new Set([pill]));

    // Act
    move(400, 50, "touch");
    vi.advanceTimersToNextFrame();

    // Assert
    expect(pill.style.getPropertyValue("--_mp-angle")).toBe("");
    stop();
  });

  it("gives the pill its own light back when it stops, even between a move and its frame", () => {
    // Arrange
    const stop = followPointer(new Set([pill]));
    move(400, 50);
    vi.advanceTimersToNextFrame();

    // Act
    move(0, 0);
    stop();
    vi.advanceTimersToNextFrame();
    move(0, 0);
    vi.advanceTimersToNextFrame();

    // Assert
    expect(pill.style.cssText).toBe("");
  });
});
