// @vitest-environment node
/// <reference types="vite/client" />
import { useEffect } from "react";
import { describe, expect, it } from "vitest";

import { useIsomorphicLayoutEffect } from "./react";

// Every source file, as text, to check what it imports
const sources = import.meta.glob(["../**/*.{ts,tsx}", "!../**/*.test.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("useIsomorphicLayoutEffect (L31)", () => {
  it("is useEffect on the server, where React 18 warns about layout effects", () => {
    // Assert
    expect(typeof window).toBe("undefined");
    expect(useIsomorphicLayoutEffect).toBe(useEffect);
  });

  it("is the only way the library runs a layout effect", () => {
    // Arrange
    const direct = Object.entries(sources)
      // This file defines it (Vite lists it by its shortest path)
      .filter(([path]) => path !== "./react.ts")
      .filter(([, source]) => /\buseLayoutEffect\b/.test(source))
      .map(([path]) => path);

    // Assert
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(direct).toEqual([]);
  });
});
