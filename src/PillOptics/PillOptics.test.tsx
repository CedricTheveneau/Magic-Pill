import type { CSSProperties } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Pill from "../Pill/Pill";
import type { PillProps } from "../Pill/types";
import { PillOptics } from "./PillOptics";
import * as lens from "./lens";
import * as light from "./light";

// What themes.css computes from the tokens
const GLASS = {
  "--_mp-refraction": "0.5",
  "--_mp-edge": "20px",
  "--_mp-fringe": "0",
  borderTopLeftRadius: "36px",
} as CSSProperties;

const pill = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!;
const filters = () => [...document.querySelectorAll('[data-mp="optics"] filter')];
const lensOf = (element = pill()) => element.style.getPropertyValue("--_mp-lens");
const show = (props: Partial<PillProps> = {}) => (
  <Pill theme="glass" style={GLASS} {...props}>
    content
  </Pill>
);
const renderAll = async (ui: React.ReactNode) => {
  const utils = render(ui);
  await act(async () => {});
  return { ...utils, again: async (next: React.ReactNode) => {
    utils.rerender(next);
    await act(async () => {});
  } };
};

beforeEach(() => {
  vi.spyOn(lens, "canRefract").mockReturnValue(true);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(72);
});

describe("PillOptics", () => {
  describe("refraction", () => {
    it("gives a themed pill its lens", async () => {
      // Act
      await renderAll(<><PillOptics />{show()}</>);

      // Assert
      expect(filters()).toHaveLength(1);
      expect(lensOf()).toBe(`url(#${filters()[0].id})`);
      expect(filters()[0].querySelector("feDisplacementMap")?.getAttribute("scale")).toBe("90");
    });

    it("finds pills rendered before or after it", async () => {
      // Arrange
      const { again } = await renderAll(<><PillOptics key="optics" /></>);

      // Act
      await again(<><PillOptics key="optics" />{show()}</>);

      // Assert
      expect(lensOf()).not.toBe("");
    });

    it("shares a lens between pills with the same one", async () => {
      // Act
      await renderAll(
        <>
          {show()}
          {show({ style: { ...GLASS, borderTopLeftRadius: "30px" } })}
          {show()}
          <PillOptics />
        </>,
      );

      // Assert
      const [first, second, third] = [...document.querySelectorAll<HTMLElement>('[data-mp="pill"]')].map((element) => lensOf(element));
      expect(filters()).toHaveLength(2);
      expect(third).toBe(first);
      expect(second).not.toBe(first);
    });

    it("splits the colours when there's a fringe", async () => {
      // Act
      await renderAll(<><PillOptics />{show({ style: { ...GLASS, "--_mp-fringe": "0.2" } as CSSProperties })}</>);

      // Assert: red bends more, blue less
      const scales = [...filters()[0].querySelectorAll("feDisplacementMap")].map((map) => Number(map.getAttribute("scale")));
      expect(scales).toEqual([108, 90, 72]);
    });

    it("has corners no larger than half the pill (border-radius: 9999px)", async () => {
      // Act
      await renderAll(<><PillOptics />{show({ style: { ...GLASS, borderTopLeftRadius: "9999px" } })}</>);

      // Assert
      expect(filters()[0].id).toMatch(/^mp-lens-36-/);
    });

    it.each([
      ["plain", { theme: "plain" }],
      ["without a theme", { theme: undefined }],
      ["unstyled", { unstyled: true }],
      ["without refraction", { style: { ...GLASS, "--_mp-refraction": "0" } as CSSProperties }],
    ])("leaves a pill %s alone", async (_, props) => {
      // Act
      await renderAll(<><PillOptics />{show(props)}</>);

      // Assert
      expect(lensOf()).toBe("");
      expect(filters()).toHaveLength(0);
    });

    it("draws nothing where the browser can't, and only asks if a pill needs it", async () => {
      // Arrange
      const canRefract = vi.mocked(lens.canRefract).mockReturnValue(false);

      // Act
      const { again } = await renderAll(<><PillOptics />{show({ theme: "plain" })}</>);
      const asked = canRefract.mock.calls.length;
      await again(<><PillOptics />{show()}</>);

      // Assert
      expect(asked).toBe(0);
      expect(canRefract).toHaveBeenCalledOnce();
      expect(lensOf()).toBe("");
    });

    it("follows the tokens: it hears their transition end", async () => {
      // Arrange
      await renderAll(<><PillOptics />{show()}</>);
      const before = lensOf();

      // Act
      pill().style.setProperty("--_mp-refraction", "0.8");
      await act(async () => {
        fireEvent(pill(), Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "--_mp-refraction" }));
      });

      // Assert
      expect(lensOf()).not.toBe(before);
      expect(filters()).toHaveLength(1);
    });

    it("drops the lens when the pill becomes plain", async () => {
      // Arrange
      const { again } = await renderAll(<><PillOptics />{show()}</>);

      // Act
      await again(<><PillOptics />{show({ theme: "plain" })}</>);

      // Assert
      expect(lensOf()).toBe("");
      expect(filters()).toHaveLength(0);
    });

    it("keeps the lens when a modal opens (its element may be another one)", async () => {
      // Arrange
      const { again } = await renderAll(<><PillOptics />{show()}</>);

      // Act
      await again(<><PillOptics />{show({ placement: "overlay" })}</>);

      // Assert
      expect(pill().tagName).toBe("DIALOG");
      expect(lensOf()).not.toBe("");
    });

    it("cleans up after itself", async () => {
      // Arrange
      const { again } = await renderAll(<><PillOptics />{show()}</>);

      // Act
      await again(<>{show()}</>);

      // Assert
      expect(lensOf()).toBe("");
      expect(filters()).toHaveLength(0);
    });
  });

  describe.each([
    ["the pointer's light", "--_mp-follow", () => vi.spyOn(light, "followPointer")],
  ])("%s", (_, property, spy) => {
    const asking = { ...GLASS, [property]: "1" } as CSSProperties;

    it("only runs for the pills that ask for it", async () => {
      // Arrange
      const stop = vi.fn();
      const start = spy().mockReturnValue(stop);

      // Act
      const { again, unmount } = await renderAll(<><PillOptics />{show()}</>);
      const before = start.mock.calls.length;
      await again(<><PillOptics />{show({ style: asking, theme: "liquid" })}</>);
      const running = [...start.mock.calls];
      unmount();

      // Assert
      expect(before).toBe(0);
      expect(running).toHaveLength(1);
      expect([...running[0][0]]).toHaveLength(1);
      expect(stop).toHaveBeenCalledOnce();
    });

    it("goes on undisturbed when nothing changed for it", async () => {
      // Arrange
      const start = spy().mockReturnValue(vi.fn());
      const { again } = await renderAll(<><PillOptics />{show({ style: asking })}</>);

      // Act
      await again(<><PillOptics />{show({ style: asking, presence: "expanded" })}</>);

      // Assert
      expect(start).toHaveBeenCalledOnce();
    });
  });

  it("renders nothing on the server", () => {
    // Assert
    expect(renderToString(<PillOptics />)).toBe("");
  });
});
