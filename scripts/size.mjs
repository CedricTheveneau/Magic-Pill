// Size budget: what an app ships when it uses Magic Pill (VISION.md §7, "Tiny but mighty").
//
// Each probe imports part of the built package (dist/), and is bundled the way
// an app's bundler would: tree-shaken, minified, with React left out (it's a
// peer dependency the app already has). The result is measured gzipped.
// Run `npm run build` first. Exits with 1 when a probe goes over its budget.
//
// Usage: node scripts/size.mjs [--json]
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "tsdown";

const KB = 1000;

// Budgets in gzipped bytes. Raise one only on purpose, and say why in the PR.
const PROBES = [
  {
    name: "MagicPill + pill()",
    description: "the quick start: the host, the store and the notification template",
    code: 'export { MagicPill, pill } from "ENTRY";',
    budget: 5.5 * KB, // 4.89 kB at 9.0.0-next.0
  },
  {
    name: "Pill primitive",
    description: "a hand-written pill: Pill and its parts",
    code: 'export { Pill, PillIcon, PillDivider, PillMessage, PillActions, PillAction } from "ENTRY";',
    budget: 1.75 * KB, // 1.44 kB at 9.0.0-next.0
  },
  {
    name: "Everything",
    description: "every export, icons included",
    code: 'export * from "ENTRY";',
    budget: 10 * KB, // 9.07 kB at 9.0.0-next.0
  },
];
const CSS_BUDGET = 4 * KB; // 3.59 kB at 9.0.0-next.0

const root = resolve(import.meta.dirname, "..");
const entry = join(root, "dist", "index.mjs");
const gzip = (buffer) => gzipSync(buffer, { level: 9 }).length;

async function measureProbe(probe, workDir, index) {
  const input = join(workDir, `probe-${index}.mjs`);
  const outDir = join(workDir, `out-${index}`);
  writeFileSync(input, probe.code.replace("ENTRY", entry.replaceAll("\\", "/")));
  await build({
    config: false,
    entry: { probe: input },
    outDir,
    format: "esm",
    platform: "browser",
    minify: true,
    dts: false,
    sourcemap: false,
    external: [/^react($|\/)/, /^react-dom($|\/)/],
    logLevel: "silent",
  });
  const code = Buffer.concat(
    readdirSync(outDir)
      .filter((file) => /\.m?js$/.test(file))
      .map((file) => readFileSync(join(outDir, file))),
  );
  return { name: probe.name, description: probe.description, raw: code.length, rawLabel: "minified", gzip: gzip(code), budget: probe.budget };
}

const workDir = mkdtempSync(join(tmpdir(), "magic-pill-size-"));
try {
  const results = [];
  for (const [index, probe] of PROBES.entries()) {
    results.push(await measureProbe(probe, workDir, index));
  }
  const css = readFileSync(join(root, "dist", "styles.css"));
  results.push({ name: "styles.css", description: "the stylesheet", raw: css.length, rawLabel: "as shipped", gzip: gzip(css), budget: CSS_BUDGET });

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const format = (bytes) => `${(bytes / KB).toFixed(2)} kB`;
    console.log("Size of what an app ships (gzipped, React excluded):\n");
    for (const result of results) {
      const status = result.gzip <= result.budget ? "ok  " : "OVER";
      console.log(
        `${status} ${result.name.padEnd(20)} ${format(result.gzip).padStart(9)} / ${format(result.budget).padStart(9)}   (${format(result.raw)} ${result.rawLabel}: ${result.description})`,
      );
    }
  }

  const over = results.filter((result) => result.gzip > result.budget);
  if (over.length > 0) {
    console.error(`\nOver budget: ${over.map((result) => result.name).join(", ")}. See scripts/size.mjs.`);
    process.exitCode = 1;
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
