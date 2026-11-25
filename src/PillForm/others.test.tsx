import { useState, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PillCode } from "./PillCode";
import { PillColor } from "./PillColor";
import { PillFile } from "./PillFile";
import { PillForm } from "./PillForm";
import Pill from "../Pill/Pill";

const renderForm = (children: ReactNode) =>
  render(
    <Pill>
      <PillForm data-testid="form">
        {children}
        <button type="reset">Reset</button>
      </PillForm>
    </Pill>,
  );
const reset = () => {
  fireEvent.click(screen.getByText("Reset"));
  act(() => void vi.runAllTimers());
};

beforeEach(() => {
  vi.useFakeTimers();
});

describe("PillCode", () => {
  const input = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Code" });
  const slots = () => [...document.querySelectorAll('[data-mp="code-slot"]')].map((slot) => slot.textContent);

  it("keeps the digits of what's typed or pasted, and tells once they're all there", () => {
    // Arrange
    const onComplete = vi.fn();
    renderForm(<PillCode label="Code" length={4} onComplete={onComplete} />);

    // Act + Assert
    fireEvent.input(input(), { target: { value: "12a" } });
    expect(input().value).toBe("12");
    expect(slots()).toEqual(["1", "2", "", ""]);
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.input(input(), { target: { value: "12 34-5" } });
    expect(input().value).toBe("1234");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    reset();
    expect(slots()).toEqual(["", "", "", ""]);
  });

  it("is one input, that phones can fill in", () => {
    // Act
    renderForm(<PillCode label="Code" required />);

    // Assert
    expect(input().autocomplete).toBe("one-time-code");
    expect(input().inputMode).toBe("numeric");
    fireEvent.input(input(), { target: { value: "123" } });
    expect(input().validity.patternMismatch).toBe(true);
  });

  it("can be controlled", () => {
    // Arrange
    const Controlled = () => {
      const [code, setCode] = useState("");
      return <PillCode label="Code" length={4} value={code} onChange={(event) => setCode(event.target.value)} />;
    };
    renderForm(<Controlled />);

    // Act
    fireEvent.input(input(), { target: { value: "9x8" } });

    // Assert
    expect(input().value).toBe("98");
    expect(slots()).toEqual(["9", "8", "", ""]);
  });
});

describe("PillFile", () => {
  it("names what was picked, and forgets it with a reset", () => {
    // Arrange
    renderForm(<PillFile label="Photos" multiple prompt="Pick some" />);
    const input = screen.getByLabelText<HTMLInputElement>("Photos");
    const body = () => document.querySelector('[data-mp="file-body"]')?.textContent;
    expect(body()).toBe("Pick some");

    // Act
    fireEvent.change(input, { target: { files: [new File([], "a.png"), new File([], "b.png")] } });

    // Assert
    expect(body()).toBe("a.png, b.png");

    // Act: jsdom keeps the files that were forced in
    Object.defineProperty(input, "files", { value: [] });
    reset();

    // Assert
    expect(body()).toBe("Pick some");
  });

  it("shows where files can be dropped", () => {
    // Arrange
    renderForm(<PillFile label="Photos" />);
    const area = document.querySelector('[data-type="file"]')!;

    // Act + Assert
    fireEvent.dragEnter(area);
    expect(area.hasAttribute("data-over")).toBe(true);
    fireEvent.drop(area);
    expect(area.hasAttribute("data-over")).toBe(false);
  });
});

describe("PillColor", () => {
  it("draws the colour that was picked", () => {
    // Arrange
    renderForm(<PillColor label="Highlight" defaultValue="#ff4f00" />);
    const input = screen.getByLabelText<HTMLInputElement>("Highlight");
    const drawn = () => document.querySelector<HTMLElement>('[data-type="color"]')!.style.getPropertyValue("--_mp-color");
    expect(drawn()).toBe("#ff4f00");

    // Act + Assert
    fireEvent.input(input, { target: { value: "#0d3142" } });
    expect(drawn()).toBe("#0d3142");
    reset();
    expect(drawn()).toBe("#ff4f00");
  });
});
