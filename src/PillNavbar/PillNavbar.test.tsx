import { forwardRef, type AnchorHTMLAttributes } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { findActiveIndex } from "./matchPath";
import { PillNavbar, type NavItem, type NavLinkItem } from "./PillNavbar";
import Pill from "../Pill/Pill";
import { PillPanel } from "../Pill/PillPanel";
import BoxIcon from "../icons/BoxIcon";

const items: NavLinkItem[] = [
  { href: "/", label: "Home", icon: <BoxIcon /> },
  { href: "/blog", label: "Blog" },
  { href: "/blog/drafts", label: "Drafts" },
  { href: "/about", label: "About" },
];

const labels = (indexes: number[]) => indexes.map((index) => (index === -1 ? "none" : items[index].label));

describe("findActiveIndex (L8)", () => {
  it.each([
    ["/", "Home"],
    ["/about", "About"], // 8.x showed Home as active here
    ["/blog", "Blog"],
    ["/blog/", "Blog"],
    ["/blog/my-post", "Blog"],
    ["/blog?page=2#top", "Blog"],
    ["/blog/drafts/1", "Drafts"], // longest match wins
    ["/blogroll", "none"], // whole segments only
    ["/contact", "none"],
    ["/blog///", "Blog"], // trailing slashes, however many
    ["///", "Home"],
    ["/blog//post", "Blog"],
  ])("on %s, the active item is %s", (pathname, expected) => {
    // Act
    const index = findActiveIndex(pathname, items);

    // Assert
    expect(labels([index])).toEqual([expected]);
  });

  it("supports exact items and custom matchers", () => {
    // Arrange
    const custom = [
      { href: "/shop", match: "exact" as const },
      { href: "/cart", match: (pathname: string) => pathname.startsWith("/checkout") },
    ];

    // Act + Assert
    expect(findActiveIndex("/shop/item", custom)).toBe(-1);
    expect(findActiveIndex("/shop", custom)).toBe(0);
    expect(findActiveIndex("/checkout/pay", custom)).toBe(1);
  });

  it("stays fast on a crafted path made of many slashes (ReDoS)", () => {
    // Arrange: a regex such as /\/+$/ takes seconds on this (quadratic backtracking)
    const crafted = "/" + "/".repeat(200_000) + "x";
    const start = performance.now();

    // Act
    const index = findActiveIndex(crafted, items);

    // Assert: linear work takes about a millisecond; the bound leaves room for slow CI
    expect(index).toBe(-1);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("never matches external links by itself, and matches nothing without a pathname", () => {
    // Act + Assert
    expect(findActiveIndex("/", [{ href: "https://example.com/" }, { href: "//cdn.example.com/" }])).toBe(-1);
    expect(findActiveIndex(undefined, items)).toBe(-1);
  });
});

describe("PillNavbar", () => {
  it("renders a labelled nav of links, matched by href rather than label", () => {
    // Arrange: two items with the same label used to collide in 8.x
    const sameLabels: NavItem[] = [
      { href: "/a", label: "Same" },
      { href: "/b", label: "Same" },
    ];

    // Act
    render(
      <Pill>
        <PillNavbar items={sameLabels} pathname="/b" />
      </Pill>,
    );
    const links = screen.getAllByRole("link", { name: "Same" });

    // Assert
    expect(screen.getByRole("navigation", { name: "Main" }).dataset.mp).toBe("navbar");
    expect(links.map((link) => link.getAttribute("aria-current"))).toEqual([null, "page"]);
  });

  it("follows the pathname prop, so client-side navigations update it", () => {
    // Arrange
    const { rerender } = render(<PillNavbar items={items} pathname="/" />);

    // Act
    rerender(<PillNavbar items={items} pathname="/about" />);

    // Assert
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).hasAttribute("aria-current")).toBe(false);
  });

  it("falls back to window.location after mounting, and follows popstate", () => {
    // Arrange
    window.history.pushState({}, "", "/blog/post");

    // Act
    render(<PillNavbar items={items} />);

    // Assert
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBe("page");

    // Act
    act(() => {
      window.history.pushState({}, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Assert
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe("page");
    window.history.pushState({}, "", "/");
  });

  it("renders links through linkComponent, takes a custom label, and blocks unsafe hrefs (L16)", () => {
    // Arrange
    const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
      function RouterLink(props, ref) {
        return <a {...props} ref={ref} data-router="" />;
      },
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Act
    render(
      <PillNavbar
        aria-label="Sections"
        items={[...items, { href: "javascript:alert(1)", label: "Evil" }]}
        pathname="/"
        linkComponent={RouterLink}
      />,
    );

    // Assert
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" }).hasAttribute("data-router")).toBe(true);
    expect(screen.queryByRole("link", { name: "Evil" })).toBeNull();
  });
});

describe("items that aren't links", () => {
  const mixed = (skip = vi.fn()): NavItem[] => [
    { href: "/", label: "Home" },
    { onClick: skip, label: "Skip session", icon: <BoxIcon />, expanded: true },
    { panel: "prefs", label: "Preferences", icon: <BoxIcon /> },
    { href: "/blog", label: "Blog" },
  ];

  it("render buttons, next to links that still match the path", () => {
    // Arrange
    const skip = vi.fn();
    render(
      <Pill>
        <PillNavbar items={mixed(skip)} pathname="/blog" />
      </Pill>,
    );

    // Act
    const button = screen.getByRole("button", { name: "Skip session" });
    fireEvent.click(button);

    // Assert
    expect(skip).toHaveBeenCalledOnce();
    expect(button.hasAttribute("data-expanded")).toBe(true);
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).hasAttribute("aria-current")).toBe(false);
    expect(button.hasAttribute("aria-current")).toBe(false);
  });

  it("open the panel with their name", () => {
    // Arrange
    render(
      <Pill>
        <PillNavbar items={mixed()} pathname="/" />
        <PillPanel name="account" title="Account" />
        <PillPanel name="prefs" title="Preferences" />
      </Pill>,
    );
    const trigger = screen.getByRole("button", { name: "Preferences" });

    // Act
    fireEvent.click(trigger);

    // Assert
    const open = document.querySelectorAll('[data-mp="panel"][data-open]');
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe(trigger.getAttribute("aria-controls"));
    expect(screen.getByRole("region", { name: "Preferences" })).toBe(open[0]);
  });
});
