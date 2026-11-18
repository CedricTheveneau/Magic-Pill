import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-cleans when test globals are enabled, which they aren't
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
