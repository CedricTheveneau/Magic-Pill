import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotificationContent, PillNotification } from "./PillNotification";
import Pill from "../Pill/Pill";
import CheckIcon from "../icons/CheckIcon";
import UndoIcon from "../icons/UndoIcon";

const part = (name: string) => document.querySelector<HTMLElement>(`[data-mp="${name}"]`);

describe("PillNotification", () => {
  it("lays out icon, divider, message and action, like the mockups", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(
      <Pill variant="success">
        <PillNotification
          icon={<CheckIcon />}
          message="Item successfully removed from cart!"
          action={{ icon: <UndoIcon />, label: "Undo", onClick }}
        />
      </Pill>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    // Assert
    const order = [...part("pill")!.children].map((child) => (child as HTMLElement).dataset.mp);
    expect(order).toEqual(["icon", "divider", "message", "actions"]);
    expect(part("message")!.textContent).toBe("Item successfully removed from cart!");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders any content as React nodes, never as HTML (L3)", () => {
    // Act
    render(
      <Pill>
        <PillNotification
          message={
            <>
              Total: <strong>768.99$</strong>
            </>
          }
          panel={{ content: "<img src=x onerror=alert(1)>" }}
        />
      </Pill>,
    );

    // Assert
    expect(part("message")!.querySelector("strong")!.textContent).toBe("768.99$");
    expect(document.querySelector("img")).toBeNull();
    expect(part("panel-body")!.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("leaves out the icon, divider and actions when not given", () => {
    // Act
    render(
      <Pill>
        <PillNotification message="Saved" />
      </Pill>,
    );

    // Assert
    expect([...part("pill")!.children].map((child) => (child as HTMLElement).dataset.mp)).toEqual(["message"]);
  });

  it.each([
    ["a button", { onClick: () => {} }],
    ["a link", { href: "/cart" }],
  ] as const)("keeps the label of %s action open with expanded", (_kind, target) => {
    // Act
    render(
      <Pill>
        <PillNotification
          message="Your current cart total is 768.99$"
          action={{ icon: <CheckIcon />, label: "Checkout", expanded: true, ...target }}
          panel={{ content: "Details", trigger: { label: "Learn more", icon: <CheckIcon />, expanded: true } }}
        />
      </Pill>,
    );

    // Assert
    const actions = [...part("actions")!.querySelectorAll<HTMLElement>('[data-mp="action"]')];
    expect(actions).toHaveLength(2);
    for (const action of actions) expect(action.hasAttribute("data-expanded")).toBe(true);
  });

  it("shows action labels on hover and focus only, by default", () => {
    // Act
    render(
      <Pill>
        <PillNotification message="Hello" action={{ icon: <CheckIcon />, label: "OK", onClick: () => {} }} />
      </Pill>,
    );

    // Assert
    expect(part("action")!.hasAttribute("data-expanded")).toBe(false);
  });

  it("renders link actions through linkComponent", () => {
    // Arrange
    const Link = vi.fn((props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} data-router="" />);

    // Act
    render(
      <Pill>
        <PillNotification
          message="Your cart"
          action={{ icon: <CheckIcon />, label: "Checkout", href: "/checkout" }}
          linkComponent={Link}
        />
      </Pill>,
    );
    const link = screen.getByRole("link", { name: "Checkout" });

    // Assert
    expect(link.getAttribute("href")).toBe("/checkout");
    expect(link.hasAttribute("data-router")).toBe(true);
  });

  it("opens and closes its panel with the default trigger and close labels", () => {
    // Arrange
    render(
      <Pill>
        <PillNotification message="Discover" panel={{ title: "Powers", content: <p>Body</p> }} />
      </Pill>,
    );
    const trigger = screen.getByRole("button", { name: "Learn more" });

    // Act
    fireEvent.click(trigger);

    // Assert
    expect(part("pill")!.dataset.presence).toBe("panel");
    expect(screen.getByRole("region", { name: "Powers" })).toBe(part("panel"));

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    // Assert
    expect(part("pill")!.dataset.presence).toBe("compact");
  });

  it("takes a custom trigger and close label, and per-part class names", () => {
    // Act
    render(
      <Pill>
        <PillNotification
          icon={<CheckIcon />}
          message="Discover"
          panel={{ content: "Body", trigger: { label: "Read" }, closeLabel: "Done" }}
          classNames={{ icon: "i", divider: "d", message: "m", actions: "as", action: "a", panel: "p" }}
        />
      </Pill>,
    );

    // Assert
    const trigger = screen.getByRole("button", { name: "Read" });
    expect(trigger.className).toBe("a");
    expect(trigger.querySelector('[data-mp="action-icon"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Done", hidden: true })).toBeTruthy();
    expect(["icon", "divider", "message", "actions", "panel"].map((name) => part(name)!.className)).toEqual([
      "i",
      "d",
      "m",
      "as",
      "p",
    ]);
  });

  describe("onAction (used by <MagicPill> to dismiss)", () => {
    it("runs after the action's own handler, for buttons and links", () => {
      // Arrange
      const calls: string[] = [];
      const onAction = vi.fn(() => calls.push("host"));
      const { rerender } = render(
        <Pill>
          <NotificationContent message="m" action={{ label: "Go", onClick: () => calls.push("action") }} onAction={onAction} />
        </Pill>,
      );

      // Act
      fireEvent.click(screen.getByRole("button", { name: "Go" }));
      rerender(
        <Pill>
          <NotificationContent message="m" action={{ label: "Go", href: "#go" }} onAction={onAction} />
        </Pill>,
      );
      fireEvent.click(screen.getByRole("link", { name: "Go" }));

      // Assert
      expect(calls).toEqual(["action", "host", "host"]);
    });

    it("sees preventDefault() from the action's handler", () => {
      // Arrange
      let prevented: boolean | undefined;
      render(
        <Pill>
          <NotificationContent
            message="m"
            action={{ label: "Keep", onClick: (event) => event.preventDefault() }}
            onAction={(event) => (prevented = event.defaultPrevented)}
          />
        </Pill>,
      );

      // Act
      fireEvent.click(screen.getByRole("button", { name: "Keep" }));

      // Assert
      expect(prevented).toBe(true);
    });

    it("isn't called by the panel trigger or the panel's close button", () => {
      // Arrange
      const onAction = vi.fn();
      render(
        <Pill>
          <NotificationContent message="m" panel={{ content: "Body" }} onAction={onAction} />
        </Pill>,
      );

      // Act
      fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      // Assert
      expect(onAction).not.toHaveBeenCalled();
    });
  });
});
