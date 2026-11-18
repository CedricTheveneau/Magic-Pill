import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { MagicPillNavbarItem } from "../types";
import Navbar from "./Navbar";

// Characterisation tests: the active item logic is documented as it is in v8 (L8).

const items: MagicPillNavbarItem[] = [
  { icon: "arrow", label: "Home", link: "/" },
  { icon: "box", label: "Blog", link: "/blog" },
  { icon: "mail", label: "Contact", link: "/contact" },
];

const renderNavbar = (navItems: MagicPillNavbarItem[]) =>
  render(<Navbar mode="navbar" navbar={{ navItems }} />);

const linkFor = (label: string) => screen.getByText(label).closest("a");

describe("Navbar", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders one link per item, with its href and label", () => {
    renderNavbar(items);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/", "/blog", "/contact"]);
    expect(links.map((link) => link.textContent)).toEqual(["Home", "Blog", "Contact"]);
  });

  it("renders each item's icon with the 'label' class", () => {
    renderNavbar(items);

    const icons = screen.getAllByRole("link").map((link) => link.querySelector("svg"));
    expect(icons.map((svg) => svg?.getAttribute("class"))).toEqual(["label", "label", "label"]);
  });

  it("marks the item matching the current path as active", () => {
    window.history.pushState({}, "", "/blog/my-post");

    renderNavbar(items);

    expect(linkFor("Blog")?.className).toBe("CTA active");
    expect(linkFor("Home")?.className).toBe("CTA");
  });

  it("marks Home as active on a page that no item links to, because '/' matches every path", () => {
    window.history.pushState({}, "", "/about");

    renderNavbar(items);

    expect(linkFor("Home")?.className).toBe("CTA active");
  });

  it("compares by label, so items sharing a label are all marked active", () => {
    window.history.pushState({}, "", "/contact");

    renderNavbar([
      { icon: "mail", label: "Contact", link: "/contact" },
      { icon: "tel", label: "Contact", link: "/call-us" },
    ]);

    expect(screen.getAllByRole("link").map((link) => link.className)).toEqual(["CTA active", "CTA active"]);
  });

  it("doesn't update the active item on client-side navigation", () => {
    window.history.pushState({}, "", "/blog");
    renderNavbar(items);

    window.history.pushState({}, "", "/contact");

    expect(linkFor("Blog")?.className).toBe("CTA active");
    expect(linkFor("Contact")?.className).toBe("CTA");
  });

  it("recomputes the active item when the items change", () => {
    window.history.pushState({}, "", "/blog");
    const { rerender } = renderNavbar(items);
    window.history.pushState({}, "", "/contact");

    rerender(<Navbar mode="navbar" navbar={{ navItems: [...items] }} />);

    expect(linkFor("Contact")?.className).toBe("CTA active");
  });
});
