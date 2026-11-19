import { createRef, forwardRef, type AnchorHTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PillAction from "./PillAction";
import { PillActions, PillDivider, PillIcon, PillMessage } from "./parts";
import CheckIcon from "../icons/CheckIcon";

describe("PillAction", () => {
  it("is a button named by its label, with the icon hidden from assistive technology", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<PillAction icon={<CheckIcon />} label="Yes" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Yes" });
    fireEvent.click(button);

    // Assert
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset.mp).toBe("action");
    expect(button.querySelector('[data-mp="action-icon"]')?.getAttribute("aria-hidden")).toBe("true");
    expect(button.querySelector('[data-mp="label"]')?.textContent).toBe("Yes");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("puts its look on an inner body, out of reach of global a/button resets", () => {
    // Act
    render(<PillAction icon={<CheckIcon />} label="Yes" href="/yes" />);
    const link = screen.getByRole("link", { name: "Yes" });
    const body = link.firstElementChild as HTMLElement;

    // Assert
    expect(link.children).toHaveLength(1);
    expect(body.dataset.mp).toBe("action-body");
    expect([...body.children].map((child) => (child as HTMLElement).dataset.mp)).toEqual(["action-icon", "label"]);
  });

  it("shows its label when expanded, or when it has no icon", () => {
    // Act
    render(
      <>
        <PillAction icon={<CheckIcon />} label="collapsed" />
        <PillAction icon={<CheckIcon />} label="expanded" expanded />
        <PillAction label="text only" />
      </>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "collapsed" }).hasAttribute("data-expanded")).toBe(false);
    expect(screen.getByRole("button", { name: "expanded" }).hasAttribute("data-expanded")).toBe(true);
    expect(screen.getByRole("button", { name: "text only" }).hasAttribute("data-expanded")).toBe(true);
    expect(screen.getByRole("button", { name: "text only" }).querySelector('[data-mp="action-icon"]')).toBeNull();
  });

  it("is a link with an href, and forwards its ref", () => {
    // Arrange
    const ref = createRef<HTMLElement>();

    // Act
    render(<PillAction ref={ref} icon={<CheckIcon />} label="Checkout" href="/checkout" aria-current="page" />);
    const link = screen.getByRole("link", { name: "Checkout" });

    // Assert
    expect(link.getAttribute("href")).toBe("/checkout");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(ref.current).toBe(link);
  });

  it("renders links through linkComponent", () => {
    // Arrange
    const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
      function RouterLink(props, ref) {
        return <a {...props} ref={ref} data-router="" />;
      },
    );

    // Act
    render(<PillAction label="Blog" href="/blog" linkComponent={RouterLink} />);
    const link = screen.getByRole("link", { name: "Blog" });

    // Assert
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.dataset.mp).toBe("action");
    expect(link.getAttribute("href")).toBe("/blog");
  });

  it.each(["mailto:hello@example.com", "tel:+33100000000", "https://example.com"])("renders %s", (href) => {
    // Act
    render(<PillAction label="Go" href={href} />);

    // Assert
    expect(screen.getByRole("link", { name: "Go" }).getAttribute("href")).toBe(href);
  });

  it("never renders an unsafe href, even through linkComponent, and warns (L16)", () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const RouterLink = vi.fn((props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />);

    // Act
    const { container } = render(
      <PillAction label="Click" href={" java\tscript:alert(1)"} linkComponent={RouterLink} />,
    );
    const action = container.querySelector('[data-mp="action"]')!;

    // Assert
    expect(action.tagName).toBe("A");
    expect(action.hasAttribute("href")).toBe(false);
    expect(action.getAttribute("aria-disabled")).toBe("true");
    expect(RouterLink).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('<PillAction label="Click"> got an unsafe href');
  });
});

describe("Pill parts", () => {
  it("mark themselves with data-mp and pass props through", () => {
    // Act
    const { container } = render(
      <>
        <PillIcon className="i">
          <CheckIcon />
        </PillIcon>
        <PillDivider />
        <PillMessage className="m">Hello</PillMessage>
        <PillActions />
      </>,
    );
    const part = (name: string) => container.querySelector(`[data-mp="${name}"]`)!;

    // Assert
    expect(part("icon").className).toBe("i");
    expect(part("divider").getAttribute("aria-hidden")).toBe("true");
    expect(part("message").textContent).toBe("Hello");
    expect(part("actions").tagName).toBe("DIV");
  });

  it("keep the icon decorative unless it has a label", () => {
    // Act
    render(
      <>
        <PillIcon>
          <CheckIcon />
        </PillIcon>
        <PillIcon label="Success">
          <CheckIcon />
        </PillIcon>
      </>,
    );

    // Assert
    const labelled = screen.getByRole("img", { name: "Success" });
    expect(labelled.dataset.mp).toBe("icon");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
