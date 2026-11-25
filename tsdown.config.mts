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
  // Readable output, no source maps: apps minify the code themselves (the
  // size they ship is the same either way, see scripts/size.mjs), and plain
  // code in node_modules is easier to debug and learn from than minified
  // code plus maps, which were more than half of the package.
  sourcemap: false,
  minify: false,
  // One output file per source module, so each component keeps its own
  // "use client" directive (L2). A Server Component can then render
  // the client components directly, while stateless modules (parts, icons,
  // the store and pill()) stay ordinary values instead of client references.
  unbundle: true,
  // Consumers import the stylesheet themselves, so it's shipped untouched next
  // to the bundles (L9). package.json maps the 8.x paths to it too.
  copy: [{ from: ["src/styles.css", "src/themes.css"], to: "dist" }],
});
