# Magic Pill
Let it empower you.

> **Status:** Magic Pill 9 is the first version with a **stable, documented API**. While it's in pre-release, install it with `npm install magic-pill@next`. The `latest` tag is still 8.1.0, documented in the [8.1.0 README](https://github.com/CedricTheveneau/Magic-Pill/tree/v8.1.0#readme). Coming from 8.x? Read the [migration guide](./MIGRATING.md).

#### Thank you !!
Thank you for your patience and to all people who already have shown interest in Magic Pill, it's my very first npm package and I couldn't ask for a better reception of my package after only a few days after its initial release.

## Badges
![npm version](https://img.shields.io/npm/v/magic-pill?color=blue)
![npm downloads](https://img.shields.io/npm/dt/magic-pill?color=green)
[![DeepScan grade](https://deepscan.io/api/teams/23515/projects/28307/branches/911491/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=23515&pid=28307&bid=911491)
[![Known Vulnerabilities](https://snyk.io/test/github/CedricTheveneau/Magic-Pill/badge.svg)](https://snyk.io/test/github/CedricTheveneau/Magic-Pill)
[![install size](https://packagephobia.com/badge?p=magic-pill@latest)](https://packagephobia.com/result?p=magic-pill@latest)

## Introduction
Magic Pill is **a design primitive, not just a notification library.** At its core is *the pill*: a dark, fully rounded, elevated container with a strong design language, and you can put anything inside it.

On top of it come ready-made **templates** (a notification, a navbar) and a **controller** you can call from anywhere: `pill().notify(...)`. Use one pill as a discreet assistant at the bottom of the page, or several pills together (a sidebar, a navbar, a modal) to build a whole interface.

## Features
 - [X] Two lines to get started: mount `<MagicPill />`, then call `pill().notify(...)` from anywhere, even outside React
 - [X] A notification queue on top of a **base layer** (e.g. a navbar): notifications take the pill over, then hand it back
 - [X] Several named pills on one page, at any edge or corner, inline, or as a modal
 - [X] Anything inside: messages, icons and panels are React content; build your own templates from the same parts
 - [X] Shape-changing animations (circle ↔ pill ↔ panel) that respect reduced motion
 - [X] Accessible: screen reader announcements, keyboard focus pauses the countdown, focus handling for panels and modals
 - [X] Works in any React 18+ app, including React Server Components (Next.js App Router), with any router
 - [X] Styles you can override without `!important`, design tokens, no fonts loaded behind your back
 - [X] Written in TypeScript, zero runtime dependencies

## Installation
```bash
npm install magic-pill@next
```

### Requirements
- **React and React DOM 18 or later** (peer dependencies).
- **Next.js is optional**: Magic Pill works in any React app (Vite, React Router, Remix…).
- **TypeScript is optional**: the type definitions ship with the package.
- Browsers from 2023 onwards (the stylesheet uses CSS nesting and cascade layers).

> **No CDN build:** Magic Pill is published for bundlers (Next.js, Vite, webpack…) as ES modules and CommonJS. It has no UMD build, so it can't be loaded with a plain `<script>` tag yet.

## Quick start
**1. Import the stylesheet and mount the pill once**, e.g. in your root layout:
```tsx
// app/layout.tsx (Next.js App Router: this can stay a Server Component)
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
}
```

**2. Notify from anywhere** in your client code: an event handler, a store, a fetch callback…
```tsx
import { pill, CheckIcon } from "magic-pill";

pill().notify({ icon: <CheckIcon />, message: "Saved!", variant: "success" });
```

That's it. The pill pops in at the bottom of the page, stays for 5 seconds, then goes away.

### Fonts
Magic Pill loads no fonts: it uses your page's fonts. For the signature look, an italic serif for messages (**Overlock**) and a bold sans for action labels (**Lexend**), point the two font tokens at them.

With `next/font`, the `variable` option sets the tokens directly:
```tsx
// app/layout.tsx
import { Lexend, Overlock } from "next/font/google";

const overlock = Overlock({ subsets: ["latin"], style: "italic", weight: ["400", "700", "900"], variable: "--mp-font-text" });
const lexend = Lexend({ subsets: ["latin"], weight: "700", variable: "--mp-font-accent" });

// <html lang="en" className={`${overlock.variable} ${lexend.variable}`}>
```

Without Next.js, load the fonts however you like (self-hosted is best for privacy), then set the tokens:
```css
:root {
  --mp-font-text: "Overlock", serif;
  --mp-font-accent: "Lexend", sans-serif;
}
```

## Notifications
```tsx
import { pill, CheckIcon, UndoIcon } from "magic-pill";

const id = pill().notify({
  variant: "success",
  icon: <CheckIcon />,
  message: "Item successfully removed from cart!",
  action: { icon: <UndoIcon />, label: "Undo", onClick: restoreItem },
  duration: 8000,
});
```

| Option | Type | Notes |
|---|---|---|
| `message` | `ReactNode` | Required (unless you use `render`). Any content, e.g. `<>Total: <strong>768.99$</strong></>`. Never parsed as HTML. |
| `icon` | `ReactNode` | The leading icon, followed by the divider. |
| `action` | `{ icon?, label, onClick }` or `{ icon?, label, href }` | The round button. Its label shows on hover and focus. Clicking it dismisses the notification; call `event.preventDefault()` in `onClick` to keep it open. |
| `panel` | `{ title?, content, trigger?, closeLabel? }` | A "Learn more" action that grows the pill into a panel. `trigger` defaults to `{ icon: <PlusIcon />, label: "Learn more" }`, `closeLabel` to `"Close"`. |
| `variant` | `"neutral"` · `"success"` · `"danger"` · any string | Defaults to the host's variant. |
| `duration` | `number` (ms) | Defaults to the host's (5000). `Infinity` keeps it until dismissed. |
| `id` | `string` | Notifying again with the same id updates the notification in place. |
| `announce` | `string` · `false` | What screen readers hear. Defaults to the message's text. |
| `onDismiss` | `(id, reason) => void` | `reason` is `"timeout"`, `"action"`, `"dismissed"` or `"cleared"`. |
| `render` | `({ id, dismiss }) => ReactNode` | Your own content instead of the template, with the same queue, timing and animation. See [Your own templates](#your-own-templates). |

**How it behaves:**
- Notifications queue up and show one at a time, first in, first out.
- The countdown starts once the pill is fully shown. It pauses while the pill is hovered, holds keyboard focus or has its panel open, or while the browser tab is hidden, and it starts again from the full duration afterwards.
- Calls made before `<MagicPill>` mounts are kept, and shown once it mounts.
- `pill()` is for client code. Called on the server, it does nothing (it warns in development), so visitors never see each other's notifications.

**The controller:**
```ts
const id = pill().notify({ message: "Saving…", duration: Infinity });
pill().update(id, { message: "Saved", variant: "success", duration: 3000 }); // in place, countdown restarts
pill().dismiss(id); // or pill().dismiss() for the visible one
pill().clear();     // empty the queue
```

**More examples**, the templates from the design:
```tsx
// A question: the action is an answer
pill().notify({ icon: <HelpIcon />, message: "Do you need some help?", action: { icon: <CheckIcon />, label: "Yes", onClick: openHelp } });

// Live data, and a link (rendered with your router's link component, see below)
pill().notify({
  icon: <InfoIcon />,
  message: <>Your current cart total is: <strong>{total}$</strong></>,
  action: { icon: <CheckIcon />, label: "Checkout", href: "/checkout" },
});

// A promotion that stays open while it works
pill().notify({
  icon: <CouponIcon />,
  message: "Interested in 10% off your next purchase?",
  action: {
    icon: <ArrowIcon />,
    label: "Activate the promo code",
    onClick: (event) => {
      event.preventDefault();
      activatePromo().then(() => pill().dismiss());
    },
  },
});

// An expandable panel
pill().notify({
  icon: <InfoIcon />,
  message: "Discover the powers Magic Pill gives you!",
  panel: { title: "Discover the powers Magic Pill gives you!", content: <p>Anything can go in a panel.</p> },
  duration: Infinity,
});
```

## The host: `<MagicPill>`
`<MagicPill>` is a pill plus its queue. It takes every [`<Pill>` prop](#the-primitive) except `presence`, and adds:

| Prop | Default | Notes |
|---|---|---|
| `name` | `"main"` | Which `pill(name)` controls it. Mount one host per name. |
| `children` | none | The **base layer**: shown whenever no notification is. Without it, the pill hides between notifications. |
| `duration` | `5000` | Default display time for notifications. |
| `idle` | `"hidden"` | With no base layer and nothing queued: `"hidden"`, or `"rest"` for a small resting circle showing `idleIcon`. |
| `idleIcon` | none | The icon of the resting circle. |
| `linkComponent` | `<a>` | Renders notification actions that have an `href`, e.g. Next's `Link`. |
| `classNames` | none | Classes for the notification's parts: `icon`, `divider`, `message`, `actions`, `action`, `panel`. |
| `placement` | `"bottom"` | See [placements](#the-primitive). |

### A navbar as the base layer
Notifications take the pill over, then it goes back to the navbar. The navbar works with any router: give it the current `pathname` and your link component.

```tsx
// app/app-pill.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagicPill, PillNavbar, BoxIcon, DocumentIcon, MailIcon } from "magic-pill";

const items = [
  { href: "/", label: "Home", icon: <BoxIcon /> },
  { href: "/blog", label: "Blog", icon: <DocumentIcon /> },
  { href: "/contact", label: "Contact", icon: <MailIcon /> },
];

export function AppPill() {
  return (
    <MagicPill linkComponent={Link}>
      <PillNavbar items={items} pathname={usePathname()} linkComponent={Link} />
    </MagicPill>
  );
}
```

- **Matching:** an item is active on its own path and below it, on whole segments: `/blog` is active on `/blog/my-post`, not on `/blogroll`. `/` is only active on `/`. When several items match, the longest `href` wins. Override with `match: "exact"` or `match: (pathname) => boolean`.
- **The active link** shows its label and gets `aria-current="page"`.
- **Without `pathname`**, the navbar reads `window.location.pathname` after mounting and on back/forward navigation. That misses client-side navigations, so pass `pathname` when you use a client-side router.
- **`aria-label`** defaults to `"Main"`.

**React Router:** its `Link` takes `to` instead of `href`. Wrap it once:
```tsx
import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import type { LinkComponent } from "magic-pill";

export const RouterLink: LinkComponent = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function RouterLink({ href, ...props }, ref) {
    return <Link to={href} {...props} ref={ref} />;
  },
);

// <PillNavbar items={items} pathname={useLocation().pathname} linkComponent={RouterLink} />
```

### Several pills
Give each host a name, and target it with `pill(name)`:
```tsx
<MagicPill name="sidebar" placement="left">
  <PillNavbar items={items} pathname={pathname} linkComponent={Link} />
</MagicPill>
<MagicPill name="assistant" placement="bottom-end" idle="rest" idleIcon={<HelpIcon />} />
```
```ts
pill("sidebar").notify({ message: "3 new posts" });
pill("assistant").notify({ icon: <HelpIcon />, message: "Need a hand?", duration: Infinity });
```

## The primitive
Everything above is built from `<Pill>` and its parts, and you can use them directly. A `<Pill>` you write yourself isn't connected to `pill()`: you control it with props.

```tsx
import { Pill, PillActions, PillAction, PhoneIcon, MailIcon, DocumentIcon } from "magic-pill";

// The toolbox from the design: only actions
<Pill placement="bottom" aria-label="Contact us">
  <PillActions>
    <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
    <PillAction icon={<MailIcon />} label="Send an email" href="mailto:hello@example.com" />
    <PillAction icon={<DocumentIcon />} label="Ask for a quotation" href="/quote" linkComponent={Link} />
  </PillActions>
</Pill>
```

| `<Pill>` prop | Values | Default |
|---|---|---|
| `placement` | `"inline"` (in the page flow), `"top"`, `"bottom"`, `"left"`, `"right"`, `"top-start"`, `"top-end"`, `"bottom-start"`, `"bottom-end"` (fixed; `start`/`end` follow the text direction), `"overlay"` (a modal `<dialog>`) | `"inline"` |
| `presence` / `defaultPresence` / `onPresenceChange` | `"hidden"`, `"rest"` (a circle with the icon only), `"compact"`, `"expanded"` (every action label shown), `"panel"` | `"compact"` |
| `orientation` | `"horizontal"`, `"vertical"` | `"vertical"` for `left`/`right` |
| `variant` | `"neutral"`, `"success"`, `"danger"`, or any string (see [Styling](#styling)) | `"neutral"` |
| `unstyled` | `boolean`: keep the behaviour, drop the look | `false` |

Any other prop (`className`, `aria-label`, `ref`…) goes to the element.

**The parts:**
- `PillIcon`: the leading icon. Decorative unless you give it a `label`.
- `PillDivider`: the thin line after the icon.
- `PillMessage`: the message, in the italic serif.
- `PillActions` and `PillAction`: round buttons. `label` is required: it's the accessible name, and it shows on hover, on focus, with `expanded`, or at the `expanded` level. A `PillAction` is a `<button>` with `onClick`, or a link with `href` (through `linkComponent` if you pass one).
- `PillPanel` and `PillPanelTrigger`: content shown at the `panel` level, and the action that opens it. The panel takes the focus when it opens, closes on Escape or with its close button, and gives the focus back to the trigger. One panel per pill.

**A modal:** `placement="overlay"` renders a native modal `<dialog>`, which brings a focus trap, Escape and an inert page with it.
```tsx
<Pill placement="overlay" variant="danger" presence={open ? "compact" : "hidden"} onPresenceChange={(p) => setOpen(p !== "hidden")}>
  <PillMessage>Delete this item?</PillMessage>
  <PillActions>
    <PillAction icon={<CheckIcon />} label="Delete" expanded onClick={confirmDelete} />
    <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => setOpen(false)} />
  </PillActions>
</Pill>
```

### Your own templates
Templates are plain arrangements of the parts, so yours work the same way. `usePill()` gives a part access to its pill (`presence`, `setPresence`, `placement`, `orientation`, `variant`). Inside a `<MagicPill>`, the `render` option puts your arrangement in the queue:

```tsx
pill().notify({
  announce: "Incoming call from Alex",
  duration: Infinity,
  render: ({ dismiss }) => (
    <>
      <PillIcon><PhoneIcon /></PillIcon>
      <PillDivider />
      <PillMessage>Alex is calling</PillMessage>
      <PillActions>
        <PillAction icon={<CheckIcon />} label="Answer" onClick={() => { answer(); dismiss(); }} />
        <PillAction icon={<CloseIcon />} label="Decline" onClick={dismiss} />
      </PillActions>
    </>
  ),
});
```

### React Server Components
- The parts, `PillAction`, `PillNotification`, the icons and `pill()` have no `"use client"`. A Server Component can render them (and pass `linkComponent={Link}`) without shipping them to the browser.
- `Pill`, `MagicPill`, `PillPanel`, `PillPanelTrigger`, `PillNavbar`, `usePill` and `usePillQueue` are Client Components. You can still render them from a Server Component.
- Call `pill()` from client code: event handlers, effects, client-side stores.

### Headless: `usePillQueue`
To build your own display on the same store: `const { current, queued } = usePillQueue("main");`.

## Icons
Twelve built-in icons, drawn in `currentColor` and decorative by default (`aria-hidden`). Any other icon or SVG works too: icons are just React content.

`ArrowIcon` · `BoxIcon` · `CheckIcon` · `CloseIcon` · `CouponIcon` · `DocumentIcon` · `HelpIcon` · `InfoIcon` · `MailIcon` · `PhoneIcon` · `PlusIcon` · `UndoIcon`

## Styling
- **Easy to override:** every rule sits in a `magic-pill` cascade layer. Any CSS of yours that isn't in a layer wins, whatever its specificity, with no `!important`.
- **No collisions:** parts are selected by `data-mp` attributes (`[data-mp="pill"]`, `"icon"`, `"divider"`, `"message"`, `"actions"`, `"action"`, `"action-icon"`, `"label"`, `"panel"`, `"panel-title"`, `"panel-body"`, `"panel-footer"`, `"navbar"`), and states by `data-presence`, `data-placement`, `data-orientation` and `data-variant`. There are no class names of ours to clash with yours.
- **Classes:** every part takes a `className`; templates and `<MagicPill>` take `classNames`.
- **Tailwind CSS v4:** declare the layer order once, before your imports, so utilities win: `@layer theme, base, magic-pill, components, utilities;`.
- **Your own variants:** `variant="brand"` gives `data-variant="brand"`, so you can write `[data-variant="brand"] { --mp-surface: #4b2bd6; }`.

**Tokens:** set them on `:root`, on one pill, or anywhere in between.

| Token | Default |
|---|---|
| `--mp-surface` / `--mp-on-surface` | `#141414` / `#f9f9f9` |
| `--mp-action` / `--mp-on-action` | `#f9f9f9` / `#141414` |
| `--mp-success` / `--mp-danger` | `#3f7253` / `#c2303e` |
| `--mp-font-text` / `--mp-font-accent` | `inherit` (see [Fonts](#fonts)) |
| `--mp-text-size` / `--mp-title-size` | fluid, about 1rem / 1.5–2rem |
| `--mp-padding` / `--mp-gap` / `--mp-action-size` | `0.875rem` / `1rem` / `2.75rem` |
| `--mp-max-width` / `--mp-message-width` / `--mp-panel-width` | `48rem` / `24rem` / `32rem` |
| `--mp-radius-panel` / `--mp-shadow` | `2.5rem` / a soft drop shadow |
| `--mp-offset` / `--mp-z-index` | `1.5rem` from the viewport edges (plus safe areas) / `50` |
| `--mp-backdrop` | the overlay's backdrop |
| `--mp-duration-enter` / `--mp-duration-change` / `--mp-duration-exit` | `500ms` / `250ms` / `300ms` |

The pill fits small screens: sizes are in `rem`, fixed pills stay inside the viewport and its safe areas, and long panels scroll.

## Accessibility
- **Announcements:** each `<MagicPill>` has a polite live region that reads notifications out (or your `announce` text). A hidden pill leaves the accessibility tree.
- **Time to act:** the countdown pauses on hover and keyboard focus, and while a panel is open.
- **Panels and modals:** they take and give back the focus, and close on Escape. The overlay is a native modal `<dialog>`.
- **Accessible names:** every action has one (`label` is required), and icons are hidden from assistive technology.
- **Motion and contrast:** with `prefers-reduced-motion`, shape changes become short fades. In forced-colours mode, the shapes keep visible outlines.

## Security
- **No HTML strings:** contents are React nodes and never parsed as HTML, so text from your users can't inject markup.
- **Safe links:** links only render relative, `http(s):`, `mailto:` and `tel:` URLs. Anything else, such as `javascript:`, renders without a link (with a warning in development). React 18 doesn't block those URLs by itself.

## TypeScript
Everything is typed. The main types are `NotifyOptions`, `NotifyInput`, `PillController`, `MagicPillProps`, `PillProps`, `PillPresence`, `PillPlacement`, `PillVariant`, `NavItem` and `LinkComponent`.

## Build your own
Maybe what I brought to the table wasn't enough but you like the idea behind it, that's why Magic Pill is under [MIT License](https://www.tldrlegal.com/license/mit-license), which means you can pretty much do whatever you want and build upon my own version of Magic Pill to bring it to new heights or just make it your own.

Here's how to proceed:
1. Clone the project:
```bash
git clone https://github.com/CedricTheveneau/Magic-Pill.git
```

2. Use the Node.js version from `.nvmrc` (Node 26) and install all dependencies:
```bash
nvm use
npm install
```

3. Check that everything works:
```bash
npm run typecheck   # TypeScript
npm test            # Vitest test suite
npm run build       # Builds dist/ with tsdown
```

4. You're good to go! For easier development, we recommend creating a Next.js app and creating a symbolic link between the app and the package. Now, when you're making changes to the code in src/, the changes should be reflected in your Next.js app.
```bash
# Create a new Next.js app
npx create-next-app@latest my-app --typescript

# Link the package (from the Magic-Pill directory)
npm link

# Link to your app (from your app directory)
npm link magic-pill
```

## Troubleshooting / Contact
Found a bug or something unclear? Please [open an issue](https://github.com/CedricTheveneau/Magic-Pill/issues).
You can also send me emails anytime at [theveneaucedricpro@gmail.com](mailto:theveneaucedricpro@gmail.com), I'll try my best to help you out.

## License
Magic Pill is distributed under the [MIT License](https://www.tldrlegal.com/license/mit-license).

## What's next?
| Coming next | Done in 9.0 |
|-----------|-----------|
| Toolbox and carousel indicator templates | Custom icons (any React content) |
| Animated morphing between contents | Transitions between the navbar and notifications |
| More built-in icons | Function triggers on actions (`onClick`) |
| A documentation site with live examples | Responsive styles, full documentation, tests |
