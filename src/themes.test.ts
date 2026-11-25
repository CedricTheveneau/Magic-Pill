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

  it.each(["refraction", "edge", "fringe", "follow", "adaptive", "action-layer", "action-radius"])("registers --_mp-%s and gives it a transition, for <PillOptics>", (name) => {
    // Assert
    expect(css).toMatch(new RegExp(`@property --_mp-${name} {`));
    expect(css).toMatch(new RegExp(`--_mp-watch:[^;]*--_mp-${name} 1ms`));
  });

  it("tells <PillOptics> of token changes with reduced motion too, where pills have other transitions", () => {
    // Arrange
    const reduced = withoutComments(styles).split("@media (prefers-reduced-motion: reduce)")[1];

    // Assert
    expect(reduced.match(/var\(--_mp-watch, visibility 0s\)/g)).toHaveLength(3);
    expect(css).toMatch(/--_mp-also:[^;]*var\(--_mp-watch\)/);
  });

  it("moves the glass to a layer for glass actions, but not while a panel scrolls it away", () => {
    // Assert
    expect(css).toMatch(/&\[data-actions="glass"\] {[^}]*&:not\(\[data-presence="panel"\]\) {[^}]*backdrop-filter: none;/);
    expect(css).toMatch(/&::before {[^}]*backdrop-filter: var\(--_mp-filter\) var\(--_mp-lens,\);/);
  });

  it("gives actions their glass once the content has faded in: a fading parent would turn them black", () => {
    // Assert
    expect(css).toContain("animation: mp-settle calc(var(--_mp-change) + var(--_mp-fade));");
    expect(css).toMatch(/@keyframes mp-settle {\s*from,\s*to {[^}]*backdrop-filter: none;/);
  });

  it("masks a panel's text as it scrolls, where the browser can, and covers it elsewhere", () => {
    // Assert
    expect(css).toMatch(/@supports \(animation-timeline: view\(\)\) {[\s\S]*animation: mp-seen linear both;/);
    expect(css).toContain("@supports not (animation-timeline: view())");
    // A text that doesn't scroll is all there
    expect(css).toMatch(/@property --_mp-seen {[^}]*initial-value: 100%;/);
  });

  it("puts the lens last in the filters, and Safari's prefixed one has none", () => {
    // Assert
    expect(css).toMatch(
      /-webkit-backdrop-filter: var\(--_mp-filter\);\s*backdrop-filter: var\(--_mp-filter\) var\(--_mp-lens,\);/,
    );
  });

  it("sits between the look and the behaviour, whichever stylesheet is imported first", () => {
    // Assert
    expect(css.trim().startsWith("@layer magic-pill.look, magic-pill.theme, magic-pill.forms, magic-pill.behaviour;")).toBe(true);
    expect(withoutComments(styles)).toMatch(/@layer magic-pill\s*{\s*@layer look, theme, forms, behaviour;/);
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
    "action-glass",
    "adaptive",
    "adaptive-surface",
    "adaptive-on-surface",
    "readable",
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

  it("reads the actions' colours from what the app set for the variant, not from the overall tokens (L28)", () => {
    // Assert
    expect(css).toMatch(/var\(\s*--_mp-own-action,/);
    expect(css).toMatch(/var\(\s*--_mp-own-on-action,/);
    expect(css).not.toMatch(/var\(\s*--mp-(on-)?action\s*[,)]/);
  });

  it("takes the glass of open lists and calendars away with the rest, when less transparency is asked for", () => {
    // Arrange
    const preferences = css.slice(css.lastIndexOf("@media (prefers-reduced-transparency: reduce)"));

    // Assert
    expect(preferences).toContain("--_mp-list-filter: none;");
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
