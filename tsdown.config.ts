import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  // Runs in browsers and in React Server Components' SSR, so no Node-only shims
  platform: "neutral",
  target: "es2020",
  // Keep the historical CJS name (dist/index.js + index.d.ts, used by "main"
  // and "types"). ESM uses .mjs so Node never mistakes it for CommonJS.
  outExtensions: ({ format }) =>
    format === "cjs" ? { js: ".js", dts: ".d.ts" } : { js: ".mjs", dts: ".d.mts" },
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
