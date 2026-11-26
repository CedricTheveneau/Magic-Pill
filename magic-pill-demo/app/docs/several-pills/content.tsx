"use client";
import { useState } from "react";
import {
  BoxIcon,
  CheckIcon,
  CloseIcon,
  HelpIcon,
  InfoIcon,
  MagicPill,
  MailIcon,
  Pill,
  PillAction,
  PillActions,
  PillMessage,
  UndoIcon,
  pill,
} from "magic-pill";

import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks } from "../_components/text";

/** Pills added at the bottom of the screen: they line up above this site's pill. */
function Ladder() {
  const [pills, setPills] = useState<{ id: number; hidden: boolean }[]>([]);
  const [next, setNext] = useState(1);
  const [ladder, setLadder] = useState(true);

  const add = () => {
    setPills((list) => [...list, { id: next, hidden: false }]);
    setNext((n) => n + 1);
  };
  const toggle = (id: number) => setPills((list) => list.map((item) => (item.id === id ? { ...item, hidden: !item.hidden } : item)));
  const remove = (id: number) => setPills((list) => list.filter((item) => item.id !== id));

  return (
    <div className="controls">
      <div className="button-row">
        <button type="button" className="button button-dark" onClick={add} disabled={pills.length >= 3}>
          Add a pill at the bottom
        </button>
        <button type="button" className="button button-outline" onClick={() => setLadder((on) => !on)} aria-pressed={!ladder}>
          {ladder ? "Leave them out of the ladder" : "Put them back in the ladder"}
        </button>
      </div>
      {pills.length > 0 && (
        <ul className="ladder-list">
          {pills.map((item) => (
            <li key={item.id}>
              <span>Pill {item.id}</span>
              <button type="button" className="button button-outline" onClick={() => toggle(item.id)}>
                {item.hidden ? "Show" : "Hide"}
              </button>
              <button type="button" className="button button-outline" onClick={() => remove(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {pills.map((item) => (
        <Pill
          key={item.id}
          placement="bottom"
          ladder={ladder}
          presence={item.hidden ? "hidden" : "compact"}
          role="group"
          aria-label={`Pill ${item.id}`}
        >
          <PillMessage>Pill {item.id}</PillMessage>
          <PillActions>
            <PillAction icon={<CloseIcon />} label="Remove" onClick={() => remove(item.id)} />
          </PillActions>
        </Pill>
      ))}
    </div>
  );
}

export function Content() {
  return (
    <>
      {/* A second host, in the top corner, under the help pill when it's there */}
      <MagicPill name="assistant" placement="top-end" idle="rest" idleIcon={<HelpIcon />} aria-label="Assistant" />

      <DocsHeader title="Several pills">
        <p>
          Use as many pills as you need: a navbar, a sidebar, an assistant, a modal. Give each host a <code>name</code>, and
          target it with <code>pill(name)</code>. This page has four: the docs’ pill on the left, this site’s at the bottom,
          the help pill and a resting assistant at the top.
        </p>
      </DocsHeader>

      <DocsSection id="named" title="Named hosts">
        <div className="docs-examples">
          <Example
            title="The sidebar"
            notify={() => pill("docs").notify({ icon: <InfoIcon />, message: "3 new pages", duration: 3000 })}
            code={`<MagicPill name="docs" placement="left">
  <PillNavbar items={sections} pathname={pathname} linkComponent={Link} />
</MagicPill>

pill("docs").notify({ icon: <InfoIcon />, message: "3 new pages" });`}
          >
            <p>The docs’ pill is a host too: its navbar makes way for the notification, then comes back.</p>
          </Example>
          <Example
            title="An assistant"
            notify={() =>
              pill("assistant").notify({
                icon: <HelpIcon />,
                message: "Need a hand?",
                action: { icon: <MailIcon />, label: "Write to us", href: "mailto:hello@example.com" },
              })
            }
            code={`<MagicPill name="assistant" placement="top-end" idle="rest" idleIcon={<HelpIcon />} />

pill("assistant").notify({ icon: <HelpIcon />, message: "Need a hand?", action: { … } });`}
          >
            <p>A discreet resting circle in the top corner until it has something to say. Scroll to the top to see it line up under the help pill.</p>
          </Example>
          <Example
            title="Both at once"
            notify={() => {
              pill().notify({ icon: <BoxIcon />, message: "Your order has shipped", duration: 4000 });
              pill("docs").notify({ icon: <InfoIcon />, message: "Updated", duration: 4000 });
              pill("assistant").notify({ icon: <HelpIcon />, message: "Track it from here", duration: 4000 });
            }}
            code={`pill().notify({ icon: <BoxIcon />, message: "Your order has shipped" });
pill("docs").notify({ icon: <InfoIcon />, message: "Updated" });
pill("assistant").notify({ icon: <HelpIcon />, message: "Track it from here" });`}
          >
            <p>Each host has its own queue.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="sidebar-notifications" title="Notifications in a sidebar">
        <div className="docs-examples">
          <Example
            title="In one row"
            notify={() =>
              pill("docs").notify({ icon: <InfoIcon />, message: "3 new pages in the docs", duration: 4000 })
            }
            code={`<MagicPill name="docs" placement="left">…</MagicPill> {/* notificationLayout="pill", the default */}

pill("docs").notify({ icon: <InfoIcon />, message: "3 new pages in the docs" });`}
          >
            <p>The sidebar turns horizontal while it’s a circle, shows the notification as a pill, and turns back.</p>
          </Example>
          <Example
            title="In rows"
            notify={() =>
              pill("docs").notify({
                layout: "rows",
                variant: "success",
                icon: <CheckIcon />,
                message: "Your changes are saved and shared with the team.",
                action: { icon: <UndoIcon />, label: "Undo", onClick: () => {}, expanded: true },
                panel: { title: "Details", content: <p>Saved at 18:42. The previous version stays in the history.</p>, trigger: { label: "Details", expanded: true } },
                duration: 6000,
              })
            }
            code={`pill("docs").notify({
  layout: "rows",
  variant: "success",
  icon: <CheckIcon />,
  message: "Your changes are saved and shared with the team.",
  action: { icon: <UndoIcon />, label: "Undo", onClick: restore },
  panel: { title: "Details", content: … },
});`}
          >
            <p>The actions go under the message. With <code>swap=&quot;always&quot;</code>, the sidebar slides into it, turning as it goes.</p>
          </Example>
          <Example
            title="A card"
            notify={() =>
              pill("docs").notify({
                layout: "card",
                icon: <MailIcon />,
                message: "Léa replied to your comment on Forms",
                action: { icon: <MailIcon />, label: "Reply", onClick: () => {} },
                duration: 6000,
              })
            }
            code={`pill("docs").notify({
  layout: "card",
  icon: <MailIcon />,
  message: "Léa replied to your comment on Forms",
  action: { icon: <MailIcon />, label: "Reply", onClick: openThread },
});`}
          >
            <p>
              The sidebar keeps its column: the icon on top, the message, the actions full width. As wide as the sidebar, at
              least <code>--mp-card-width</code>.
            </p>
          </Example>
          <Example
            title="A flag"
            notify={() =>
              pill("docs").notify({
                layout: "flag",
                at: "/docs/several-pills/",
                icon: <InfoIcon />,
                message: "This page has a new section",
                duration: 5000,
              })
            }
            code={`pill("docs").notify({
  layout: "flag",
  at: "/docs/several-pills/", // the navbar item it's about
  icon: <InfoIcon />,
  message: "This page has a new section",
});`}
          >
            <p>
              The sidebar stays, usable, and the notification comes out of its edge, next to its section. Its motion will
              follow the Electron’s once it’s designed.
            </p>
          </Example>
        </div>
        <Notes>
          <ul>
            <li>
              <code>notificationLayout</code> on the host sets it for all its notifications; <code>layout</code> on one wins.
            </li>
            <li>Cards and flags are a sidebar’s: on a horizontal host, they show in one row. A flag needs a base layer to come out of.</li>
            <li>A flag pauses while it’s pointed at or focused; the next one slides in it, and moves to its own section.</li>
          </ul>
        </Notes>
      </DocsSection>

      <DocsSection id="ladder" title="Pills in the same spot">
        <div className="docs-examples">
          <Example
            title="The ladder"
            preview={<Ladder />}
            wide
            code={`<MagicPill />                         {/* first: keeps its spot */}
<Pill placement="bottom">…</Pill>     {/* lines up above it */}
<Pill placement="bottom" ladder={false}>…</Pill> {/* stays in its spot, and the others ignore it */}`}
          >
            <p>
              Pills with the same fixed <code>placement</code> make room for each other. The first one set up keeps its
              spot, and the next ones line up after it: below it at the top of the screen, above it at the bottom, further in
              from the edge on the <code>left</code> and <code>right</code>, each with its own <code>--mp-gap</code>.
            </p>
          </Example>
        </div>
        <Notes>
          <ul>
            <li>When a pill hides or unmounts, the ones after it take its place. A hidden pill keeps its turn, and takes its spot back when it shows again; one that unmounts comes back last.</li>
            <li>An open panel covers the other pills instead of pushing them.</li>
            <li>The order is the one the pills mount in. For a layout’s pill to stay ahead of its pages’ pills, render it before them.</li>
            <li>
              <code>ladder=&#123;false&#125;</code> leaves a pill out: it stays in its spot and the others ignore it.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/several-pills/" />
    </>
  );
}
