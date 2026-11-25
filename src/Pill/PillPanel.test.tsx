import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Pill from "./Pill";
import { PillActions, PillMessage } from "./parts";
import { PillPanel, PillPanelTrigger } from "./PillPanel";
import type { PillPresence } from "./types";
import { resetInputModality } from "../utils/inputModality";

const ExpandablePill = ({ onPresenceChange }: { onPresenceChange?: (presence: PillPresence) => void }) => (
  <Pill onPresenceChange={onPresenceChange}>
    <PillMessage>Discover the powers Magic Pill gives you!</PillMessage>
    <PillActions>
      <PillPanelTrigger label="Learn more" />
    </PillActions>
    <PillPanel title="Discover" closeLabel="Close">
      <p>Anything can go in a panel.</p>
    </PillPanel>
  </Pill>
);

const pill = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!;
const panel = () => document.querySelector<HTMLElement>('[data-mp="panel"]')!;

describe("PillPanel and PillPanelTrigger", () => {
  beforeEach(() => {
    resetInputModality();
  });

  it("start closed, with the trigger pointing at the panel (Y4)", () => {
    // Act
    render(<ExpandablePill />);
    const trigger = screen.getByRole("button", { name: "Learn more" });

    // Assert
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(panel().id);
    expect(panel().hasAttribute("data-open")).toBe(false);
  });

  it("open the panel, labelled by its title, and move the focus into it", () => {
    // Arrange
    const onPresenceChange = vi.fn();
    render(<ExpandablePill onPresenceChange={onPresenceChange} />);
    const trigger = screen.getByRole("button", { name: "Learn more" });

    // Act
    fireEvent.click(trigger);

    // Assert
    expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("panel");
    expect(pill().dataset.presence).toBe("panel");
    expect(panel().hasAttribute("data-open")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "Discover" })).toBe(panel());
    expect(document.activeElement).toBe(panel());
  });

  it("close from the close button, back to the previous level, and give the focus back", () => {
    // Arrange
    render(<ExpandablePill />);
    const trigger = screen.getByRole("button", { name: "Learn more" });
    fireEvent.click(trigger);
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();

    // Act
    fireEvent.click(close);

    // Assert
    expect(pill().dataset.presence).toBe("compact");
    expect(panel().hasAttribute("data-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("show the close button's icon, its label coming on hover and focus, unless asked for", () => {
    // Act
    const { rerender } = render(<ExpandablePill />);
    const collapsed = screen.getByRole("button", { name: "Close" }).hasAttribute("data-collapsed");
    rerender(
      <Pill>
        <PillPanel closeExpanded>Body</PillPanel>
      </Pill>,
    );

    // Assert
    expect(collapsed).toBe(true);
    expect(screen.getByRole("button", { name: "Close" }).hasAttribute("data-collapsed")).toBe(false);
  });

  it("give the focus back as non-keyboard focus after a tap (L22)", () => {
    // Arrange
    render(<ExpandablePill />);
    const trigger = screen.getByRole("button", { name: "Learn more" });
    fireEvent.click(trigger);
    const close = screen.getByRole("button", { name: "Close" });
    const focus = vi.spyOn(trigger, "focus");

    // Act
    fireEvent.pointerDown(close);
    close.focus();
    fireEvent.click(close);

    // Assert
    expect(focus).toHaveBeenCalledExactlyOnceWith({ focusVisible: false });
    expect(document.activeElement).toBe(trigger);
  });

  it("give the focus back as keyboard focus after a key press", () => {
    // Arrange
    render(<ExpandablePill />);
    const trigger = screen.getByRole("button", { name: "Learn more" });
    fireEvent.click(trigger);
    const close = screen.getByRole("button", { name: "Close" });
    const focus = vi.spyOn(trigger, "focus");

    // Act
    fireEvent.keyDown(close, { key: "Enter" });
    close.focus();
    fireEvent.click(close);

    // Assert
    expect(focus).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it("close on Escape and give the focus back", () => {
    // Arrange
    render(<ExpandablePill />);
    const trigger = screen.getByRole("button", { name: "Learn more" });
    fireEvent.click(trigger);

    // Act
    fireEvent.keyDown(panel(), { key: "Escape" });

    // Assert
    expect(pill().dataset.presence).toBe("compact");
    expect(document.activeElement).toBe(trigger);
  });

  it("don't take the focus back if it has already moved elsewhere", () => {
    // Arrange
    const Page = () => {
      const [presence, setPresence] = useState<PillPresence>("compact");
      return (
        <>
          <button onClick={() => setPresence("compact")}>outside</button>
          <Pill presence={presence} onPresenceChange={setPresence}>
            <PillPanelTrigger label="Learn more" />
            <PillPanel>Body</PillPanel>
          </Pill>
        </>
      );
    };
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    const outside = screen.getByRole("button", { name: "outside" });
    outside.focus();

    // Act
    fireEvent.click(outside);

    // Assert
    expect(pill().dataset.presence).toBe("compact");
    expect(document.activeElement).toBe(outside);
  });

  it("don't steal the focus when the pill starts as a panel", () => {
    // Act
    render(
      <Pill defaultPresence="panel">
        <PillPanel title="Hi">Body</PillPanel>
      </Pill>,
    );

    // Assert
    expect(panel().hasAttribute("data-open")).toBe(true);
    expect(document.activeElement).toBe(document.body);
  });

  it("must be rendered inside a pill", () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act + Assert
    expect(() => render(<PillPanel>Body</PillPanel>)).toThrow("[magic-pill] <PillPanel> must be rendered inside a <Pill>.");
  });
});
