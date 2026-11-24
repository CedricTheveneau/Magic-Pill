import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MagicPill from "../MagicPill/MagicPill";
import Pill from "./Pill";
import { planLadder, type RungBox } from "./zone";
import type { PillProps } from "./types";

const box = (patch: Partial<RungBox> = {}): RungBox => ({ offset: 24, size: 72, gap: 16, visible: true, ...patch });

describe("planLadder", () => {
  it("leaves the first pill in its spot and lines the others up after it", () => {
    expect(planLadder([box(), box({ size: 100 }), box()])).toEqual([0, 88, 204]);
  });

  it("gives no room to a hidden pill, but keeps its rung for when it shows", () => {
    expect(planLadder([box(), box({ visible: false }), box()])).toEqual([0, 88, 88]);
    expect(planLadder([box({ visible: false }), box()])).toEqual([0, 0]);
  });

  it("gives no room to a pill that isn't rendered", () => {
    expect(planLadder([box({ size: 0 }), box()])).toEqual([0, 0]);
  });

  it("counts from each pill's own offset", () => {
    // Its own spot is already past the first pill
    expect(planLadder([box(), box({ offset: 200 })])).toEqual([0, 0]);
    expect(planLadder([box({ offset: 64 }), box()])).toEqual([0, 128]);
  });
});

describe("zones", () => {
  // What the stylesheet would give each pill: jsdom has no layout
  let styles: Record<string, Partial<CSSStyleDeclaration>>;
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    styles = {};
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element) =>
        ({
          position: "fixed",
          visibility: "visible",
          insetBlockStart: "24px",
          insetBlockEnd: "24px",
          left: "24px",
          right: "24px",
          blockSize: "72px",
          width: "84px",
          rowGap: "16px",
          getPropertyValue: () => "",
          ...styles[element.id],
        }) as unknown as CSSStyleDeclaration,
    );
    // Each pill's position follows its shift
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const shift = (axis: string) => Number.parseFloat(this.style.getPropertyValue(`--_mp-shift-${axis}`)) || 0;
      return { left: shift("x"), top: shift("y"), width: 200, height: 72 } as DOMRect;
    });
    animate = vi.fn(() => ({ finished: new Promise(() => {}), cancel() {} }));
    HTMLElement.prototype.animate = animate as unknown as HTMLElement["animate"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  });

  const pill = (id: string, props: Partial<PillProps> = {}) => (
    <Pill key={id} id={id} placement="top-end" {...props}>
      {id}
    </Pill>
  );
  const shift = (id: string, axis = "y") =>
    document.getElementById(id)?.style.getPropertyValue(`--_mp-shift-${axis}`) || "0px";
  const moves = () => animate.mock.calls.filter(([, options]) => options.id === "mp-shift");

  it("lines up the pills that share a placement", () => {
    render([pill("a"), pill("b"), pill("c")]);
    expect([shift("a"), shift("b"), shift("c")]).toEqual(["0px", "88px", "176px"]);
  });

  it("goes straight to its rung when it appears", () => {
    render([pill("a"), pill("b")]);
    expect(moves()).toHaveLength(0);
  });

  it("leaves pills in other placements alone", () => {
    render([pill("a"), pill("b", { placement: "top" }), pill("c", { placement: "bottom-end" })]);
    expect([shift("a"), shift("b"), shift("c")]).toEqual(["0px", "0px", "0px"]);
  });

  it.each(["left", "right"] as const)("lines up %s pills further in from the edge", (placement) => {
    render([pill("a", { placement }), pill("b", { placement })]);
    expect([shift("b", "x"), shift("b", "y")]).toEqual(["100px", "0px"]);
  });

  it("takes the place of a pill that hides, and gives it back", () => {
    const { rerender } = render([pill("a"), pill("b")]);
    rerender([pill("a", { presence: "hidden" }), pill("b")]);
    expect(shift("b")).toBe("0px");
    // It waits for the first one to be out of the way: fade + change + a third of the exit
    expect(moves()).toHaveLength(1);
    expect(moves()[0]).toEqual([
      [{ translate: "0px 88px" }, { translate: "0px 0px" }],
      expect.objectContaining({ delay: 500, duration: 400, composite: "add" }),
    ]);

    rerender([pill("a", { presence: "compact" }), pill("b")]);
    expect([shift("a"), shift("b")]).toEqual(["0px", "88px"]);
    expect(moves()[1][1]).toMatchObject({ delay: 0, duration: 250 });
  });

  it("takes the place of a pill that unmounts; the newcomer goes last", () => {
    const { rerender } = render([pill("a"), pill("b")]);
    rerender([pill("b")]);
    expect(shift("b")).toBe("0px");
    rerender([pill("a"), pill("b")]);
    expect([shift("a"), shift("b")]).toEqual(["88px", "0px"]);
  });

  it("gives up its rung when it moves to another placement", () => {
    const { rerender } = render([pill("a"), pill("b"), pill("c", { placement: "bottom" })]);
    rerender([pill("a", { placement: "bottom" }), pill("b"), pill("c", { placement: "bottom" })]);
    expect([shift("a"), shift("b"), shift("c")]).toEqual(["88px", "0px", "0px"]);
    // The one left behind closes up, and the moved one heads for its new rung
    expect(moves()).toHaveLength(2);
  });

  it("keeps the room it had while its panel covers the others", async () => {
    let close = () => {};
    const { rerender } = render([pill("a"), pill("b")]);
    styles.a = { blockSize: "600px" };
    rerender([pill("a", { presence: "panel" }), pill("b"), pill("c")]);
    expect(shift("b")).toBe("88px");

    const finished = new Promise<void>((resolve) => (close = resolve));
    HTMLElement.prototype.getAnimations = () => [{ id: "mp-morph", finished, cancel() {} } as unknown as Animation];
    rerender([pill("a", { presence: "compact" }), pill("b"), pill("c")]);
    await act(async () => {});
    expect(shift("b")).toBe("88px");

    styles.a = { blockSize: "90px" };
    await act(async () => close());
    expect(shift("b")).toBe("106px");
  });

  it("leaves out a pill with stack={false}, unstyled, inline or an overlay", () => {
    render([
      pill("a"),
      pill("b", { stack: false }),
      pill("c", { unstyled: true }),
      pill("d", { placement: "inline" }),
      pill("e", { placement: "inline" }),
      pill("f"),
    ]);
    expect(["b", "c", "d", "e"].map((id) => shift(id))).toEqual(["0px", "0px", "0px", "0px"]);
    expect(shift("f")).toBe("88px");
  });

  it("leaves and joins as `stack` changes", () => {
    const { rerender } = render([pill("a"), pill("b")]);
    rerender([pill("a"), pill("b", { stack: false })]);
    expect(shift("b")).toBe("0px");
    rerender([pill("a"), pill("b")]);
    expect(shift("b")).toBe("88px");
  });

  it("ignores a pill the app's CSS takes out of its fixed spot", () => {
    styles.a = { position: "static" };
    render([pill("a"), pill("b")]);
    expect(shift("b")).toBe("0px");
  });

  it("doesn't pass `stack` to the page", () => {
    render(pill("a", { stack: false }));
    expect(document.getElementById("a")?.hasAttribute("stack")).toBe(false);
  });

  it("works on <MagicPill> hosts", () => {
    render([
      pill("a"),
      <MagicPill key="b" id="b" name="zone-b" placement="top-end" />,
      <MagicPill key="c" id="c" name="zone-c" placement="top-end" stack={false}>
        Base
      </MagicPill>,
      pill("d"),
    ]);
    // Hidden, at its rung for when a notification comes
    expect([shift("b"), shift("c"), shift("d")]).toEqual(["88px", "0px", "88px"]);
  });

  it("moves at once with reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { rerender } = render([pill("a"), pill("b")]);
    rerender([pill("a", { presence: "hidden" }), pill("b")]);
    expect(shift("b")).toBe("0px");
    expect(moves()).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("follows a pill that resizes, without an animation of its own", () => {
    const callbacks: (() => void)[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    render([pill("a"), pill("b")]);
    styles.a = { blockSize: "120.5px" };
    callbacks.forEach((callback) => callback());
    expect(shift("b")).toBe("136.5px");
    expect(moves()).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("measures nothing for a pill that's alone in its spot", () => {
    const { rerender, unmount } = render(pill("a"));
    rerender(pill("a", { presence: "hidden" }));
    unmount();
    expect(window.getComputedStyle).not.toHaveBeenCalled();
  });
});
