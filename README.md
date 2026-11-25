# Magic Pill
Let it empower you.

> **9.0.0 is the first stable release of Magic Pill**; earlier versions are deprecated. Upgrading from 8.x? Read the [migration guide](./MIGRATING.md). 8.x is documented in the [8.1.0 README](https://github.com/CedricTheveneau/Magic-Pill/tree/v8.1.0#readme).

**[Try it on the live demo](https://cedrictheveneau.github.io/Magic-Pill/)**: the playground, the templates and the building blocks.

#### Thank you !!
Thank you for your patience and to all people who already have shown interest in Magic Pill, it's my very first npm package and I couldn't ask for a better reception of my package after only a few days after its initial release.

## Badges
![npm version](https://img.shields.io/npm/v/magic-pill?color=blue)
![npm downloads](https://img.shields.io/npm/dt/magic-pill?color=green)
[![DeepScan grade](https://deepscan.io/api/teams/23515/projects/28307/branches/911491/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=23515&pid=28307&bid=911491)
[![Known Vulnerabilities](https://snyk.io/test/github/CedricTheveneau/Magic-Pill/badge.svg)](https://snyk.io/test/github/CedricTheveneau/Magic-Pill)
[![install size](https://img.shields.io/npm/unpacked-size/magic-pill?label=install%20size)](https://packagephobia.com/result?p=magic-pill@latest)

## Introduction
Magic Pill is **a design primitive, not just a notification library.** At its core is *the pill*: a dark, fully rounded, elevated container with a strong design language, and you can put anything inside it.

On top of it come ready-made **templates** (a notification, a navbar) and a **controller** you can call from anywhere: `pill().notify(...)`. Use one pill as a discreet assistant at the bottom of the page, or several pills together (a sidebar, a navbar, a modal) to build a whole interface.

## Features
 - [X] Two lines to get started: mount `<MagicPill />`, then call `pill().notify(...)` from anywhere, even outside React
 - [X] A notification queue on top of a **base layer** (e.g. a navbar): notifications take the pill over, then hand it back
 - [X] Several named pills on one page, at any edge or corner, inline, or as a modal; pills that share a spot line up instead of overlapping
 - [X] Anything inside: messages, icons and panels are React content; build your own templates from the same parts
 - [X] Shape-changing animations (circle ↔ pill ↔ panel) at the pill's real size, notifications that slide into each other, a pill that travels when its placement changes, all respecting reduced motion
 - [X] Accessible: screen reader announcements, keyboard focus pauses the countdown, focus handling for panels and modals
 - [X] Works in any React 18+ app, including React Server Components (Next.js App Router), with any router
 - [X] Styles you can override without `!important`, design tokens, no fonts loaded behind your back
 - [X] Tiny: the quick start adds about **12.6 kB gzipped** to your app (9.5 kB of JavaScript + 3.1 kB of CSS, minified by your bundler), checked in CI. Unused parts are tree-shaken.
 - [X] Written in TypeScript, zero runtime dependencies

## Installation
```bash
npm install magic-pill
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
| `action` | `{ icon?, label, onClick }` or `{ icon?, label, href }`, plus `expanded?` | The round button. Its label shows on hover and focus, or all the time with `expanded: true` (phones don't hover). Clicking it dismisses the notification; call `event.preventDefault()` in `onClick` to keep it open. |
| `panel` | `{ title?, titleAction?, content, footer?, trigger?, closeLabel?, closeExpanded? }` | A "Learn more" action that grows the pill into a panel. `trigger` defaults to `{ icon: <PlusIcon />, label: "Learn more" }` and takes `expanded` too, `closeLabel` to `"Close"`: like the other labels, it shows on hover and focus, or all the time with `closeExpanded`. `titleAction` and `footer`: see [the panel](#the-primitive). |
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
| `swap` | `"queue"` | Where new content slides into the open pill (out through the top, in from the bottom, the other way round for a top pill) instead of closing it to a circle and growing back: `"queue"` between notifications, `"always"` also between the base layer and notifications, `"never"` nowhere. |
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
- **Items can be actions**, or open a panel of the same pill: `{ onClick, label, icon }` and `{ panel: "settings", label, icon }`, with `expanded: true` to always show their label. The panels sit next to the navbar:

```tsx
<MagicPill>
  <PillNavbar
    items={[
      { href: "/", label: "Home", icon: <BoxIcon /> },
      { onClick: skipSession, label: "Skip session", icon: <ArrowIcon />, expanded: true },
      { panel: "settings", label: "Timer settings", icon: <InfoIcon /> },
    ]}
  />
  <PillPanel name="settings" title="Timer settings">…</PillPanel>
</MagicPill>
```

- **The active link** shows its label and gets `aria-current="page"`.
- **Without `pathname`**, the navbar reads `window.location.pathname` after mounting and on back/forward navigation. That misses client-side navigations, so pass `pathname` when you use a client-side router.
- **On a narrow screen**, when there's no room for the current page's label and the one you point at (or focus), the current one folds meanwhile. A label that still has no room ends with an ellipsis.
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
| `placement` | `"inline"` (in the page flow), `"top"`, `"bottom"`, `"left"`, `"right"`, `"top-start"`, `"top-end"`, `"bottom-start"`, `"bottom-end"` (fixed; `start`/`end` follow the text direction), `"overlay"` (a modal `<dialog>`). Change it and the pill travels to its new place (e.g. with the scroll, or for a guided tour), except to or from `"overlay"`. | `"inline"` |
| `presence` / `defaultPresence` / `onPresenceChange` | `"hidden"`, `"rest"` (a circle with the icon only), `"compact"`, `"expanded"` (every action label shown), `"panel"` | `"compact"` |
| `closeOnBackdropClick` | `boolean`, for the `"overlay"` placement: a click outside the modal does what Escape does (closes its panel if it's open, the modal otherwise). Call `event.preventDefault()` in your `onClick` to keep it open | `false` |
| `backdrop` | `"plain"`, `"glow"`, or any string, for the `"overlay"` placement: what's behind the modal (see below) | `"plain"` |
| `ladder` | `boolean`, for the fixed placements: pills with the same placement line up like the rungs of a ladder (see below). `false` leaves this one out: it stays in its spot and the others ignore it | `true` |
| `orientation` | `"horizontal"`, `"vertical"` | `"vertical"` for `left`/`right` |
| `variant` | `"neutral"`, `"success"`, `"danger"`, or any string (see [Styling](#styling)) | `"neutral"` |
| `theme` | `"plain"`, `"glass"`, `"liquid"`, or any string (see [Themes](#themes)). The variant picks the colour, the theme the material | `"plain"` |
| `unstyled` | `boolean`: keep the behaviour, drop the look | `false` |

Any other prop (`className`, `aria-label`, `ref`…) goes to the element.

**The parts:**
- `PillIcon`: the leading icon. Decorative unless you give it a `label`.
- `PillDivider`: the thin line after the icon.
- `PillMessage`: the message, in the italic serif.
- `PillActions` and `PillAction`: round buttons. `label` is required: it's the accessible name, and it shows on hover, on focus, with `expanded`, or at the `expanded` level. A `PillAction` is a `<button>` with `onClick`, or a link with `href` (through `linkComponent` if you pass one).
- `PillPanel` and `PillPanelTrigger`: content shown at the `panel` level, and the action that opens it. The panel takes the focus when it opens, closes on Escape or with its close button (`closeLabel`, `closeIcon`, and `closeExpanded` to always show the label), and gives the focus back to the trigger. `titleAction` goes at the end of the title's row and `footer` before the close button, which is then quieter (an outline, `--mp-close`). **Several panels in one pill:** give each a `name`, and its trigger the same `panel`.

**Pills in the same spot:** pills with the same fixed `placement` make room for each other, `<MagicPill>` hosts included. The first one set up keeps its spot, and the next ones line up after it: below it at the top of the screen, above it at the bottom, further in from the edge on the `left` and `right`. Each one keeps its own `--mp-gap` from the one before it.
- When a pill hides or unmounts, the ones after it take its place. A hidden pill keeps its turn, and takes its spot back when it shows again; one that unmounts comes back last.
- An open panel covers the other pills instead of pushing them.
- The order is the one the pills mount in. For a layout's pill to stay ahead of its pages' pills, render it before them.

**A modal:** `placement="overlay"` renders a native modal `<dialog>`, which brings a focus trap, Escape and an inert page with it. It pops in and scales out like any other pill, while its backdrop fades in and out: the dialog closes, and gives the focus back, once the exit has played. Add `closeOnBackdropClick` to also close it with a click outside (off by default, so a confirmation isn't dismissed by accident).
```tsx
<Pill placement="overlay" variant="danger" presence={open ? "compact" : "hidden"} onPresenceChange={(p) => setOpen(p !== "hidden")}>
  <PillMessage>Delete this item?</PillMessage>
  <PillActions>
    <PillAction icon={<CheckIcon />} label="Delete" expanded onClick={confirmDelete} />
    <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => setOpen(false)} />
  </PillActions>
</Pill>
```

Its backdrop is `--mp-backdrop`: a colour, or any CSS background. `--mp-backdrop-blur: 10px` also blurs the page. `backdrop="glow"` adds two soft lights drifting over them: import `magic-pill/themes.css`, and set `--mp-glow-1`, `--mp-glow-2` (their colours) and `--mp-glow-duration` (a full turn, `14s`). They stand still with reduced motion. Any other string is written to `data-backdrop`, for a backdrop of your own: `[data-mp="pill"][data-backdrop="dots"]::backdrop { … }`.

### Your own templates
Templates are plain arrangements of the parts, so yours work the same way. `usePill()` gives a part access to its pill (`presence`, `setPresence`, `openPanel(name?)`, `closePanel()`, `placement`, `orientation`, `variant`). Inside a `<MagicPill>`, the `render` option puts your arrangement in the queue:

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
- `Pill`, `MagicPill`, `PillPanel`, `PillPanelTrigger`, `PillNavbar`, `PillOptics`, `usePill` and `usePillQueue` are Client Components. You can still render them from a Server Component.
- Call `pill()` from client code: event handlers, effects, client-side stores.

### Headless: `usePillQueue`
To build your own display on the same store: `const { current, queued } = usePillQueue("main");`.

## Icons
Twelve built-in icons, drawn in `currentColor` and decorative by default (`aria-hidden`). Any other icon or SVG works too: icons are just React content.

`ArrowIcon` · `BoxIcon` · `CheckIcon` · `CloseIcon` · `CouponIcon` · `DocumentIcon` · `HelpIcon` · `InfoIcon` · `MailIcon` · `PhoneIcon` · `PlusIcon` · `UndoIcon`

## Styling
- **Easy to override:** every rule sits in a `magic-pill` cascade layer. Any CSS of yours that isn't in a layer wins, whatever its specificity, with no `!important`.
- **No collisions:** parts are selected by `data-mp` attributes (`[data-mp="pill"]`, `"icon"`, `"divider"`, `"message"`, `"actions"`, `"action"`, `"action-body"`, `"action-icon"`, `"label"`, `"panel"`, `"panel-head"`, `"panel-title"`, `"panel-title-action"`, `"panel-body"`, `"panel-footer"`, `"navbar"`), and states by `data-presence`, `data-placement`, `data-orientation`, `data-variant`, `data-theme`, `data-backdrop` and `data-scheme`. There are no class names of ours to clash with yours.
- **Classes:** every part takes a `className`; templates and `<MagicPill>` take `classNames`.
- **Global resets are safe:** an action's look lives on its inner `[data-mp="action-body"]`, so app-wide rules such as `a { color: inherit }` or `button { background: none }` don't break it. To restyle an action, target `[data-mp="action-body"]`.
- **Tailwind CSS v4:** declare the layer order once, before your imports, so utilities win: `@layer theme, base, magic-pill, components, utilities;`.
- **Your own variants:** `variant="brand"` gives `data-variant="brand"`, so you can write `[data-variant="brand"] { --mp-surface: #4b2bd6; }` (and `--mp-on-surface`, `--mp-action`… for its text and actions).

**Tokens:** set them on `:root`, on one pill, or anywhere in between. The text and action colours can be set for every pill at once, or for one variant:

```css
:root {
  --mp-surface: #fffaf0; --mp-on-neutral: #2b2118;                          /* a light neutral pill, with dark text… */
  --mp-neutral-action: #2b2118; --mp-on-neutral-action: #fffaf0;            /* …and dark actions: success and danger stay as they are */
  --mp-danger-action: #ffd7db; --mp-on-danger-action: #7a1420;              /* pink actions on danger pills */
}
```

| Token | Default |
|---|---|
| `--mp-surface` / `--mp-on-surface` | `#141414` / `#f9f9f9` |
| `--mp-action` / `--mp-on-action` | `#f9f9f9` / `#141414` |
| `--mp-on-neutral` / `--mp-on-success` / `--mp-on-danger` | `--mp-on-surface`: the text of one variant |
| `--mp-neutral-action` / `--mp-success-action` / `--mp-danger-action` | `--mp-action`: the actions of one variant |
| `--mp-on-neutral-action` / `--mp-on-success-action` / `--mp-on-danger-action` | `--mp-on-action`: the text of one variant's actions |
| `--mp-action-rim` | `transparent`: a thin outline on the actions |
| `--mp-action-current` / `--mp-on-action-current` | the action's own colours: the action with `aria-current` (a navbar's current page) |
| `--mp-accent` / `--mp-on-accent` | the pill's text / its surface: what stands out, such as a panel's `titleAction` |
| `--mp-close` / `--mp-on-close` / `--mp-close-rim` | `transparent` / the pill's text / the same at 48%: the close button next to a panel's `footer` |
| `--mp-success` / `--mp-danger` | `#3f7253` / `#c2303e` |
| `--mp-font-text` / `--mp-font-accent` | `inherit` (see [Fonts](#fonts)) |
| `--mp-text-size` / `--mp-title-size` | fluid, about 1rem / 1.5–2rem |
| `--mp-padding` / `--mp-gap` / `--mp-action-size` | `0.875rem` / `1rem` / `2.75rem` |
| `--mp-max-width` / `--mp-message-width` / `--mp-panel-width` | `48rem` / `24rem` / `32rem` |
| `--mp-radius-panel` / `--mp-shadow` | `2.5rem` / a soft drop shadow |
| `--mp-offset` / `--mp-z-index` | `1.5rem` from the viewport edges (plus safe areas) / `50` |
| `--mp-backdrop` / `--mp-backdrop-blur` | the overlay's backdrop: `rgb(20 20 20 / 0.4)` / no blur |
| `--mp-duration-enter` / `--mp-duration-change` / `--mp-duration-exit` | `500ms` / `250ms` / `300ms` |
| `--mp-scale-origin` | `center`: where the pill pops in from and scales out to (e.g. `bottom` to come out of the edge) |
| `--mp-align` | How a vertical pill lines up its items: `start`, `center` or `end` (following the text direction). By default, along the screen edge for a `left` or `right` pill, centred otherwise |

The pill fits small screens: sizes are in `rem`, fixed pills stay inside the viewport and its safe areas, and long panels scroll.

**Sidebars:** a `left` or `right` pill lines its items up along the screen edge, and on the right-hand side its labels open towards the middle of the screen, so the icons stay in line (mirrored in right-to-left pages). Set `--mp-align` to change the alignment.

**Shape and motion:** the pill animates its real size whenever its presence changes (a script measures it; with `unstyled` or reduced motion it doesn't). Its corners are half the one-line pill's height, so a taller pill, such as a wrapped message, is a rounded rectangle; a panel's corners are `--mp-radius-panel`.

### Themes
A theme is the pill's material. `glass` (frosted glass) and `liquid` (clearer, thicker Liquid Glass) come in a second stylesheet, so plain pills don't load them. Import it once, before or after `styles.css`:

```tsx
import "magic-pill/styles.css";
import "magic-pill/themes.css";

<MagicPill theme="glass" />
```

Set these tokens like the others, on `:root`, on one pill, or anywhere in between. Booleans are `1` and `0`.

| Token | What it does | `glass` | `liquid` |
|---|---|---|---|
| `--mp-tint` | How much of the surface's colour stays, from 0 (clear) to 1 (solid) | `0.35` | `0.18` |
| `--mp-status-tint` | The least a `success` or `danger` pill keeps, so it still reads as one | `0.75` | `0.75` |
| `--mp-frost` | The blur of what's behind | `14px` | `3px` |
| `--mp-panel-frost` | The least blur behind an open panel (more text, more frosting); `0px` for none | `12px` | `12px` |
| `--mp-rays` | Ray casting: `0` turns refraction, the light and the tinting (vibrancy, adaptive) off | `1` | `1` |
| `--mp-light` | The strength of the light on the edges, 0 to 1 | `0.7` | `0.7` |
| `--mp-light-angle` / `--mp-light-color` | Where the light comes from, and its colour | `235deg` (top left) / `#fff` | same |
| `--mp-vibrancy` | How much the page's colours glow through (`1` is off) | `1.9` | `1.9` |
| `--mp-refraction` | With `<PillOptics>`: how much the edge bends what's behind, 0 to 1 | `0.16` | `0.55` |
| `--mp-edge` / `--mp-fringe` | With `<PillOptics>`: how wide that edge is, and how much it splits colours, 0 to 1 | `10px` / `0` | `22px` / `0.15` |
| `--mp-action-glass` | `1` makes the actions little lenses of the same glass: the light on their edges, and with `<PillOptics>`, their own refraction and frosting | `0` | `0` |
| `--mp-light-follow` | With `<PillOptics>`: `1` has the light follow the pointer | `0` | `0` |
| `--mp-adaptive` | With `<PillOptics>`: `1` tints the pill after the page behind it, and turns a neutral pill light over light pages | `0` | `0` |
| `--mp-adaptive-surface` / `--mp-adaptive-on-surface` | The colours of that light pill | `#f9f9f9` / `#141414` | same |
| `--mp-readable` | Keeps the text readable over any page: see below | `1` | `1` |

- **Readable by default:** a veil, worked out in CSS from the surface's colour and tint, keeps Magic Pill's colours at 4.5:1 or more over any page. `--mp-readable: 0` turns it off; the contrast is then yours to check, as it is for your own `--mp-action` colours.
- **Actions** are see-through on `glass` and `liquid`, solid on the others. Any action works on any theme:

```css
/* Solid actions on glass */
.my-pill { --mp-action: #f4c542; --mp-on-action: #141414; }

/* See-through actions on a plain pill, with less white on the status colours to keep 4.5:1 */
.my-pill { --mp-action: rgb(249 249 249 / 0.12); --mp-on-action: #f9f9f9; --mp-action-rim: rgb(249 249 249 / 0.2); }
.my-pill:is([data-variant="success"], [data-variant="danger"]) { --mp-action: rgb(249 249 249 / 0.06); }
```

- **Your own theme:** any other name. With colours only, `themes.css` isn't needed. With `--mp-tint` below 1, it's built on the same glass:

```css
[data-mp="pill"][data-theme="paper"] {
  --mp-tint: 0.8; --mp-frost: 24px; --mp-light: 0;
  --mp-surface: #fffaf0;
  --mp-on-neutral: #2b2118; /* --mp-on-surface would also darken the text of success and danger */
}
```

- **Refraction and adaptive tinting** need a script: render `<PillOptics />` once, anywhere, e.g. in your root layout. It has no props: each pill's tokens decide, and it costs nothing to the pills that don't use it.

```tsx
import { MagicPill, PillOptics } from "magic-pill";

<MagicPill theme="liquid" style={{ "--mp-adaptive": 1 } as React.CSSProperties} />
<PillOptics />
```

  - **Refraction** is drawn by Chromium browsers (Chrome, Edge, Arc, Dia…) that use the GPU. Safari and Firefox show the same glass without the bending. A Content Security Policy needs `img-src data:` for it.
  - **Adaptive** reads colours, gradients, images, videos and canvases behind the pill. It can't read `url()` backgrounds, pictures from other sites (without CORS), or elements that ignore the pointer. It writes `data-scheme="light"` or `"dark"` on the pill. Status pills keep their colours.
  - **Cost:** the graphics card does the work. With three Liquid Glass pills on a MacBook Pro (M2 Pro, 1440 × 900 at 2x), a frame takes about 1.1 ms, 1.4 ms with `--mp-action-glass: 1`. The colour fringe is most of it: with `--mp-fringe: 0`, 0.5 ms, glass actions included.
  - Glass actions aren't refracted in an open panel, nor with reduced motion (pills fade then, which hides the page from them).
  - The light doesn't follow a finger, nor anything with reduced motion.
- **Where the glass can't be drawn** (a browser without relative colours or `pow()` in CSS, less transparency, more contrast, forced colours), the pill has its plain look.

## Accessibility
- **Announcements:** each `<MagicPill>` has a polite live region that reads notifications out (or your `announce` text). A hidden pill leaves the accessibility tree.
- **Time to act:** the countdown pauses while a mouse hovers the pill, on keyboard focus, and while a panel is open. A tap doesn't pause it.
- **Panels and modals:** they take and give back the focus, and close on Escape. The overlay is a native modal `<dialog>`.
- **Accessible names:** every action has one (`label` is required), and icons are hidden from assistive technology.
- **Motion and contrast:** with `prefers-reduced-motion`, shape changes become short fades. In forced-colours mode, the shapes keep visible outlines. The glass [themes](#themes) keep text at 4.5:1 or more by default, and become solid when the system asks for less transparency or more contrast.

## Security
- **No HTML strings:** contents are React nodes and never parsed as HTML, so text from your users can't inject markup.
- **Safe links:** links only render relative, `http(s):`, `mailto:` and `tel:` URLs. Anything else, such as `javascript:`, renders without a link (with a warning in development). React 18 doesn't block those URLs by itself.

## TypeScript
Everything is typed. The main types are `NotifyOptions`, `NotifyInput`, `PillController`, `MagicPillProps`, `PillProps`, `PillPresence`, `PillPlacement`, `PillVariant`, `PillTheme`, `NavItem` and `LinkComponent`.

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
npm run size        # What an app ships, against the size budget (after a build)
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
| A documentation site with live examples | Custom icons (any React content) |
| Themes (glass, custom) | Animated morphing between contents, panels and placements |
| Forms, toolbox and carousel indicator templates | Transitions between the navbar and notifications |
| More built-in icons | Function triggers on actions (`onClick`) |
| | Responsive styles, full documentation, tests |
