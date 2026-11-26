# Notifications in a sidebar: API proposal

> **Status: approved by the maintainer on 2026-11-26**, every question answered "yes" (§9). The four layouts were tried in a throwaway prototype (the **Sidebar notifications** page, private), with every composition: short and long messages, with or without icon, divider, actions, a text panel or a form. Builds on #112, which ships the default (A). **Implementation:** rows (§8, 1) in #114, card (§8, 2) in #115, flag (§8, 3), then the docs pages. The flag's estimate (§8) was low: about 1.5 kB for the quick start, with the navbar's matching and a second pill's steps and pauses.

## 1. What was decided

The maintainer, 2026-11-26, after trying the prototype:

- **Keep all of them, as variants.** "I like all of them for various reasons."
- **The current implementation stays the default** (A: a horizontal pill from the edge, #112).
- **Slides:** B and C can slide, since they come from the same pill. E can't: it comes out of the sidebar **like an electron**.
- **E's motion may change** once the Electron is designed (§1.5 of the roadmap): build it so its animation can follow.

## 2. At a glance

```tsx
<MagicPill name="docs" placement="left" notificationLayout="card">
  <PillNavbar items={sections} pathname={pathname} />
</MagicPill>
```

```ts
pill("docs").notify({ message: "3 new pages" });                 // the host's layout
pill("docs").notify({ message: "Léa replied", layout: "flag", at: "/messages" }); // one of its own
```

| Value | In the prototype | What it does | Reaches it |
|---|---|---|---|
| `"pill"` (default) | A | A horizontal pill growing out of the edge, like any other host's | Through the circle, where the sidebar turns (shipped in #112) |
| `"card"` | B | The sidebar's column: the icon on top, the message wrapping under it, the actions stacked full width | Through the circle; **slides** with `swap="always"` (it stays vertical) |
| `"rows"` | C | A rounded rectangle: the icon and the message on one line, the actions on a second line under the message | Through the circle; **slides** with `swap="always"` |
| `"flag"` | E | The sidebar stays; the notification comes out of its edge as a pill of its own, next to the section it's about | Splits off the sidebar like the Electron (§6) |

## 3. The prop

On `<MagicPill>`, read only while the host is vertical (`left`/`right`, or `orientation="vertical"`). A horizontal host ignores it (but see Q3 for `rows`).

```ts
/**
 * How a sidebar shows its notifications: as a horizontal pill (default),
 * a tall card in its own column, two rows, or a flag out of its edge.
 */
notificationLayout?: "pill" | "card" | "rows" | "flag";
```

And on a notification, for one that needs another layout than its host's:

```ts
interface NotifyInput {
  /** This notification's layout in a sidebar, instead of the host's `notificationLayout`. */
  layout?: "pill" | "card" | "rows" | "flag";
  /** `flag` only: the navbar item it's about (its `href`), to come out next to it. Default: the middle of the sidebar. */
  at?: string;
}
```

Written to `data-layout` on the pill (`flag`: on the flag), so apps can style each one.

## 4. The layouts

The template (`NotificationContent`) keeps its parts (icon, divider, message, action, panel trigger) and arranges them per layout, through the stylesheet:

- **card:** a column of the sidebar's width, at least `--mp-card-width` (default `12.5rem`, a new token: the sidebar may be only icons). The divider turns horizontal. Actions take the full width, one per line.
- **rows:** the actions go on a second row, lined up with the message (after the icon and divider). **When needed only** (the prototype's "Only when they need it"): with two of them (a notification's `action` and its panel's trigger), or when the message wraps; one action with a short message stays on the line (see Q4).
- **flag:** today's horizontal arrangement, in its own pill beside the sidebar.

The colour (`variant`) applies to the whole card or rows pill, and to the flag only (the sidebar keeps its own). A notification with `render` (your own arrangement) gets the layout's shape and place; what's inside is yours.

## 5. Panels and forms

Each layout opens a notification's panel from where it is, the way panels already open:

- **card** and **rows:** the pill grows into the panel (its width is `--mp-panel-width`, as everywhere), at the sidebar's spot.
- **flag:** the flag grows into the panel beside the sidebar, which stays (and stays usable).
- Forms in a panel work the same in every layout (a reply, a snooze…). Notifications already wait while a form of the base layer is open; with `flag`, the base layer stays on screen and keeps its state.

## 6. The flag, and the Electron

The flag is a **satellite of the host**: a second element, next to the sidebar, while the sidebar stays mounted and usable (unlike the other layouts, where the notification takes the pill over).

- **Its motion:** it splits off the sidebar's edge as a circle (the prototype's pop, with a short bridge between the two while they part), grows into its pill, and goes back the same way. **This is the Electron's split, and will follow it**: when the Electron's join/split morph is designed (gooey bridge, timings), the flag gets the same. Until then it uses the prototype's motion, documented as subject to change.
- **Between notifications:** the flag is a pill of its own, so the next one slides in it (`swap="queue"`, the default), and `at` moves it along the sidebar.
- **Where:** next to the item whose `href` matches `at` (with the navbar's `matchPath`), else in the middle; kept inside the screen. It covers the page beside the sidebar, like an open panel; the ladder doesn't move for it.
- **Pauses and announcements:** as today. Pointing at or focusing the flag pauses it; the live region reads it. The sidebar stays in the focus order.
- **Reduced motion:** a fade, like everything else.

## 7. What it degrades to

- Reduced motion: every layout appears and leaves with fades; nothing slides.
- `unstyled`: the attributes are written; the layout is yours.
- A horizontal host: `notificationLayout` and `layout` are ignored (Q3).

## 8. Cost and delivery

Estimated: card and rows are mostly CSS (`styles.css` + about 0.3 kB, the host + 0.2 kB); the flag is a second element with its own presence and placement (about 1 kB for the quick start). Budgets raised as needed, with the reasons.

Small PRs, in order, each one checked in Chromium frame by frame and on the docs:

1. `notificationLayout` and `layout`, with **rows** (C), and its slide.
2. **card** (B), with `--mp-card-width`, and its slide.
3. **flag** (E), with `at`, the prototype's motion and a note that it will follow the Electron.
4. The docs pages: a section on sidebars, with the four layouts live.

## 9. Questions for the maintainer (all answered "yes", 2026-11-26)

- **Q1, names:** `notificationLayout` on the host, `layout` on a notification, and `"pill" | "card" | "rows" | "flag"`? (*Proposed: yes; they're the prototype's titles.*)
- **Q2, per notification:** keep `layout` on `notify()`, so one notification can differ from its host (e.g. a flag for a message, a card for the rest)? (*Proposed: yes.*)
- **Q3, rows everywhere:** C's two rows would help any host whose notification has an action and a panel. Allow `notificationLayout="rows"` on horizontal hosts too? (*Proposed: yes, in PR 1; card and flag stay sidebar-only.*)
- **Q4, rows' second row:** only when needed (an action and a panel's trigger, or a wrapping message), or always? (*Proposed: when needed; the prototype showed one short action alone on a second row looking empty.*)
- **Q5, the flag's place:** `at` (a navbar `href`) to come out next to its section, the middle otherwise? (*Proposed: yes.*)
