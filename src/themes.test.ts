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
    expect(topLevel.filter((block) => !/^@property --_mp-[\w-]+$/.test(block))).toEqual(["@layer magic-pill.theme"]);
  });

  it.each(["refraction", "edge", "fringe", "follow", "adaptive"])("registers --_mp-%s and gives it a transition, for <PillOptics>", (name) => {
    // Assert
    expect(css).toMatch(new RegExp(`@property --_mp-${name} {`));
    expect(css).toMatch(new RegExp(`--_mp-also:[^;]*--_mp-${name} 1ms`));
  });

  it("puts the lens last in the filters, and Safari's prefixed one has none", () => {
    // Assert
    expect(css).toMatch(
      /-webkit-backdrop-filter: var\(--_mp-filter\);\s*backdrop-filter: var\(--_mp-filter\) var\(--_mp-lens,\);/,
    );
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
    "refraction",
    "edge",
    "fringe",
    "light-follow",
    "adaptive",
    "adaptive-surface",
    "adaptive-on-surface",
    "readable",
    "action",
    "on-action",
    "action-rim",
    "action-current",
    "on-action-current",
    "backdrop",
    "glow-1",
    "glow-2",
    "glow-duration",
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
    const glow = '[data-mp="pill"][data-backdrop="glow"]:not([data-unstyled])::backdrop';
    const selectors = [...css.matchAll(/\[data-mp="pill"\][^{]*/g)]
      .map(([selector]) => selector.trim())
      .filter((selector) => selector !== glow);

    // Assert
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector).toBe('[data-mp="pill"][data-theme]:not([data-theme="plain"], [data-unstyled])');
    }
  });

  it("only applies where the browser can work out the readable veil", () => {
    // Assert
    const supports = css.indexOf("@supports (color: oklch(from red l c h / calc(pow(l, 2)))) {");
    expect(supports).toBeGreaterThan(-1);
    expect(css.indexOf('[data-mp="pill"][data-theme]')).toBeGreaterThan(supports);
  });

  it("goes back to the plain look with less transparency, more contrast or forced colours", () => {
    // Assert: the glow, then the material
    expect(
      css.split("@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)"),
    ).toHaveLength(3);
  });

  it("selects by data attributes, never by class names that could collide", () => {
    // Assert
    expect(css).not.toMatch(/(^|[\s,>+~(])\.[a-zA-Z_-]/m);
  });
});

describe("the light that follows the pointer", () => {
  it("stays put with reduced motion", () => {
    // Assert
    expect(withoutComments(themes)).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{[^}]*--_mp-follow: 0;/);
  });
});

describe("the modal's glow", () => {
  it("stands still with reduced motion", () => {
    // Assert
    expect(withoutComments(themes)).toMatch(
      /animation: mp-drift [^;]+;\s*@media \(prefers-reduced-motion: reduce\)\s*{\s*animation: none;/,
    );
  });
});

describe("styles.css", () => {
  const css = withoutComments(styles);

  it("blurs the modal's backdrop only when asked to: no fallback, so no filter by default", () => {
    // Assert
    expect(css).toContain("backdrop-filter: blur(var(--mp-backdrop-blur));");
  });

  it("lets a theme join the pill's transitions, in every state", () => {
    // Assert
    expect(css.match(/var\(--_mp-also, visibility 0s\)/g)).toHaveLength(3);
  });
});
