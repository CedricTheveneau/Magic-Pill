import { createRef, useState, type ReactNode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PillDate, type PillDateProps } from "./PillDate";
import { placePopover } from "./popover";
import { PillForm } from "./PillForm";
import Pill from "../Pill/Pill";
import { PillPanel } from "../Pill/PillPanel";

const renderForm = (children: ReactNode) =>
  render(
    <Pill defaultPresence="panel">
      <PillPanel title="Panel">
        <PillForm data-testid="form">
          {children}
          <button type="reset">Reset</button>
        </PillForm>
      </PillPanel>
    </Pill>,
  );
const renderDate = (props: Partial<PillDateProps> = {}) => renderForm(<PillDate label="When" name="when" locale="en-US" {...props} />);
const trigger = () => screen.getByRole("button", { name: /^When/ });
const dialog = () => screen.getByRole("dialog");
const isOpen = () => document.querySelector('[data-mp="calendar"]')?.hasAttribute("data-open") ?? false;
const open = () => fireEvent.click(trigger());
const cell = (name: string | RegExp) => within(dialog()).getByRole("button", { name });
const press = (key: string, init = {}) => fireEvent.keyDown(document.activeElement!, { key, ...init });
const sent = () => Object.fromEntries(new FormData(screen.getByTestId<HTMLFormElement>("form")));
const focused = () => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent;

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 10, 25, 9, 7) });
  // jsdom hides popovers, and has no way to show them
  Object.assign(HTMLElement.prototype, {
    showPopover(this: HTMLElement) {
      this.style.display = "block";
    },
    hidePopover(this: HTMLElement) {
      this.style.display = "";
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
  Reflect.deleteProperty(HTMLElement.prototype, "hidePopover");
});

describe("PillDate", () => {
  it("shows its value as it's written there, and sends it as the native input does", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();
    renderDate({ ref, defaultValue: "2026-12-24" } as never);

    // Assert
    expect(trigger().textContent).toBe("December 24, 2026");
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(ref.current).toBe(trigger());
    expect(sent()).toEqual({ when: "2026-12-24" });
  });

  it("says it's empty, in its own words or the app's", () => {
    // Act
    renderDate({ placeholder: "Any day" });

    // Assert
    expect(trigger().textContent).toBe("Any day");
  });

  it("opens on its day, chooses another, and gives the focus back", () => {
    // Arrange
    const onChange = vi.fn();
    renderDate({ defaultValue: "2026-12-24", onChange });

    // Act
    open();

    // Assert
    expect(isOpen()).toBe(true);
    expect(focused()).toBe("Thursday, December 24, 2026");

    // Act
    fireEvent.click(cell("Friday, December 11, 2026"));

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-12-11");
    expect(sent()).toEqual({ when: "2026-12-11" });
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it.each([
    ["ArrowRight", {}, "Friday, December 25, 2026"],
    ["ArrowLeft", {}, "Wednesday, December 23, 2026"],
    ["ArrowDown", {}, "Thursday, December 31, 2026"],
    ["ArrowUp", {}, "Thursday, December 17, 2026"],
    ["Home", {}, "Sunday, December 20, 2026"],
    ["End", {}, "Saturday, December 26, 2026"],
    ["PageDown", {}, "Sunday, January 24, 2027"],
    ["PageUp", { shiftKey: true }, "Wednesday, December 24, 2025"],
  ])("moves with the keyboard (%s)", (key, init, expected) => {
    // Arrange
    renderDate({ defaultValue: "2026-12-24", firstDay: 0 });
    open();

    // Act
    press(key, init);

    // Assert
    expect(focused()).toBe(expected);
  });

  it("keeps the days out of its bounds, or the app's, from being chosen", () => {
    // Arrange
    const onChange = vi.fn();
    renderDate({ defaultValue: "2026-12-24", min: "2026-12-10", disabledDate: (day) => day === "2026-12-25", onChange });
    open();

    // Act
    for (const name of ["Wednesday, December 9, 2026", "Friday, December 25, 2026"]) {
      expect(cell(name).getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(cell(name));
    }

    // Assert
    expect(onChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("closes on Escape, alone: the panel stays", () => {
    // Arrange
    renderDate();
    open();

    // Act
    press("Escape");

    // Assert
    expect(isOpen()).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-mp="pill"]')!.dataset.presence).toBe("panel");
    expect(document.activeElement).toBe(trigger());
  });

  it("closes with a press elsewhere, and opens with the arrow", () => {
    // Arrange
    renderDate();
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(isOpen()).toBe(true);

    // Act + Assert
    fireEvent.pointerDown(dialog());
    expect(isOpen()).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(isOpen()).toBe(false);
  });

  it("goes to today, and can be cleared unless it's required", () => {
    // Arrange
    const { unmount } = renderDate({ defaultValue: "2026-12-24" });
    open();

    // Act + Assert
    fireEvent.click(cell("Today"));
    expect(sent()).toEqual({ when: "2026-11-25" });
    open();
    fireEvent.click(cell("Clear"));
    expect(sent()).toEqual({ when: "" });
    unmount();
    renderDate({ required: true });
    open();
    expect(within(dialog()).queryByText("Clear")).toBeNull();
  });

  it("goes through months and years", () => {
    // Arrange
    renderDate({ defaultValue: "2026-12-24" });
    open();

    // Act + Assert
    fireEvent.click(cell("December 2026"));
    fireEvent.click(cell("2026"));
    fireEvent.click(cell("2020"));
    fireEvent.click(cell("Mar"));
    expect(focused()).toBe("Tuesday, March 24, 2020");
    fireEvent.click(cell("Next"));
    expect(within(dialog()).getByText("April 2020")).toBeDefined();
  });

  it("is told it's required under the field, until it's chosen", () => {
    // Arrange
    renderDate({ required: true });
    const native = document.querySelector<HTMLInputElement>('[data-mp="date-value"]')!;

    // Act
    act(() => void screen.getByTestId<HTMLFormElement>("form").reportValidity());

    // Assert
    expect(trigger().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(trigger());
    expect(native.tabIndex).toBe(-1);

    // Act
    open();
    fireEvent.click(cell("Today"));

    // Assert
    expect(trigger().hasAttribute("aria-invalid")).toBe(false);
  });

  it("goes back with a reset, and can be controlled", () => {
    // Arrange
    const Controlled = () => {
      const [value, setValue] = useState("2026-12-01");
      return <PillDate label="Other" locale="en-US" value={value} onChange={setValue} />;
    };
    renderForm(
      <>
        <PillDate label="When" name="when" locale="en-US" defaultValue="2026-12-24" />
        <Controlled />
      </>,
    );
    open();
    fireEvent.click(cell("Today"));

    // Act
    fireEvent.click(screen.getByText("Reset"));
    act(() => void vi.runAllTimers());

    // Assert
    expect(trigger().textContent).toBe("December 24, 2026");

    // Act
    fireEvent.click(screen.getByRole("button", { name: /^Other/ }));
    fireEvent.click(cell("Wednesday, December 2, 2026"));

    // Assert
    expect(screen.getByRole("button", { name: /^Other/ }).textContent).toBe("December 2, 2026");
  });

  it("does nothing when it's disabled", () => {
    // Arrange
    renderDate({ disabled: true });

    // Act
    open();

    // Assert
    expect(isOpen()).toBe(false);
  });

  it("can always be there, in the form", () => {
    // Act
    renderDate({ inline: true, defaultValue: "2026-12-24" });

    // Assert
    const group = screen.getByRole("group", { name: "When" });
    fireEvent.click(within(group).getByRole("button", { name: "Friday, December 11, 2026" }));
    expect(sent()).toEqual({ when: "2026-12-11" });
    expect(document.activeElement).toBe(document.body);
  });

  it("speaks the app's words", () => {
    // Arrange
    renderDate({ locale: "fr-FR", labels: { today: "Aujourd'hui", clear: "Effacer" } });

    // Act
    open();

    // Assert
    expect(cell("Aujourd'hui")).toBeDefined();
    expect(cell("mercredi 25 novembre 2026")).toBeDefined();
  });
});

describe("the other types", () => {
  it("a week is chosen whole, from Monday", () => {
    // Arrange
    renderDate({ type: "week", defaultValue: "2026-W52", firstDay: 0 });
    open();
    expect(within(dialog()).getAllByRole("columnheader")[1].getAttribute("abbr")).toBe("Monday");
    expect(within(dialog()).getAllByRole("gridcell", { selected: true })).toHaveLength(7);

    // Act
    fireEvent.click(cell("Wednesday, December 9, 2026"));

    // Assert
    expect(sent()).toEqual({ when: "2026-W50" });
  });

  it("a month is chosen among twelve", () => {
    // Arrange
    renderDate({ type: "month", defaultValue: "2026-12" });
    open();

    // Act
    fireEvent.click(cell("Mar"));

    // Assert
    expect(sent()).toEqual({ when: "2026-03" });
    expect(trigger().textContent).toBe("March 2026");
  });

  it("a time is chosen in columns, and waits for Done", () => {
    // Arrange
    renderDate({ type: "time", defaultValue: "19:30" });
    open();
    const hours = within(dialog()).getByRole("listbox", { name: "Hours" });
    expect(document.activeElement).toBe(hours);

    // Act + Assert: 12 hours, in English
    expect(within(hours).getByRole("option", { selected: true }).textContent).toBe("7");
    press("ArrowDown");
    expect(sent()).toEqual({ when: "20:30" });
    fireEvent.click(within(dialog()).getByRole("option", { name: "45" }));
    fireEvent.click(within(dialog()).getByRole("option", { name: "AM" }));
    expect(sent()).toEqual({ when: "08:45" });
    expect(isOpen()).toBe(true);
    fireEvent.click(cell("Done"));
    expect(isOpen()).toBe(false);
  });

  it("a time keeps to its bounds and its step, and shows a minute out of it", () => {
    // Arrange
    renderDate({ type: "time", locale: "fr-FR", defaultValue: "09:07", min: "08:30", max: "18:00", step: 900 });
    open();
    const minutes = within(dialog()).getByRole("listbox", { name: "Minutes" });

    // Assert
    expect(within(minutes).getAllByRole("option").map((option) => option.textContent)).toEqual(["00", "07", "15", "30", "45"]);
    const hours = within(dialog()).getByRole("listbox", { name: "Hours" });
    expect(within(hours).getByRole("option", { name: "07" }).getAttribute("aria-disabled")).toBe("true");
    expect(within(hours).getByRole("option", { name: "08" }).hasAttribute("aria-disabled")).toBe(false);
  });

  it("a date and time keeps one while the other changes", () => {
    // Arrange
    renderDate({ type: "datetime-local", defaultValue: "2026-12-24T19:30" });
    open();

    // Act + Assert
    fireEvent.click(cell("Friday, December 11, 2026"));
    expect(sent()).toEqual({ when: "2026-12-11T19:30" });
    expect(isOpen()).toBe(true);
    fireEvent.click(within(dialog()).getByRole("option", { name: "45" }));
    expect(sent()).toEqual({ when: "2026-12-11T19:45" });
  });
});

describe("placePopover", () => {
  const viewport = { width: 800, height: 600 };
  const popover = { width: 300, height: 350 };

  it.each([
    ["under the field", { top: 100, bottom: 144, left: 50, right: 400 }, false, { left: 50, top: 150, above: false }],
    ["above it when there's more room there", { top: 400, bottom: 444, left: 50, right: 400 }, false, { left: 50, top: 44, above: true }],
    ["within the screen", { top: 100, bottom: 144, left: 700, right: 790 }, false, { left: 492, top: 150, above: false }],
    ["from the end in right-to-left pages", { top: 100, bottom: 144, left: 50, right: 400 }, true, { left: 100, top: 150, above: false }],
  ])("goes %s", (_name, field, isRtl, expected) => {
    // Assert
    expect(placePopover(field, popover, viewport, isRtl)).toMatchObject(expected);
  });

  it("scrolls in the room there is", () => {
    // Assert
    expect(placePopover({ top: 250, bottom: 294, left: 0, right: 100 }, popover, viewport, false).maxHeight).toBe(292);
  });
});
