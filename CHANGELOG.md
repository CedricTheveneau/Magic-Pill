# Changelog

## [Unreleased]

### Added
- **Beta:** the Electron, in an optional entry, `magic-pill/satellites`: a small round pill that splits out of the host to keep a background activity in reach. `pill().electron()`, `updateElectron()` and `endElectron()`; on `<MagicPill>`, `satellites`, `pathname`, `electronSide`, `electronLine`, `keepElectronsOut`, `electronEnding` and `arrange`. It's tucked into the pill on the page that started it and while a notification has the pill, a tap goes back to that page, and the pill and its electrons stay centred as a group
- **Beta:** an electron's orbitals, its quick actions fanned out around it (`orbitals` on `pill().electron()`): opened by a long press (slide to one and release to run it), hovering with a mouse, or a tap (`orbitalsOpenOn`, with a first orbital going back), and the keyboard as a menu. On an arc away from the screen's edge, clear of the pill and the other electrons; when they don't all fit, a wheel that turns with the mouse wheel, a drag along it or the arrow keys, and stays open until a tap away. `orbitalLabels`, `orbitalsStayOpen`, `backLabel`, and the tokens `--mp-orbital-size`, `--mp-orbital-distance`, `--mp-orbital-spread`, `--mp-orbital-stagger`, `--mp-hover-delay` and `--mp-long-press`
- **Beta:** the page's actions, the design's wide atom: `usePillActions()` (from `magic-pill/satellites`) and `pill().setActions()` set one or more actions for the current page, next to the pill. `actionsStyle` (`"detached"`, a pill of their own that comes out of the host with the goo, or `"inside"`, after a divider), `actionsSide` (`"start"`, `"end"` or `"beside"`), `actionsOrientation` (`"auto"`, turning across when room runs out, `"horizontal"`, `"vertical"`) and `actionsLabel` on `<MagicPill>`
- **Beta:** `actionsWheel` on `<MagicPill>`: short of room, the page's actions show what fits and the others turn in, like the orbitals' wheel (a mouse wheel, a drag, a swipe or the arrow keys, each one snapping into place, the ends that hide some fading out), instead of turning across; in the pill, the cut starts right at the divider. And `nearestToPill` (`"actions"`, the default, or `"electrons"`): which are nearer the pill on a side they share
- `labels` on `<PillNavbar>`: which labels show at rest. `"auto"` (the default) shows the current page's while the pill has room for it and folds it when it doesn't, `"current"` always shows it, `"closed"` shows none. An electron stays in the pill's row when the navbar can fold to make room, and only goes above it when it still doesn't fit
- `PillProgress`: a progress ring around a value or an icon, in the text colour (`--mp-progress-size`, `--mp-progress-width`)
- The split's tokens, for a sidebar's flag: `--mp-duration-split` and `--mp-duration-join` (the enter and exit durations by default), `--mp-ease-split` (`bouncy`, the default, `pop`, `smooth` or any CSS easing), `--mp-goo` (`12`; `0` for no neck) and `--mp-electron-start` (`1`)

### Fixed
- Opening an electron's orbitals no longer stutters: each orbital's goo ran an SVG filter over the whole screen; it now only covers the two pills it joins (60 frames a second where it fell to about 30, with frames of up to 180 ms)
- Two electrons given an empty `id` are two electrons, instead of one flickering between them
- The page's actions grow away from the pill when an action's label opens on hover, instead of over it
- When the host changes placement or turns, its electrons and actions tuck in while it travels and come out at its new place; one that changes side or row (or actions that turn) goes back into the pill and out again, instead of sliding across it or jumping
- An electron's orbitals bulge out of its centre one after the other and fold back into it, quicker than they came and in the other order, as the design drew them. Next to another electron, two of them used to slide sideways into each other above it, merge and vanish; the electron's shadow flickered as they opened, and on the glass themes they switched colour at the end. On their way back, they're out of reach (a pointer over them can't hold them); when their electron ends from one of them, they're in at once; on their way out, one under the pointer doesn't light up
- With the orbitals open (they stay open after an action), a press on the electron slides onto one at once, instead of waiting for a long press again: it only worked once until a tap away
- For a notification, the electrons and the actions go into the pill with it, once their content has faded, instead of staying out while it closes and then chasing it; back from the notification, they come out once the pill has grown back, not out of a half-grown pill
- Beside the pill, the actions and the electrons make a row of their own, clear of each other and kept on the screen (on a phone, four actions covered the second electron and could run off the screen); automatic actions turn across there when the row is too long, and a row that still doesn't fit wraps into a further one
- The actions slide with the group (gathered to spread, another satellite coming or going), instead of jumping; and whether they turn across is decided again once a resize settles, not only after a render
- An orbital's label is a small pill of the electron's look (its theme and colours), instead of always light on dark
- A navbar too long for its pill scrolls inside it, instead of its last items being cut off: a sidebar's, and a horizontal one once its labels have folded; where the browser has scroll-driven animations, the ends that hide some fade out
- An electron and the page's actions come out of the pill and go back into it as the orbitals do, drawing themselves the whole way: on the glass themes they no longer switch colour at the end; changing sides, they no longer flicker between going in and coming out. For a notification, they go into the pill's centre as it closes to a circle
- The actions go into the pill and come out of it with the goo when `actionsStyle` changes, instead of disappearing; turned while they were in, they come out turned, instead of at their old shape first. Two satellites passing each other (`nearestToPill` changed) melt together as they meet
- An electron's orbitals keep clear of the page's actions, as they do of the other electrons

### Changed
- A navbar whose current page's label has no room folds it (`labels="auto"`, the new default), instead of the pill cutting its last items off. `labels="current"` keeps the old behaviour
- A sidebar's flag comes out of the sidebar's edge as a droplet, with goo: a neck forms between them, stretches and snaps, on a bouncy curve, and it goes back into the sidebar the same way. It no longer pops in at its spot with a short bridge, nor scales in and out. With reduced motion it still fades. On the glass themes, its blur waits until it's clear of the sidebar

## [9.3.0] - 2026-11-27
A token for the content's fade, the built-in icons deprecated, and two fixes. Nothing to change in your code: the icons still work as before, and leaving them can wait until the next major version.

### Added
- `--mp-duration-fade` (`150ms`): how long the content takes to fade out before the pill shrinks, and in once it has grown, like the other duration tokens

### Deprecated
- The twelve built-in icons (`ArrowIcon`, `BoxIcon`, `CheckIcon`, `CloseIcon`, `CouponIcon`, `DocumentIcon`, `HelpIcon`, `InfoIcon`, `MailIcon`, `PhoneIcon`, `PlusIcon`, `UndoIcon`) and `IconProps`: bring your own icons, any React content fits an icon slot (README, "Icons"). They still work, unchanged, and go in the next major version. The defaults the library draws itself stay

### Fixed
- React 18 no longer warns about `useLayoutEffect` when the pills render on the server (L31)
- An `<img>` in an icon slot (a notification's, an action's, a field's) is sized like an `<svg>`, 1em square, instead of its file's own size

## [9.2.0] - 2026-11-26
Placement changes through the circle, and new layouts for notifications: in rows on any host, and as cards or flags in a sidebar. One default changes: a pill whose placement changes now closes to a circle, travels, and opens at its new place; `moveThroughCircle={false}` keeps the old travel at full size. Nothing else to change in your code.

### Added
- `moveThroughCircle` on `<Pill>` and `<MagicPill>` (default `true`), see Changed
- Notifications in rows: `notificationLayout="rows"` on `<MagicPill>`, `layout: "rows"` on a notification (it wins over the host's), or `layout="rows"` on `<PillNotification>`. The actions go under the message when they need the room (the message wraps, or there's an action and a panel's trigger), lined up with it; one action beside a short message stays on its line. On every host. A sidebar slides to and from a notification in rows with `swap="always"`, turning as it goes
- Notifications as cards, in a sidebar: `notificationLayout="card"` or `layout: "card"`. A column of the sidebar's width, at least `--mp-card-width` (`12.5rem`): the icon on top, the divider across, the message centred, the actions full width with their labels. The sidebar stays vertical, through the circle, or sliding with `swap="always"`. A horizontal host shows it in one row
- A sidebar's flag: `notificationLayout="flag"` or `layout: "flag"`, on a `left` or `right` host with a base layer. The sidebar stays, usable, and the notification comes out of its edge as a pill of its own (`data-layout="flag"`), next to the navbar item it's about (`at`, its `href`) or in the middle. It pauses while pointed at or focused, slides to the next one and moves to its section, and opens its panel beside the sidebar. Its motion, a pop out of the sidebar with a short bridge while they part, will follow the Electron's once it's designed. Elsewhere, a flag shows in the pill itself
- Navbar links carry `data-href`, their item's `href` as given (the rendered one may carry the app's base path)

### Changed
- A pill whose placement (or orientation) changes goes there through the circle: it closes to a circle where it is, the circle travels, and it opens at its new place, instead of travelling at full size while its content is laid out for the new place. Nothing jumps, even from the bottom of the screen to a side, where it turns vertical inside the circle. `moveThroughCircle={false}` travels at full size as before; with reduced motion it still changes place at once
- A sidebar host (`placement="left"` or `"right"`) shows its notifications as horizontal pills, like any other host: it turns horizontal while it's a circle, and back once they're gone. Between its base layer and a notification, it goes through the circle even with `swap="always"`, unless the notification is in rows or a card

### Fixed
- A vertical pill at rest is a circle: it kept the width of its hidden content (an oval as wide as the sidebar's labels)
- A pill that hides plays its whole exit on iOS: when the page scrolled and Safari's toolbar folded away at the same time, the viewport's change restyled the page and cut the exit's transitions short, so the pill vanished at once. The exit (the content fading, the scale and the visibility) is now played by script on top of the stylesheet, with the same timings; a pill asked back mid-way grows back from where it was, as before
- Form fields draw their focus ring for the keyboard only: browsers matched `:focus-visible` on text fields, lists, steppers and code fields even after a click or a tap. A field focused with a pointer now gets `data-pointer-focus`, and `forms.css` leaves it without a ring (the caret shows where typing goes). Tabbing to a field still draws it. An app's own global `:focus-visible` outline no longer shows on the bare controls either (text fields, the stepper's value, a list's options): browsers drew it after a click, and with the keyboard it doubled the field's ring

## [9.1.1] - 2026-11-26
A fix for Next.js apps. Nothing to change in your code.

### Fixed
- `magic-pill/forms.css` builds with Next.js's Turbopack (and anything else that uses Lightning CSS): 9.1.0 failed the whole build with "Invalid pseudo class after pseudo element". The open list's rule now reads `select:open::picker(select)`, with the same effect, and a test keeps every stylesheet clear of it

## [9.1.0] - 2026-11-25
Themes (frosted glass, Liquid Glass, yours), forms and a calendar, scenes, and pills that make room for each other. Nothing to change in your code: forms, themes and the calendar are optional, each with its own stylesheet.

### Added
- Pills with the same fixed placement make room for each other instead of overlapping: the first one set up keeps its spot, the next ones line up after it (below it at the top of the screen, above it at the bottom, further in from the edge on the sides), and take its place when it hides or unmounts. An open panel covers the others. On by default, for `<MagicPill>` hosts too; `ladder={false}` leaves a pill out
- Themes: the `theme` prop on `<Pill>` and `<MagicPill>`, written to `data-theme`. `glass` and `liquid` come in an optional stylesheet, `magic-pill/themes.css`; any other name is yours to style, on the same glass if you like
  - Set through tokens: `--mp-tint`, `--mp-status-tint`, `--mp-frost`, `--mp-panel-frost`, `--mp-rays`, `--mp-light`, `--mp-light-angle`, `--mp-light-color`, `--mp-vibrancy`, `--mp-readable`
  - Text stays readable whatever the page shows behind the pill, with no script: a veil worked out from the pill's own colour. `--mp-readable: 0` opts out
  - `<PillOptics />`, rendered once, for what CSS can't do: refraction (`--mp-refraction`, `--mp-edge`, `--mp-fringe`; Chromium only), a light that follows the pointer (`--mp-light-follow`), and adaptive tinting, which takes the colours of the page behind the pill and turns it light over light pages (`--mp-adaptive`, `--mp-adaptive-surface`, `--mp-adaptive-on-surface`)
  - `--mp-action-glass: 1` makes the actions of the same glass as the pill: the light on their edges and, with `<PillOptics>`, their own refraction and frosting
  - Solid when the system asks for less transparency, more contrast or forced colours, and where the browser can't draw it
- The modal's backdrop: `--mp-backdrop-blur` blurs the page behind it, and `backdrop="glow"` (with `magic-pill/themes.css`) adds two soft lights drifting over it (`--mp-glow-1`, `--mp-glow-2`, `--mp-glow-duration`), still with reduced motion. Any other `backdrop` is written to `data-backdrop`, for one of your own
- `--mp-action-rim`, `--mp-action-current` and `--mp-on-action-current`: an outline for the actions, and the current page's own colours. Together with `--mp-action`, they make actions solid or see-through on any theme
- Text and action colours for each variant: `--mp-on-neutral`, `--mp-on-success`, `--mp-on-danger` (the text), `--mp-neutral-action`, `--mp-success-action`, `--mp-danger-action` (the actions) and `--mp-on-neutral-action`, `--mp-on-success-action`, `--mp-on-danger-action` (the actions' text), on every theme. They default to `--mp-on-surface`, `--mp-action` and `--mp-on-action`, so nothing changes without them
- Panels: `titleAction`, an action at the end of the title's row, and `footer`, actions before the close button, which is then an outline. In notifications' `panel` too. Tokens: `--mp-accent`, `--mp-on-accent`, `--mp-close`, `--mp-on-close`, `--mp-close-rim`
- Several panels in one pill: a `name` on `<PillPanel>`, the same `panel` on `<PillPanelTrigger>`, and `openPanel(name?)` and `closePanel()` from `usePill()`
- Navbar items that are actions (`{ onClick, label }`) or that open a panel (`{ panel, label }`), next to links. `NavItem` is now one of `NavLinkItem`, `NavActionItem` and `NavPanelItem`
- Scenes: `scene` on `<Pill>`, or on `<MagicPill>` for its base layer, names what it shows. When it changes, the pill goes from one content to the other through the circle, or sliding (`sceneChange="slide"`; `swap="always"` on the host), instead of jumping
- Forms, in an optional `magic-pill/forms.css`: fields on native controls, with no dependency, for panels and for the pill itself. The browser's validation shows under them, and the pill stays above the on-screen keyboard
  - `PillForm` (`look`: solid, soft or outline, for every kind of field, open lists and calendars included, which are of the same glass as the pill on the glass themes; `layout`; `errors`; `disabled`; `busy`), `PillInput` (12 types, icons, suffixes, suggestions), `PillTextarea`, `PillSelect`, and `PillField` for a control of yours
  - Tokens that follow the actions by default: `--mp-field`, `--mp-on-field`, `--mp-field-rim`, `--mp-field-size`, `--mp-field-radius`, `--mp-field-gap`, `--mp-field-scheme`, `--mp-placeholder`, `--mp-label-font`, `--mp-label-style`, `--mp-label-weight`, `--mp-error`, `--mp-list`, `--mp-on-list`, `--mp-picker`
  - `PillSlider`, `PillSwitch`, `PillCheckbox`, `PillChoices` (a list, one bar where the choice slides, chips; one or several), `PillStepper` and `PillFields`. Tokens: `--mp-track`, `--mp-track-size`, `--mp-thumb`
  - `PillCode` (a one-time code), `PillFile` and `PillColor`
  - `PillDate`, with an optional `magic-pill/calendar.css`: a calendar in the pill's language for dates, months, weeks, times, and dates and times, in a popover or `inline`, with the native inputs' values, in the reader's language and with the keyboard
  - `PillFormPanel`: a panel that is a form. It sends, waits, closes, or says what went wrong
  - `PillSubmit`, the action that sends a form and says so meanwhile: `busyLabel`, one label or several that follow one another, also on `PillFormPanel`. `onSend` on `PillForm` gets the data, waits, and says what went wrong
  - A form of the base layer that's being filled in isn't replaced by a notification, which waits for its panel to close

### Changed
- A pill's open panel sits one level above the other pills (`--mp-z-index` + 1) until it has closed
- A panel's close button shows its icon, and its label on hover and focus, like the other actions. `closeExpanded`, on `<PillPanel>` or in a notification's `panel`, always shows it
- Colours change together: the text's and the actions' now fade like the pill's
- TypeScript: `NavItem` is a union now, so an `interface` can't extend it: extend `NavLinkItem` instead
- Size, measured and checked in CI: the quick start (`MagicPill` + `pill()`) adds about 10.2 kB of gzipped JavaScript and 3.1 kB of gzipped CSS to an app; a hand-written `Pill` with its parts, about 6.2 kB of JavaScript. A form panel adds about 3.2 kB to the quick start, and the calendar about 5 kB, only for apps that use them

### Fixed
- A notification triggered with the keyboard from inside the pill (an action of the base layer, for instance) never timed out: the pill thought it still had the focus
- A panel's footer changed colour at once when the variant changed, ahead of the pill
- An action with no icon had more space after its label than before it
- A scrolled panel's text showed again under its close button
- A navbar too wide for its pill (a narrow screen, a long label) pushed its last items out of it: the open label folds while another item is pointed at or focused with the keyboard, and a label that still has no room ends with an ellipsis

## [9.0.0] - 2026-11-23
9.0.0 is the first stable release of Magic Pill; earlier versions are deprecated (upgrading from 8.x: [MIGRATING.md](./MIGRATING.md)). It's a breaking release with a new API, but most apps get shorter.

### Added
- The pill primitive: `Pill` with its parts `PillIcon`, `PillDivider`, `PillMessage`, `PillActions`, `PillAction`, `PillPanel` and `PillPanelTrigger`, plus the `usePill()` hook to write your own templates
  - Presence levels (`hidden`, `rest`, `compact`, `expanded`, `panel`), controlled or not
  - Placements: `inline`, fixed at an edge or corner, or `overlay` (a native modal `<dialog>`)
  - Horizontal or vertical orientation, and `neutral`, `success`, `danger` or custom variants
  - Stateless parts and `PillAction` can be rendered by React Server Components without becoming client code
  - The pill animates its real size, width and height together: a message that wraps to several lines, a panel opening or closing, a sidebar's labels unfolding. Its corners stay right at every frame: half the one-line pill's height, so a taller pill is a rounded rectangle, up to `--mp-radius-panel` for a panel
  - Vertical pills line their items up along the screen edge they sit on (`left` or `right`), and a right-hand sidebar opens its labels towards the middle of the screen, so the icons stay in line; mirrored in right-to-left pages. The `--mp-align` token (`start`, `center`, `end`) changes the alignment; an inline vertical pill stays centred
  - When its `placement` changes, the pill travels to its new place from where it was, resizing on the way (e.g. into a sidebar), instead of jumping there: handy for a pill that follows the scroll, or a guided tour
  - The overlay pops in and scales out like any other pill, and its backdrop fades in and out, in every browser. The dialog closes once its exit has played; its actions stop responding at once. With reduced motion, it all fades briefly
  - `closeOnBackdropClick` closes the overlay (or its panel first, like Escape) with a click outside it. Off by default
  - The panel grows out of the pill (upwards from a bottom pill, sideways from a sidebar) and closes back into it. Its content fades in as it grows, behind an edge that fades out as the panel settles, instead of appearing all at once
- Link actions take a `linkComponent` (e.g. Next's `Link`) and only render relative, `http(s):`, `mailto:` and `tel:` URLs. Any other scheme, such as `javascript:`, renders no link
- Templates built from those parts:
  - `PillNotification`: icon, message, an action (`onClick` or `href`) and an optional expandable panel. Every content is a React node, so nothing is parsed as HTML any more
  - `PillNavbar`: a `<nav>` of icon links for any router (`pathname`, `linkComponent`). Items match whole path segments (in linear time, whatever the URL), the longest match wins, and the active link gets `aria-current="page"`
- `<MagicPill>` and `pill(name)`: mount the host once, then call `pill().notify({...})` from anywhere, including outside React. This replaces the 8.x Context, Provider and Initializer (about 135 lines of user code)
  - Notifications queue first in, first out, take the pill over, then hand it back to the host's **base layer** (its children, e.g. a `PillNavbar`), so navbar and notifications are no longer exclusive
  - `update(id, patch)`, `dismiss(id?)`, `clear()`, and `notify()` with an existing `id` to update in place
  - `duration` per notification or on the host (`Infinity` keeps it). The countdown pauses while a mouse or pen hovers the pill, on keyboard focus, with an open panel and in a hidden browser tab. A tap doesn't pause it
  - Action clicks dismiss the notification unless the handler calls `event.preventDefault()`; `onDismiss(id, reason)` reports `timeout`, `action`, `dismissed` or `cleared`
  - `render` for your own template, which keeps the queue, timing and animation
  - `expanded: true` on a notification's action (or its panel trigger) keeps its label open, not only on hover and focus, so phones show it too
  - Several named hosts per page (`<MagicPill name="sidebar">`), and `idle="rest"` for a discreet resting circle
  - Shape changes: the next notification in the queue replaces the current one in one movement, without closing the pill: the current one slides out through the top while the pill resizes, and the next one comes in from the bottom (the other way round for a pill at the top of the screen). Other changes (the navbar and a notification) collapse to a circle, swap the content there and grow back: the content fades out before the pill shrinks, and in once it has grown, so text never rewraps or gets cut off along the way. `swap="always"` slides between the base layer and notifications too, so it all feels like one pill; `swap="never"` uses the circle everywhere. With reduced motion, the pill fades instead
  - Announcements go through a separate live region, so a hidden pill can leave the accessibility tree
  - On the server, `pill()` does nothing (it warns in development), so requests never share notifications
- `usePillQueue(name)`: the queue as a hook, to build your own host
- Twelve icons as components (`ArrowIcon`, `BoxIcon`, `CheckIcon`, `CloseIcon`, `CouponIcon`, `DocumentIcon`, `HelpIcon`, `InfoIcon`, `MailIcon`, `PhoneIcon`, `PlusIcon`, `UndoIcon`): drawn in `currentColor`, decorative by default
- A new stylesheet, `magic-pill/styles.css`:
  - every rule sits in a `magic-pill` cascade layer and targets `data-mp` attributes, so your own CSS overrides it without `!important` and no class names collide;
  - global resets on links and buttons, such as `a { color: inherit }` or `button { background: none }`, leave the actions alone: their look lives on an inner `[data-mp="action-body"]`;
  - it loads no fonts (it uses your page's fonts unless you set `--mp-font-text`/`--mp-font-accent`);
  - it's sized in `rem`, fits phone screens and safe areas, and supports reduced motion and forced colours;
  - labels open on hover only on devices that can hover, so a tapped action doesn't stay open on touchscreens;
  - the pill pops in and scales out from its centre; `--mp-scale-origin` changes that (e.g. `bottom` to come out of the edge a bottom pill sits on)
- A migration guide from 8.x, [MIGRATING.md](./MIGRATING.md), shipped in the package
- The README is rewritten for v9: quick start, notifications, the host and its base layer, the primitive, React Server Components, styling and tokens, accessibility and security

### Changed
- The published JavaScript is readable (not minified) and has no source maps: your bundler minifies it, so it doesn't change what your app ships. The package is about 253 kB unpacked (201 kB for 8.1.0, minified and with source maps)
- The danger colour is darker (`#c2303e` instead of `#fc5d6a`), so the light text on it meets WCAG AA contrast
- Size, measured and checked in CI: the quick start (`MagicPill` + `pill()`) adds about 8.25 kB of gzipped JavaScript and 2.45 kB of gzipped CSS to an app (both minified, as your bundler does); a hand-written `Pill` with its parts, about 3.8 kB of JavaScript, most of it the size animation

### Removed
- The 8.x API: the `pillData` prop and `mode`, the types (`MagicPillType`, `Mode`, `NotificationIcon`, `CTAIcon`, `MagicPillNotification*`, `MagicPillNavbar*`), the 15 handlers (`updateMode` … `handleActiveNavItem`), `Icons`, `CTAIcons`, `getIconComponent` and `defaultPillData`
- The 8.x stylesheet: its `.magicPill`/`.CTA`/… classes, the `--mp__*` variables and the Google Fonts `@import`. The `magic-pill/magicpill.css` and `magic-pill/dist/magicpill.css` paths now serve the new stylesheet
- Raw HTML content: `info.content` was injected with `dangerouslySetInnerHTML`. Contents are React nodes now

## [8.1.0] - 2026-11-19
A maintenance release: bug fixes, accessibility, a modern build and an up-to-date toolchain. Imports, props and the documented stylesheet path are unchanged.

### Added
- Accessibility: screen readers announce notifications (the pill is a polite live region, with `role="status"` in notification mode)
- Accessibility: the auto-hide also pauses while the pill holds keyboard focus, not only on hover
- Accessibility: with `prefers-reduced-motion: reduce`, the entry and exit animations become short fades without the overshoot, and size transitions are instant
- Accessibility: the info toggle exposes `aria-expanded` and `aria-controls`
- An `exports` map: `magic-pill`, the stylesheet at the existing `magic-pill/dist/magicpill.css` and at `magic-pill/magicpill.css`, and `magic-pill/package.json`
- `"sideEffects": ["*.css"]`, so bundlers can tree-shake the JavaScript while keeping the stylesheet
- README: requirements, an accessibility section, and a note on the Google Fonts `@import`, which Next.js 16's default bundler (Turbopack) drops

### Changed
- `react` and `react-dom` (>= 18) are now the only peer dependencies. `next` and `typescript` were never needed at runtime, and listing them caused peer warnings in plain React apps
- The ESM build is now `dist/index.mjs`, with its own typings (`dist/index.d.mts`), instead of `dist/index.esm.js`, so Node.js never mistakes it for CommonJS. `module` points to it, and the CommonJS build stays at `dist/index.js`
- Because of the `exports` map, files inside the package can no longer be imported directly (e.g. `magic-pill/dist/index.js`), apart from the stylesheet

### Fixed
- A notification shows up again when its content changes (message, icon, CTA or info panel). Before, only a change of `mode` replayed it, so every notification after the first one stayed hidden
- The pill no longer hides itself while hovered when the pointer arrived during the entry animation, or was already on the navbar when a notification replaced it
- Switching from a notification to the navbar during the entry animation no longer makes the navbar hide itself 7.5 s later, and no timer keeps running after `MagicPill` unmounts
- `MagicPill` can be rendered directly from a React Server Component (Next.js App Router): each component keeps its `"use client"` directive, which the old build stripped
- The missing `info` CTA icon: it was a valid `CTAIcon` value but rendered nothing
- Icon components (`Icons`, `CTAIcons`) now accept SVG props (`className`, `aria-*`, `width`…) and pass them to the `<svg>`
- The shipped `dist/magicpill.css` is always the real stylesheet, copied as-is from the source
- README: the setup guide's code samples (wrong import path, a check that could never fire, an unused element), the CDN snippets that couldn't work (there's no UMD build), the contact address and several typos

### Security
- Releases are built and uploaded by GitHub Actions with npm Trusted Publishing, with a provenance attestation, instead of a long-lived access token. They're staged on npm and only go live once a maintainer approves them with 2FA (staged publishing)
- The development dependency tree has no known advisories any more (`npm audit`: 16 advisories, including 1 critical, down to 0), and CI fails on new high or critical ones
- README: a warning that `info.content` is rendered as raw HTML and must never contain user input, and that links from users should be restricted to `http(s)` or relative URLs

### Maintenance
- Build: tsdown replaces Rollup 2 and Babel, with TypeScript 6.0 and the automatic JSX runtime
- Tests: a Vitest test suite, run in CI and before every publish
- CI: typecheck, test and build on Node 22, 24 and 26 for every pull request. The publish workflow runs on Node 26, builds once, typechecks and tests first, and has a dry-run trigger. GitHub Actions are pinned to commit SHAs
- Dependabot version updates for the library, the demo and the GitHub Actions, and an `.nvmrc` (Node 26) for contributors
- Demo app tooling upgraded to Next.js 16, React 19 and ESLint 9. It still showcases v7
- Housekeeping: changelog dates fixed and entries backfilled, the demo app no longer ignored by the root `.gitignore`, a typo in the publish workflow's name, unused repository secrets removed, and the unused `cdn` field removed from `package.json`

## [8.0.3] - 2025-06-28
### Changed
- Added prefix to Magic Pill's CSS variables to prevent conflicts with generic variable names
- Updated `README.md` with fixes to file setup instructions

### Fixed
- Changed `handleActiveNavItem` handler behavior to be less restrictive - anchors now count as active navbar items

## [8.0.2] - 2025-06-26
### Fixed
- Fixed type export issue

## [8.0.1] - 2025-06-26
### Added
- Added `*.tsbuildinfo` to `.gitignore`

### Changed
- Minor improvements to typing with better TypeScript interfaces
- Reduced package size by removing unnecessary files and reworking all the handlers
- Updated the "How to use" section of the `README.md` file to better reflect real usage of the package with Context API and added comprehensive documentation for icons and handlers

### Fixed
- Fixed the behavior of the entry and exit animations of Magic Pill
- Improved navbar mode's semantic HTML structure for better accessibility
- Enhanced navbar's active state behavior and link transitions

## [8.0.0] - 2025-06-24
### Added
- Complete TypeScript rewrite with comprehensive type definitions
- New Navbar mode for Magic Pill with full TypeScript support
- Improved component architecture with separate Notification and Navbar components
- Enhanced type safety with discriminated unions for different modes
- New strongly-typed icon system
- Added TypeScript build configuration with proper source maps
- Added proper TypeScript development tools and dependencies
- Added comprehensive JSDoc comments for better IDE support

### Changed
- Migrated entire codebase to TypeScript
- Updated build system to handle TypeScript files
- Improved code organization with feature-based directory structure
- Enhanced type definitions for better developer experience
- Updated documentation to reflect TypeScript support
- Refactored component props for better type inference
- Updated all examples in documentation to use TypeScript

### Fixed
- Improved type safety across the entire codebase
- Better handling of optional properties with proper TypeScript nullability
- More consistent prop types and interfaces
- Fixed potential type-related runtime errors
- Improved type checking for icon variants

### Breaking Changes
- Removed deprecated JavaScript files
- Updated minimum TypeScript version requirement to 5.0
- Changed some prop types to be more strict
- Removed support for untyped icon strings

## [7.1.3] - 2024-11-17
### Changed
- Updated the "Disclaimer" and "What's next ?" sections of the README file

### Added
- Added a box-shadow to Magic Pill

### Fixed
- Fixed a layout shift when going from collapsed info to expanded info
- Added a min-width to Magic Pill when info is expanded to keep it looking good

## [7.1.1] -> [7.1.2] - 2024-11-17
### Fixed
- Fixed the default style of CTA with a link. It no longer is underlined and blue

## [7.1.0] - 2024-11-17
### Fixed
- Reworked the way the conditional CTA and button rendering works

## [7.0.1] - 2024-11-16
### Fixed
- Removed defaultProps, as it will no longer be supported in future versions of React

## [7.0.0] - 2024-11-16
### Fixed
- Fixed version compatibility issues with NextJS / React

## [6.1.28] - 2024-11-16
### Fixed
- Fixed a wrong display condition for info panel

## [6.1.27] - 2024-11-16
### Fixed
- Fixed the issue with stuttering exit animation 

## [6.1.26] - 2024-11-15
### Fixed
- Backtracked to V6.1.20 after various fails. V6.1.20 was the closest to actually being usable 

## [6.1.22] -> [6.1.25] - 2024-11-15
### Fixed
- Refined a bit more the logic regarding classes applied to Magic Pill upon animations to prevent buggy visuals (still in progress)

## [6.1.21] - 2024-11-15
### Fixed
- Refined a bit more the logic regarding entry and exit animations to prevent buggy visuals (still in progress)

## [6.1.20] - 2024-11-15
### Fixed
- Implemented a more refined logic to prevent animation on hover and resume it on mouse leave (still in progress)
- Simplified the info div animation and removed the ::after pseudo-element
- Added a new animation for the CTA : when the info div is expanded, the button moves to the center of Magic Pill

## [6.1.19] - 2024-11-15
### Fixed
- Added the import of useRef, which I forgot in the previous release

## [6.1.18] - 2024-11-15
### Fixed
- Reworked the logic regarding animation pausing on hover (still a work in progress)

## [6.1.17] - 2024-11-15
### Added
- Added logic to prevent exit animation when the mouse enters Magic Pill. Once the mouse leaves, a five seconds timer starts, if the mouse hasn't entered, it triggers the exit animation, if it enters again, the timer is reset to five seconds.
- Added a LICENSE file
- Added a NOTICE file
- LICENSE and NOTICE files will be added to the package

### Changed
- README file

## [6.1.16] - 2024-11-15
### Fixed
- Fixed various display issues
- Improved layout breaks
- Started fixing info pop-up display issues
- Fixed z-index issues

## [6.1.15] - 2024-11-15
### Fixed
- Fixed an issue regarding the useEffect which could create errors leading to crashes because of bad syntax. It's now fixed and the component should render correctly without causing crashes

## [6.1.14] - 2024-11-15
### Added
- Added a default props, so that Magic Pill displays a friendly default message if there is an issue with the given props

### Fixed
- Fixed a display issue when Magic Pill was active
- Fixed a display issue regarding closing button when you have information added and simplified the logic related to it
- Fixed the way Magic Pill was rendered on useEffect
- Fixed some specificity issues in CSS by wrapping Magic Pill inside html and body to raise its style priority
- Changed the name of the "entry" keyframes to "magicPillEntry" to avoid any issue, considering "entry" is a popular term for keyframes

## [6.1.13] - 2024-11-15
### Fixed
- Fixed the definition of CSS variables which conflicted with the project's global stylesheet, now everything only extends to the scope of the Magic Pill

## [6.1.12] - 2024-11-15
### Fixed
- Fixed a wrong import line in the README file

### Removed
- Removed preferred theme based light/dark mode as it was conflicting with the rest of the project's stylesheet

## [6.1.11] - 2024-11-15
### Added
- Added preferred theme based light/dark mode

### Fixed
- Fixed a display issue regarding CTA labels

## [6.1.10] - 2024-11-15
### Added
- Added the changelog file to the package

### Fixed
- Fixed issues with useStates and reworked the timing of the exit of Magic Pill
