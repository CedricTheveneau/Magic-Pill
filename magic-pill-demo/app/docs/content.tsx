"use client";
import Link from "next/link";
import { CheckIcon } from "magic-pill";

import { Code } from "./_components/code";
import { Example, NotificationPreview } from "./_components/example";
import { SECTIONS } from "./_components/sections";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "./_components/text";

const SAVED = { icon: <CheckIcon />, message: "Saved!", variant: "success" } as const;

export function Content() {
  return (
    <>
      <DocsHeader title="Getting started">
        <p>
          Magic Pill is <strong>a design primitive, not just a notification library.</strong> At its core is the pill: a
          dark, fully rounded, elevated container with a strong design language, and you can put anything inside it.
        </p>
        <p>
          On top of it come ready-made templates (a notification, a navbar, forms) and a controller you can call from
          anywhere: <code>pill().notify(…)</code>. Every example of these pages has a <strong>Try it</strong> button: it
          plays the example in the pill at the bottom of the screen, the one that holds this site’s navbar.
        </p>
      </DocsHeader>

      <DocsSection id="install" title="Install">
        <Notes>
          <Code language="bash" label="Install">{`npm install magic-pill`}</Code>
          <ul>
            <li>
              <strong>React and React DOM 18 or later</strong> (peer dependencies).
            </li>
            <li>
              <strong>Next.js is optional</strong>: Magic Pill works in any React app (Vite, React Router, Remix…).
            </li>
            <li>
              <strong>TypeScript is optional</strong>: the type definitions ship with the package.
            </li>
            <li>Browsers from 2023 onwards (the stylesheet uses CSS nesting and cascade layers).</li>
            <li>
              Published for bundlers, as ES modules and CommonJS. There’s no build for a plain <code>&lt;script&gt;</code>{" "}
              tag yet.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <DocsSection id="quick-start" title="Quick start">
        <div className="docs-examples">
          <Example
            title="1. Mount the pill once"
            code={`// app/layout.tsx (Next.js App Router: this can stay a Server Component)
import "magic-pill/styles.css";
import { MagicPill } from "magic-pill";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MagicPill />
      </body>
    </html>
  );
}`}
          >
            <p>Import the stylesheet, and put a host in your root layout.</p>
          </Example>
          <Example
            title="2. Notify from anywhere"
            preview={<NotificationPreview options={SAVED} />}
            notify={SAVED}
            code={`import { pill, CheckIcon } from "magic-pill";

pill().notify({ icon: <CheckIcon />, message: "Saved!", variant: "success" });`}
          >
            <p>
              From an event handler, a store, a fetch callback… The pill pops in at the bottom of the page, stays for 5
              seconds, then goes away. Here, it takes the navbar’s place for a while, then hands it back.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="fonts" title="Fonts">
        <div className="docs-examples">
          <Example
            title="With next/font"
            code={`// app/layout.tsx
import { Lexend, Overlock } from "next/font/google";

const overlock = Overlock({ subsets: ["latin"], style: "italic", weight: ["400", "700", "900"], variable: "--mp-font-text" });
const lexend = Lexend({ subsets: ["latin"], weight: "700", variable: "--mp-font-accent" });

// <html lang="en" className={\`\${overlock.variable} \${lexend.variable}\`}>`}
          >
            <p>
              Magic Pill loads no fonts: it uses your page’s. For the signature look, an italic serif for messages
              (Overlock) and a bold sans for labels (Lexend), point the two font tokens at them. <code>variable</code> sets
              them directly.
            </p>
          </Example>
          <Example
            title="Without Next.js"
            language="css"
            code={`:root {
  --mp-font-text: "Overlock", serif;
  --mp-font-accent: "Lexend", sans-serif;
}`}
          >
            <p>Load the fonts however you like (self-hosted is best for privacy), then set the tokens.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="stylesheets" title="Stylesheets">
        <Notes>
          <p>One stylesheet is needed, the others are optional, so apps only load what they use. Import them in any order.</p>
          <Reference
            head={["Import", "For"]}
            rows={[
              ["`magic-pill/styles.css`", "Every pill: always."],
              ["`magic-pill/themes.css`", "The `glass` and `liquid` themes, and the modal's `glow` backdrop."],
              ["`magic-pill/forms.css`", "The fields: `PillForm`, `PillFormPanel`, `PillInput`…"],
              ["`magic-pill/calendar.css`", "`PillDate`'s calendar, with `forms.css`."],
            ]}
          />
        </Notes>
      </DocsSection>

      <DocsSection id="good-to-know" title="Good to know">
        <Notes>
          <h3>Accessibility</h3>
          <ul>
            <li>Each host has a polite live region that reads notifications out (or your <code>announce</code> text).</li>
            <li>The countdown pauses while a mouse hovers the pill, on keyboard focus, and while a panel is open.</li>
            <li>Panels and modals take and give back the focus, and close on Escape. The overlay is a native modal <code>&lt;dialog&gt;</code>.</li>
            <li>Every action has an accessible name (<code>label</code> is required), and icons are hidden from assistive technology.</li>
            <li>With reduced motion, shape changes become short fades. Glass themes keep text at 4.5:1 or more by default.</li>
          </ul>
          <h3>Security</h3>
          <ul>
            <li>Contents are React nodes, never parsed as HTML: text from your users can’t inject markup.</li>
            <li>
              Links only render relative, <code>http(s):</code>, <code>mailto:</code> and <code>tel:</code> URLs. Anything
              else, such as <code>javascript:</code>, renders without a link.
            </li>
          </ul>
          <h3>TypeScript</h3>
          <p>
            Everything is typed. The main types are <code>NotifyOptions</code>, <code>NotifyInput</code>,{" "}
            <code>PillController</code>, <code>MagicPillProps</code>, <code>PillProps</code>, <code>PillPresence</code>,{" "}
            <code>PillPlacement</code>, <code>PillVariant</code>, <code>PillTheme</code>, <code>NavItem</code> and{" "}
            <code>LinkComponent</code>.
          </p>
        </Notes>
      </DocsSection>

      <DocsSection id="sections" title="Everything else">
        <div className="section-grid">
          {SECTIONS.slice(1).map((section) => (
            <Link key={section.href} href={section.href} className="card section-card">
              {section.icon}
              <strong>{section.label}</strong>
              <span className="hint">{section.summary}</span>
            </Link>
          ))}
        </div>
      </DocsSection>

      <PageLinks href="/docs/" />
    </>
  );
}
