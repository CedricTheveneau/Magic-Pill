/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import calendar from "./calendar.css?raw";
import forms from "./forms.css?raw";
import styles from "./styles.css?raw";
import themes from "./themes.css?raw";

// Lightning CSS, the parser of Next.js's Turbopack, fails the whole build on a
// pseudo-class after a pseudo-element, except the user-action ones (:hover,
// :active, :focus…), even where browsers accept it. 9.1.0 shipped one.
const PSEUDO_CLASS_AFTER_PSEUDO_ELEMENT = /::[\w-]+(?:\([^)]*\))?:(?!:|hover|active|focus)[\w-]+/g;

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe.each([
  ["styles.css", styles],
  ["themes.css", themes],
  ["forms.css", forms],
  ["calendar.css", calendar],
])("%s, for every bundler", (_name, css) => {
  it("puts no pseudo-class after a pseudo-element, which Lightning CSS refuses", () => {
    // Act
    const found = withoutComments(css).match(PSEUDO_CLASS_AFTER_PSEUDO_ELEMENT) ?? [];

    // Assert
    expect(found).toEqual([]);
  });
});
