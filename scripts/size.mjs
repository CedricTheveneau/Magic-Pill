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
    // Raised from 5.5 kB for the size animation (Pill/morph.ts): 6.36 kB,
    // then from 6.5 kB for the queue's swap animation: 7.47 kB,
    // then from 7.5 kB for placement changes and held messages: 7.82 kB,
    // then from 8 kB for the modal's entry and exit (Pill/modal.ts): 8.09 kB,
    // then from 8.25 kB for closeOnBackdropClick: 8.25 kB,
    // then from 8.5 kB for pills sharing a placement (Pill/zone.ts): 9.14 kB,
    // then from 9.25 kB for the themes (Pill/themed.ts): 9.24 kB, the focus lost with its content: 9.30 kB,
    // then from 9.4 kB for several panels and their slots: 9.48 kB
    budget: 9.75 * KB, // 4.89 kB at 9.0.0-next.0
  },
  {
    name: "Pill primitive",
    description: "a hand-written pill: Pill and its parts",
    code: 'export { Pill, PillIcon, PillDivider, PillMessage, PillActions, PillAction } from "ENTRY";',
    // Raised from 1.75 kB for the size animation (Pill/morph.ts): 2.76 kB,
    // then from 3 kB for placement changes and held messages: 3.31 kB,
    // then from 3.5 kB for the modal's entry and exit (Pill/modal.ts): 3.61 kB,
    // then from 3.75 kB for closeOnBackdropClick: 3.78 kB,
    // then from 4 kB for pills sharing a placement (Pill/zone.ts): 4.69 kB,
    // then from 4.75 kB for the themes (Pill/themed.ts): 4.80 kB,
    // then from 4.9 kB for several panels: 4.87 kB
    budget: 5 * KB, // 1.44 kB at 9.0.0-next.0
  },
  {
    name: "A form panel",
    description: "the quick start, with a form panel, a text field and a switch",
    code: 'export { MagicPill, pill, PillFormPanel, PillInput, PillSwitch } from "ENTRY";',
    // 12.17 kB, then 12.71 kB with the busy labels
    budget: 13 * KB,
  },
  {
    name: "Everything",
    description: "every export, icons included",
    code: 'export * from "ENTRY";',
    // Raised from 10 kB for the size animation (Pill/morph.ts): 10.61 kB,
    // then from 11 kB for the queue's swap animation: 11.74 kB,
    // then from 12 kB for placement changes and held messages: 12.09 kB,
    // then from 12.5 kB for the modal's entry and exit and closeOnBackdropClick: 12.54 kB,
    // then from 12.75 kB for pills sharing a placement (Pill/zone.ts): 13.42 kB,
    // then from 13.5 kB for the glass' optics (PillOptics/, only for apps that render it): 17.05 kB,
    // then from 17.25 kB for a navbar's narrow screens (PillNavbar/room.ts): 17.70 kB,
    // then from 18 kB for several panels and the navbar's other items: 18.02 kB,
    // then from 18.25 kB for the text fields (PillForm/, only for apps with forms): 20.40 kB,
    // then from 20.5 kB for the settings' fields: 22.01 kB,
    // then from 22.25 kB for codes, files and colours: 22.66 kB,
    // then from 22.75 kB for the form panel: 23.11 kB,
    // then from 23.25 kB for the busy labels: 23.57 kB
    budget: 23.75 * KB, // 9.07 kB at 9.0.0-next.0
  },
];
const STYLESHEETS = [
  {
    name: "styles.css",
    description: "the stylesheet",
    // Raised from 2.5 kB for pills sharing a placement: 2.51 kB,
    // then from 2.6 kB for the actions' rim and current page colours: 2.59 kB, the backdrop's blur: 2.62 kB,
    // the variants' text and action colours: 2.71 kB,
    // then from 2.75 kB for a navbar's narrow screens and colours that change together: 2.90 kB,
    // then from 3 kB for the panel's slots: 3.09 kB
    budget: 3.25 * KB, // 2.15 kB at 9.0.0-next.1 (3.89 kB with its comments, as shipped)
  },
  {
    name: "themes.css",
    description: "the glass themes, only for apps that import it",
    // Raised from 2.25 kB for the mask of the panels' text and the glass actions: 2.43 kB
    budget: 2.6 * KB,
  },
  {
    name: "forms.css",
    description: "the fields, only for apps that import it",
    // 4.99 kB
    budget: 5.25 * KB,
  },
];

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
  // Shipped with its comments; an app's bundler strips them and the whitespace,
  // like it minifies the JavaScript, so that's what's measured
  for (const { name, description, budget } of STYLESHEETS) {
    const css = readFileSync(join(root, "dist", name), "utf8");
    const minified = Buffer.from(css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim());
    results.push({ name, description, raw: minified.length, rawLabel: "minified", gzip: gzip(minified), budget });
  }

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
