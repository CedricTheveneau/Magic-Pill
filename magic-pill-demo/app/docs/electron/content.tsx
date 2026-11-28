"use client";
import { useEffect } from "react";
import { pill, type PillActionItem } from "magic-pill";

import { ChecksIcon, FormIcon, PlusIcon, SearchIcon } from "../../icons";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";
import { startFocus, startUpload } from "./activities";

const PAGE_ACTIONS: PillActionItem[] = [
  { icon: <FormIcon />, label: "Write" },
  { icon: <ChecksIcon />, label: "Mark all as read" },
];
const MORE_ACTIONS: PillActionItem[] = [...PAGE_ACTIONS, { icon: <PlusIcon />, label: "New note" }, { icon: <SearchIcon />, label: "Search" }];

/** Tries a setting of the host with the focus timer running, so there's an electron to see it on. */
const withTimer = () => startFocus();

export function Content() {
  // The page's actions are this page's: they go when you leave it
  useEffect(() => () => pill().setActions(null), []);

  return (
    <>
      <DocsHeader title="The Electron">
        <p>
          <span className="beta-tag">Beta</span> A small round pill that splits out of the main one to keep a background
          activity in reach while you go elsewhere in the app: a timer, a call, an upload. It’s tucked into the pill on the
          page that started it, and comes out anywhere else; a tap goes back. Long-press it (or hover it with a mouse) for
          its quick actions, the orbitals.
        </p>
        <p className="hint">
          It ships in <code>9.4.0-next</code> releases, and may still change. Try it here, then go to another page: this
          site’s pill has the satellites.
        </p>
      </DocsHeader>

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
  href: "/docs/electron/", // where a tap goes back (default: here)
});
pill().updateElectron(id, { value: "24:59", progress: 1 / 1500 }); // every second
pill().endElectron(id); // it goes back into the pill`}
          >
            <p>
              Start it, then go to another page: it splits out of the pill, its ring filling as the time goes. Tap it to
              come back here, where it tucks in.
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
  ending: "pop", // done: it scales out instead of going back in
});`}
          >
            <p>
              Two electrons line up along the pill (or stack across it). On a phone, short of room, the navbar folds its
              labels, then the last one goes above the pill.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="orbitals" title="Orbitals">
        <div className="docs-examples">
          <Example
            title="Long press, slide, release"
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
              Long-press the electron, keep pressing, slide to one and release to run it. With a mouse, hovering opens
              them too. The keyboard: the arrow pointing away from the edge, then the arrows. They stay open after an action
              (Pause becomes Resume).
            </p>
          </Example>
          <Example
            title="Opened with a tap"
            notify={withTimer}
            stage={{ pill: { orbitalsOpenOn: "tap" } }}
            code={`<MagicPill orbitalsOpenOn="tap" …>`}
          >
            <p>A tap opens them instead of going back, with a first orbital that goes back.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="where" title="Where they go">
        <div className="docs-examples">
          <Example title="Beside the pill" notify={withTimer} stage={{ pill: { electronSide: "beside" } }} code={`<MagicPill electronSide="beside" …>`}>
            <p>One row towards the page, at the pill’s end. Or <code>&quot;before&quot;</code> the pill.</p>
          </Example>
          <Example title="Spread to the edges" notify={withTimer} stage={{ pill: { arrange: "spread" } }} code={`<MagicPill arrange="spread" …>`}>
            <p>The pill stays where it is, the electron goes to the screen’s edge: under the thumb on a tablet.</p>
          </Example>
          <Example
            title="Out during notifications"
            notify={() => {
              startFocus();
              pill().notify({ message: "The electron stayed out", variant: "success", duration: 4000 });
            }}
            stage={{ pill: { keepElectronsOut: true } }}
            code={`<MagicPill keepElectronsOut …>`}
          >
            <p>By default it tucks in while a notification has the pill, and comes back once the pill is open again.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="actions" title="The page’s actions">
        <div className="docs-examples">
          <Example
            title="Detached"
            notify={() => pill().setActions(PAGE_ACTIONS)}
            tryLabel="Show this page’s actions"
            code={`import { usePillActions } from "magic-pill/satellites";

usePillActions([
  { icon: <PenIcon />, label: "Write", onClick: compose },
  { icon: <ChecksIcon />, label: "Mark all as read", onClick: readAll },
]); // in a page: they go with it`}
          >
            <p>
              The design’s wide atom: a pill of its own, on the start side, that comes out of the host. Short of room, it
              turns across, then goes above the pill.
            </p>
          </Example>
          <Example
            title="In the pill, after a divider"
            notify={() => pill().setActions(PAGE_ACTIONS)}
            stage={{ pill: { actionsStyle: "inside" } }}
            code={`<MagicPill actionsStyle="inside" …>`}
          >
            <p>The original design: before the navbar, past a divider. After it with <code>actionsSide=&quot;end&quot;</code>.</p>
          </Example>
          <Example
            title="Vertical, on the end side"
            notify={() => pill().setActions(MORE_ACTIONS)}
            stage={{ pill: { actionsOrientation: "vertical", actionsSide: "end" } }}
            code={`<MagicPill actionsOrientation="vertical" actionsSide="end" …>`}
          >
            <p>Taking one spot along the pill instead of four.</p>
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
              ["`href` / `onClick`", "Where a tap goes back (default: the page it was started on), or what it does instead"],
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
