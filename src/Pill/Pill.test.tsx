import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Pill from "./Pill";
import { usePill } from "./PillContext";

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

      // Assert: closed, and not made inert on top (a closed dialog already is)
      expect(close).toHaveBeenCalledOnce();
      expect(pill().hasAttribute("inert")).toBe(false);
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
      fireEvent(pill(), new Event("close"));

      // Assert
      expect(onPresenceChange).toHaveBeenCalledExactlyOnceWith("hidden");
    });
  });
});
