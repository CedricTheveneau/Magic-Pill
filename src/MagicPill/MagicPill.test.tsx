import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MagicPill from "./MagicPill";
import { usePill } from "../Pill/PillContext";
import { PillMessage } from "../Pill/parts";
import { PillNavbar } from "../PillNavbar/PillNavbar";
import { getStore, pill, resetStores, type NotifyInput } from "../store/store";
import { usePillQueue } from "../store/usePillQueue";
import CheckIcon from "../icons/CheckIcon";
import HelpIcon from "../icons/HelpIcon";

// The stylesheet's default timings, which the host falls back to in jsdom
const ENTER = 500;
const CHANGE = 250;
const EXIT = 300;
const DURATION = 5000;

const root = () => document.querySelector<HTMLElement>('[data-mp="pill"]')!;
const presence = () => root().dataset.presence;
const message = () => root().querySelector('[data-mp="message"]')?.textContent ?? null;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const notify = (input: NotifyInput, name?: string) => {
  let id = "";
  act(() => {
    id = pill(name).notify(input);
  });
  return id;
};
/** Notify and wait until it's fully shown. */
const show = (input: NotifyInput) => {
  const id = notify(input);
  advance(ENTER);
  return id;
};

const items = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
];

describe("MagicPill", () => {
  beforeEach(() => {
    resetStores();
    vi.useFakeTimers();
  });

  describe("lifecycle", () => {
    it("is hidden until notified, pops in as a circle, grows, then hides after the duration", () => {
      // Arrange
      const onDismiss = vi.fn();
      render(<MagicPill />);
      expect(presence()).toBe("hidden");
      expect(root().dataset.placement).toBe("bottom");

      // Act + Assert: the pop
      const id = notify({ icon: <CheckIcon />, message: "Saved", onDismiss });
      expect(presence()).toBe("rest");
      advance(ENTER - 1);
      expect(presence()).toBe("rest");
      advance(1);
      expect(presence()).toBe("compact");
      expect(message()).toBe("Saved");

      // Act + Assert: the display time, then the exit
      advance(DURATION - 1);
      expect(presence()).toBe("compact");
      advance(1);
      expect(presence()).toBe("hidden");
      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id, "timeout");

      // The content stays while it scales out, then goes
      expect(message()).toBe("Saved");
      advance(CHANGE + EXIT);
      expect(message()).toBeNull();
    });

    it("shows queued notifications one after the other, swapping at the circle", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "first" });
      notify({ message: "second" });
      expect(message()).toBe("first");

      // Act
      advance(DURATION);

      // Assert
      expect(presence()).toBe("rest");
      expect(message()).toBe("first");
      advance(CHANGE);
      expect(message()).toBe("second");
      expect(presence()).toBe("compact");
      advance(DURATION);
      expect(presence()).toBe("hidden");
    });

    it("shows notifications sent before it mounted", () => {
      // Arrange
      act(() => void pill().notify({ message: "early" }));

      // Act
      render(<MagicPill />);
      advance(ENTER);

      // Assert
      expect(presence()).toBe("compact");
      expect(message()).toBe("early");
    });

    it("only follows its own name", () => {
      // Arrange
      render(<MagicPill name="sidebar" />);

      // Act
      notify({ message: "for main" });

      // Assert
      expect(presence()).toBe("hidden");
      notify({ message: "for the sidebar" }, "sidebar");
      advance(ENTER);
      expect(message()).toBe("for the sidebar");
    });
  });

  describe("base layer (A2)", () => {
    it("shows its base straight away and never hides it", () => {
      // Act
      render(
        <MagicPill>
          <PillNavbar items={items} pathname="/" />
        </MagicPill>,
      );
      advance(DURATION * 3);

      // Assert
      expect(presence()).toBe("compact");
      expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    });

    it("lets a notification take the pill over, then returns to the base", () => {
      // Arrange
      render(
        <MagicPill>
          <PillNavbar items={items} pathname="/" />
        </MagicPill>,
      );

      // Act: take over
      notify({ message: "Hello" });
      expect(presence()).toBe("rest");
      advance(CHANGE);

      // Assert
      expect(presence()).toBe("compact");
      expect(message()).toBe("Hello");
      expect(screen.queryByRole("navigation")).toBeNull();

      // Act: back to the base
      advance(DURATION);
      expect(presence()).toBe("rest");
      advance(CHANGE);

      // Assert
      expect(presence()).toBe("compact");
      expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    });

    it("lays new content out closed before the pill grows around it (L21)", () => {
      // Arrange: record what's on screen whenever the host forces a layout
      const layouts: [string | undefined, string | null][] = [];
      const offsetWidth = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
        if (this.dataset.mp === "pill") layouts.push([presence(), message()]);
        return 0;
      });
      render(
        <MagicPill>
          <PillNavbar items={items} pathname="/" />
        </MagicPill>,
      );

      // Act
      notify({ message: "Hello" });
      advance(CHANGE);

      // Assert: the message was on the page, closed, before the pill opened
      expect(layouts).toEqual([["rest", "Hello"]]);
      expect(presence()).toBe("compact");
      offsetWidth.mockRestore();
    });

    it("can rest as a circle when idle", () => {
      // Act
      render(<MagicPill idle="rest" idleIcon={<HelpIcon data-testid="idle" />} />);

      // Assert
      expect(presence()).toBe("rest");
      expect(screen.getByTestId("idle")).toBeTruthy();
    });
  });

  describe("options", () => {
    it("takes a duration per notification, or from the host", () => {
      // Arrange
      render(<MagicPill duration={2000} />);

      // Act + Assert
      show({ message: "host duration" });
      advance(2000);
      expect(presence()).toBe("hidden");

      advance(CHANGE + EXIT);
      show({ message: "own duration", duration: 8000 });
      advance(7999);
      expect(presence()).toBe("compact");
      advance(1);
      expect(presence()).toBe("hidden");
    });

    it("keeps an Infinity notification until it's dismissed", () => {
      // Arrange
      render(<MagicPill />);
      const id = show({ message: "sticky", duration: Infinity });

      // Act
      advance(DURATION * 10);
      expect(presence()).toBe("compact");
      act(() => pill().dismiss(id));

      // Assert
      expect(presence()).toBe("hidden");
    });

    it("updates a shown notification in place and restarts its countdown", () => {
      // Arrange
      render(<MagicPill />);
      const id = show({ message: "Saving…", duration: Infinity });
      advance(DURATION * 2);

      // Act
      act(() => pill().update(id, { message: "Saved", duration: 3000 }));

      // Assert: no animation, new content, new countdown
      expect(presence()).toBe("compact");
      expect(message()).toBe("Saved");
      advance(2999);
      expect(presence()).toBe("compact");
      advance(1);
      expect(presence()).toBe("hidden");
    });

    it("uses the notification's variant over the host's", () => {
      // Arrange
      render(<MagicPill variant="brand" />);

      // Act
      show({ message: "ok", variant: "success" });

      // Assert
      expect(root().dataset.variant).toBe("success");
    });

    it("dismisses on an action click, unless the handler prevents the default", () => {
      // Arrange
      const onDismiss = vi.fn();
      const onClick = vi.fn((event: { preventDefault: () => void }) => {
        if (onClick.mock.calls.length === 1) event.preventDefault();
      });
      render(<MagicPill />);
      const id = show({ message: "Promo", action: { label: "Activate", onClick }, onDismiss });

      // Act + Assert: kept open the first time
      fireEvent.click(screen.getByRole("button", { name: "Activate" }));
      expect(onDismiss).not.toHaveBeenCalled();

      // Act + Assert: dismissed the second time
      fireEvent.click(screen.getByRole("button", { name: "Activate" }));
      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id, "action");
      expect(presence()).toBe("hidden");
    });

    it("renders custom templates with their id and a dismiss function", () => {
      // Arrange
      const onDismiss = vi.fn();
      render(<MagicPill />);

      // Act
      const id = show({
        onDismiss,
        render: ({ id: ownId, dismiss }) => (
          <>
            <PillMessage>Call {ownId}</PillMessage>
            <button onClick={dismiss}>Decline</button>
          </>
        ),
      });
      expect(message()).toBe(`Call ${id}`);
      fireEvent.click(screen.getByRole("button", { name: "Decline" }));

      // Assert
      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id, "dismissed");
    });

    it("treats a request to hide the pill (e.g. Escape on an overlay) as a dismissal", () => {
      // Arrange
      const onDismiss = vi.fn();
      const Hide = () => {
        const { setPresence } = usePill();
        return <button onClick={() => setPresence("hidden")}>hide</button>;
      };
      render(<MagicPill />);
      const id = show({ onDismiss, render: () => <Hide /> });

      // Act
      fireEvent.click(screen.getByRole("button", { name: "hide" }));

      // Assert
      expect(onDismiss).toHaveBeenCalledExactlyOnceWith(id, "dismissed");
    });
  });

  describe("pauses", () => {
    it("stays while hovered and hides a full duration after the pointer leaves", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "Hello" });

      // Act
      fireEvent.mouseEnter(root());
      advance(DURATION * 3);
      expect(presence()).toBe("compact");
      fireEvent.mouseLeave(root());

      // Assert
      advance(DURATION - 1);
      expect(presence()).toBe("compact");
      advance(1);
      expect(presence()).toBe("hidden");
    });

    it("doesn't start the countdown when hovered during the entry (L15)", () => {
      // Arrange
      render(<MagicPill />);
      notify({ message: "Hello" });

      // Act
      fireEvent.mouseEnter(root());
      advance(ENTER + DURATION * 3);

      // Assert
      expect(presence()).toBe("compact");
    });

    it("pauses while an element inside has keyboard focus, across moves inside (Y3)", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "Hello", action: { label: "Open", href: "/orders" }, panel: { content: "Body" } });
      const link = screen.getByRole("link", { name: "Open" });
      const trigger = screen.getByRole("button", { name: "Learn more" });

      // Act: focus moves from one action to the other
      act(() => link.focus());
      act(() => trigger.focus());
      advance(DURATION * 3);
      expect(presence()).toBe("compact");

      // Act: focus leaves
      act(() => trigger.blur());

      // Assert
      advance(DURATION);
      expect(presence()).toBe("hidden");
    });

    it("waits for both the pointer and the focus to leave", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "Hello", action: { label: "Open", href: "/orders" } });
      const link = screen.getByRole("link", { name: "Open" });
      fireEvent.mouseEnter(root());
      act(() => link.focus());

      // Act + Assert: the pointer leaves first
      fireEvent.mouseLeave(root());
      advance(DURATION * 3);
      expect(presence()).toBe("compact");

      // Act + Assert: then the focus
      act(() => link.blur());
      advance(DURATION);
      expect(presence()).toBe("hidden");
    });

    it("pauses while the panel is open", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "Discover", panel: { title: "Powers", content: "Body" } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
      advance(DURATION * 3);

      // Assert
      expect(presence()).toBe("panel");
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      act(() => (document.activeElement as HTMLElement | null)?.blur());
      expect(presence()).toBe("compact");
      advance(DURATION);
      expect(presence()).toBe("hidden");
    });

    it("pauses while the browser tab is hidden", () => {
      // Arrange
      let visibility: DocumentVisibilityState = "visible";
      vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
      render(<MagicPill />);
      show({ message: "Hello" });

      // Act
      visibility = "hidden";
      act(() => void document.dispatchEvent(new Event("visibilitychange")));
      advance(DURATION * 3);
      expect(presence()).toBe("compact");
      visibility = "visible";
      act(() => void document.dispatchEvent(new Event("visibilitychange")));

      // Assert
      advance(DURATION);
      expect(presence()).toBe("hidden");
    });
  });

  describe("accessibility", () => {
    const announcer = () => screen.getByRole("status");

    it("announces through a live region outside the pill, with the message's text (Y1)", () => {
      // Arrange
      render(<MagicPill />);

      // Act
      show({
        icon: <CheckIcon />,
        message: (
          <>
            Total: <strong>768.99$</strong>
          </>
        ),
      });

      // Assert
      expect(announcer().getAttribute("aria-live")).toBe("polite");
      expect(root().contains(announcer())).toBe(false);
      expect(announcer().textContent).toBe("Total: 768.99$");
    });

    it("announces updates, custom text, and nothing when asked", () => {
      // Arrange
      render(<MagicPill />);
      const id = show({ message: "Saving…", duration: Infinity });

      // Act + Assert
      act(() => pill().update(id, { message: "Saved" }));
      expect(announcer().textContent).toBe("Saved");

      act(() => pill().update(id, { announce: "All changes saved" }));
      expect(announcer().textContent).toBe("All changes saved");

      act(() => pill().notify({ id, message: "Quiet", announce: false }));
      expect(announcer().textContent).toBe("All changes saved");
    });

    it("takes a hidden pill out of the accessibility tree, while the live region stays (Y5)", () => {
      // Arrange
      render(<MagicPill />);
      show({ message: "Hello", duration: 1000 });
      expect(root().hasAttribute("inert")).toBe(false);

      // Act
      advance(1000);

      // Assert
      expect(root().hasAttribute("inert")).toBe(true);
      expect(announcer().closest("[inert]")).toBeNull();
    });
  });

  describe("reduced motion", () => {
    afterEach(() => {
      Reflect.deleteProperty(window, "matchMedia");
    });

    it("skips the circle: hidden to compact, and swaps while hidden", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (query: string) => ({ matches: query.includes("reduce") }),
      });
      render(<MagicPill />);

      // Act + Assert
      notify({ message: "first" });
      expect(presence()).toBe("compact");
      notify({ message: "second" });
      advance(DURATION);
      expect(presence()).toBe("hidden");
      advance(150);
      expect(presence()).toBe("compact");
      expect(message()).toBe("second");
    });
  });

  it("exposes the queue to headless hosts through usePillQueue", () => {
    // Arrange
    const Counter = () => {
      const { current, queued } = usePillQueue();
      return <output>{current ? `${current.id} +${queued.length}` : "empty"}</output>;
    };
    render(<Counter />);

    // Act
    const first = notify({ message: "1" });
    notify({ message: "2" });

    // Assert
    expect(screen.getByRole("status").textContent).toBe(`${first} +1`);
    act(() => getStore("main").clear());
    expect(screen.getByRole("status").textContent).toBe("empty");
  });
});
