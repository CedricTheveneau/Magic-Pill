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
    expect(withoutComments).toMatch(/@layer magic-pill\s*{\s*@layer look, theme, forms, behaviour;/);
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

  it("sizes any icon in its slot: an svg or an image at 1em, a font icon by the font size", () => {
    // Assert
    expect(withoutComments).toMatch(
      /& \[data-mp="icon"\] > :is\(svg, img\),\s*& \[data-mp="action-icon"\] > :is\(svg, img\) {\s*inline-size: 1em;\s*block-size: 1em;\s*object-fit: contain;/,
    );
    expect(withoutComments).toMatch(/& \[data-mp="icon"\] {[^}]*font-size: calc\(var\(--_mp-action-size\) \* 0\.6\);/);
    expect(withoutComments).toMatch(/& \[data-mp="action-icon"\] {[^}]*font-size: 1\.25rem;/);
  });

  it("takes every duration from a public token, the fade included", () => {
    // Assert
    expect(withoutComments).toContain("--_mp-enter: var(--mp-duration-enter, 500ms);");
    expect(withoutComments).toContain("--_mp-exit: var(--mp-duration-exit, 300ms);");
    expect(withoutComments).toContain("--_mp-change: var(--mp-duration-change, 250ms);");
    expect(withoutComments).toContain("--_mp-fade: var(--mp-duration-fade, 150ms);");
  });

  it("lets a sidebar's flag and an electron come out of the pill's edge (goo.ts) without scaling, on the split's and the join's durations", () => {
    // Assert
    const flag = /&:is\(\[data-layout="flag"\], \[data-satellite\]\) {([\s\S]*?)\n {6}}/.exec(withoutComments)?.[1] ?? "";
    expect(flag).toContain("--_mp-enter: var(--mp-duration-split, var(--mp-duration-enter, 500ms));");
    expect(flag).toContain("--_mp-exit: var(--mp-duration-join, var(--mp-duration-exit, 300ms));");
    expect(flag).toContain("--_mp-exit-scale: 1;");
    expect(flag).toMatch(/&\[data-presence="hidden"\] {\s*scale: 1;\s*}/);
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

  it("gives actions a rim and the current page's one its own colours, unchanged by default", () => {
    // Assert
    expect(withoutComments).toContain("--_mp-action-rim: var(--mp-action-rim, transparent);");
    expect(withoutComments).toContain("--_mp-action-current: var(--mp-action-current, var(--_mp-action));");
    expect(withoutComments).toContain("--_mp-on-action-current: var(--mp-on-action-current, var(--_mp-on-action));");
  });

  it.each(["neutral", "success", "danger"])("gives %s pills their own text and action colours (L28)", (variant) => {
    // Arrange
    const rule = withoutComments.split(`&[data-variant="${variant}"] {`)[1]?.split("}")[0];

    // Assert
    expect(rule).toContain(`--_mp-own-on-surface: var(--mp-on-${variant}, var(--mp-on-surface));`);
    expect(rule).toContain(`--_mp-own-action: var(--mp-${variant}-action, var(--mp-action));`);
    expect(rule).toContain(`--_mp-own-on-action: var(--mp-on-${variant}-action, var(--mp-on-action));`);
  });

  it("leaves a panel's close button folded while the other actions show their label", () => {
    // Assert
    expect(withoutComments).toContain(
      '&:is([data-presence="expanded"], [data-presence="panel"]) [data-mp="action"]:not([data-collapsed])',
    );
  });

  it("changes the panel's footer, the text and the actions' colours at the pill's pace", () => {
    // Arrange
    const footer = withoutComments.split('[data-mp="panel-footer"] {')[1].split("/* ")[0];
    const body = withoutComments.split('& [data-mp="action-body"] {\n        display: inline-flex;')[1].split("}")[0];

    // Assert: a colour under a mask, since a gradient can't be transitioned
    expect(footer).toMatch(/&::before {[^}]*background: var\(--_mp-surface\);\s*mask: linear-gradient/);
    expect(footer).toContain("transition: background-color var(--_mp-change) ease-in-out;");
    expect(body).toContain("background-color var(--_mp-change) ease-in-out");
    expect(body).toContain("color var(--_mp-change) ease-in-out");
    expect(withoutComments.match(/[^-]color var\(--_mp-change\) ease-in-out/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("folds a tight (or folded) navbar's open labels, except the one pointed at or focused", () => {
    // Assert
    expect(withoutComments).toContain(
      '& [data-mp="navbar"]:is([data-tight], [data-folded]) [data-mp="action"]:not(:hover, :focus-visible)',
    );
  });

  it("follows prefers-reduced-motion", () => {
    // Assert
    expect(withoutComments).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
