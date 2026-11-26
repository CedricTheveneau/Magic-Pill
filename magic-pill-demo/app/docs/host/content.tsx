"use client";
import {
  CheckIcon,
  CloseIcon,
  HelpIcon,
  InfoIcon,
  MailIcon,
  PillAction,
  PillActions,
  PillDivider,
  PillIcon,
  PillMessage,
  pill,
  usePillQueue,
} from "magic-pill";

import { HeartIcon, SkipIcon } from "../../icons";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

function threeInARow() {
  pill().notify({ variant: "success", icon: <CheckIcon />, message: "Saved!", duration: 2500 });
  pill().notify({ icon: <MailIcon />, message: "Camille replied to your message about the order you placed last week.", duration: 3500 });
  pill().notify({ variant: "danger", icon: <CloseIcon />, message: "Your session expires in 2 minutes.", duration: 3000 });
}

/** What the base layer shows instead of the navbar in the scene examples. */
function Player() {
  return (
    <>
      <PillIcon>
        <HeartIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>Now playing: Clair de lune</PillMessage>
      <PillActions>
        <PillAction icon={<SkipIcon />} label="Next song" onClick={() => {}} />
      </PillActions>
    </>
  );
}

/** The main pill's queue, read live with usePillQueue. */
function QueueReadout() {
  const { current, queued } = usePillQueue("main");
  const text = (input: unknown) => {
    const message = (input as { message?: unknown }).message;
    return typeof message === "string" ? message : "(your own content)";
  };
  return (
    <dl className="readout">
      <div>
        <dt>Showing</dt>
        <dd>{current ? text(current.input) : "nothing: the base layer"}</dd>
      </div>
      <div>
        <dt>Waiting</dt>
        <dd>{queued.length === 0 ? "none" : queued.map((item) => text(item.input)).join(" · ")}</dd>
      </div>
    </dl>
  );
}

export function Content() {
  return (
    <>
      <DocsHeader title="The host">
        <p>
          <code>&lt;MagicPill&gt;</code> is a pill plus its queue: <code>pill(name)</code> sends it notifications. What you
          put inside is its <strong>base layer</strong>, shown whenever no notification is. It takes every{" "}
          <code>&lt;Pill&gt;</code> prop but <code>presence</code>.
        </p>
      </DocsHeader>

      <DocsSection id="base-layer" title="The base layer">
        <div className="docs-examples">
          <Example
            title="A navbar"
            code={`// app/app-pill.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagicPill, PillNavbar } from "magic-pill";

export function AppPill() {
  return (
    <MagicPill linkComponent={Link}>
      <PillNavbar items={items} pathname={usePathname()} linkComponent={Link} />
    </MagicPill>
  );
}`}
            notify={{ icon: <InfoIcon />, message: "The navbar comes back after me." }}
          >
            <p>This site’s own pill. Notifications take it over, then hand it back.</p>
          </Example>
          <Example
            title="No base layer"
            code={`<MagicPill />`}
            stage={{ content: null }}
            notify={{ icon: <InfoIcon />, message: "Then I go, and so does the pill.", duration: 3000 }}
          >
            <p>The pill hides between notifications.</p>
          </Example>
          <Example
            title="A resting circle"
            code={`<MagicPill idle="rest" idleIcon={<HelpIcon />} />`}
            stage={{ content: null, pill: { idle: "rest", idleIcon: <HelpIcon />, "aria-label": "Assistant" } }}
            notify={{ icon: <HelpIcon />, message: "Need a hand? I’ll rest in a circle after this.", duration: 3000 }}
          >
            <p>
              With no base layer and nothing queued, <code>idle=&quot;rest&quot;</code> keeps a small circle showing{" "}
              <code>idleIcon</code>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="scenes" title="Scenes and swapping">
        <div className="docs-examples">
          <Example
            title="A new scene"
            code={`<MagicPill scene={playing ? "player" : "navbar"}>
  {playing ? <Player /> : <PillNavbar items={items} />}
</MagicPill>`}
            stage={{ content: <Player /> }}
          >
            <p>
              When the base layer changes altogether, name it: the pill closes to a circle on the old content and opens on
              the new one, instead of jumping. Every “Try it” of these pages does that.
            </p>
          </Example>
          <Example
            title="Sliding scenes"
            code={`<MagicPill scene={playing ? "player" : "navbar"} swap="always">
  {playing ? <Player /> : <PillNavbar items={items} />}
</MagicPill>`}
            stage={{ content: <Player />, pill: { swap: "always" } }}
          >
            <p>
              With <code>swap=&quot;always&quot;</code>, the new content slides in instead: out through the top, in from the
              bottom.
            </p>
          </Example>
          <Example
            title={`swap="always"`}
            code={`<MagicPill swap="always">…</MagicPill>`}
            stage={{ pill: { swap: "always" } }}
            notify={threeInARow}
          >
            <p>Notifications slide in over the navbar too, not only into each other.</p>
          </Example>
          <Example title={`swap="never"`} code={`<MagicPill swap="never">…</MagicPill>`} stage={{ pill: { swap: "never" } }} notify={threeInARow}>
            <p>Each notification closes to a circle, and the next grows back from it.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="defaults" title="Defaults for its notifications">
        <div className="docs-examples">
          <Example
            title="A shorter time"
            code={`<MagicPill duration={1500}>…</MagicPill>`}
            stage={{ pill: { duration: 1500 } }}
            notify={{ icon: <InfoIcon />, message: "Gone in a second and a half." }}
          >
            <p>
              <code>duration</code> and <code>variant</code> are the defaults of the notifications that don’t set their own.
            </p>
          </Example>
          <Example
            title="Classes for its parts"
            code={`<MagicPill classNames={{ message: "my-message", action: "my-action" }} />`}
          >
            <p>
              <code>classNames</code> reaches the notification’s parts: <code>icon</code>, <code>divider</code>,{" "}
              <code>message</code>, <code>actions</code>, <code>action</code>, <code>panel</code>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="headless" title="Headless">
        <div className="docs-examples">
          <Example
            title="usePillQueue"
            preview={<QueueReadout />}
            notify={threeInARow}
            tryLabel="Notify 3 in a row"
            code={`const { current, queued } = usePillQueue("main");`}
          >
            <p>Build your own display on the same store. This one reads the main pill’s queue, live.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="server-components" title="React Server Components">
        <Notes>
          <ul>
            <li>
              The parts, <code>PillAction</code>, <code>PillNotification</code>, the icons and <code>pill()</code> have no{" "}
              <code>&quot;use client&quot;</code>. A Server Component can render them (and pass{" "}
              <code>linkComponent=&#123;Link&#125;</code>) without shipping them to the browser.
            </li>
            <li>
              <code>Pill</code>, <code>MagicPill</code>, <code>PillPanel</code>, <code>PillPanelTrigger</code>,{" "}
              <code>PillNavbar</code>, <code>PillOptics</code>, the fields, <code>PillForm</code>, <code>PillSubmit</code>,{" "}
              <code>PillFormPanel</code>, <code>usePill</code> and <code>usePillQueue</code> are for the client. You can still
              render them from a Server Component.
            </li>
            <li>
              Call <code>pill()</code> from client code: event handlers, effects, client-side stores.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            head={["Prop", "Default", "Notes"]}
            rows={[
              ["`name`", "`\"main\"`", "Which `pill(name)` controls it. Mount one host per name."],
              ["`children`", "none", "The base layer: shown whenever no notification is. Without it, the pill hides between notifications."],
              ["`scene`", "none", "A name for what the base layer shows: when it changes, the pill goes from one to the other (through the circle, or sliding with `swap=\"always\"`)."],
              ["`duration`", "`5000`", "Default display time for notifications."],
              ["`idle`", "`\"hidden\"`", "With no base layer and nothing queued: `\"hidden\"`, or `\"rest\"` for a small resting circle showing `idleIcon`."],
              ["`idleIcon`", "none", "The icon of the resting circle."],
              ["`swap`", "`\"queue\"`", "Where new content slides into the open pill: `\"queue\"` between notifications, `\"always\"` also between the base layer and notifications, `\"never\"` nowhere."],
              ["`linkComponent`", "`<a>`", "Renders notification actions that have an `href`, e.g. Next's `Link`."],
              ["`classNames`", "none", "Classes for the notification's parts: `icon`, `divider`, `message`, `actions`, `action`, `panel`."],
              ["`placement`", "`\"bottom\"`", "See the pill's placements."],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/host/" />
    </>
  );
}
