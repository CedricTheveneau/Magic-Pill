import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  // Runs in browsers and in React Server Components' SSR, so no Node-only shims
  platform: "neutral",
  target: "es2020",
  // File names follow tsdown's defaults for a package without "type":
  // CJS keeps the historical dist/index.js + index.d.ts ("main", "types"),
  // ESM uses .mjs + .d.mts so Node never mistakes it for CommonJS.
  dts: true,
  sourcemap: true,
  minify: true,
  // One output file per source module, so each component keeps its own
  // "use client" directive (L2). A Server Component can then render
  // <MagicPill> directly, while plain exports (types, handlers,
  // defaultPillData) stay ordinary values instead of client references.
  unbundle: true,
  // Consumers import the stylesheet themselves (magic-pill/dist/magicpill.css),
  // so it's shipped untouched next to the bundles (L9)
  copy: [{ from: "src/magicpill.css", to: "dist" }],
});
