import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // Every test starts from real timers and untouched mocks
    restoreMocks: true,
    unstubGlobals: true,
  },
});
