import { createRef, type FormEvent, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PillField } from "./PillField";
import { PillForm } from "./PillForm";
import { PillInput } from "./PillInput";
import { PillSelect } from "./PillSelect";
import { PillTextarea } from "./PillTextarea";
import Pill from "../Pill/Pill";
import { PillPanel } from "../Pill/PillPanel";
import type { PillFormProps } from "./PillForm";
import { resetInputModality } from "../utils/inputModality";

const renderForm = (children: ReactNode, props: Partial<PillFormProps> = {}) =>
  render(
    <Pill defaultPresence="panel">
      <PillPanel title="Form">
        <PillForm data-testid="form" onSubmit={(event: FormEvent) => event.preventDefault()} {...props}>
          {children}
          <button type="submit">Save</button>
          <button type="reset">Reset</button>
        </PillForm>
      </PillPanel>
    </Pill>,
  );

const form = () => screen.getByTestId<HTMLFormElement>("form");
const submit = () => fireEvent.click(screen.getByText("Save"));
/** The text read with a control. */
const description = (control: HTMLElement) =>
  (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent);

describe("fields", () => {
  it("are native controls with a name, a hint and the props they're given", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();
    renderForm(
      <PillInput ref={ref} label="Email" hint="We never share it." name="email" type="email" required autoComplete="email" />,
    );

    // Assert
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Email" });
    expect(ref.current).toBe(input);
    expect(input.type).toBe("email");
    expect(input.required).toBe(true);
    expect(input.autocomplete).toBe("email");
    expect(description(input)).toEqual(["We never share it."]);
  });

  it("keep a hidden label as their name", () => {
    // Act
    renderForm(<PillInput label="Search" hideLabel type="search" />);

    // Assert
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeDefined();
  });

  it.each([
    [true, "Phone optional"],
    ["facultatif", "Phone facultatif"],
  ])("say they're optional (%s)", (optional, name) => {
    // Act
    renderForm(<PillInput label="Phone" optional={optional} />);

    // Assert
    expect(screen.getByRole("textbox", { name })).toBeDefined();
  });

  it("show the app's own error, read with the control", () => {
    // Act
    renderForm(<PillInput label="Username" error="This username is taken." />);

    // Assert
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(description(input)).toEqual(["This username is taken."]);
    expect(input.closest('[data-mp="field"]')?.hasAttribute("data-invalid")).toBe(true);
  });

  it("send their values with the form", () => {
    // Arrange
    renderForm(
      <>
        <PillInput label="Name" name="name" defaultValue="Camille" />
        <PillInput label="Date" name="date" type="date" defaultValue="2026-12-24" />
        <PillTextarea label="About" name="about" defaultValue="Hello" />
        <PillSelect label="Language" name="lang" options={["FR", "EN"]} defaultValue="EN" />
      </>,
    );

    // Act
    const data = Object.fromEntries(new FormData(form()));

    // Assert
    expect(data).toEqual({ name: "Camille", date: "2026-12-24", about: "Hello", lang: "EN" });
  });

  it("wrap any control of yours", () => {
    // Act
    renderForm(
      <PillField label="Rating" hint="Out of five." error="Pick one.">
        {(control) => <input {...control} type="number" />}
      </PillField>,
    );

    // Assert
    const input = screen.getByRole("spinbutton", { name: "Rating" });
    expect(description(input)).toEqual(["Out of five.", "Pick one."]);
  });

  it("group several controls under one label", () => {
    // Act
    renderForm(
      <PillField label="Colours" group="group">
        {() => <input type="checkbox" aria-label="Red" />}
      </PillField>,
    );

    // Assert
    expect(screen.getByRole("group", { name: "Colours" }).tagName).toBe("FIELDSET");
  });

  it("follow their form's layout, when they're text", () => {
    // Act
    renderForm(
      <>
        <PillInput label="Beside" />
        <PillInput label="Above" layout="stacked" />
        <PillTextarea label="Long" />
      </>,
      { layout: "inline" },
    );

    // Assert
    const layouts = [...document.querySelectorAll<HTMLElement>('[data-mp="field"]')].map((field) => field.dataset.layout);
    expect(layouts).toEqual(["inline", "stacked", "stacked"]);
  });

  it("draw their focus ring for the keyboard only, not after a click or a tap", () => {
    // Arrange
    resetInputModality();
    renderForm(
      <>
        <PillInput label="Name" />
        <PillInput label="Email" />
      </>,
    );
    const name = screen.getByLabelText("Name");
    const email = screen.getByLabelText("Email");
    const field = (control: HTMLElement) => control.closest<HTMLElement>('[data-mp="field"]');

    // Act: a click, then Tab to the next one
    fireEvent.pointerDown(name);
    name.focus();
    const clicked = field(name)?.hasAttribute("data-pointer-focus");
    fireEvent.keyDown(name, { key: "Tab" });
    email.focus();

    // Assert
    expect(clicked).toBe(true);
    expect(field(email)?.hasAttribute("data-pointer-focus")).toBe(false);
  });
});

describe("PillInput", () => {
  it("shows a password, and hides it again", () => {
    // Arrange
    renderForm(<PillInput label="Password" type="password" defaultValue="secret" revealLabel="Afficher" />);
    const input = screen.getByLabelText<HTMLInputElement>("Password");
    const button = screen.getByRole("button", { name: "Afficher" });

    // Act + Assert
    expect(input.type).toBe("password");
    fireEvent.click(button);
    expect(input.type).toBe("text");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button);
    expect(input.type).toBe("password");
    expect(input.value).toBe("secret");
  });

  it("offers suggestions", () => {
    // Act
    renderForm(<PillInput label="City" suggestions={["Lisbon", "London"]} />);

    // Assert
    const input = screen.getByLabelText<HTMLInputElement>("City");
    expect([...(input.list?.options ?? [])].map((option) => option.value)).toEqual(["Lisbon", "London"]);
  });
});

describe("PillTextarea", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("counts with maxLength, and again after a reset", () => {
    // Arrange
    renderForm(<PillTextarea label="About" maxLength={20} defaultValue="Hello" />);
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    const count = () => document.querySelector('[data-mp="field-aside"]')?.textContent;
    expect(count()).toBe("5 / 20");

    // Act + Assert
    fireEvent.input(textarea, { target: { value: "Hello there" } });
    expect(count()).toBe("11 / 20");
    fireEvent.click(screen.getByText("Reset"));
    act(() => void vi.runAllTimers());
    expect(textarea.value).toBe("Hello");
    expect(count()).toBe("5 / 20");
  });
});

describe("PillSelect", () => {
  it("lists strings, options and groups", () => {
    // Act
    renderForm(
      <PillSelect
        label="Country"
        options={["Elsewhere", { value: "jp", label: "Japan", disabled: true }, { label: "Europe", options: ["France"] }]}
      />,
    );

    // Assert
    const options = screen.getAllByRole<HTMLOptionElement>("option");
    expect(options.map(({ value, label, disabled }) => [value, label, disabled])).toEqual([
      ["Elsewhere", "Elsewhere", false],
      ["jp", "Japan", true],
      ["France", "France", false],
    ]);
    expect(screen.getByRole("group", { name: "Europe" })).toBeDefined();
  });

  it("starts with its placeholder, which isn't a choice", () => {
    // Act
    renderForm(<PillSelect label="Size" options={["S", "M"]} placeholder="Pick one" required />);

    // Assert
    const select = screen.getByRole<HTMLSelectElement>("combobox");
    expect(select.value).toBe("");
    expect(select.validity.valueMissing).toBe(true);
  });

  it("keeps Escape to itself while its list is open, so the panel stays", () => {
    // Arrange
    renderForm(<PillSelect label="Size" options={["S", "M"]} />);
    const select = screen.getByRole("combobox");
    const pill = document.querySelector<HTMLElement>('[data-mp="pill"]')!;
    const matches = select.matches.bind(select);
    let isOpen = true;
    vi.spyOn(select, "matches").mockImplementation((selector) => (selector === ":open" ? isOpen : matches(selector)));

    // Act + Assert
    fireEvent.keyDown(select, { key: "Escape" });
    expect(pill.dataset.presence).toBe("panel");
    isOpen = false;
    fireEvent.keyDown(select, { key: "Escape" });
    expect(pill.dataset.presence).toBe("compact");
  });
});

describe("validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const twoFields = (
    <>
      <PillInput label="Name" required />
      <PillInput label="Email" type="email" required />
    </>
  );
  const name = () => screen.getByLabelText<HTMLInputElement>("Name");
  const email = () => screen.getByLabelText<HTMLInputElement>("Email");

  it("shows the browser's messages under the fields, and focuses the first", () => {
    // Arrange
    const onSubmit = vi.fn();
    renderForm(twoFields, { onSubmit });

    // Act
    submit();

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
    expect(description(name())).toEqual([name().validationMessage]);
    expect(description(email())).toEqual([email().validationMessage]);
    expect(name().validationMessage).not.toBe("");
    expect(document.activeElement).toBe(name());
  });

  it("drops a message as soon as the value is right", () => {
    // Arrange
    renderForm(twoFields);
    submit();

    // Act + Assert
    fireEvent.input(email(), { target: { value: "camille@" } });
    expect(email().getAttribute("aria-invalid")).toBe("true");
    fireEvent.input(email(), { target: { value: "camille@example.com" } });
    expect(email().hasAttribute("aria-invalid")).toBe(false);
    expect(name().getAttribute("aria-invalid")).toBe("true");
  });

  it("checks a field that was changed as it's left", () => {
    // Arrange: jsdom has no :user-invalid
    renderForm(twoFields);
    const matches = email().matches.bind(email());
    vi.spyOn(email(), "matches").mockImplementation((selector) => (selector === ":user-invalid" ? true : matches(selector)));
    fireEvent.input(email(), { target: { value: "camille@" } });
    expect(email().hasAttribute("aria-invalid")).toBe(false);

    // Act
    fireEvent.blur(email());

    // Assert
    expect(description(email())).toEqual([email().validationMessage]);
  });

  it("leaves the messages to the browser's bubbles when asked to", () => {
    // Arrange
    renderForm(twoFields, { errors: "native" });

    // Act
    const notPrevented = fireEvent.invalid(name());

    // Assert
    expect(notPrevented).toBe(true);
    expect(name().hasAttribute("aria-invalid")).toBe(false);
  });

  it("is forgotten when the form is reset", () => {
    // Arrange
    renderForm(twoFields);
    submit();

    // Act
    fireEvent.click(screen.getByText("Reset"));
    act(() => void vi.runAllTimers());

    // Assert
    expect(name().hasAttribute("aria-invalid")).toBe(false);
  });

  it("lets the app's error win", () => {
    // Arrange
    renderForm(<PillInput label="Name" required error="Already taken." />);

    // Act
    submit();

    // Assert
    expect(description(name())).toEqual(["Already taken."]);
  });
});

describe("PillForm", () => {
  it("writes its look, and submits when everything is valid", () => {
    // Arrange
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    renderForm(<PillInput label="Name" defaultValue="Camille" required />, { look: "soft", onSubmit });

    // Act
    submit();

    // Assert
    expect(form().dataset.look).toBe("soft");
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it.each([
    ["disabled", { disabled: true }, null],
    ["busy", { busy: true }, "true"],
  ])("disables its fields when it's %s", (_name, props, ariaBusy) => {
    // Act
    renderForm(<PillInput label="Name" />, props);

    // Assert
    expect(screen.getByLabelText("Name").matches(":disabled")).toBe(true);
    expect(form().getAttribute("aria-busy")).toBe(ariaBusy);
  });
});

describe("the on-screen keyboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const viewport = Object.assign(new EventTarget(), { height: 768, offsetTop: 0, scale: 1 });
  const resize = (height: number, scale = 1) => {
    Object.assign(viewport, { height, scale });
    viewport.dispatchEvent(new Event("resize"));
  };
  const keyboard = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!.style.getPropertyValue("--_mp-keyboard");

  it("lifts the pill while one of its fields has the focus", () => {
    // Arrange
    vi.stubGlobal("visualViewport", viewport);
    resize(768);
    renderForm(<PillInput label="Name" />);

    // Act + Assert
    resize(400);
    expect(keyboard()).toBe("");
    screen.getByLabelText("Name").focus();
    expect(keyboard()).toBe(`${window.innerHeight - 400}px`);
    resize(760); // only a toolbar
    expect(keyboard()).toBe("");
    resize(400, 2); // zoomed in
    expect(keyboard()).toBe("");
    resize(400);
    screen.getByLabelText("Name").blur();
    expect(keyboard()).toBe("");
  });
});
