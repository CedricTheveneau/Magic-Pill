import type { FormEvent } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PillForm, type PillFormProps } from "./PillForm";
import { PillInput } from "./PillInput";
import { PillSubmit, type PillSubmitProps } from "./PillSubmit";
import Pill from "../Pill/Pill";

const renderForm = (form: Partial<PillFormProps> = {}, action: Partial<PillSubmitProps> = {}) =>
  render(
    <Pill>
      <PillForm data-testid="form" {...form}>
        <PillInput label="Email" name="email" defaultValue="camille@example.com" />
        <PillSubmit label="Subscribe" {...action} />
      </PillForm>
    </Pill>,
  );
const button = () => screen.getByRole("button");
const label = () => button().textContent;
const submit = () => act(async () => void fireEvent.submit(screen.getByTestId("form")));
const advance = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

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

beforeEach(() => {
  vi.useFakeTimers();
});

describe("PillSubmit", () => {
  it("says so while its form is sending, and announces it", async () => {
    // Arrange
    const { promise, resolve } = deferred();
    renderForm({ onSend: () => promise });
    expect(label()).toBe("Subscribe");

    // Act
    await submit();

    // Assert
    expect(label()).toBe("Just a moment…");
    expect(button().getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Just a moment…");

    // Act
    await act(async () => resolve());

    // Assert
    expect(label()).toBe("Subscribe");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("goes from one label to the next, stays on the last, and starts again the next time", async () => {
    // Arrange
    let sending = deferred();
    renderForm({ onSend: () => sending.promise }, { busyLabel: ["Sending…", "Still sending…", "Nearly there…"], busyInterval: 1000 });

    // Act + Assert
    await submit();
    expect(label()).toBe("Sending…");
    await advance(1000);
    expect(label()).toBe("Still sending…");
    await advance(1000);
    expect(label()).toBe("Nearly there…");
    await advance(5000);
    expect(label()).toBe("Nearly there…");
    await act(async () => sending.resolve());
    expect(label()).toBe("Subscribe");
    sending = deferred();
    await submit();
    expect(label()).toBe("Sending…");
  });

  it("follows its own `busy`, outside a form", () => {
    // Act
    render(<PillSubmit label="Save" busy busyLabel="Saving…" />);

    // Assert
    expect(label()).toBe("Saving…");
  });

  it("ignores clicks while it's busy", () => {
    // Arrange
    const onClick = vi.fn();
    render(<PillSubmit label="Save" busy onClick={onClick} />);

    // Act
    const notPrevented = fireEvent.click(button());

    // Assert
    expect(notPrevented).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("PillForm's onSend", () => {
  it("gets the data, once, without loading the page", async () => {
    // Arrange
    const { promise, resolve } = deferred();
    const onSend = vi.fn((_data: FormData) => promise);
    renderForm({ onSend });

    // Act
    await submit();
    await submit();

    // Assert
    expect(onSend).toHaveBeenCalledOnce();
    expect(Object.fromEntries(onSend.mock.calls[0][0])).toEqual({ email: "camille@example.com" });
    expect(screen.getByTestId("form").getAttribute("aria-busy")).toBe("true");
    await act(async () => resolve());
    expect(screen.getByTestId("form").hasAttribute("aria-busy")).toBe(false);
  });

  it("says what went wrong", async () => {
    // Arrange
    const { promise, reject } = deferred();
    renderForm({ onSend: () => promise });
    await submit();

    // Act
    await act(async () => reject(new Error("You're already in.")));

    // Assert
    expect(screen.getByRole("alert").textContent).toBe("You're already in.");
    expect(screen.getByTestId("form").hasAttribute("data-failed")).toBe(true);
  });

  it("leaves it alone when onSubmit prevented it", async () => {
    // Arrange
    const onSend = vi.fn();
    renderForm({ onSend, onSubmit: (event: FormEvent) => event.preventDefault() });

    // Act
    await submit();

    // Assert
    expect(onSend).not.toHaveBeenCalled();
  });
});
