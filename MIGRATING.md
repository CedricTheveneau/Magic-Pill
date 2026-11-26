# Migrating from Magic Pill 8 to 9

Magic Pill 9 is the first version with a stable, documented API. It's a breaking release, but most apps get **shorter**: the Context, Provider and Initializer that 8.x asked you to write (about 135 lines) go away.

## Why it changed
In 8.x, your app owned the pill's state. You kept a `pillData` object in your own Context and changed it with 14 setters. The pill showed either a notification or a navbar, never both, and content was a fixed list of icon names, strings and raw HTML.

In 9, the package owns its state, and the API has three layers:
1. **A primitive**, `<Pill>`, with parts (`PillIcon`, `PillMessage`, `PillAction`…) that take any React content.
2. **Templates** made of those parts: `PillNotification` and `PillNavbar`.
3. **A host and a controller**: mount `<MagicPill />` once, then call `pill().notify(...)` from anywhere. Notifications queue on top of a **base layer** (your navbar) instead of replacing it.

## 1. Replace your Context with `<MagicPill />`
**Delete** the files the 8.x README had you create (`magicPillContext.tsx`, `magicPillInitializer.tsx`), the `<MagicPillProvider>` wrapper, and the `useMagicPill()` calls. Then mount the host once:

```tsx
// app/layout.tsx
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

`MagicPill` keeps its name, but it no longer takes `pillData`. TypeScript flags every old call site.

## 2. Notifications
Where you used to set the notification mode, call `pill().notify()`:

```tsx
// 8.x
setPillData({
  mode: "notification",
  notification: {
    icon: "checkmark",
    message: "Order confirmed",
    cta: { icon: "arrow", label: "Track", link: "/orders" },
  },
});

// 9
import { pill, CheckIcon, ArrowIcon } from "magic-pill";

pill().notify({
  icon: <CheckIcon />,
  message: "Order confirmed",
  action: { icon: <ArrowIcon />, label: "Track", href: "/orders" },
});
```

| 8.x | 9 |
|---|---|
| `notification.icon: "checkmark"` | `icon: <CheckIcon />` (any React content) |
| `notification.message: string` | `message: ReactNode` |
| `cta: { icon, label, link }` | `action: { icon, label, href }` |
| (no callbacks) | `action: { icon, label, onClick }` |
| `cta` + `info: { title, content, closeLabel }` | `panel: { trigger: { icon, label }, title, content, closeLabel }` |
| `info.content` (an HTML string) | `panel.content` (React content) |
| `updateNotificationMessage(…)`, `updateCTALabel(…)`… | `pill().update(id, { message: … })`, or `notify` again with the same `id` |
| a fixed 5 s | `duration` per notification, or on `<MagicPill duration>` |

**The expandable info panel:**
```tsx
// 8.x
notification: {
  icon: "info",
  message: "Discover the powers Magic Pill gives you!",
  cta: { icon: "plus", label: "Learn more" },
  info: { title: "Discover", content: "<p>Magic Pill gives you <b>powers</b>.</p>", closeLabel: "Close" },
}

// 9
pill().notify({
  icon: <InfoIcon />,
  message: "Discover the powers Magic Pill gives you!",
  panel: {
    title: "Discover",
    content: <p>Magic Pill gives you <b>powers</b>.</p>,
    // trigger and closeLabel default to "+ Learn more" and "Close"
  },
});
```

> **HTML strings are gone.** If you have HTML you **trust** (never anything from your users), render it yourself: `content: <div dangerouslySetInnerHTML={{ __html: trustedHtml }} />`.

**What behaves differently:**
- **Every notification shows.** In 8.x, a notification only animated in again when its content changed. In 9, each `notify()` call is queued and shown in turn.
- **The animation is shorter and shape-based:** the pill pops in as a circle, then grows (about 0.75 s, against 2.5 s in 8.x). The 5 s countdown starts once the pill is fully shown.
- **Actions dismiss** the notification when clicked. Call `event.preventDefault()` in `onClick` to keep it open.
- **Pauses:** as in 8.1, hover and keyboard focus pause the countdown. An open panel and a hidden browser tab now pause it too.

## 3. Navbar
The navbar is now the host's **base layer**: it stays mounted, notifications take the pill over, and then it comes back. Switching `mode` doesn't clear your items any more.

```tsx
// 8.x
setPillData({
  mode: "navbar",
  navbar: { navItems: [{ icon: "arrow", label: "Home", link: "/" }, { icon: "mail", label: "Contact", link: "/contact" }] },
});

// 9: a client component, rendered once (e.g. from your layout)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagicPill, PillNavbar, ArrowIcon, MailIcon } from "magic-pill";

const items = [
  { icon: <ArrowIcon />, label: "Home", href: "/" },
  { icon: <MailIcon />, label: "Contact", href: "/contact" },
];

export function AppPill() {
  return (
    <MagicPill linkComponent={Link}>
      <PillNavbar items={items} pathname={usePathname()} linkComponent={Link} />
    </MagicPill>
  );
}
```

| 8.x | 9 |
|---|---|
| `navItems: [{ icon, label?, link }]` | `items: [{ icon, label, href, match? }]`. **`label` is now required**: it's the link's accessible name. |
| `addNavItem`, `deleteNavItem`, `updateNavItem*` | Change the `items` array (your own React state) |
| `handleActiveNavItem` + `window.location`, matched by label | `pathname` prop + `match`, matched by `href` |
| Plain `<a>` (full page reloads in Next.js) | `linkComponent={Link}` |

The active item also changes: an item is active on its own path and below, on whole segments. In 8.x, a `/` item was active everywhere, and `/blog` matched `/blogroll`.

## 4. Icons
Icons are components now, and any React content works as an icon.

> **The built-in icons below are deprecated since 9.3** (they still work, and go in the next major version): you can also pass your own icons right away, any SVG, image or icon component ([README, "Icons"](./README.md#icons)). The table is the quickest way off 8.x.

| 8.x name | 9 component |
|---|---|
| `info` | `InfoIcon` |
| `checkmark` | `CheckIcon` |
| `questionmark` | `HelpIcon` |
| `coupon` | `CouponIcon` |
| `arrow` | `ArrowIcon` |
| `box` | `BoxIcon` |
| `cross` | `CloseIcon` |
| `mail` | `MailIcon` |
| `plus` | `PlusIcon` |
| `quotation` | `DocumentIcon` |
| `tel` | `PhoneIcon` |
| `undo` | `UndoIcon` |
| `""` (no icon) | leave `icon` out |

`Icons`, `CTAIcons` and `getIconComponent` are removed.

## 5. Styling
**The stylesheet:** `import "magic-pill/styles.css"`. The 8.x paths (`magic-pill/magicpill.css`, `magic-pill/dist/magicpill.css`) still work and serve the new stylesheet.

**Fonts are no longer loaded for you.** 8.x imported Lexend and Overlock from Google Fonts. That sent your visitors' IP addresses to Google, and Turbopack dropped the import anyway. 9 uses your page's fonts. To keep the 8.x look, set the font tokens, e.g. with `next/font`:

```tsx
import { Lexend, Overlock } from "next/font/google";

const overlock = Overlock({ subsets: ["latin"], style: "italic", weight: ["400", "700", "900"], variable: "--mp-font-text" });
const lexend = Lexend({ subsets: ["latin"], weight: "700", variable: "--mp-font-accent" });
// <html className={`${overlock.variable} ${lexend.variable}`}>
```

**Tokens:**

| 8.x | 9 |
|---|---|
| `--mp__themeDark` | `--mp-surface` (the pill) and `--mp-on-action` (text on buttons) |
| `--mp__themeLight` | `--mp-on-surface` (text on the pill) and `--mp-action` (buttons) |
| `--mp__font-text` / `--mp__font-accent` | `--mp-font-text` / `--mp-font-accent` (default: `inherit`) |
| `--mp__success` | `--mp-success` |
| `--mp__danger` | `--mp-danger`. The default is now `#c2303e`: 8.x's `#fc5d6a` was too light for white text. |
| `--mp__textSize` / `--mp__titleSize` | `--mp-text-size` / `--mp-title-size` (fluid `rem` defaults instead of px) |
| `--mp__normal`, `--mp__italic`, `--mp__medium`, `--mp__bold`, `--mp__black` | Removed. Style the parts directly, e.g. `[data-mp="message"] { font-style: normal; }` |

9 also adds spacing, size, radius, shadow, offset and duration tokens. See the README's [Styling](./README.md#styling) section.

**Selectors:** 8.x used class names under `html > body`, and overriding them took high specificity or `!important`. 9 uses `data-mp` attributes inside a cascade layer, so any rule of yours wins:

| 8.x | 9 |
|---|---|
| `.magicPill` | `[data-mp="pill"]` |
| `.magicPill.out` / `.entry` / `.active` | `[data-presence="hidden"]` / `"rest"` / `"compact"` (also `"expanded"`, `"panel"`) |
| `.message` | `[data-mp="message"]` |
| `.CTA` | `[data-mp="action"]` (its label: `[data-mp="label"]`) |
| `.CTA.active` (navbar) | `[data-mp="action"][aria-current="page"]` |
| `.info` / `.info .title` / `.info .content` | `[data-mp="panel"]` / `[data-mp="panel-title"]` / `[data-mp="panel-body"]` |
| `.navbar` | `[data-mp="navbar"]` |

**Responsive:** 8.x needed your own mobile CSS (the demo had some). 9 fits small screens by itself, so you can probably delete those overrides.

## 6. Security
- **No raw HTML:** content isn't parsed as HTML any more (see the note in step 2).
- **Safe links:** links only render relative, `http(s):`, `mailto:` and `tel:` URLs. A `javascript:` URL now renders without a link (with a warning in development), even on React 18, which doesn't block it.

## 7. Removed exports
`pillData`, `MagicPillType`, `Mode`, `NotificationIcon`, `CTAIcon`, `MagicPillNotification`, `MagicPillNotificationCTA`, `MagicPillNotificationInfo`, `MagicPillNavbar`, `MagicPillNavbarItem`, `updateMode`, `updateNotificationIcon`, `updateNotificationMessage`, `updateCTAIcon`, `updateCTALabel`, `updateCTALink`, `updateInfoTitle`, `updateInfoContent`, `updateInfoCloseLabel`, `updateNavItemLabel`, `updateNavItemLink`, `updateNavItemIcon`, `addNavItem`, `deleteNavItem`, `handleActiveNavItem`, `Icons`, `CTAIcons`, `getIconComponent`, `defaultPillData`.

## Checklist
Search your code for leftovers:

```bash
# 8.x API
grep -rnE "pillData|useMagicPill|MagicPillProvider|update(Mode|Notification|CTA|Info|NavItem)|(add|delete)NavItem|handleActiveNavItem|getIconComponent|CTAIcons|defaultPillData|MagicPillType|NotificationIcon|CTAIcon" src app

# 8.x styles
grep -rnE "\.magicPill|\.CTA|--mp__" --include="*.css" --include="*.scss" .
```

Then check that:
- [ ] `<MagicPill />` is mounted once (per name), and `magic-pill/styles.css` is imported.
- [ ] Notifications go through `pill().notify()`, and the navbar is a `PillNavbar` inside `<MagicPill>`.
- [ ] Every nav item has a `label`.
- [ ] The fonts are set, if you want the Overlock + Lexend look.
- [ ] Custom CSS targets `data-mp` attributes and `--mp-*` tokens.
