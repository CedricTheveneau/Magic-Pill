import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CTAIcons, getIconComponent, Icons } from "./icons";

// Characterisation tests of the icon maps as they are in v8.

describe("Icons (notification icons)", () => {
  it("maps the four notification icon names", () => {
    expect(Object.keys(Icons).sort()).toEqual(["checkmark", "coupon", "info", "questionmark"]);
  });
});

describe("CTAIcons", () => {
  it("maps every CTA icon name", () => {
    expect(Object.keys(CTAIcons).sort()).toEqual([
      "arrow",
      "box",
      "checkmark",
      "cross",
      "info",
      "mail",
      "plus",
      "quotation",
      "tel",
      "undo",
    ]);
  });

  it("has an 'info' icon drawn in the CTA's dark colour, unlike the light notification one (L6)", () => {
    const InfoLabel = getIconComponent("info", CTAIcons);
    expect(InfoLabel).not.toBeNull();
    expect(InfoLabel).not.toBe(Icons.info);

    const { container } = render(InfoLabel ? <InfoLabel /> : null);

    expect(container.querySelector("path")?.getAttribute("fill")).toBe("#141414");
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
  const allIcons = [
    ...Object.entries(Icons).map(([name, Icon]) => [`Icons.${name}`, Icon] as const),
    ...Object.entries(CTAIcons).map(([name, Icon]) => [`CTAIcons.${name}`, Icon] as const),
  ];

  it.each(allIcons)("%s renders a single <svg>", (_name, Icon) => {
    const { container } = render(<Icon />);

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it.each(allIcons)("%s passes its props to the <svg> (L7)", (_name, Icon) => {
    const { container } = render(<Icon className="label" aria-hidden="true" width={12} />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toBe("label");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("width")).toBe("12");
  });
});
