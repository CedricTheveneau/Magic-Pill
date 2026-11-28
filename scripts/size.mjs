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
    // then from 9.4 kB for several panels and their slots: 9.48 kB,
    // then from 9.75 kB for scenes (Pill/scene.ts): 10.22 kB,
    // then from 10.5 kB for the exit played by script, which a restyle of the page can't cut short (iOS): 10.68 kB,
    // then from 11 kB for placement changes through the circle (Pill/travel.ts): 11.02 kB,
    // then from 11.5 kB for notifications in rows and the slides where a sidebar turns: 11.42 kB,
    // then from 12 kB for cards (11.57 kB) and a sidebar's flag, a second pill with its own steps and
    // pauses, and the navbar's matching to find its section (MagicPill/flag.ts, useChoreography.ts): 13.08 kB,
    // then from 13.5 kB for the goo, a flag's split and join (Pill/goo.ts: an overlay and its SVG filter,
    // the curves, the content's fade, the glass' blur kept off the sidebar), in place of the bridge: 15.16 kB,
    // then from 15.5 kB for the electrons' part of the store and the host (pill().electron(), the host's
    // satellites props and its warning without them; the rest is in magic-pill/satellites): 15.54 kB,
    // then from 15.75 kB for the page's actions' part (pill().setActions(), the host's props and the
    // actions inside the pill): 15.78 kB, 15.96 kB with the goo's overlay bounded to its two pills
    budget: 16.25 * KB, // 4.89 kB at 9.0.0-next.0
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
    // then from 4.9 kB for several panels: 4.87 kB,
    // then from 5 kB for scenes (Pill/scene.ts, and the swap, which only the host had): 6.16 kB,
    // then from 6.5 kB for the exit played by script, which a restyle of the page can't cut short (iOS): 6.65 kB,
    // then from 7 kB for placement changes through the circle (Pill/travel.ts): 6.99 kB
    budget: 7.5 * KB, // 1.44 kB at 9.0.0-next.0
  },
  {
    name: "A form panel",
    description: "the quick start, with a form panel, a text field and a switch",
    code: 'export { MagicPill, pill, PillFormPanel, PillInput, PillSwitch } from "ENTRY";',
    // 12.17 kB, then 12.71 kB with the busy labels, 13.38 kB with scenes,
    // 13.88 kB with the exit played by script, 14.23 kB with placement changes through the circle,
    // 14.62 kB with notifications in rows, 16.33 kB with cards and the flag, 18.48 kB with the goo,
    // 18.88 kB with the electrons' part of the store and the host, 19.11 kB with the page's actions' part,
    // 19.33 kB with the goo's overlay bounded to its two pills
    budget: 19.5 * KB,
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
    // then from 23.25 kB for the busy labels: 23.57 kB,
    // then from 23.75 kB for scenes: 24.16 kB,
    // then from 24.5 kB for the calendar (PillDate, only for apps that use it): 29.35 kB,
    // then from 29.75 kB for the exit played by script and the fields' keyboard-only focus rings: 29.85 kB,
    // then from 30.25 kB for placement changes through the circle: 30.23 kB,
    // then from 30.75 kB for notifications in rows: 30.68 kB,
    // then from 31.25 kB for cards and the flag: 32.39 kB,
    // then from 32.75 kB for the goo: 34.74 kB,
    // then from 35 kB for the electrons' part of the store and the host, and PillProgress: 35.31 kB,
    // then from 35.5 kB for the navbar's labels at rest (folded while they have no room): 35.65 kB,
    // then from 36 kB for the goo's overlay bounded to its two pills: 36.03 kB
    budget: 36.25 * KB, // 9.07 kB at 9.0.0-next.0
  },
  {
    name: "With the satellites",
    description: "the quick start, with the electrons (magic-pill/satellites, beta)",
    code: 'export { MagicPill, pill } from "ENTRY"; export { satellites } from "SATELLITES";',
    // 18.16 kB with the electrons (the layer, the layout, PillProgress): 2.62 kB more than the quick start,
    // 18.49 kB with the navbar's folded width, to know whether an electron fits next to it,
    // 21.71 kB with the orbitals (their arc around obstacles, the long press, sliding to one,
    // hovering, the keyboard's menu, their labels),
    // 22.75 kB with the wheel (turning with the mouse wheel, a drag and the keys, snapping, peeking where clear),
    // 23.62 kB with the page's actions (usePillActions, their pill, their side and orientation),
    // 24.37 kB with tucking in while the host travels, going back in and out to change sides, and
    // the actions growing away from the pill
    budget: 24.75 * KB,
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
    // then from 3 kB for the panel's slots: 3.09 kB,
    // a vertical pill's circle: 3.10 kB, notifications in rows: 3.20 kB,
    // then from 3.5 kB for the electron (its link, its value) and PillProgress's ring: 3.66 kB,
    // then from 3.75 kB for the orbitals and their label: 3.92 kB
    budget: 4 * KB, // 2.15 kB at 9.0.0-next.1 (3.89 kB with its comments, as shipped)
  },
  {
    name: "themes.css",
    description: "the glass themes, only for apps that import it",
    // Raised from 2.25 kB for the mask of the panels' text and the glass actions: 2.43 kB,
    // then from 2.6 kB for the glass of lists and calendars: 2.54 kB
    budget: 2.75 * KB,
  },
  {
    name: "forms.css",
    description: "the fields, only for apps that import it",
    // 4.99 kB, then 5.49 kB for the looks of every field, lists and calendars, 5.71 kB with their glass
    budget: 6 * KB,
  },
  {
    name: "calendar.css",
    description: "the calendar, only for apps that import it",
    // 2.17 kB
    budget: 2.5 * KB,
  },
];

const root = resolve(import.meta.dirname, "..");
const entry = join(root, "dist", "index.mjs");
const satellitesEntry = join(root, "dist", "satellites.mjs");
const gzip = (buffer) => gzipSync(buffer, { level: 9 }).length;

async function measureProbe(probe, workDir, index) {
  const input = join(workDir, `probe-${index}.mjs`);
  const outDir = join(workDir, `out-${index}`);
  writeFileSync(
    input,
    probe.code.replace("ENTRY", entry.replaceAll("\\", "/")).replace("SATELLITES", satellitesEntry.replaceAll("\\", "/")),
  );
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
