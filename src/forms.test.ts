/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import forms from "./forms.css?raw";
import styles from "./styles.css?raw";
import themes from "./themes.css?raw";

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

// Guards for the forms' contract (docs/v9/forms-proposal.md)
describe("forms.css", () => {
  const css = withoutComments(forms);

  it("loads nothing from the network: no @import, no url()", () => {
    // Assert
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/url\(/);
  });

  it("puts every rule in magic-pill.forms, so unlayered user CSS wins", () => {
    // Arrange
    const topLevel: string[] = [];
    let depth = 0;
    let start = 0;
    [...css].forEach((char, index) => {
      if (char === "{" && depth++ === 0) topLevel.push(css.slice(start, index).trim());
      if ((char === "}" && --depth === 0) || (char === ";" && depth === 0)) start = index + 1;
    });

    // Assert
    expect(topLevel).toEqual(["@layer magic-pill.forms"]);
  });

  it("sits after the themes and before the behaviour, whichever stylesheet is imported first", () => {
    // Arrange
    const order = "@layer magic-pill.look, magic-pill.theme, magic-pill.forms, magic-pill.behaviour;";

    // Assert
    expect(css.trim().startsWith(order)).toBe(true);
    expect(withoutComments(themes).trim().startsWith(order)).toBe(true);
    expect(withoutComments(styles)).toMatch(/@layer magic-pill\s*{\s*@layer look, theme, forms, behaviour;/);
  });

  it("only reads the public tokens: they can be set anywhere", () => {
    // Assert
    expect(css).not.toMatch(/(^|[\s{;])--mp-[\w-]+\s*:/m);
  });

  it.each([
    "field",
    "on-field",
    "field-rim",
    "field-size",
    "field-radius",
    "field-gap",
    "field-scheme",
    "placeholder",
    "track",
    "thumb",
    "label-font",
    "label-style",
    "label-weight",
    "error",
    "list",
    "on-list",
    "picker",
  ])("reads --mp-%s", (token) => {
    // Assert
    expect(css).toMatch(new RegExp(`var\\(\\s*--mp-${token},`));
  });

  it("leaves unstyled pills alone, and selects by data attributes only", () => {
    // Assert
    for (const [selector] of css.matchAll(/\[data-mp="pill"\][^{]*/g)) {
      expect(selector.trim()).toBe('[data-mp="pill"]:not([data-unstyled])');
    }
    expect(css).not.toMatch(/(^|[\s,>+~(])\.[a-zA-Z_-]/m);
  });

  it("never sets text under 16px in a control: iOS would zoom the page in", () => {
    // Assert
    expect(css).toContain("font-size: max(1rem, 16px);");
  });

  it("puts no pseudo-element in :is(), which would drop the rule", () => {
    // Assert
    expect(css).not.toMatch(/:is\([^)]*::/);
  });

  it("follows reduced motion and forced colours", () => {
    // Assert
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (forced-colors: active)");
  });
});
