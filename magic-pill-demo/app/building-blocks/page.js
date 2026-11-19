// A Server Component: the toolbox below is rendered on the server, with Next's
// Link passed as linkComponent, and ships no Magic Pill code of its own.
import Link from "next/link";
import { BoxIcon, DocumentIcon, MailIcon, Pill, PillAction, PillActions, PhoneIcon } from "magic-pill";

import { AssistantExample, CallExample, ModalExample, SidebarExample } from "./examples";

export const metadata = { title: "Building blocks" };

function Example({ title, children, code, note }) {
  return (
    <article className="card example">
      <h3>{title}</h3>
      {note && <p className="hint">{note}</p>}
      <div className="specimen">{children}</div>
      <pre className="code">
        <code>{code}</code>
      </pre>
    </article>
  );
}

export default function BuildingBlocksPage() {
  return (
    <main className="page">
      <header className="card section-header">
        <h1>Building blocks</h1>
        <p>
          Everything is made of <code>&lt;Pill&gt;</code> and its parts. Put anything inside, place it anywhere, and use
          as many as you need.
        </p>
      </header>
      <div className="gallery">
        <Example
          title="Toolbox"
          note="Only actions. Rendered by a Server Component."
          code={`<Pill aria-label="Contact us">
  <PillActions>
    <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
    <PillAction icon={<MailIcon />} label="Send an email" href="mailto:…" />
    <PillAction icon={<DocumentIcon />} label="Ask for a quotation"
      href="/templates/" linkComponent={Link} />
  </PillActions>
</Pill>`}
        >
          <Pill aria-label="Contact us">
            <PillActions>
              <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
              <PillAction icon={<MailIcon />} label="Send an email" href="mailto:hello@example.com" />
              <PillAction icon={<DocumentIcon />} label="Ask for a quotation" href="/templates/" linkComponent={Link} />
              <PillAction icon={<BoxIcon />} label="Track my order" href="/" linkComponent={Link} />
            </PillActions>
          </Pill>
        </Example>

        <Example
          title="Modal"
          note={'placement="overlay" is a native modal <dialog>: focus trap, Escape, inert page.'}
          code={`<Pill placement="overlay" variant="danger"
  presence={open ? "compact" : "hidden"}
  onPresenceChange={(p) => setOpen(p !== "hidden")}>
  <PillMessage>Delete this item?</PillMessage>
  <PillActions>…</PillActions>
</Pill>`}
        >
          <ModalExample />
        </Example>

        <Example
          title="Your own template"
          note="render puts your own arrangement in the queue, with the same timing and animation."
          code={`pill().notify({
  duration: Infinity,
  render: ({ dismiss }) => (
    <>
      <PillIcon><PhoneIcon /></PillIcon>
      <PillDivider />
      <PillMessage>Alex is calling</PillMessage>
      <PillActions>…</PillActions>
    </>
  ),
});`}
        >
          <CallExample />
        </Example>

        <Example
          title="Several pills"
          note="A second named host rests as a circle in the corner of this page until it has something to say."
          code={`<MagicPill name="assistant" placement="bottom-end"
  idle="rest" idleIcon={<HelpIcon />} />

pill("assistant").notify({ message: "Need a hand?" });`}
        >
          <AssistantExample />
        </Example>

        <Example
          title="Vertical"
          note={'Sidebars: orientation="vertical" (the default for placement="left" and "right").'}
          code={`<Pill orientation="vertical">
  <PillActions>…</PillActions>
</Pill>`}
        >
          <SidebarExample />
        </Example>
      </div>
    </main>
  );
}
