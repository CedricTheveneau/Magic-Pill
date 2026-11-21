/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import css from "./styles.css?raw";

// Guards for the v9 styling contract (api-proposal §7)
describe("styles.css", () => {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

  it("loads nothing from the network: no @import, no url() (L10, R12)", () => {
    // Assert
    expect(withoutComments).not.toMatch(/@import/);
    expect(withoutComments).not.toMatch(/url\(/);
  });

  it("puts every rule in the magic-pill layer, so unlayered user CSS wins (L12)", () => {
    // Arrange
    const firstStatement = withoutComments.trim().split("{")[0].trim();

    // Assert
    expect(firstStatement).toBe("@layer magic-pill");
    expect(withoutComments.trim().endsWith("}")).toBe(true);
    // One top-level block: the layer
    let depth = 0;
    let topLevelBlocks = 0;
    for (const char of withoutComments) {
      if (char === "{" && depth++ === 0) topLevelBlocks++;
      if (char === "}") depth--;
    }
    expect(topLevelBlocks).toBe(1);
  });

  it("declares the behaviour sub-layer after the look, so hiding rules always win", () => {
    // Assert
    expect(withoutComments).toMatch(/@layer magic-pill\s*{\s*@layer look, behaviour;/);
    expect(withoutComments.indexOf("@layer behaviour {")).toBeGreaterThan(-1);
    expect(withoutComments.indexOf("@layer look {")).toBeGreaterThan(-1);
  });

  it("selects by data attributes, never by class names that could collide (L12)", () => {
    // Assert
    expect(withoutComments).not.toMatch(/(^|[\s,>+~(])\.[a-zA-Z_-]/m);
  });

  it("doesn't hard-code the fonts: they come from tokens or the page", () => {
    // Assert
    const fontFamilies = [...withoutComments.matchAll(/font-family:\s*([^;]+);/g)].map((match) => match[1]);
    expect(fontFamilies.length).toBeGreaterThan(0);
    for (const value of fontFamilies) {
      expect(value).toMatch(/^var\(--mp-font-(text|accent), inherit\)$/);
    }
  });

  it("lines a sidebar's items up along its screen edge, overridable with --mp-align", () => {
    // Assert
    expect(withoutComments).toContain("--_mp-align: var(--mp-align, center);");
    expect(withoutComments).toMatch(
      /\[data-placement="left"\]:dir\(ltr\), \[data-placement="right"\]:dir\(rtl\)\)\s*{\s*--_mp-align: var\(--mp-align, start\);/,
    );
    expect(withoutComments).toMatch(
      /\[data-placement="right"\]:dir\(ltr\), \[data-placement="left"\]:dir\(rtl\)\)\s*{\s*--_mp-align: var\(--mp-align, end\);/,
    );
  });

  it("follows prefers-reduced-motion", () => {
    // Assert
    expect(withoutComments).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
