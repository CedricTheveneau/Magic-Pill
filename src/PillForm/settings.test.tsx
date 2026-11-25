import { createRef, useState, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PillCheckbox } from "./PillCheckbox";
import { PillChoices } from "./PillChoices";
import { PillFields } from "./PillFields";
import { PillForm } from "./PillForm";
import { PillSlider } from "./PillSlider";
import { PillStepper } from "./PillStepper";
import { PillSwitch } from "./PillSwitch";
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
const data = () => [...new FormData(screen.getByTestId<HTMLFormElement>("form"))];
const reset = () => {
  fireEvent.click(screen.getByText("Reset"));
  act(() => void vi.runAllTimers());
};

beforeEach(() => {
  vi.useFakeTimers();
});

describe("PillSwitch", () => {
  it("is a switch, named by its label", () => {
    // Arrange
    renderForm(<PillSwitch label="Dark mode" name="dark" hint="At night." defaultChecked />);

    // Assert
    const control = screen.getByRole<HTMLInputElement>("switch", { name: "Dark mode" });
    expect(control.checked).toBe(true);
    expect(data()).toEqual([["dark", "on"]]);
    expect(document.getElementById(control.getAttribute("aria-describedby")!)?.textContent).toBe("At night.");
  });

  it("can be controlled", () => {
    // Arrange
    const Controlled = () => {
      const [isOn, setIsOn] = useState(false);
      return <PillSwitch label="Sounds" checked={isOn} onChange={(event) => setIsOn(event.target.checked)} />;
    };
    renderForm(<Controlled />);

    // Act
    fireEvent.click(screen.getByRole("switch"));

    // Assert
    expect(screen.getByRole<HTMLInputElement>("switch").checked).toBe(true);
  });
});

describe("PillCheckbox", () => {
  it("can be neither checked nor not", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();

    // Act
    renderForm(<PillCheckbox ref={ref} label="Some of my devices" indeterminate />);

    // Assert
    expect(ref.current?.indeterminate).toBe(true);
  });

  it("asks to be checked when it's required", () => {
    // Arrange
    renderForm(<PillCheckbox label="I agree" required />);
    const checkbox = screen.getByRole<HTMLInputElement>("checkbox");

    // Act
    fireEvent.invalid(checkbox);

    // Assert
    expect(checkbox.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("PillSlider", () => {
  const position = () => document.querySelector<HTMLElement>('[data-type="slider"]')!.style.getPropertyValue("--_mp-at");
  const shown = () => document.querySelector('[data-mp="field-aside"]')?.textContent;

  it("shows its value, says it, and goes back to it with a reset", () => {
    // Arrange
    renderForm(<PillSlider label="Duration" name="duration" min={5} max={25} defaultValue={10} format={(v) => `${v} min`} />);
    const slider = screen.getByRole<HTMLInputElement>("slider", { name: "Duration" });
    expect([shown(), position(), slider.getAttribute("aria-valuetext")]).toEqual(["10 min", "0.25", "10 min"]);

    // Act + Assert
    fireEvent.change(slider, { target: { value: "20" } });
    expect([shown(), position(), slider.getAttribute("aria-valuetext")]).toEqual(["20 min", "0.75", "20 min"]);
    expect(data()).toEqual([["duration", "20"]]);
    reset();
    expect([slider.value, shown(), position()]).toEqual(["10", "10 min", "0.25"]);
  });

  it("starts halfway, follows its value when it's controlled, and stays in its bounds", () => {
    // Arrange
    const { rerender } = render(<PillSlider label="Volume" />);
    expect(shown()).toBe("50");

    // Act
    rerender(<PillSlider label="Volume" value={130} onChange={() => {}} />);

    // Assert
    expect(position()).toBe("1");
  });
});

describe("PillChoices", () => {
  const plans = ["Weekly", "Monthly", { value: "year", label: "Yearly", disabled: true }];
  const bar = () => document.querySelector<HTMLElement>('[data-mp="choices"]')!;
  const thumb = () => document.querySelector<HTMLElement>('[data-mp="choices-thumb"]');

  it("are radios, in a group named by the label", () => {
    // Arrange
    const onChange = vi.fn();
    renderForm(<PillChoices label="Plan" name="plan" options={plans} defaultValue="Weekly" onChange={onChange} />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeDefined();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Monthly", expect.anything());
    expect(data()).toEqual([["plan", "Monthly"]]);
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Yearly" }).disabled).toBe(true);
  });

  it("are checkboxes with `multiple`, in the options' order", () => {
    // Arrange
    const onChange = vi.fn();
    renderForm(
      <PillChoices label="Music" name="music" multiple look="chips" options={["Pop", "Jazz", "Folk"]} defaultValue={["Folk"]} onChange={onChange} />,
    );

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: "Pop" }));

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith(["Pop", "Folk"], expect.anything());
    expect(data()).toEqual([
      ["music", "Pop"],
      ["music", "Folk"],
    ]);
  });

  it("slide in one bar, from one choice to the next", () => {
    // Arrange
    renderForm(<PillChoices label="Plan" look="segmented" options={plans} defaultValue="Weekly" />);
    expect(bar().style.getPropertyValue("--_mp-at")).toBe("0");

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));

    // Assert
    expect(bar().style.getPropertyValue("--_mp-at")).toBe("1");
    expect(thumb()?.hasAttribute("data-appearing")).toBe(false);

    // Act: back to where it was
    reset();

    // Assert
    expect(bar().style.getPropertyValue("--_mp-at")).toBe("0");
  });

  it("don't slide the first choice in from the start: it appears in place", () => {
    // Arrange
    renderForm(<PillChoices label="Plan" look="segmented" options={plans} />);
    expect(thumb()?.hasAttribute("data-empty")).toBe(true);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));

    // Assert
    expect(thumb()?.hasAttribute("data-empty")).toBe(false);
    expect(thumb()?.hasAttribute("data-appearing")).toBe(true);

    // Act: the next one slides
    fireEvent.click(screen.getByRole("radio", { name: "Weekly" }));

    // Assert
    expect(thumb()?.hasAttribute("data-appearing")).toBe(false);
  });

  it("have nothing to slide when several can be chosen, or in a list", () => {
    // Act
    renderForm(
      <>
        <PillChoices label="Days" look="segmented" multiple options={["Sat", "Sun"]} />
        <PillChoices label="Plan" options={plans} />
      </>,
    );

    // Assert
    expect(thumb()).toBeNull();
  });

  it("can be controlled", () => {
    // Arrange
    const { rerender } = render(<PillChoices label="Plan" look="segmented" options={plans} value="Weekly" onChange={() => {}} />);

    // Act
    rerender(<PillChoices label="Plan" look="segmented" options={plans} value="Monthly" onChange={() => {}} />);

    // Assert
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Monthly" }).checked).toBe(true);
    expect(bar().style.getPropertyValue("--_mp-at")).toBe("1");
  });

  it("ask for one when they're required", () => {
    // Arrange
    renderForm(<PillChoices label="Plan" name="plan" options={plans} required />);

    // Act
    act(() => void screen.getByTestId<HTMLFormElement>("form").reportValidity());

    // Assert
    expect(document.querySelector('[data-mp="field"]')?.hasAttribute("data-invalid")).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Weekly" }));
  });
});

describe("PillStepper", () => {
  const input = () => screen.getByRole<HTMLInputElement>("spinbutton", { name: "Guests" });
  const buttons = () => [...document.querySelectorAll<HTMLButtonElement>('[data-mp="stepper-button"]')];

  it("goes one step at a time, as if it were typed, and stops at its limits", () => {
    // Arrange
    const onChange = vi.fn();
    renderForm(<PillStepper label="Guests" name="guests" min={1} max={3} onChange={onChange} />);
    const [less, more] = buttons();
    expect(less.disabled).toBe(true);

    // Act
    fireEvent.click(more);
    fireEvent.click(more);

    // Assert
    expect(input().value).toBe("3");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(more.disabled).toBe(true);
    expect(less.disabled).toBe(false);

    // Act
    reset();

    // Assert
    expect(data()).toEqual([["guests", "1"]]);
    expect(less.disabled).toBe(true);
  });

  it("works controlled", () => {
    // Arrange
    const Controlled = () => {
      const [guests, setGuests] = useState(2);
      return <PillStepper label="Guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))} />;
    };
    renderForm(<Controlled />);

    // Act
    fireEvent.click(buttons()[1]);

    // Assert
    expect(input().value).toBe("3");
  });

  it("leaves its buttons to the pointer: the arrows do it with the keyboard", () => {
    // Act
    renderForm(<PillStepper label="Guests" />);

    // Assert
    expect(buttons().every((button) => button.tabIndex === -1 && button.getAttribute("aria-hidden") === "true")).toBe(true);
  });
});

describe("PillFields", () => {
  it("name a group, or none without a label", () => {
    // Act
    renderForm(
      <>
        <PillFields label="Display" columns={2} separators>
          <PillSwitch label="Dark mode" />
        </PillFields>
        <PillFields>
          <PillSwitch label="Sounds" />
        </PillFields>
      </>,
    );

    // Assert
    const group = screen.getByRole("group");
    expect(group).toBe(screen.getByRole("group", { name: "Display" }));
    expect([group.dataset.columns, group.hasAttribute("data-separators")]).toEqual(["2", true]);
  });
});
