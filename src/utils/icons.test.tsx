import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

import { CTAIcons, getIconComponent, Icons } from "./icons";

// Characterisation tests of the icon maps as they are in v8.

describe("Icons (notification icons)", () => {
  it("maps the four notification icon names", () => {
    expect(Object.keys(Icons).sort()).toEqual(["checkmark", "coupon", "info", "questionmark"]);
  });
});

describe("CTAIcons", () => {
  it("maps nine CTA icon names", () => {
    expect(Object.keys(CTAIcons).sort()).toEqual([
      "arrow",
      "box",
      "checkmark",
      "cross",
      "mail",
      "plus",
      "quotation",
      "tel",
      "undo",
    ]);
  });

  it("has no 'info' entry, although the CTAIcon type allows it (L6)", () => {
    expect(getIconComponent("info", CTAIcons)).toBeNull();
  });
});

describe("getIconComponent", () => {
  it("returns the component registered under the name", () => {
    expect(getIconComponent("arrow", CTAIcons)).toBe(CTAIcons.arrow);
    expect(getIconComponent("coupon", Icons)).toBe(Icons.coupon);
  });

  it("returns null for an empty name", () => {
    expect(getIconComponent("", CTAIcons)).toBeNull();
  });

  it("returns null for an unknown name", () => {
    expect(getIconComponent("rocket", Icons)).toBeNull();
  });

  it("returns null for a name that belongs to the other map", () => {
    expect(getIconComponent("arrow", Icons)).toBeNull();
    expect(getIconComponent("coupon", CTAIcons)).toBeNull();
  });

  it("returns inherited object properties for names like 'constructor' (quirk)", () => {
    // The lookup is a plain property access, so prototype keys aren't filtered out
    expect(getIconComponent("constructor", CTAIcons)).toBe(Object);
  });
});

describe("icon components", () => {
  it.each(Object.entries({ ...Icons, ...CTAIcons }))("%s renders a single <svg>", (_name, Icon) => {
    const { container } = render(<Icon />);

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("ignores the props it's given, including className (L7)", () => {
    // getIconComponent types every icon as ComponentType<SVGProps>, so Navbar and
    // Notification pass className, but the components themselves drop it
    const Arrow = CTAIcons.arrow as ComponentType<{ className?: string }>;

    const { container } = render(<Arrow className="label" />);

    expect(container.querySelector("svg")?.getAttribute("class")).toBeNull();
  });
});
