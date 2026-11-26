"use client";
import { useState } from "react";
import { BoxIcon, CheckIcon, DocumentIcon, MailIcon, Pill, PillPanel, pill, type NavItem } from "magic-pill";

import { ChipGroup } from "../../controls";
import { GearIcon, SkipIcon, UserIcon } from "../../icons";
import { DemoNavbar } from "../_components/demo-navbar";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const LINKS: NavItem[] = [
  { href: "/", label: "Home", icon: <BoxIcon /> },
  { href: "/blog/", label: "Blog", icon: <DocumentIcon /> },
  { href: "/contact/", label: "Contact", icon: <MailIcon /> },
];

const skip = () => pill().notify({ icon: <SkipIcon />, message: "Session skipped: time for a break.", duration: 2500 });

const MIXED: NavItem[] = [
  { href: "/", label: "Timer", icon: <BoxIcon /> },
  { onClick: skip, label: "Skip session", icon: <SkipIcon />, expanded: true },
  { panel: "settings", label: "Timer settings", icon: <GearIcon /> },
];

const PATHS = ["/", "/blog/", "/blog/my-post/", "/blogroll/", "/contact/"].map((value) => ({ value, label: value }));

function Settings() {
  return (
    <PillPanel name="settings" title="Timer settings">
      <p>Sessions last 25 minutes, pauses 5. A panel holds anything: see the forms for real settings.</p>
    </PillPanel>
  );
}

function Mixed() {
  return (
    <DemoNavbar items={MIXED} pathname="/" label="Pomodoro">
      <Settings />
    </DemoNavbar>
  );
}

function Matching() {
  const [pathname, setPathname] = useState("/blog/my-post/");
  return (
    <div className="controls">
      <Pill role="group" aria-label="Matching example">
        <DemoNavbar items={[...LINKS, { href: "/blogroll/", label: "Blogroll", icon: <UserIcon /> }]} pathname={pathname} />
      </Pill>
      <ChipGroup legend="The current path" name="matching-path" options={PATHS} value={pathname} onChange={setPathname} />
    </div>
  );
}

export function Content() {
  return (
    <>
      <DocsHeader title="Navbar">
        <p>
          <code>&lt;PillNavbar&gt;</code> is a <code>&lt;nav&gt;</code> of icon links, actions and panel triggers. The current
          page shows its label, the others on hover and focus. Put it in a <code>&lt;Pill&gt;</code>, or as the base layer
          of a host, like the two navbars of this page.
        </p>
      </DocsHeader>

      <DocsSection id="links" title="Links">
        <div className="docs-examples">
          <Example
            title="Pages"
            preview={
              <Pill role="group" aria-label="Navbar example">
                <DemoNavbar items={LINKS} pathname="/" />
              </Pill>
            }
            stage={{ content: <DemoNavbar items={LINKS} pathname="/" /> }}
            code={`const items = [
  { href: "/", label: "Home", icon: <BoxIcon /> },
  { href: "/blog", label: "Blog", icon: <DocumentIcon /> },
  { href: "/contact", label: "Contact", icon: <MailIcon /> },
];

<MagicPill linkComponent={Link}>
  <PillNavbar items={items} pathname={usePathname()} linkComponent={Link} />
</MagicPill>`}
          >
            <p>
              It works with any router: give it the current <code>pathname</code> and your link component. These examples’
              links stay on this page.
            </p>
          </Example>
          <Example
            title="Matching"
            preview={<Matching />}
            code={`{ href: "/blog", label: "Blog", match: "exact" }
{ href: "/blog", label: "Blog", match: (pathname) => pathname.startsWith("/blog") }`}
          >
            <p>
              An item is active on its own path and below it, on whole segments: <code>/blog</code> is active on{" "}
              <code>/blog/my-post</code>, not on <code>/blogroll</code>. <code>/</code> is only active on <code>/</code>. The
              longest match wins. Override it with <code>match</code>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="actions" title="Actions and panels">
        <div className="docs-examples">
          <Example
            title="Links, an action and a panel"
            preview={
              <Pill role="group" aria-label="Pomodoro example">
                <Mixed />
              </Pill>
            }
            stage={{ content: <Mixed /> }}
            code={`<MagicPill>
  <PillNavbar
    items={[
      { href: "/", label: "Timer", icon: <BoxIcon /> },
      { onClick: skipSession, label: "Skip session", icon: <SkipIcon />, expanded: true },
      { panel: "settings", label: "Timer settings", icon: <GearIcon /> },
    ]}
  />
  <PillPanel name="settings" title="Timer settings">…</PillPanel>
</MagicPill>`}
          >
            <p>
              Items can be buttons (<code>onClick</code>) or open a panel of the same pill (<code>panel</code>), with{" "}
              <code>expanded: true</code> to always show their label. The panel replaces the navbar, and closes back to it.
            </p>
          </Example>
          <Example
            title="A notification over the navbar"
            notify={{ icon: <CheckIcon />, message: "Your session is over!", action: { icon: <SkipIcon />, label: "Start a break", onClick: () => {} } }}
            code={`pill().notify({
  icon: <CheckIcon />,
  message: "Your session is over!",
  action: { icon: <SkipIcon />, label: "Start a break", onClick: startBreak },
});`}
          >
            <p>As the base layer of a host, the navbar makes way for notifications, then comes back.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="routers" title="Routers">
        <div className="docs-examples">
          <Example
            title="React Router"
            code={`import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import type { LinkComponent } from "magic-pill";

export const RouterLink: LinkComponent = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function RouterLink({ href, ...props }, ref) {
    return <Link to={href} {...props} ref={ref} />;
  },
);

// <PillNavbar items={items} pathname={useLocation().pathname} linkComponent={RouterLink} />`}
          >
            <p>
              Its <code>Link</code> takes <code>to</code> instead of <code>href</code>: wrap it once.
            </p>
          </Example>
          <Example title="No router" code={`<PillNavbar items={items} />`}>
            <p>
              Without <code>pathname</code>, the navbar reads <code>window.location.pathname</code> after mounting and on
              back/forward navigation. That misses client-side navigations: pass <code>pathname</code> with a client-side
              router.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            caption="Items"
            head={["Item", "Shape", "Notes"]}
            rows={[
              ["A link", "`{ href, label, icon?, match? }`", "The current one shows its label and gets `aria-current=\"page\"`. `match`: `\"prefix\"` (default), `\"exact\"` or `(pathname) => boolean`."],
              ["An action", "`{ onClick, label, icon?, expanded? }`", "A button."],
              ["A panel", "`{ panel, label, icon?, expanded? }`", "Opens the `<PillPanel>` (or `<PillFormPanel>`) with that `name`, next to the navbar in the pill."],
            ]}
          />
          <Reference
            caption="Props"
            head={["Prop", "Notes"]}
            rows={[
              ["`items`", "The items, in order."],
              ["`pathname`", "The current path, e.g. Next's `usePathname()`."],
              ["`linkComponent`", "Renders the links, e.g. Next's `Link`."],
              ["`aria-label`", "Defaults to `\"Main\"`."],
            ]}
          />
          <h3>On a narrow screen</h3>
          <p>
            When there’s no room for the current page’s label and the one you point at (or focus), the current one folds
            meanwhile. A label that still has no room ends with an ellipsis.
          </p>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/navbar/" />
    </>
  );
}
