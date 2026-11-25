import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Pill from "./Pill";
import { PillActions, PillMessage } from "./parts";
import { PillPanel, PillPanelTrigger } from "./PillPanel";
import MagicPill from "../MagicPill/MagicPill";
import { pill as controller, resetStores } from "../store/store";
import type { PillProps } from "./types";

const FADE = 150;
const CHANGE = 250;
const ENTER = 500;

const root = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!;
const presence = () => root().dataset.presence;
const variant = () => root().dataset.variant;
const message = () => root().querySelector('[data-mp="message"]')?.textContent;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

function reduceMotion() {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduced-motion") }));
}

const Scenes = ({ scene, ...rest }: Partial<PillProps>) => (
  <Pill scene={scene} variant={scene === "done" ? "success" : "neutral"} {...rest}>
    <PillMessage>{scene === "done" ? "You're in!" : "Subscribe"}</PillMessage>
  </Pill>
);

beforeEach(() => {
  vi.useFakeTimers();
});

describe("a pill's scene", () => {
  it("leaves as the pill closes on it, and the next one comes as it opens", () => {
    // Arrange
    const { rerender } = render(<Scenes scene="form" />);

    // Act + Assert: closing, on the old content and its colour
    rerender(<Scenes scene="done" />);
    expect([presence(), message(), variant()]).toEqual(["rest", "Subscribe", "neutral"]);
    advance(FADE + CHANGE - 1);
    expect([presence(), message(), variant()]).toEqual(["rest", "Subscribe", "neutral"]);

    // Act + Assert: open, on the new one
    advance(1);
    expect([presence(), message(), variant()]).toEqual(["compact", "You're in!", "success"]);
  });

  it("lays the new content out in the closed pill first, so it transitions open", () => {
    // Arrange
    const seen: string[] = [];
    const { rerender } = render(<Scenes scene="form" />);
    const observer = new MutationObserver(() => {});
    observer.observe(root(), { attributes: true, attributeFilter: ["data-presence"], attributeOldValue: true });
    const layout = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.mp === "pill") seen.push(`${this.dataset.presence} ${message()}`);
      return 0;
    });

    // Act
    rerender(<Scenes scene="done" />);
    advance(FADE + CHANGE);

    // Assert
    expect(seen).toContain("rest You're in!");
    layout.mockRestore();
    observer.disconnect();
  });

  it("keeps following the app while it's shown", () => {
    // Arrange
    const { rerender } = render(
      <Pill scene="a">
        <PillMessage>1</PillMessage>
      </Pill>,
    );

    // Act
    rerender(
      <Pill scene="a">
        <PillMessage>2</PillMessage>
      </Pill>,
    );

    // Assert
    expect([presence(), message()]).toEqual(["compact", "2"]);
  });

  it("opens again on the old one when the app changes its mind", () => {
    // Arrange
    const { rerender } = render(<Scenes scene="form" />);
    rerender(<Scenes scene="done" />);
    advance(FADE);

    // Act
    rerender(<Scenes scene="form" />);
    advance(FADE + CHANGE);

    // Assert
    expect([presence(), message(), variant()]).toEqual(["compact", "Subscribe", "neutral"]);
  });

  it("closes the panel it leaves", () => {
    // Arrange
    const App = () => {
      const [scene, setScene] = useState("form");
      return (
        <Pill scene={scene}>
          <PillMessage>{scene}</PillMessage>
          <PillActions>
            <PillPanelTrigger label="Open" />
          </PillActions>
          <PillPanel title="Panel">
            <button onClick={() => setScene("done")}>next</button>
          </PillPanel>
        </Pill>
      );
    };
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(presence()).toBe("panel");

    // Act
    fireEvent.click(screen.getByText("next"));
    advance(FADE + CHANGE);

    // Assert
    expect([presence(), message()]).toEqual(["compact", "done"]);
  });

  it("starts each scene anew: what was typed doesn't go over to the next", () => {
    // Arrange
    const { rerender } = render(
      <Pill scene="a">
        <input aria-label="field" />
      </Pill>,
    );
    fireEvent.input(screen.getByLabelText("field"), { target: { value: "typed" } });

    // Act
    rerender(
      <Pill scene="b">
        <input aria-label="field" />
      </Pill>,
    );
    advance(FADE + CHANGE);

    // Assert
    expect(screen.getByLabelText<HTMLInputElement>("field").value).toBe("");
  });

  it("takes the focus that left with the old content", () => {
    // Arrange
    const App = () => {
      const [scene, setScene] = useState("form");
      return (
        <Pill scene={scene}>{scene === "form" ? <button onClick={() => setScene("done")}>send</button> : <p>done</p>}</Pill>
      );
    };
    render(<App />);
    screen.getByText("send").focus();

    // Act
    fireEvent.click(screen.getByText("send"));
    advance(FADE + CHANGE);

    // Assert
    expect(document.activeElement).toBe(root());
  });

  it.each([
    ["when asked to", { scene: "done", sceneChange: "none" as const }],
    ["when unstyled", { scene: "done", unstyled: true }],
    ["when hidden", { scene: "done", presence: "hidden" as const }],
  ])("changes at once %s", (_name, props) => {
    // Arrange
    const { rerender } = render(<Scenes {...props} scene="form" />);

    // Act
    rerender(<Scenes {...props} />);

    // Assert
    expect(message()).toBe("You're in!");
  });

  it("changes at once with reduced motion", () => {
    // Arrange
    reduceMotion();
    const { rerender } = render(<Scenes scene="form" />);

    // Act
    rerender(<Scenes scene="done" />);
    advance(0);

    // Assert
    expect([presence(), message()]).toEqual(["compact", "You're in!"]);
  });

  describe("sliding", () => {
    beforeEach(() => {
      Element.prototype.animate = vi.fn(() => ({ finished: new Promise(() => {}), cancel: () => {} })) as never;
      Element.prototype.getAnimations = vi.fn(() => []) as never;
    });

    it("slides a copy of the old content out, with what was typed in it", () => {
      // Arrange
      const { rerender } = render(
        <Pill scene="form" sceneChange="slide">
          <input aria-label="field" defaultValue="" />
        </Pill>,
      );
      fireEvent.input(screen.getByLabelText("field"), { target: { value: "camille@example.com" } });

      // Act
      rerender(
        <Pill scene="done" sceneChange="slide">
          <PillMessage>You're in!</PillMessage>
        </Pill>,
      );

      // Assert
      const outgoing = root().querySelector('[data-mp="outgoing"]');
      expect(presence()).toBe("compact");
      expect(message()).toBe("You're in!");
      expect(outgoing?.querySelector("input")?.value).toBe("camille@example.com");
      expect(outgoing?.getAttribute("aria-hidden")).toBe("true");
    });
  });
});

describe("a host's scene", () => {
  beforeEach(() => {
    resetStores();
  });

  const host = (scene: string) => (
    <MagicPill scene={scene} variant={scene === "done" ? "success" : undefined}>
      <PillMessage>{scene}</PillMessage>
    </MagicPill>
  );

  it("goes through the circle, like the base layer and a notification", () => {
    // Arrange
    const { rerender } = render(host("form"));

    // Act + Assert
    rerender(host("done"));
    expect([presence(), message(), variant()]).toEqual(["rest", "form", "neutral"]);
    advance(FADE + CHANGE);
    expect([presence(), message(), variant()]).toEqual(["compact", "done", "success"]);
  });

  it("comes back to the current one after a notification", () => {
    // Arrange
    const { rerender } = render(host("form"));
    act(() => void controller().notify({ message: "New message", duration: 1000 }));
    for (const ms of [FADE + CHANGE, ENTER]) advance(ms);
    expect(message()).toBe("New message");

    // Act
    rerender(host("done"));
    for (const ms of [1000, FADE + CHANGE, ENTER, ENTER]) advance(ms);

    // Assert
    expect(message()).toBe("done");
  });
});
