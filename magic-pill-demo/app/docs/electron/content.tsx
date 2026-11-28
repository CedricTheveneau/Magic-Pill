"use client";
import { useEffect } from "react";
import { pill, type PillActionItem } from "magic-pill";

import { ELECTRON_DEFAULTS, useElectronSettings, type ElectronSettings } from "../../electron-settings";
import { ChecksIcon, FormIcon, PlusIcon, SearchIcon } from "../../icons";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";
import { TIMER_PAGE, UPLOAD_PAGE, startFocus, startUpload } from "./activities";

const PAGE_ACTIONS: PillActionItem[] = [
  { icon: <FormIcon />, label: "Write" },
  { icon: <ChecksIcon />, label: "Mark all as read" },
];
const MORE_ACTIONS: PillActionItem[] = [...PAGE_ACTIONS, { icon: <PlusIcon />, label: "New note" }, { icon: <SearchIcon />, label: "Search" }];

type Choice<K extends keyof ElectronSettings> = { key: K; legend: string; prop: string; options: [ElectronSettings[K], string][] };
const yesNo = (yes: string, no: string): [boolean, string][] => [
  [true, yes],
  [false, no],
];

/** Every setting of the main pill's satellites, as the prop it sets. */
const CHOICES = [
  { key: "theme", legend: "Theme", prop: "theme", options: [["plain", "Plain"], ["glass", "Glass"], ["liquid", "Liquid Glass"]] },
  { key: "electronSide", legend: "Where electrons go", prop: "electronSide", options: [["after", "After the pill"], ["before", "Before it"], ["beside", "Beside it"]] },
  { key: "electronLine", legend: "Several electrons", prop: "electronLine", options: [["along", "Along the pill"], ["across", "Stacked across"]] },
  { key: "arrange", legend: "The group", prop: "arrange", options: [["gather", "Gathered"], ["spread", "Spread to the edges"]] },
  { key: "keepElectronsOut", legend: "During a notification", prop: "keepElectronsOut", options: yesNo("They stay out", "They tuck in") },
  { key: "electronEnding", legend: "When one ends", prop: "electronEnding", options: [["join", "It joins back"], ["pop", "It pops away"]] },
  { key: "orbitalsOpenOn", legend: "Orbitals open with", prop: "orbitalsOpenOn", options: [["press-hover", "A long press or hovering"], ["press", "A long press"], ["tap", "A tap"]] },
  { key: "orbitalLabels", legend: "Orbitals' labels", prop: "orbitalLabels", options: yesNo("Shown", "Hidden") },
  { key: "orbitalsStayOpen", legend: "After an orbital runs", prop: "orbitalsStayOpen", options: yesNo("They stay open", "They close") },
  { key: "actionsStyle", legend: "The page's actions", prop: "actionsStyle", options: [["detached", "A pill of their own"], ["inside", "In the pill"]] },
  { key: "actionsSide", legend: "Their side", prop: "actionsSide", options: [["start", "Start"], ["end", "End"], ["beside", "Beside"]] },
  { key: "actionsOrientation", legend: "Their orientation", prop: "actionsOrientation", options: [["auto", "Automatic"], ["horizontal", "Horizontal"], ["vertical", "Vertical"]] },
  { key: "labels", legend: "The navbar's labels", prop: "labels (PillNavbar)", options: [["auto", "Automatic"], ["current", "The current page's"], ["closed", "None"]] },
] as Choice<keyof ElectronSettings>[];

/** The settings, as chips: each applies to the main pill on every page. */
function Settings() {
  const { settings, set } = useElectronSettings();
  const changed = (Object.keys(ELECTRON_DEFAULTS) as (keyof ElectronSettings)[]).some((key) => settings[key] !== ELECTRON_DEFAULTS[key]);
  return (
    <div className="card electron-settings">
      {CHOICES.map(({ key, legend, prop, options }) => (
        <fieldset key={key} className="chips">
          <legend>
            {legend} <code>{prop}</code>
          </legend>
          <div className="chip-list">
            {options.map(([value, label]) => (
              <label key={String(value)} className="chip">
                <input type="radio" name={`electron-${key}`} checked={settings[key] === value} onChange={() => set({ [key]: value })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="button-row">
        <button type="button" className="button button-outline" disabled={!changed} onClick={() => set(null)}>
          Back to the defaults
        </button>
      </div>
    </div>
  );
}

export function Content() {
  // The page's actions are this page's: they go when you leave it
  useEffect(() => () => pill().setActions(null), []);

  return (
    <>
      <DocsHeader title="The Electron">
        <p>
          <span className="beta-tag">Beta</span> A small round pill that splits out of the main one to keep a background
          activity in reach while you go elsewhere in the app: a timer, a call, an upload. It’s tucked into the pill on the
          page that started it, and comes out anywhere else; a tap goes back there. Long-press it (or hover it with a
          mouse) for its quick actions, the orbitals.
        </p>
        <p className="hint">
          It ships in <code>9.4.0-next</code> releases, and may still change. Start the timer below: it comes out of this
          site’s pill at once. The settings further down apply to it on every page.
        </p>
      </DocsHeader>

      <DocsSection id="electrons" title="Electrons">
        <div className="docs-examples">
          <Example
            title="A focus timer"
            notify={startFocus}
            tryLabel="Start the timer"
            code={`const id = pill().electron({
  label: "Focus timer",
  value: "25:00",
  valueText: "25 minutes left", // what screen readers read: round it
  progress: 0,
  href: "/focus", // its page: tucked in there, and where a tap goes back
});
pill().updateElectron(id, { value: "24:59", progress: 1 / 1500 }); // every second
pill().endElectron(id); // it goes back into the pill`}
          >
            <p>
              Its page here is {TIMER_PAGE.name}: it comes out at once, its ring filling as the time goes. Tap it to go to
              {" "}
              {TIMER_PAGE.name}, where it tucks in.
            </p>
          </Example>
          <Example
            title="An upload, a second electron"
            notify={startUpload}
            tryLabel="Start the upload"
            code={`pill().electron({
  label: "Upload",
  value: "12%",
  progress: 0.12,
  href: "/notes",
  ending: "pop", // done: it scales out instead of going back in
});`}
          >
            <p>
              Its page is {UPLOAD_PAGE.name}. Two electrons line up along the pill (or stack across it). On a phone, short of
              room, the navbar folds its labels, then the last one goes above the pill.
            </p>
          </Example>
          <Example
            title="Orbitals"
            notify={startFocus}
            tryLabel="Start the timer"
            code={`pill().electron({
  label: "Focus timer",
  orbitals: [
    { icon: <PlusIcon />, label: "+1 min", onClick: addMinute },
    { icon: <PauseIcon />, label: "Pause", onClick: pause },
    { icon: <SkipIcon />, label: "Skip to the break", onClick: skip },
  ],
});`}
          >
            <p>
              Long-press the timer, keep pressing, slide to one and release to run it. With a mouse, hovering opens them
              too. The keyboard: the arrow pointing away from the edge, then the arrows. They stay open after an action
              (Pause becomes Resume).
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="actions" title="The page’s actions">
        <div className="docs-examples">
          <Example
            title="Two actions"
            notify={() => pill().setActions(PAGE_ACTIONS)}
            tryLabel="Show this page’s actions"
            code={`import { usePillActions } from "magic-pill/satellites";

usePillActions([
  { icon: <PenIcon />, label: "Write", onClick: compose },
  { icon: <ChecksIcon />, label: "Mark all as read", onClick: readAll },
]); // in a page: they go with it`}
          >
            <p>
              The design’s wide atom: a pill of their own on the start side, or in the pill after a divider (see the
              settings). Short of room, they turn across, then go above the pill. They go when you leave this page.
            </p>
          </Example>
          <Example title="Four actions" notify={() => pill().setActions(MORE_ACTIONS)} tryLabel="Show four" code={`pill().setActions([write, readAll, newNote, search]);`}>
            <p>Vertical (in the settings), they take one spot along the pill instead of four.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="settings" title="Every setting, on every page">
        <p className="hint">
          Each one sets the main pill’s prop it names, on every page of this site, and stays on this device. Start the timer,
          pick, and go elsewhere.
        </p>
        <Settings />
      </DocsSection>

      <DocsSection id="setup" title="Setting it up">
        <div className="docs-examples">
          <Example
            title="The satellites"
            wide
            code={`"use client";
import { MagicPill, PillNavbar } from "magic-pill";
import { satellites } from "magic-pill/satellites"; // optional: only the apps that use it pay for it

<MagicPill pathname={pathname} satellites={satellites} linkComponent={Link}>
  <PillNavbar items={items} pathname={pathname} linkComponent={Link} />
</MagicPill>`}
          >
            <p>
              Give the host the current path, so an electron knows when you’re on its page, and the satellites. Without
              them, <code>pill().electron()</code> warns in development and shows nothing.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            head={["Electron option", "Notes"]}
            rows={[
              ["`label` / `value` / `valueText`", "Its name, a short live text, and what screen readers read for it"],
              ["`progress` / `icon` / `render`", "A ring (0 to 1), an icon, or your own content"],
              ["`href` / `onClick`", "Its page (default: the page it was started on), where a tap goes back; or what a tap does instead"],
              ["`hideOnOrigin`", "Tucked in on its page and the pages under it. Default `true`"],
              ["`ending`", "`\"join\"` (back into the pill) or `\"pop\"`. Default: the host's `electronEnding`"],
              ["`orbitals` / `backLabel`", "Its quick actions, and the label of the one going back with `orbitalsOpenOn=\"tap\"`"],
              ["`announce` / `variant` / `id`", "A milestone, said once; its colour; the same id updates it"],
            ]}
          />
          <Reference
            head={["Host prop", "Default"]}
            rows={[
              ["`satellites` / `pathname`", "none: from `magic-pill/satellites`, and the current path"],
              ["`electronSide` / `electronLine`", "`\"after\"` (or `\"before\"`, `\"beside\"`) / `\"along\"` (or `\"across\"`)"],
              ["`arrange`", "`\"gather\"` (or `\"spread\"`)"],
              ["`keepElectronsOut` / `electronEnding`", "`false` / `\"join\"`"],
              ["`orbitalsOpenOn`", "`\"press-hover\"` (or `\"press\"`, `\"tap\"`)"],
              ["`orbitalLabels` / `orbitalsStayOpen`", "`true` / `true`"],
              ["`actionsStyle` / `actionsSide` / `actionsOrientation`", "`\"detached\"` / `\"start\"` / `\"auto\"`"],
              ["`actionsLabel`", "`\"Page actions\"`"],
            ]}
          />
          <Reference
            head={["Token", "Default"]}
            rows={[
              ["`--mp-duration-split` / `--mp-duration-join`", "The enter and exit durations"],
              ["`--mp-ease-split`", "`bouncy` (or `pop`, `smooth`, any easing)"],
              ["`--mp-goo` / `--mp-electron-start`", "`12` (`0`: no neck) / `1`"],
              ["`--mp-electron-gap`", "`--mp-gap`"],
              ["`--mp-orbital-size` / `--mp-orbital-distance` / `--mp-orbital-spread`", "an action's size / `0.875rem` / `auto`"],
              ["`--mp-orbital-stagger` / `--mp-hover-delay` / `--mp-long-press`", "`30ms` / `300ms` / `450ms`"],
              ["`--mp-progress-size` / `--mp-progress-width`", "`3.375rem` / `3.5`"],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/electron/" />
    </>
  );
}
