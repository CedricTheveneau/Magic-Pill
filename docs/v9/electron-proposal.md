# The Electron, its orbitals and the wide atom: API proposal

> **Status: proposal, waiting for the maintainer's review.** Built from a throwaway prototype, the **Electron lab** (private page, version 2 of 2026-11-28), with every setting adjustable. The maintainer tried version 1 in detail on 2026-11-27 ("exactly what I had in mind") and answered every question; version 2 carries those answers. **Beta:** it ships in `9.4.0-next.N` releases and is marked beta in the docs and the demo until it settles.

## 1. What was decided (the maintainer, 2026-11-27)

- **Motion: goo only.** The electron splits out of the pill as a droplet: a neck forms and snaps. The orbitals are gooey too. **The sidebar's flag moves to the goo and the bridge goes.**
- **Curves:** bouncy by default, pop and smooth as options. Reduced motion: a fade.
- **Every default as prototyped, with overrides through props or tokens.**
- **During a notification:** the electron tucks in by default ("a cleaner, less messy look, which displays the animations"); a boolean keeps it out.
- **The electron's look** depends on what it holds: ring and value, ring and icon, value only. All three stay.
- **Always centred:** the pill and its electrons as a group. The placement's `-start` and `-end` move the group to that edge.
- **Where they go is settable:** the electron after, before or beside the pill (e.g. under a sidebar or next to it); the wide atom on either side, or beside; horizontal or vertical.
- **When the activity ends:** joins back into the pill by default, or pops away like any pill leaving.
- **Orbitals:** all three ways to open them (long press and hover by default, long press only, a tap with a "Back" orbital). 3 by default, 44 px, labels on, staying open after an action, each with a boolean or a token. A **distance from the electron**. The **automatic spread** keeps clear of the pill and the screen's edges, and becomes a **wheel** when they don't fit (scroll or drag; it stays open; a tap away closes it).
- **The wide atom:** one action or more, for the current page. Detached by default, or in the pill after a divider. Horizontal or vertical on demand; a horizontal one that takes too much room turns vertical by itself. On the start or the end side (the thumb a developer wants).
- **Gather or spread:** the electrons and the wide atom gathered around the pill (default), or spread to the screen's edges (on a tablet, under each thumb).
- **Beta**, in a `-next` release, with a distinctive tag in the demo, to try it on devices first.

## 2. At a glance

```tsx
// app/layout.tsx: the host, as today, plus where the satellites go
<MagicPill pathname={pathname} satellites={satellites}>
  <PillNavbar items={items} pathname={pathname} linkComponent={Link} />
</MagicPill>
```

```ts
// Anywhere in the app: a background activity
const id = pill().electron({
  label: "Focus timer",
  value: "25:00",
  progress: 0,
  orbitals: [
    { icon: <PlusIcon />, label: "+1 min", onClick: addMinute },
    { icon: <PauseIcon />, label: "Pause", onClick: pause },
    { icon: <SkipIcon />, label: "Skip to the break", onClick: skip },
  ],
});
pill().updateElectron(id, { value: "24:59", progress: 1 / 1500 }); // every second
pill().endElectron(id);                                             // joins back into the pill
```

```tsx
// A page: its contextual actions (the wide atom), while it's mounted
usePillActions([
  { icon: <PenIcon />, label: "Write", onClick: compose },
  { icon: <ChecksIcon />, label: "Mark all as read", onClick: readAll },
]);
```

## 3. The Electron

It belongs to the host and the store, so it survives page changes (the host sits in the layout). `pill(name)` reaches the host of that name, as for notifications.

```ts
interface ElectronOptions {
  /** Its accessible name, e.g. "Focus timer". Required. */
  label: string;
  /** A short live text: "4:34", "64%". In its accessible name, never announced on its own. */
  value?: string;
  /** An icon; with `progress` and no `value`, it sits inside the ring. */
  icon?: ReactNode;
  /** 0 to 1: draws a progress ring (the new `PillProgress` part). */
  progress?: number;
  /** "neutral", "success", "danger" or yours, like a pill's. */
  variant?: PillVariant;
  /** Where it came from. Default: the pathname when it was created. A tap goes back there. */
  href?: string;
  /** Instead of the link: what a tap does. */
  onClick?: (event: MouseEvent) => void;
  /** Tucked into the pill while the current page is its `href` (needs the host's `pathname`). Default true. */
  hideOnOrigin?: boolean;
  /** Its quick actions (§4). */
  orbitals?: Orbital[];
  /** How it leaves when it ends: "join" (back into the pill) or "pop" (scales out). Default: the host's. */
  ending?: "join" | "pop";
  /** Said once by screen readers when set, for a milestone ("Break time"). */
  announce?: string;
  /** Your own content instead of the ring, value and icon. */
  render?: () => ReactNode;
  /** Electrons with the same id update in place. */
  id?: string;
}
```

- **Its look comes from what it's given:** `progress` and `value` give the ring and the value, `progress` and `icon` the ring and the icon, `value` alone the value only. `render` for anything else. (The maintainer: "it all depends on the kind of widget we put in it, we might need some more thoughts put into it down the line.") The **extended size** (a short pill instead of a circle) stays for later, as decided on 2026-11-22.
- **On its own page it's tucked in** (`hideOnOrigin`): its `href` is matched against the host's new `pathname` prop the way the navbar matches (`matchPath`, so sub-pages count). Starting a timer on its page shows nothing until you leave it; coming back tucks it in.
- **A tap goes back** to its `href` through the host's `linkComponent`, or runs `onClick`.
- **Accessibility:** a link or a button named "Focus timer, 4 minutes left. Back to Focus" (the value rounded to the minute in the name, so it doesn't change every second); `aria-haspopup="menu"` when it has orbitals. Nothing is announced on each tick; `announce` says milestones once.

**Host props:**

| Prop | Values | Default |
|---|---|---|
| `pathname` | The current path, as for the navbar | none (electrons always show) |
| `electronSide` | `"after"` (further along the edge), `"before"`, `"beside"` (one row towards the page: above a bottom pill, next to a sidebar) | `"after"` |
| `electronLine` | Several electrons line up `"along"` the pill or stack `"across"` it | `"along"` |
| `keepElectronsOut` | `true` keeps them out while a notification shows | `false` (tucked in) |
| `electronEnding` | `"join"` or `"pop"` | `"join"` |
| `arrange` | `"gather"` (around the pill) or `"spread"` (to the screen's edges, the pill staying put) | `"gather"` |

**Short of room** (seen on a 375 px phone): the navbar goes tight (icons only, as today), then an automatic wide atom turns vertical, then the second electron, the wide atom and the electron move beside the pill, in that order, like the ladder. A spread arrangement with no room stays gathered.

## 4. Orbitals

```ts
interface Orbital {
  icon: ReactNode;
  label: string;
  onClick?: (event: MouseEvent) => void;
  href?: string;
  id?: string;
}
```

- **Opening them** (host prop `orbitalsOpenOn`): `"press-hover"` (default: a long press on touch, hovering with a mouse after a delay), `"press"` (a long press only), or `"tap"` (a tap opens them, and a first orbital, "Back", does what the tap did). A long press keeps going: slide to an orbital and release to run it (live feedback under the finger, picked by its angle from the electron's centre, a dead zone in the middle).
- **Keyboard:** Enter does the tap; the arrow pointing away from the edge, Shift+F10 or the context-menu key open them, focus on the first; arrows move around the ring, Home and End, Enter runs, Escape closes and gives focus back. ARIA menu pattern.
- **Labels:** the one under the finger (or the pointer, or focus) shows its label in a small pill. Host prop `orbitalLabels`, default `true`.
- **After an action they stay open** (host prop `orbitalsStayOpen`, default `true`), with their icons updated (Pause becomes Resume).
- **Where they go:** on an arc on the side away from the screen's edge, at a distance from the electron. **The automatic spread** looks for the free arc around that direction, clear of the pill, the wide atom, the other electrons and the edges; if all of them don't fit, it moves the arc out a little (up to one orbital's size); if they still don't fit, **the wheel**: it shows what fits, the next one peeking out faintly at each end, and turns with the mouse wheel, a drag along the arc, or the arrow keys. A wheel stays open until a tap away or Escape. A fixed spread that doesn't fit falls back to the automatic one first.
- **Motion:** they bulge out of the electron, staggered, in its own goo layer (so they never melt into the pill), and fold back into it.

## 5. The wide atom (contextual actions)

The actions of the current page, one or more, next to the pill. The docs will call it the wide atom; the API says actions, which reads by itself.

```ts
/** Registers the current page's actions while the calling component is mounted. */
function usePillActions(items: PillActionItem[] | null, options?: { pill?: string }): void;
pill().setActions(items | null); // the same, imperatively
type PillActionItem = { icon: ReactNode; label: string; onClick?: (event: MouseEvent) => void; href?: string };
```

| Host prop | Values | Default |
|---|---|---|
| `actionsStyle` | `"detached"` (a pill of its own) or `"inside"` (in the pill, after a divider: the original design) | `"detached"` |
| `actionsSide` | `"start"`, `"end"` (follow the text direction), or `"beside"` | `"start"` |
| `actionsOrientation` | `"auto"` (as the pill; turns across when a horizontal one leaves too little room, back again once beside the pill), `"horizontal"`, `"vertical"` | `"auto"` |

It splits out of the pill with the same goo, and changes with the page (its actions swap; with none, it joins back).

## 6. Tokens

Visual settings are tokens, like the rest of the library; behaviours are props. All optional.

| Token | Default | What |
|---|---|---|
| `--mp-electron-gap` | `--mp-gap` (`1rem`) | Between the pill and an electron, the wide atom, each other |
| `--mp-goo` | `12` | How sticky the goo is (the blur behind the neck, in px). `0`: a plain split, no neck |
| `--mp-electron-start` | `1` | The size an electron starts at as it comes out. `1`: full size, hidden behind the pill's end, it slides out as a droplet. Lower: it starts small and grows on its way out |
| `--mp-duration-split` / `--mp-duration-join` | `--mp-duration-enter` / `--mp-duration-exit` (500 ms / 300 ms) | The split and the join. The content fades with `--mp-duration-fade` |
| `--mp-ease-split` | `bouncy` | `bouncy`, `pop`, `smooth`, or any CSS easing (`linear()` springs included) |
| `--mp-orbital-size` | `--mp-action-size` (`2.75rem`) | An orbital's diameter |
| `--mp-orbital-distance` | `0.875rem` | Between the electron and its orbitals |
| `--mp-orbital-spread` | `auto` | Or an angle (`120deg`) |
| `--mp-orbitals-shown` | `3` | How many show at once before the wheel (see Q2) |
| `--mp-orbital-stagger` | `30ms` | Between two orbitals coming out |
| `--mp-hover-delay` / `--mp-long-press` | `300ms` / `450ms` | Before hovering or pressing opens them |

## 7. How it's built

- **The goo only runs during motion.** The prototype showed that a goo layer left on melts shapes that sit close together (the orbitals into the pill, two neighbours into each other) and rounds corners. So at rest every pill is the library's pill, unchanged. While something splits or joins, a fixed overlay draws the fills of the pills involved, follows their rectangles every frame, and goes through an SVG filter (blur, alpha threshold, a shadow cut out under the shapes); the real pills' backgrounds and shadows are transparent meanwhile. The blur rises and falls with the motion (none at the start and the end), so nothing pops when the overlay hands back.
- **The orbitals have their own overlay**, with their electron drawn once inside it while they move, so they bulge out of the electron and never into the pill.
- **Glass:** the tint keeps its transparency with the goo on or off, the shadow is cut out under it (as a box-shadow is), and a circle's own glass (its blur and rim) waits until it is apart from the pill before coming in. Without that, the circles' outlines showed across the pill (the maintainer's note on version 1).
- **The flag** (9.2) uses the same overlay: `playBridge` goes.
- The split reuses `morph.ts` (WAAPI, measured sizes) and the ladder's offsets; the layout is a small pure function (sizes in, rectangles out), unit-tested.
- **Reduced motion:** fades in place, no goo.

## 8. Beta

- Ships in **`9.4.0-next.N`** releases (npm's `next` tag; `latest` stays 9.3.x). The API may change between them; `@beta` in the TSDoc of every new export.
- **The demo:** a docs page, "The Electron", with a **Beta** tag in the navbar and the page's title, and the Electron lab rebuilt on the real code (every setting of the prototype, as for the Glass and Forms labs). To try it on devices, the live demo depends on the `-next` release (Q5).
- README: a short section marked beta, linking to the docs page.

## 9. Cost and delivery

**Estimated cost** (gzipped): the goo overlay about 1.5 kB, the electrons and their layout 2.5 kB, the orbitals and the wheel 2.5 kB, the wide atom 1 kB: **about 7.5 kB**, in an optional entry (Q1), so the quick start doesn't change. The flag's switch to the goo moves about 1 kB into the quick start's sidebar code (the bridge goes, the overlay comes).

**PRs, in order, each with tests (the ones for motion fail on the old code first):**
1. This proposal.
2. The goo overlay and the curves; the flag moves to it (the bridge goes).
3. Electrons: the store and controller, `pathname` and the origin, the layout (sides, line, gather or spread, short of room), tucking in during notifications, the endings, `PillProgress`, accessibility.
4. Orbitals: the arc and the automatic spread, the three ways to open, press-slide-release, labels, staying open, the keyboard.
5. The wheel.
6. The wide atom: `usePillActions`, the two styles, the sides, the automatic orientation.
7. The demo: the beta docs page and the lab on the real code. Then **9.4.0-next.1**, for you to try on your devices.

## 10. Questions for the maintainer

1. **An optional entry?** I'd put the satellites in `magic-pill/satellites`, passed to the host (`satellites={satellites}`), like forms and themes are optional: apps that don't use them pay nothing. The controller's methods (`electron`, `updateElectron`, `endElectron`, `setActions`) stay on `pill()` (a few bytes) and warn in development without it. The other way: built into the host, about +7.5 kB for every app.
2. **"3 by default":** I read it as how many orbitals show at once, the rest on the wheel (`--mp-orbitals-shown`). The other reading is only the demo's example (an app passes as many as it wants, and the wheel only comes when there's no room). Which one?
3. **Names:** `electron` and `orbitals` in the API, and `actions` for the wide atom (`usePillActions`, `actionsStyle`…) since "wide atom" needs explaining. Or `atom` everywhere (`useAtomActions`, `atomStyle`)?
4. **`pathname` on the host**, for tucking an electron in on its page (the host can't see the router otherwise). OK?
5. **The live demo on `9.4.0-next.N`** while the Electron is in beta, so you can try it on your devices from the real site (the other pages don't change). Or a separate preview?
6. **The flag's switch to the goo** is a visible change to a 9.2 feature: it lands with 9.4 (in `next.1`), in the changelog's Changed section. OK?
