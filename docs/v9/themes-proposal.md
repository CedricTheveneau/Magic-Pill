# Themes: API proposal

> **Status: approved by the maintainer on 2026-11-25** (§11), **released in 9.1.0**. **Implementation:** the material (§10, 1) in #89, the backdrop (§10, 2) in #90, `<PillOptics>` (§10, 3). The looks were tried in a throwaway prototype, the **Glass lab**, which the maintainer validated. The three action tokens marked *added* in §4 came after that OK, to make any action work on any theme: merging this file approves them.

## 1. What was decided

- **Every setting of the Glass lab ships, through tokens**, for as much customisation as possible.
- Two themes besides today's look (**plain**): **glass** and **liquid** (Liquid Glass), plus **custom themes**.
- **Ray casting** means refraction, specular highlights and dynamic tinting.
- Dynamic tinting: **vibrancy by default**; adaptive and off are options.
- Actions: **glass on the glass themes, solid on the others**.
- Light following the pointer: off by default, a boolean.
- **Readable by default**, with an opt-in for less readable.
- Modal backdrop: a colour, a blur, or the animated glow.

## 2. At a glance

```tsx
import "magic-pill/styles.css";
import "magic-pill/themes.css"; // only for glass and liquid: plain apps don't load it
import { MagicPill, PillOptics } from "magic-pill";

<MagicPill theme="liquid" />
<PillOptics />                  {/* once, anywhere: what CSS can't do (§5) */}
```

```css
:root { --mp-frost: 6px; --mp-refraction: 0.8 }        /* every pill */
.checkout-pill { --mp-rays: 0; --mp-tint: 0.6 }        /* one pill */
```

## 3. The `theme` prop

On `<Pill>` and `<MagicPill>`, like `variant`. It's written to `data-theme`.

```ts
/**
 * The pill's material. `glass` and `liquid` need `magic-pill/themes.css`.
 * Any other string is written to `data-theme`, to define your own:
 * `[data-mp="pill"][data-theme="paper"] { --mp-surface: … }`.
 * Default: `plain`.
 */
export type PillTheme = "plain" | "glass" | "liquid" | (string & {});

interface PillProps {
  theme?: PillTheme;
  /** `overlay` only. `glow`: an animated backdrop (§6). Any other string is written to `data-backdrop`. Default `plain`. */
  backdrop?: "plain" | "glow" | (string & {});
}
```

Themes and variants combine: `variant` picks the colour, `theme` the material.

**Why a prop and not a token:** a theme changes several rules at once, and CSS can't choose rules from a token's value in every browser. A prop also works in Server Components.

**Why one `themes.css`:** glass and liquid share most of their rules, so two files would mostly repeat each other. Its rules sit in their own sublayer, `magic-pill.theme`, after the look and before the behaviour, whatever the order of the imports. App CSS still beats them without `!important`.

## 4. Tokens

Set on `:root`, on one pill, or anywhere in between, like the existing ones. Booleans are `1` and `0`, so they work in `calc()`.

| Glass lab setting | Token | Values | glass | liquid |
|---|---|---|---|---|
| Frosting | `--mp-frost` | length | `14px` | `3px` |
| Surface colour | `--mp-tint` | 0 to 1 | `0.35` | `0.18` |
| (a status colour stays recognisable) | `--mp-status-tint` | 0 to 1, the least a status keeps | `0.75` (*was 0.55: `danger` read as mauve over light pages*) | same |
| **Ray casting** | `--mp-rays` | 1 / 0 | `1` | `1` |
| Refraction | `--mp-refraction` | 0 to 1 | `0.16` | `0.55` |
| Edge width | `--mp-edge` | length | `10px` | `22px` |
| Colour fringe | `--mp-fringe` | 0 to 1 | `0` | `0.15` |
| Specular highlights | `--mp-light` | 0 (off) to 1 | `0.7` | `0.7` |
| Light direction | `--mp-light-angle` | angle | `235deg` | `235deg` |
| Light's colour | `--mp-light-color` | colour | `#fff` | `#fff` |
| Light follows the pointer | `--mp-light-follow` | 1 / 0 | `0` | `0` |
| Dynamic tinting: vibrancy | `--mp-vibrancy` | saturation, `1` is off | `1.9` | `1.9` |
| Dynamic tinting: adaptive | `--mp-adaptive` | 1 / 0 | `0` | `0` |
| (adaptive's light pill) | `--mp-adaptive-surface` / `--mp-adaptive-on-surface` | colours | `#f9f9f9` / `#141414` | same |
| Actions | `--mp-action` / `--mp-on-action` (existing) | colours | see-through / the pill's text | same |
| (their outline) | `--mp-action-rim` (*added*) | colour | the pill's text at 20% (the action's colour if it's set) | same |
| (the current page's action) | `--mp-action-current` / `--mp-on-action-current` (*added*) | colours | the pill's text / its surface (the action's colours if they're set) | same |
| Actions made of the same glass (*added after the themes were built, at the maintainer's request*) | `--mp-action-glass` | 1 / 0 | `0` | `0` |
| Keep text readable | `--mp-readable` | 1 / 0 | `1` | `1` |
| (more text, more frosting) | `--mp-panel-frost` | length, the least a panel has | `12px` | `12px` |
| Modal backdrop: colour | `--mp-backdrop` (existing) | any background | a dark veil | same |
| Modal backdrop: blur | `--mp-backdrop-blur` | length | `0px` | `0px` |
| Modal backdrop: glow | `--mp-glow-1` / `--mp-glow-2` / `--mp-glow-duration` | colours, time | lavender, green, `14s` | same |

- **`--mp-rays: 0`** turns refraction, highlights and dynamic tinting off together. Each can also be turned off alone (`--mp-refraction: 0`, `--mp-light: 0`, `--mp-vibrancy: 1`).
- On **plain**, `--mp-action-rim` is `transparent` and the current action looks like the others, as today.
- **The backdrop's tokens work with every theme**, plain included, so the blur goes in `styles.css`.

### Any action on any theme

The theme only sets the actions' defaults. Both swaps were rendered on the real pills:

```css
/* Solid actions on glass: any colour */
.my-pill { --mp-action: #f4c542; --mp-on-action: #141414 }

/* Glass actions on a plain pill */
.my-pill { --mp-action: rgb(249 249 249 / 0.12); --mp-on-action: #f9f9f9; --mp-action-rim: rgb(249 249 249 / 0.2) }

/* …with less white on the status colours, so the label keeps 4.5:1 */
.my-pill:is([data-variant="success"], [data-variant="danger"]) { --mp-action: rgb(249 249 249 / 0.06) }
```

On a plain pill, 12% white gives 12.6:1 on neutral, but 4.2:1 on success and 4.4:1 on danger; 6% gives 4.7:1 and 4.8:1. There's nothing behind a plain pill's action to blur or bend, so there it's a see-through fill with a rim. The glass themes' veil (§7) accounts for their own actions; `--mp-readable` can't check an app's own colours.

### Custom themes

```css
/* Frosted paper, built on the material's tokens */
[data-mp="pill"][data-theme="paper"] { --mp-surface: #fffaf0; --mp-on-surface: #2b2118; --mp-tint: 0.8; --mp-frost: 24px; --mp-light: 0 }
```

A custom theme that sets `--mp-tint` gets the whole material from `themes.css` (its actions stay solid). One that only sets colours doesn't need that file.

## 5. `<PillOptics />`

A client component, rendered once, with no props: the tokens decide. It does the three things CSS can't:

| | Without it |
|---|---|
| **Refraction** (`--mp-refraction`, `--mp-edge`, `--mp-fringe`) | frosting, highlights and tinting only |
| **Light following the pointer** (`--mp-light-follow`) | the fixed direction |
| **Adaptive tinting** (`--mp-adaptive`) | vibrancy |

- **Refraction** is one hidden SVG filter per combination of tokens. Its map is drawn with percentages, so it follows the pill's size in every morph with no script.
- **Adaptive** samples the page behind each visible pill as it scrolls (background colours, gradients, images and canvases it's allowed to read), takes their hue for the light, and turns the pill light over light pages, with a margin so it doesn't flicker. Pills without `--mp-adaptive: 1` cost nothing.
- *As built:* it reads see-through layers, gradients (their mean) and the page's own background too, and rewrites a pill only for a change that can be seen. While scrolling, with 4 adaptive pills and a CPU slowed down 4 times, the main thread is busy 8% of the time on a calm page and 27% over bands of alternating colours (mostly the pills' own fades; reading the page is about 2%), against under 1% without. A change of token is heard through a 1ms transition of the registered properties it feeds, so nothing is polled.
- **Glass actions:** an element with a `backdrop-filter` hides the page from what's inside it, so with `--mp-action-glass: 1` the pill's glass moves to a layer under its content (`data-actions="glass"`, a `::before`), and its actions get their own filters once the content has faded in (a fading parent hides the page from them too). Not in an open panel, where the layer would scroll away, nor with reduced motion. Their lens is the pill's at their scale.
- `Pill` keeps a small list of the themed pills on the page for it. Plain pills aren't in it.

## 6. The modal's backdrop

- **Colour:** `--mp-backdrop`, as today. **Blur:** `--mp-backdrop-blur: 10px`. They fade with the pill.
- **Glow:** `backdrop="glow"`, two soft lights drifting slowly over the colour (in `themes.css`). It stands still with reduced motion, and is the plain colour with less transparency or more contrast. Measured with a CPU slowed down 4 times, it keeps the main thread busy under 2% of the time (repainted each frame; a rotating layer would cost nothing, but would spin an app's own `--mp-backdrop` too).

## 7. Readable by default

1. **Contrast** (`--mp-readable: 1`; `0` leaves it to the app). A veil, black under light text and white under dark text, just strong enough for the text whatever the page shows. Its strength is computed in CSS from `--mp-surface` and `--mp-tint`, so it also works for custom colours, with no script.
2. **Panels are frosted more** (`--mp-panel-frost`), since long text over a busy page is tiring. On its own, as in the Glass lab: *first built under `--mp-readable` too, which left see-through panels with it off (the maintainer, 2026-11-25).*

Measured in Chromium, on 8 extreme backdrops (white, black, pure colours, grey) and 6 tints from 0 to 0.9:

| Surface | Worst contrast, readable | Worst, not readable |
|---|---|---|
| `#141414` (neutral) | 4.84:1 | 1.02:1 |
| `#3f7253` (success) | 4.54:1 | 1.02:1 |
| `#c2303e` (danger) | 5.07:1 | 1.02:1 |
| `#f9f9f9` (adaptive) | 4.60:1 | 1.05:1 |
| Random colours | 99.4% of 5,760 cases at 4.5:1 or more; the worst, a vivid magenta, 3.56:1 | 63% |

**One change from the lab:** its glass actions put white text on a lighter patch of glass, about 3.4:1 at worst. *As built:* they're filled with the lightest grey the text can sit on, at 30%, instead of white (first proposed: 12% white and a stronger veil, which made all the glass darker). They stand out over dark pages and are drawn by their rim over light ones, and the glass keeps the lab's brightness. Checked on the built pills, action included: 640 cases, the worst at 4.80:1.

## 8. What it degrades to

| Situation | Result |
|---|---|
| Safari, Firefox | Everything but refraction. A `url()` in `backdrop-filter` makes Safari drop the whole filter while `@supports` says yes, so they're left out by name; lifted when they support it |
| Chromium without GPU compositing | Refraction would be drawn off-centre (by the size of the shadow): `<PillOptics>` leaves it out when the browser has no hardware WebGL, which is how it can tell |
| `prefers-reduced-transparency`, `prefers-contrast: more`, forced colours | The plain look |
| `prefers-reduced-motion` | No drifting glow, no light following the pointer |
| No relative colours or `pow()` in CSS | The plain look |
| `unstyled` | No theme |

**Not tested yet:** Safari, Firefox and phones. They're part of the work, before merging.

## 9. Cost

| | Now | After, estimated | Budget |
|---|---|---|---|
| Quick start | 9.14 kB | +0.1 kB | 9.25 → 9.4 kB |
| Primitive | 4.69 kB | +0.1 kB | 4.75 → 4.9 kB |
| Everything | 13.42 kB | +2.1 kB (`PillOptics` and the above); *as built: 17.05 kB* | 13.5 → 17.25 kB (*15.75 kB first; the maintainer, 2026-11-25: "use as much space as you need"*) |
| `styles.css` | 2.51 kB | +0.1 kB | 2.6 → 2.75 kB |
| `themes.css` | | 2 kB, only if imported | new: 2.25 kB |

No new dependency. In frame traces on an M2 Pro (a queue of three notifications while the page scrolls, three rounds, 2x), plain, glass and liquid had the same median (about 12 ms) and 95th percentile (26 ms).

## 10. Delivery

Each its own PR, with tests that fail without it, the README, the CHANGELOG and before/after frames:

1. **The material:** `theme`, `themes.css` (glass, liquid without refraction, vibrancy, highlights, glass actions, readable), the fallbacks.
2. **The backdrop:** `--mp-backdrop-blur`, `backdrop="glow"`.
3. **`<PillOptics>`:** refraction, then the pointer, then adaptive (one commit each).

## 11. Decisions (the maintainer, 2026-11-25)

| | Decided |
|---|---|
| 1. Names | `theme`, `backdrop`, `<PillOptics>`, and the tokens of §4 |
| 2. Ray casting on glass | On by default, as in the lab (`--mp-rays: 0` turns it off) |
| 3. Files | One `themes.css` for both |
| 4. Budgets | §9 |
| 5. Actions | Glass or solid on any theme (§4) |
