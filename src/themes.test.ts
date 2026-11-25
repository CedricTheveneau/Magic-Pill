/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import styles from "./styles.css?raw";
import themes from "./themes.css?raw";

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

// Guards for the themes' contract (docs/v9/themes-proposal.md)
describe("themes.css", () => {
  const css = withoutComments(themes);

  it("loads nothing from the network: no @import, no url()", () => {
    // Assert
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/url\(/);
  });

  it("puts every rule in magic-pill.theme, so unlayered user CSS wins", () => {
    // Arrange
    const topLevel: string[] = [];
    let depth = 0;
    let start = 0;
    [...css].forEach((char, index) => {
      if (char === "{" && depth++ === 0) topLevel.push(css.slice(start, index).trim());
      if ((char === "}" && --depth === 0) || (char === ";" && depth === 0)) start = index + 1;
    });

    // Assert
    expect(topLevel).toEqual(["@property --_mp-veil", "@property --_mp-frost", "@layer magic-pill.theme"]);
  });

  it("sits between the look and the behaviour, whichever stylesheet is imported first", () => {
    // Assert
    expect(css.trim().startsWith("@layer magic-pill.look, magic-pill.theme, magic-pill.behaviour;")).toBe(true);
    expect(withoutComments(styles)).toMatch(/@layer magic-pill\s*{\s*@layer look, theme, behaviour;/);
  });

  it("only reads the public tokens: they can be set anywhere", () => {
    // Assert
    expect(css).not.toMatch(/(^|[\s{;])--mp-[\w-]+\s*:/m);
    expect(withoutComments(styles)).not.toMatch(/(^|[\s{;])--mp-[\w-]+\s*:/m);
  });

  it.each([
    "tint",
    "status-tint",
    "frost",
    "panel-frost",
    "rays",
    "light",
    "light-angle",
    "light-color",
    "vibrancy",
    "readable",
    "action",
    "on-action",
    "action-rim",
    "action-current",
    "on-action-current",
  ])("reads --mp-%s", (token) => {
    // Assert
    expect(css).toMatch(new RegExp(`var\\(\\s*--mp-${token},`));
  });

  it("frosts an open panel more, whether or not the text is kept readable", () => {
    // Assert
    expect(css).toContain("--_mp-frost: max(var(--_mp-own-frost), var(--mp-panel-frost, 12px));");
  });

  it("leaves plain, unstyled and theme-less pills alone", () => {
    // Arrange
    const selectors = [...css.matchAll(/\[data-mp="pill"\][^{]*/g)].map(([selector]) => selector.trim());

    // Assert
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector).toBe('[data-mp="pill"][data-theme]:not([data-theme="plain"], [data-unstyled])');
    }
  });

  it("only applies where the browser can work out the readable veil", () => {
    // Assert
    expect(css).toMatch(/@layer magic-pill\.theme\s*{\s*@supports \(color: oklch\(from red l c h \/ calc\(pow\(l, 2\)\)\)\)/);
  });

  it("goes back to the plain look with less transparency, more contrast or forced colours", () => {
    // Assert
    expect(css).toContain(
      "@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)",
    );
  });

  it("selects by data attributes, never by class names that could collide", () => {
    // Assert
    expect(css).not.toMatch(/(^|[\s,>+~(])\.[a-zA-Z_-]/m);
  });
});

describe("styles.css", () => {
  const css = withoutComments(styles);

  it("lets a theme join the pill's transitions, in every state", () => {
    // Assert
    expect(css.match(/var\(--_mp-also, visibility 0s\)/g)).toHaveLength(3);
  });
});
