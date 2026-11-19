# Magic Pill v9: API proposal

> **Status: draft, waiting for the maintainer's approval.** Nothing here is implemented yet.
> Written 2026-11-19 for Phase 2 (`PROJECT_STATUS_REPORT.md` §12). It follows `VISION.md` §6 (three layers: primitive, templates, named controllers).
>
> **The typed half of this proposal** is [`api.ts`](./api.ts) (every public export, with doc comments) and [`examples.tsx`](./examples.tsx) (every mockup template, several pills, a modal, Tailwind, React Router). Both typecheck: `npx tsc -p docs/v9`. The examples use the demo's real `next/link`, so `linkComponent={Link}` is checked against Next 16.

---

## 1. Goals and non-goals

v9 is the first release with a **stable, documented API**. It must:

- reach **"two lines"**: mount `<MagicPill />` once, call `pill().notify(…)` from anywhere (A1);
- make the **pill a primitive**: anything goes inside, templates are compositions of the same parts (VISION §2.1–2.3);
- support **several pills per page**, each with a name, placement, base layer and queue (§2.4, A2);
- close the open findings: **L3, L4, L8, L10, L12, L14, L16, R12, Y5** and **A1–A3**.

Not in v9 (Phase 3): Toolbox and Carousel *templates* (the toolbox is already one `<Pill>` away, see examples §5), animated **morphing** between contents, more icons, docs site, CDN usage.

---

## 2. The three layers at a glance

```
<MagicPill name="main">        Layer 3: host = <Pill> + store + notification template + live region
  <PillNavbar … />             Layer 2: templates (base layer here)
</MagicPill>
pill("main").notify({…})       Layer 3: imperative controller, callable outside React

<Pill placement variant presence>   Layer 1: primitive
  <PillIcon/> <PillDivider/> <PillMessage/> <PillActions><PillAction/></PillActions> <PillPanel/>
</Pill>
```

**Exports** (one entry point, every module separate in `dist/`, so unused templates and icons are tree-shaken):

| Layer | Exports |
|---|---|
| 1. Primitive | `Pill`, `PillIcon`, `PillDivider`, `PillMessage`, `PillActions`, `PillAction`, `PillPanel`, `PillPanelTrigger`, `usePill` |
| 2. Templates | `PillNotification`, `PillNavbar` |
| 3. Controllers | `MagicPill`, `pill`, `usePillQueue` |
| Icons | `ArrowIcon`, `BoxIcon`, `CheckIcon`, `CloseIcon`, `CouponIcon`, `DocumentIcon`, `HelpIcon`, `InfoIcon`, `MailIcon`, `PhoneIcon`, `PlusIcon`, `UndoIcon` |
| Types | `PillPresence`, `PillPlacement`, `PillOrientation`, `PillVariant`, `LinkComponent`, `NavItem`, `NotifyOptions`, `PillController`, … |
| CSS | `magic-pill/styles.css` (the 8.x paths `magic-pill/magicpill.css` and `magic-pill/dist/magicpill.css` keep working) |

**Why `PillIcon` and not `Pill.Icon`:** a Server Component can't "dot into" a client module (`<Pill.Icon>` on a client reference throws). Separate named exports keep the primitive usable from Server Components, like the 8.1 component already is.

---

## 3. Layer 1: the primitive

```tsx
<Pill placement="bottom" variant="success">
  <PillIcon><CheckIcon /></PillIcon>
  <PillDivider />
  <PillMessage>Item successfully added to cart!</PillMessage>
  <PillActions>
    <PillAction icon={<CloseIcon />} label="Close" onClick={close} />
  </PillActions>
</Pill>
```

| Prop | Values | Default | Notes |
|---|---|---|---|
| `presence` / `defaultPresence` / `onPresenceChange` | `hidden` · `rest` · `compact` · `expanded` · `panel` | `compact` | Controlled or uncontrolled (Radix pattern). Replaces v8's `out`/`entry`/`active` classes. The pill animates between levels. |
| `placement` | `top`, `bottom`, `left`, `right`, `top-start`/`-end`, `bottom-start`/`-end`, `inline`, `overlay` | `bottom` | Edges are `position: fixed`, `start`/`end` follow the text direction, `inline` stays in the flow, `overlay` is a native `<dialog>` opened with `showModal()` (focus trap, Escape and inert background, no dependency). |
| `orientation` | `horizontal` · `vertical` | `vertical` on `left`/`right`, else `horizontal` | Sidebar pills. |
| `variant` | `neutral` · `success` · `danger` · any string | `neutral` | Custom strings become `data-variant="…"` for your own tokens. `success` is the mockups' green (`#3F7253`). |
| `unstyled` | boolean | `false` | Keeps behaviour and data attributes, drops the visual styles. |

- **`PillAction`** is a `<button>` (with `onClick`) or a link (with `href`). Same look either way. **`label` is required**: it's the accessible name when only the icon shows. The label appears on hover and focus, with `expanded`, with `aria-current`, and at the `expanded`/`panel` levels (the mockups' "✓" → "✓ Yes").
- **Links:** `href` renders `linkComponent` (default `<a>`). Only relative, `http(s):`, `mailto:` and `tel:` URLs are rendered. Anything else renders no link and warns in development. **This closes L16** on React 18, which doesn't block `javascript:` URLs.
- **`PillPanel`** shows at the `panel` level. **`PillPanelTrigger`** opens it, with `aria-expanded`/`aria-controls` wired (Y4). The panel is labelled by its title, gets focus when it opens, closes on Escape, and gives focus back to the trigger.
- **`usePill()`** returns `{ presence, setPresence, placement, orientation, variant }`. This is how the built-in templates are written, and how users write their own (examples §5).

---

## 4. Layer 2: templates

Templates render **inside** a pill. They render the parts, not the container, so `<MagicPill>` can swap its content inside the same container. That container is what animates now, and what will morph in Phase 3.

### `PillNotification`

```tsx
<Pill placement="inline">
  <PillNotification
    icon={<InfoIcon />}
    message={<>Your current cart total is: <strong>768.99$</strong></>}
    action={{ icon: <CheckIcon />, label: "Checkout", href: "/checkout" }}
    linkComponent={Link}
  />
</Pill>
```

- `icon`, `message` and `panel.content` are **`ReactNode`**. Nothing is parsed as HTML. **This closes L3**: v8's `dangerouslySetInnerHTML` is gone.
- `action` is `{ icon?, label, onClick }` **or** `{ icon?, label, href }`. The type forbids both at once. **This adds the CTA `onClick` from A3.**
- `panel: { title?, content, trigger?, closeLabel? }` is the mockups' "+ Learn more" panel. `trigger` defaults to `{ icon: <PlusIcon />, label: "Learn more" }` and `closeLabel` to `"Close"`. These English defaults can be overridden.
- `classNames: { icon, divider, message, actions, action, panel }`.

One template covers all six notifications in the mockups (question, success, undo, contextual info, promotion, expandable info). See examples §2.

### `PillNavbar` (router-agnostic; closes L8)

```tsx
<PillNavbar items={items} pathname={usePathname()} linkComponent={Link} />
```

- `items: { href, label, icon?, match? }[]`.
- **Matching** works on whole path segments: `/blog` matches `/blog/post`, but not `/blogroll`. `/` is always exact, and the **longest match wins**, so only one item is active. Give an item `match: "exact"` or a function to override.
- The active link gets `aria-current="page"` and shows its label. Matching uses `href`, not `label`, so duplicate labels no longer collide.
- `pathname` comes from the user's router (Next `usePathname()`, React Router `useLocation().pathname`…). Without it, the navbar reads `window.location.pathname` after mounting and on `popstate`. That fallback misses client-side navigations, so the docs recommend passing `pathname`.
- `linkComponent={Link}` gives client-side navigation instead of full page reloads. React Router's `Link` takes `to`, so it needs a 3-line wrapper (examples §7).
- It renders a `<nav aria-label="Main">`; `aria-label` can be overridden.

---

## 5. Layer 3: controllers

### `<MagicPill>`: the host

```tsx
<MagicPill name="main" placement="bottom" duration={5000} linkComponent={Link}>
  {/* optional base layer */}
  <PillNavbar items={items} pathname={pathname} linkComponent={Link} />
</MagicPill>
```

- `<MagicPill>` = `<Pill>` + its store + the notification template + a live region. It accepts the `<Pill>` props except presence, which it manages itself.
- **`children` are the base layer (A2).** When the queue isn't empty, the head notification **takes the pill over**. When the queue is empty again, the pill **returns to its base**. Navbar and notification are no longer exclusive, and **`mode` is gone**.
- With no base layer and nothing queued, `idle="hidden"` (the default) hides the pill. `idle="rest"` shows a resting circle with `idleIcon` (VISION §2.6, "discreet most of the time").
- **`name`** defaults to `"main"`. Several hosts with different names coexist (examples §4). Two hosts with the same name warn in development.

**One notification's lifecycle:**

```
hidden ─▶ rest ─▶ compact ─[duration]─▶ rest ─▶ hidden        (no base layer)
base:compact ─▶ rest ─▶ notification:compact ─[duration]─▶ rest ─▶ base:compact
```

- The `rest` step is the circle with the overshoot from v8's entry animation.
- Swapping content through `rest` is the v9 transition. True morphing is Phase 3.

### `pill(name?)`: the imperative API (A1)

```ts
const id = pill().notify({ icon: <CheckIcon />, message: "Saved!", variant: "success" });
pill().update(id, { message: "Saved twice!" });
pill().dismiss(id);      // or pill().dismiss() for the visible one
pill().clear();
pill("sidebar").notify({ message: "3 new posts" });
```

- **The queue is first in, first out, one visible notification per pill.** Calling `notify` with the `id` of a queued or visible notification **updates it in place** ("Saving…" → "Saved", examples §2) instead of adding an entry.
- **`duration`** is set per notification, or globally on the host. The default is 5000 ms, and the countdown starts once the pill is fully shown. `Infinity` keeps the notification until dismissed. **This adds `duration` from A3.** The countdown pauses on **hover, keyboard focus** (as in 8.1), an **open panel**, and a **hidden browser tab**.
- **Action clicks dismiss** the notification (`reason: "action"`). Call `event.preventDefault()` in `onClick` to keep it open, for example while a request runs. `onDismiss(id, reason)` reports `timeout` · `action` · `dismissed` · `cleared`.
- **`render: ({ id, dismiss }) => ReactNode`** replaces the built-in template with your own parts, and keeps the queue, timing and animation. This is how user-made templates reach the queue (examples §4).
- **Calls made before the host mounts** are kept and shown once it mounts.
- **Server safety:** the store and `pill()` live in modules **without** `"use client"`. Client code can call them, including code outside React. On the server they do nothing (and warn in development), because a module-level store there would leak notifications between requests.
- **Store:** a `Map` of named stores on `useSyncExternalStore`, with no dependencies. The 14 v8 setters disappear: the store's own update logic replaces them (L13 is moot).

### `usePillQueue(name?)`: headless

`usePillQueue(name?)` returns `{ current, queued }` for people who build their own host or a custom display (like react-hot-toast's `useToaster`). It's cheap to expose, since `<MagicPill>` is built on it.

---

## 6. Accessibility (Y1–Y5)

- **Live region decoupled from the pill (closes Y5).** Each `<MagicPill>` renders an always-mounted, visually hidden `role="status"` region. The announcement is `announce` if given, otherwise **the text content of the rendered message**, so `ReactNode` messages are announced too. `announce: false` stays silent.
  - Because announcing no longer depends on the visible pill, a `hidden` pill can leave the accessibility tree completely (`hidden`/`inert` after the exit animation). That's the conflict Y5 described.
  - At `rest`, everything but the icon is `inert`.
- **Focus:** panels and overlays move focus in and back out, and close on Escape. The `overlay` placement gets a real modal for free from `<dialog>`.
- **Kept from 8.1:** hover and focus pause the countdown (Y3), `aria-expanded` on panel triggers (Y4), and reduced motion (Y2), which now also shortens the JS phase timings, not just the CSS.
- `PillAction` always has an accessible name (`label` is required); icons are `aria-hidden` and `focusable="false"`.

---

## 7. Styling contract (closes L4, L10, L12, R12)

| Topic | v9 |
|---|---|
| **Selectors** | Every part carries **`data-mp="pill|icon|divider|message|actions|action|label|panel|…"`**. State goes in `data-presence`, `data-placement`, `data-orientation` and `data-variant`, plus `aria-current`/`aria-expanded`. **No class names of ours**, so `.CTA`, `.message` and `.title` can't collide with the host app's CSS (L12). |
| **Specificity** | All rules sit in **`@layer magic-pill`**, and the selectors are single attributes. **Any unlayered user CSS wins** without `!important`. Tailwind v4 users declare the layer order once: `@layer theme, base, magic-pill, components, utilities;`. |
| **Escape hatches** | `className` on every part, `classNames` on templates and the host, and `unstyled` per pill. |
| **Fonts** | **No `@import`.** `font-family: var(--mp-font-text, inherit)`: the app's font by default, so nothing goes to Google (L10) and nothing for Turbopack to drop (R12). The README gives the `next/font` recipe for the signature look: `Overlock({ style: "italic", variable: "--mp-font-text" })` + `Lexend({ variable: "--mp-font-accent" })`. |
| **Tokens** | Renamed from `--mp__camelCase` to `--mp-kebab-case` and extended: `--mp-surface`, `--mp-on-surface`, `--mp-action`, `--mp-on-action`, `--mp-success`, `--mp-danger`, `--mp-font-text`, `--mp-font-accent`, `--mp-text-size`, `--mp-title-size`, `--mp-gap`, `--mp-padding`, `--mp-radius-panel`, `--mp-shadow`, `--mp-offset`, `--mp-duration-enter`/`-exit`. The migration guide maps every old name. |
| **Responsive** | `rem` and `clamp()` instead of fixed px (104.5, 54.5, 19.4). The panel is `min(32rem, 100vw − 2 × offset)` wide, so it no longer overflows at 500px min-width on phones (L4). `--mp-offset` includes `env(safe-area-inset-*)`. Logical properties make RTL work. |
| **Icons** | One set, drawn in `currentColor`, sized by CSS. v8 had two copies of some glyphs with hard-coded fills, which go away. |
| **Motion** | Shape changes are transitions on `data-presence`, with the entry overshoot kept, and `prefers-reduced-motion` respected. The phase lengths come from tokens and the host's timing. |

---

## 8. Migration from v8

**Removed:** `pillData`, `mode`, `MagicPillType`, `Mode`, `NotificationIcon`, `CTAIcon`, `MagicPillNotification*`, `MagicPillNavbar*`, the 15 handlers (`updateMode` … `handleActiveNavItem`), `Icons`, `CTAIcons`, `getIconComponent` (L14 goes with it), `defaultPillData`, the `.magicPill`/`.CTA`/… classes, the `--mp__*` variables, and the Google Fonts `@import`.

| v8 | v9 |
|---|---|
| Context + Provider + Initializer (~135 lines) + `<MagicPill pillData={…} />` | `<MagicPill />` once, then `pill().notify(…)` |
| `{ mode: "notification", notification: {…} }` | `pill().notify({…})` |
| `{ mode: "navbar", navbar: { navItems } }` | `<MagicPill><PillNavbar items={…} pathname={…} /></MagicPill>` |
| `updateMode(…)` | Nothing: base layer + queue |
| `updateNotificationMessage/Icon`, `updateCTA*`, `updateInfo*` | `pill().update(id, {…})`, or `notify` again with the same `id` |
| `addNavItem`, `deleteNavItem`, `updateNavItem*` | Change the `items` prop (your own React state) |
| `handleActiveNavItem` + `window.location` | `pathname` prop + `match` |
| `icon: "checkmark"` / `cta.icon: "tel"` … | `icon: <CheckIcon />`, `<PhoneIcon />` … (name table in the guide) |
| `cta: { icon, label, link }` | `action: { icon, label, href }` (or `onClick`) |
| `cta` + `info: { title, content, closeLabel }` | `panel: { trigger, title, content, closeLabel }` |
| `info.content` (HTML string) | `panel.content` (`ReactNode`). For trusted HTML you already have, render your own `<div dangerouslySetInnerHTML>`. |
| fixed 5 s | `duration`, global or per notification |
| `import "magic-pill/dist/magicpill.css"` | Unchanged, or `magic-pill/styles.css` |
| `--mp__themeDark`, `--mp__font-text` … | `--mp-surface`, `--mp-font-text` … |
| Fonts loaded automatically | Inherited from the app. `next/font` recipe in the README. |

**Icon names:**

| v8 name | v9 component |
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

**Migration guide outline** (`MIGRATING.md`, linked from the README and the `[9.0.0]` CHANGELOG entry):

1. Why v9 (the three layers in one paragraph).
2. Delete your Context, Provider and Initializer; mount `<MagicPill />`.
3. Notifications: before/after for each v8 field.
4. Navbar: `items`, `pathname`, `linkComponent`.
5. Icons: the name table.
6. Styling: the token table, data attributes instead of classes, fonts.
7. Security: no more HTML strings, URL validation.
8. Checklist: `grep` patterns for leftover v8 identifiers.

---

## 9. Compatibility and packaging

- **Peers stay `react`/`react-dom` ≥ 18.** That means `forwardRef` (not ref-as-prop) and `inert=""` for React 18, plus a test pass on React 18 and 19, as in Phase 1.
- **Same build:** tsdown, unbundled. Modules with hooks or state get `"use client"`. **The store, `pill()`, icons and types don't**, so they stay plain values in Server Components. The CI output check gets a rule for that.
- **Size budget (VISION §7, "Tiny but mighty"):** CI measures the gzipped JS + CSS for `import { MagicPill, pill }` with the rolldown that tsdown already installs, so no new dependency. The budget is set at the first measurement, and the README states the real figure.

---

## 10. Delivery plan (once this is approved)

Small PRs, one per block, one commit per step:

| # | Block | Closes |
|---|---|---|
| 1 | `publish.yml` passes `--tag next` for pre-release versions; dry-run tested | (if pre-releases are approved, §11) |
| 2 | Primitive: `Pill` + parts, presence/placement/orientation/variant, new CSS (layer, tokens, data attributes, no `@import`, responsive), icons in `currentColor` | L4, L10, L12, R12 |
| 3 | Store + `pill()` + `usePillQueue` + `<MagicPill>` host, base layer + queue, live region | A1, A2, Y5 |
| 4 | `PillNotification`: `ReactNode` content, `action`, `panel`, `duration`, `render` | A3, L3 |
| 5 | `PillNavbar`: matching, `pathname`, `linkComponent`, URL validation | L8, L16 |
| 6 | Remove the v8 API and its tests, keep the behavioural specs (timers, pause, live region, reduced motion); size budget in CI | L13, L14 |
| 7 | `MIGRATING.md`, README rewrite, `[9.0.0]` CHANGELOG, Cursor rules refresh (D10, with your OK) | D10 |
| 8 | Demo rebuilt on v9, Turbopack, Pages deployed from CI (👤 settings change) | X1–X3, R13 |
| 9 | Release 9.0.0 (👤 go-ahead + `npm stage approve`) | |

Tests are written with each block (Vitest, Arrange-Act-Assert), against the new API.

---

## 11. Decisions requested from the maintainer

1. **Approve this API**, or comment on the PR.
2. **Pre-releases:** publish `9.0.0-next.N` under the npm `next` tag while Phase 2 is in progress? *Recommended:* yes, developed on `main`. An 8.1.x fix, if ever needed, would go on a `v8` branch cut from the `v8.1.0` tag.
3. **Changesets:** *recommended:* no. It's one package with one maintainer, a hand-written Keep a Changelog file works, and Changesets adds a dependency and a bot workflow.
4. **Default placement of a bare `<Pill>`:** `bottom` (proposed: the same default everywhere, matching the identity) or `inline` (more natural for a component written in JSX).
