import { createRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Pill from "./Pill";
import { usePill } from "./PillContext";
import type { PillPresence } from "./types";

const renderPill = (props: Parameters<typeof Pill>[0] = {}) => {
  const utils = render(<Pill {...props}>{props.children ?? "content"}</Pill>);
  const pill = () => utils.container.querySelector<HTMLElement>('[data-mp="pill"]')!;
  return { ...utils, pill };
};

describe("Pill", () => {
  describe("data attributes", () => {
    it("defaults to an inline, horizontal, neutral, compact pill", () => {
      // Act
      const { pill } = renderPill();

      // Assert
      expect(pill().tagName).toBe("DIV");
      expect(pill().dataset).toMatchObject({
        mp: "pill",
        presence: "compact",
        placement: "inline",
        orientation: "horizontal",
        variant: "neutral",
      });
      expect(pill().hasAttribute("data-unstyled")).toBe(false);
    });

    it.each([
      ["left", "vertical"],
      ["right", "vertical"],
      ["bottom", "horizontal"],
      ["top-end", "horizontal"],
    ] as const)("derives the orientation from placement %s", (placement, orientation) => {
      // Act
      const { pill } = renderPill({ placement });

      // Assert
      expect(pill().dataset.orientation).toBe(orientation);
    });

    it("lets an explicit orientation win", () => {
      // Act
      const { pill } = renderPill({ placement: "left", orientation: "horizontal" });

      // Assert
      expect(pill().dataset.orientation).toBe("horizontal");
    });

    it("writes custom variants and unstyled", () => {
      // Act
      const { pill } = renderPill({ variant: "brand", unstyled: true });

      // Assert
      expect(pill().dataset.variant).toBe("brand");
      expect(pill().hasAttribute("data-unstyled")).toBe(true);
    });

    it("passes other props and the ref through, but keeps its own data-mp", () => {
      // Arrange
      const ref = createRef<HTMLElement>();

      // Act
      const { pill } = renderPill({ className: "mine", "aria-label": "Assistant", ref } as never);

      // Assert
      expect(pill().className).toBe("mine");
      expect(pill().getAttribute("aria-label")).toBe("Assistant");
      expect(ref.current).toBe(pill());
    });
  });

  describe("presence", () => {
    it("starts from defaultPresence", () => {
      // Act
      const { pill } = renderPill({ defaultPresence: "rest" });

      // Assert
      expect(pill().dataset.presence).toBe("rest");
    });

    it("follows the controlled presence", () => {
      // Arrange
      const { pill, rerender } = renderPill({ presence: "compact" });

      // Act
      rerender(<Pill presence="expanded">content</Pill>);

      // Assert
      expect(pill().dataset.presence).toBe("expanded");
    });

    it("is inert while hidden, so its content leaves the focus order and the accessibility tree (Y5)", () => {
      // Arrange
      const { pill, rerender } = renderPill({ presence: "compact" });
      expect(pill().hasAttribute("inert")).toBe(false);

      // Act
      rerender(<Pill presence="hidden">content</Pill>);

      // Assert
      expect(pill().hasAttribute("inert")).toBe(true);
    });

    it("lets children drive an uncontrolled pill through usePill()", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const Expand = () => {
        const { presence, setPresence } = usePill();
        return <button onClick={() => setPresence("expanded")}>{presence}</button>;
      };
      const { pill } = renderPill({ onPresenceChange, children: <Expand /> });

      // Act
      fireEvent.click(screen.getByRole("button"));

      // Assert
      expect(pill().dataset.presence).toBe("expanded");
      expect(screen.getByRole("button").textContent).toBe("expanded");
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("expanded");
    });

    it("only asks the parent when controlled", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const Hide = () => {
        const { setPresence } = usePill();
        return <button onClick={() => setPresence("hidden")}>hide</button>;
      };
      const { pill } = renderPill({ presence: "compact", onPresenceChange, children: <Hide /> });

      // Act
      fireEvent.click(screen.getByRole("button"));

      // Assert
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("hidden");
      expect(pill().dataset.presence).toBe("compact");
    });

    it("doesn't report a change to the current level", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const Same = () => {
        const { setPresence } = usePill();
        return <button onClick={() => setPresence("compact")}>same</button>;
      };
      renderPill({ onPresenceChange, children: <Same /> });

      // Act
      fireEvent.click(screen.getByRole("button"));

      // Assert
      expect(onPresenceChange).not.toHaveBeenCalled();
    });

    it("closes the panel on Escape, back to the level it had before", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill, rerender } = renderPill({ presence: "expanded", onPresenceChange });
      rerender(
        <Pill presence="panel" onPresenceChange={onPresenceChange}>
          content
        </Pill>,
      );

      // Act
      fireEvent.keyDown(pill(), { key: "Escape" });

      // Assert
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("expanded");
    });

    it("ignores Escape outside the panel level", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill } = renderPill({ presence: "compact", onPresenceChange });

      // Act
      fireEvent.keyDown(pill(), { key: "Escape" });

      // Assert
      expect(onPresenceChange).not.toHaveBeenCalled();
    });
  });

  describe("placement changes", () => {
    let animate: ReturnType<typeof vi.fn>;
    // Where each placement puts the pill in this fake layout
    const RECTS: Record<string, Partial<DOMRect>> = {
      bottom: { left: 400, top: 700, width: 300, height: 72 },
      "top-end": { left: 900, top: 24, width: 300, height: 72 },
      left: { left: 24, top: 300, width: 72, height: 220 },
    };

    beforeEach(() => {
      animate = vi.fn(() => ({ finished: new Promise(() => {}), cancel: vi.fn() }));
      Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        const placement = this.closest<HTMLElement>('[data-mp="pill"]')?.dataset.placement ?? "bottom";
        return { ...RECTS[placement], width: this.style.width ? 72 : RECTS[placement].width } as DOMRect;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    });

    const moves = () => animate.mock.calls.filter(([, options]) => options?.id === "mp-move");

    it("travels to the new placement from where it was", () => {
      // Arrange
      const { rerender } = render(<Pill placement="bottom">content</Pill>);

      // Act
      rerender(<Pill placement="top-end">content</Pill>);

      // Assert: it starts where it was and ends at its new place
      expect(moves()).toHaveLength(1);
      const [[keyframes, options]] = moves();
      expect(keyframes[0]).toMatchObject({ translate: "-500px 676px" });
      expect(keyframes[1]).toMatchObject({ translate: "0px 0px" });
      expect(keyframes[0].width).toBeUndefined();
      expect(options).toMatchObject({ duration: 400 });
    });

    it("resizes on the way when the size changes (e.g. into a sidebar)", () => {
      // Arrange
      const { rerender } = render(<Pill placement="bottom">content</Pill>);

      // Act
      rerender(<Pill placement="left">content</Pill>);

      // Assert
      const [[keyframes]] = moves();
      expect(keyframes[0]).toMatchObject({ width: "300px", height: "72px" });
      expect(keyframes[1]).toMatchObject({ width: "72px", height: "220px", translate: "0px 0px" });
    });

    it("doesn't move on the first render, on other changes, or when unstyled", () => {
      // Arrange
      const { rerender } = render(<Pill placement="bottom">content</Pill>);

      // Act
      rerender(<Pill placement="bottom" variant="success">content</Pill>);
      rerender(<Pill placement="bottom" unstyled>content</Pill>);
      rerender(<Pill placement="top-end" unstyled>content</Pill>);

      // Assert
      expect(moves()).toHaveLength(0);
    });
  });

  describe("usePill()", () => {
    it("explains where it must be used", () => {
      // Arrange
      vi.spyOn(console, "error").mockImplementation(() => {});
      const Orphan = () => {
        usePill();
        return null;
      };

      // Act + Assert
      expect(() => render(<Orphan />)).toThrow("[magic-pill] usePill() must be rendered inside a <Pill>.");
    });

    it("exposes the pill's settings", () => {
      // Arrange
      let value: ReturnType<typeof usePill> | undefined;
      const Read = () => {
        value = usePill();
        return null;
      };

      // Act
      renderPill({ placement: "right", variant: "success", children: <Read /> });

      // Assert
      expect(value).toMatchObject({
        presence: "compact",
        placement: "right",
        orientation: "vertical",
        variant: "success",
      });
    });
  });

  describe("overlay placement", () => {
    // jsdom has no showModal()/close(): stand-ins that toggle `open`
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });

    beforeEach(() => {
      showModal.mockClear();
      close.mockClear();
      Object.assign(HTMLDialogElement.prototype, { showModal, close });
    });

    afterEach(() => {
      const prototype = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
      delete prototype.showModal;
      delete prototype.close;
    });

    it("renders a modal <dialog> while visible, and closes it when hidden", () => {
      // Arrange
      const { pill, rerender } = renderPill({ placement: "overlay", presence: "compact" });

      // Assert: open as a modal
      expect(pill().tagName).toBe("DIALOG");
      expect(showModal).toHaveBeenCalledOnce();
      expect((pill() as HTMLDialogElement).open).toBe(true);

      // Act
      rerender(
        <Pill placement="overlay" presence="hidden">
          content
        </Pill>,
      );

      // Assert: closed at once, with no exit animation to wait for
      expect(close).toHaveBeenCalledOnce();
      expect(pill().hasAttribute("inert")).toBe(true);
    });

    it("shows the dialog in its closed state, so it transitions open", () => {
      // Arrange
      const shownAs: (string | undefined)[] = [];
      showModal.mockImplementationOnce(function (this: HTMLDialogElement) {
        shownAs.push(this.dataset.presence);
        this.setAttribute("open", "");
      });

      // Act
      const { pill } = renderPill({ placement: "overlay", presence: "compact" });

      // Assert
      expect(shownAs).toEqual(["hidden"]);
      expect(pill().dataset.presence).toBe("compact");
    });

    it("focuses the dialog itself when it opens as a circle, whose content is hidden", () => {
      // Arrange
      const focus = vi.spyOn(HTMLDialogElement.prototype, "focus").mockImplementation(() => {});

      // Act
      renderPill({ placement: "overlay", presence: "rest" });

      // Assert
      expect(focus).toHaveBeenCalledOnce();
    });

    it("opens once on the page when its container is attached by a parent", () => {
      // Arrange: attached in the parent's layout effect, after the pill's own
      const container = document.createElement("div");
      function Portal() {
        useLayoutEffect(() => {
          document.body.append(container);
          return () => container.remove();
        }, []);
        return createPortal(<Pill placement="overlay">content</Pill>, container);
      }

      // Act
      render(<Portal />);

      // Assert
      expect(showModal).toHaveBeenCalledOnce();
    });

    it("ignores a late close event once it's open again", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill } = renderPill({ placement: "overlay", presence: "compact", onPresenceChange });

      // Act: the dialog is open
      fireEvent(pill(), new Event("close"));

      // Assert
      expect(onPresenceChange).not.toHaveBeenCalled();
    });

    describe("with an exit animation", () => {
      // Stand-ins for the exit's transitions, finished or cancelled by hand
      let settle: { finish: () => void; cancel: () => void };
      let endTime: number;
      const overlay = (presence: PillPresence) => (
        <Pill placement="overlay" presence={presence}>
          content
        </Pill>
      );
      const flush = () => act(async () => {});

      beforeEach(() => {
        endTime = 700;
        const finished = new Promise<void>((resolve, reject) => {
          settle = { finish: resolve, cancel: () => reject(new DOMException("Cancelled", "AbortError")) };
        });
        Object.defineProperty(HTMLDialogElement.prototype, "getAnimations", {
          value: () => [{ finished, effect: { getComputedTiming: () => ({ endTime }) } }],
          configurable: true,
        });
      });

      afterEach(() => {
        delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).getAnimations;
      });

      it("stays open, but inert, until the exit has played", async () => {
        // Arrange
        const { pill, rerender } = renderPill({ placement: "overlay", presence: "compact" });

        // Act
        rerender(overlay("hidden"));
        await flush();

        // Assert: still on screen, its buttons out of reach
        expect(close).not.toHaveBeenCalled();
        expect(pill().hasAttribute("inert")).toBe(true);

        // Act
        settle.finish();
        await flush();

        // Assert
        expect(close).toHaveBeenCalledOnce();
      });

      it("stays open when it's shown again before the exit is over, and takes the focus back", async () => {
        // Arrange: without act(), whose flushes hide the real order: the exit's
        // animations are cancelled while React commits, before passive effects
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", false);
        const focus = vi.spyOn(HTMLDialogElement.prototype, "focus").mockImplementation(() => {});
        const container = document.body.appendChild(document.createElement("div"));
        const root = createRoot(container);
        const show = async (presence: PillPresence) => {
          root.render(overlay(presence));
          await vi.waitFor(() => expect(container.querySelector(`[data-presence="${presence}"]`)).not.toBeNull());
          await new Promise((resolve) => setTimeout(resolve, 20));
        };
        await show("compact");
        await show("hidden");
        showModal.mockClear();
        focus.mockClear();
        focus.mockImplementation(() => settle.cancel());

        // Act
        await show("compact");

        // Assert
        expect(close).not.toHaveBeenCalled();
        expect(showModal).not.toHaveBeenCalled();
        expect(focus).toHaveBeenCalledOnce();
        root.unmount();
        container.remove();
      });

      it("doesn't wait for an endless animation", async () => {
        // Arrange
        endTime = Infinity;
        const { rerender } = renderPill({ placement: "overlay", presence: "compact" });

        // Act
        rerender(overlay("hidden"));
        await flush();

        // Assert
        expect(close).toHaveBeenCalledOnce();
      });
    });

    it("turns the dialog's cancel (Escape) into a hidden presence", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill } = renderPill({ placement: "overlay", presence: "compact", onPresenceChange });
      const cancel = new Event("cancel", { cancelable: true });

      // Act
      fireEvent(pill(), cancel);

      // Assert
      expect(cancel.defaultPrevented).toBe(true);
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("hidden");
    });

    it("closes the panel first when cancelled from the panel level", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill, rerender } = renderPill({ placement: "overlay", presence: "compact", onPresenceChange });
      rerender(
        <Pill placement="overlay" presence="panel" onPresenceChange={onPresenceChange}>
          content
        </Pill>,
      );

      // Act
      fireEvent(pill(), new Event("cancel", { cancelable: true }));

      // Assert
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("compact");
    });

    it("syncs the state when the browser closes the dialog itself", () => {
      // Arrange
      const onPresenceChange = vi.fn();
      const { pill } = renderPill({ placement: "overlay", presence: "compact", onPresenceChange });

      // Act
      pill().removeAttribute("open");
      fireEvent(pill(), new Event("close"));

      // Assert
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("hidden");
    });
  });
});
