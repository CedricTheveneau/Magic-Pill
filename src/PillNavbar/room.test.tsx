import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PillNavbar, type NavItem } from "./PillNavbar";
import Pill from "../Pill/Pill";
import { PillPanel } from "../Pill/PillPanel";
import BoxIcon from "../icons/BoxIcon";

const items: NavItem[] = [
  { href: "/", label: "Home", icon: <BoxIcon /> },
  { href: "/blog", label: "Blog", icon: <BoxIcon /> },
  { href: "/about", label: "About", icon: <BoxIcon /> },
];

const link = (name: string) => screen.getByRole("link", { name });
const navbar = () => screen.getByRole("navigation");
const isTight = () => navbar().hasAttribute("data-tight");

/** jsdom has no layout: a 300px pill, whose labels take 120px each once open */
function layOut() {
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(300);
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(function (this: Element) {
    const open = this.querySelectorAll('[data-mp="action"]:is([aria-current="page"], [data-expanded])').length;
    return 100 + open * 120;
  });
}

const renderNavbar = (props: Partial<Parameters<typeof Pill>[0]> = {}) =>
  render(
    <Pill {...props}>
      <PillNavbar items={items} pathname="/" />
    </Pill>,
  );

describe("a navbar with no room for two labels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("folds the current page's label while another item is pointed at", () => {
    // Arrange
    layOut();
    renderNavbar();

    // Act + Assert
    fireEvent.pointerOver(link("Blog"), { pointerType: "mouse" });
    expect(isTight()).toBe(true);
    fireEvent.pointerOver(link("Home"), { pointerType: "mouse" });
    expect(isTight()).toBe(false);
    fireEvent.pointerOver(link("About"), { pointerType: "mouse" });
    expect(isTight()).toBe(true);
    fireEvent.pointerLeave(navbar());
    expect(isTight()).toBe(false);
  });

  it("does it for keyboard focus too, until the focus leaves the navbar", () => {
    // Arrange
    layOut();
    renderNavbar();

    // Act + Assert: jsdom shows any focus as :focus-visible
    link("Blog").focus();
    expect(isTight()).toBe(true);
    link("Blog").blur();
    expect(isTight()).toBe(false);
  });

  it("leaves the labels alone when both fit", () => {
    // Arrange
    layOut();
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(400);
    renderNavbar();

    // Act
    fireEvent.pointerOver(link("Blog"), { pointerType: "mouse" });

    // Assert
    expect(isTight()).toBe(false);
  });

  it.each([
    ["a touch", {}, "touch"],
    ["a vertical pill", { orientation: "vertical" as const }, "mouse"],
    ["an unstyled pill", { unstyled: true }, "mouse"],
  ])("ignores %s", (_name, props, pointerType) => {
    // Arrange
    layOut();
    renderNavbar(props);

    // Act
    fireEvent.pointerOver(link("Blog"), { pointerType });

    // Assert
    expect(isTight()).toBe(false);
  });

  it("measures on a copy that shares no radio group with the pill, and is gone at once", () => {
    // Arrange
    layOut();
    render(
      <Pill>
        <PillNavbar items={items} pathname="/" />
        <PillPanel>
          <input type="radio" name="size" value="s" defaultChecked aria-label="Small" />
        </PillPanel>
      </Pill>,
    );

    // Act
    fireEvent.pointerOver(link("Blog"), { pointerType: "mouse" });

    // Assert
    expect(document.querySelectorAll('[data-mp="pill"]')).toHaveLength(1);
    expect(document.querySelector<HTMLInputElement>("input")?.checked).toBe(true);
  });
});

describe("a navbar's labels at rest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const isFolded = () => navbar().hasAttribute("data-folded");
  const renderWith = (labels?: "current" | "closed" | "auto") =>
    render(
      <Pill>
        <PillNavbar items={items} pathname="/" labels={labels} />
      </Pill>,
    );
  /** A pill `room` px wide: the icons take 100 px, the current page's label 120 more unless it's folded */
  const layOutWith = (room: number) => {
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(room);
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(function (this: Element) {
      const folded = this.closest?.('[data-mp="navbar"]')?.hasAttribute("data-folded") ?? this.hasAttribute("data-folded");
      return 100 + (folded ? 0 : 120);
    });
  };

  it("shows the current page's label while it fits, and folds it when it doesn't (auto, the default)", () => {
    layOutWith(300);
    const { unmount } = renderWith();
    expect(navbar().dataset.labels).toBe("auto");
    expect(isFolded()).toBe(false);
    unmount();

    layOutWith(180);
    renderWith();
    expect(isFolded()).toBe(true);
  });

  it("keeps it open with labels=\"current\", even without room", () => {
    layOutWith(180);
    renderWith("current");
    expect(isFolded()).toBe(false);
  });

  it("folds them all with labels=\"closed\", even with room", () => {
    layOutWith(600);
    renderWith("closed");
    expect(isFolded()).toBe(true);
  });
});
