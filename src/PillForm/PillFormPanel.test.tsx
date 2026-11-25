import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PillFormPanel, type PillFormPanelProps } from "./PillFormPanel";
import { PillInput } from "./PillInput";
import MagicPill from "../MagicPill/MagicPill";
import Pill from "../Pill/Pill";
import { PillActions } from "../Pill/parts";
import { PillPanelTrigger } from "../Pill/PillPanel";
import { pill as controller, resetStores } from "../store/store";

const Form = (props: Partial<PillFormPanelProps>) => (
  <>
    <PillActions>
      <PillPanelTrigger label="Edit" />
    </PillActions>
    <PillFormPanel title="Profile" submitLabel="Save" {...props}>
      <PillInput label="Name" name="name" defaultValue="Camille" required />
    </PillFormPanel>
  </>
);
const renderPanel = (props: Partial<PillFormPanelProps> = {}) => {
  render(
    <Pill>
      <Form {...props} />
    </Pill>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
};
const presence = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!.dataset.presence;
const input = () => screen.getByLabelText<HTMLInputElement>("Name");
const submit = async () => {
  await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Save" })));
};

/** A promise to settle by hand. */
function deferred() {
  let resolve!: (value?: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("PillFormPanel", () => {
  it("sends the form's data once it's valid, then closes", async () => {
    // Arrange
    const onSubmit = vi.fn((_data: FormData) => {});
    renderPanel({ onSubmit });

    // Act
    await submit();

    // Assert
    expect(Object.fromEntries(onSubmit.mock.calls[0][0])).toEqual({ name: "Camille" });
    expect(presence()).toBe("compact");
  });

  it("stays open while a field is wrong", async () => {
    // Arrange
    const onSubmit = vi.fn();
    renderPanel({ onSubmit });
    fireEvent.input(input(), { target: { value: "" } });

    // Act
    await submit();

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
    expect(presence()).toBe("panel");
    expect(document.activeElement).toBe(input());
  });

  it("stays open when it's told to", async () => {
    // Arrange
    renderPanel({ onSubmit: () => false });

    // Act
    await submit();

    // Assert
    expect(presence()).toBe("panel");
  });

  it("waits for what it sends, and sends it once", async () => {
    // Arrange
    const { promise, resolve } = deferred();
    const onSubmit = vi.fn(() => promise);
    renderPanel({ onSubmit, busyLabel: ["Saving…", "Still saving…"] });

    // Act
    await submit();

    // Assert
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(input().matches(":disabled")).toBe(true);
    fireEvent.submit(input().form!);
    expect(onSubmit).toHaveBeenCalledOnce();

    // Act
    await act(async () => resolve());

    // Assert
    expect(presence()).toBe("compact");
    expect(input().matches(":disabled")).toBe(false);
  });

  it.each([
    ["an error", new Error("The name is taken."), "The name is taken."],
    ["a string", "Try later.", "Try later."],
    ["nothing", undefined, "Oops."],
  ])("says what went wrong, and keeps what was typed (%s)", async (_name, error, message) => {
    // Arrange
    const { promise, reject } = deferred();
    renderPanel({ onSubmit: () => promise, errorLabel: "Oops." });
    fireEvent.input(input(), { target: { value: "Alex" } });
    input().focus();

    // Act
    await submit();
    await act(async () => reject(error));

    // Assert
    expect(presence()).toBe("panel");
    expect(screen.getByRole("alert").textContent).toBe(message);
    expect(input().value).toBe("Alex");
    expect(input().matches(":disabled")).toBe(false);
  });

  it("doesn't close a panel that was opened meanwhile", async () => {
    // Arrange
    const { promise, resolve } = deferred();
    render(
      <Pill>
        <PillActions>
          <PillPanelTrigger panel="edit" label="Edit" />
          <PillPanelTrigger panel="other" label="Other" />
        </PillActions>
        <PillFormPanel name="edit" title="Edit" submitLabel="Save" onSubmit={() => promise} />
        <PillFormPanel name="other" title="Other" />
      </Pill>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await submit();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    fireEvent.click(screen.getByText("Other", { selector: '[data-mp="label"] span' }));

    // Act
    await act(async () => resolve());

    // Assert
    expect(presence()).toBe("panel");
    expect(screen.getByRole("region", { name: "Other" }).hasAttribute("data-open")).toBe(true);
  });

  it("resets its fields from the title's row", () => {
    // Arrange
    renderPanel({ resetLabel: "Default" });
    fireEvent.input(input(), { target: { value: "Alex" } });

    // Act
    const button = screen.getByRole("button", { name: "Default" });
    fireEvent.click(button);

    // Assert
    expect(button.closest('[data-mp="panel-title-action"]')).not.toBeNull();
    expect(input().value).toBe("Camille");
  });

  it("has no main action for settings that apply at once", () => {
    // Act
    renderPanel({ submitLabel: undefined });

    // Assert
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByRole("button", { name: "Close" }).hasAttribute("data-quiet")).toBe(false);
  });
});

describe("a form in a host's base layer", () => {
  beforeEach(() => {
    resetStores();
    vi.useFakeTimers();
  });

  const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
  const message = () => document.querySelector('[data-mp="message"]')?.textContent ?? null;

  it("isn't replaced by a notification while it's being filled in: it waits", () => {
    // Arrange
    render(
      <MagicPill>
        <Form />
      </MagicPill>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.input(input(), { target: { value: "Alex" } });

    // Act
    act(() => void controller().notify({ message: "New message" }));
    for (let i = 0; i < 6; i++) advance(500);

    // Assert
    expect(presence()).toBe("panel");
    expect(input().value).toBe("Alex");

    // Act: it's closed
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    for (let i = 0; i < 6; i++) advance(500);

    // Assert
    expect(message()).toBe("New message");
  });

  it("is, once the app takes the base layer away", () => {
    // Arrange
    const App = () => {
      const [hasBase, setHasBase] = useState(true);
      return (
        <>
          <button onClick={() => setHasBase(false)}>remove</button>
          <MagicPill>{hasBase && <Form />}</MagicPill>
        </>
      );
    };
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    act(() => void controller().notify({ message: "New message" }));

    // Act
    fireEvent.click(screen.getByText("remove"));
    for (let i = 0; i < 6; i++) advance(500);

    // Assert
    expect(message()).toBe("New message");
  });
});
