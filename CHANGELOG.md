# Changelog

## [Unreleased]
Work towards 9.0.0, the first release with a stable API. It's a breaking release: see [MIGRATING.md](./MIGRATING.md) to move from 8.x.

### Added
- The pill primitive: `Pill` with its parts `PillIcon`, `PillDivider`, `PillMessage`, `PillActions`, `PillAction`, `PillPanel` and `PillPanelTrigger`, plus the `usePill()` hook to write your own templates
  - Presence levels (`hidden`, `rest`, `compact`, `expanded`, `panel`), controlled or not
  - Placements: `inline`, fixed at an edge or corner, or `overlay` (a native modal `<dialog>`)
  - Horizontal or vertical orientation, and `neutral`, `success`, `danger` or custom variants
  - Stateless parts and `PillAction` can be rendered by React Server Components without becoming client code
- Link actions take a `linkComponent` (e.g. Next's `Link`) and only render relative, `http(s):`, `mailto:` and `tel:` URLs. Any other scheme, such as `javascript:`, renders no link
- Templates built from those parts:
  - `PillNotification`: icon, message, an action (`onClick` or `href`) and an optional expandable panel. Every content is a React node, so nothing is parsed as HTML any more
  - `PillNavbar`: a `<nav>` of icon links for any router (`pathname`, `linkComponent`). Items match whole path segments, the longest match wins, and the active link gets `aria-current="page"`
- `<MagicPill>` and `pill(name)`: mount the host once, then call `pill().notify({...})` from anywhere, including outside React. This replaces the 8.x Context, Provider and Initializer (about 135 lines of user code)
  - Notifications queue first in, first out, take the pill over, then hand it back to the host's **base layer** (its children, e.g. a `PillNavbar`), so navbar and notifications are no longer exclusive
  - `update(id, patch)`, `dismiss(id?)`, `clear()`, and `notify()` with an existing `id` to update in place
  - `duration` per notification or on the host (`Infinity` keeps it). The countdown pauses on hover, keyboard focus, an open panel and a hidden browser tab
  - Action clicks dismiss the notification unless the handler calls `event.preventDefault()`; `onDismiss(id, reason)` reports `timeout`, `action`, `dismissed` or `cleared`
  - `render` for your own template, which keeps the queue, timing and animation
  - Several named hosts per page (`<MagicPill name="sidebar">`), and `idle="rest"` for a discreet resting circle
  - Shape changes: the pill collapses to a circle, swaps its content there and grows back; with reduced motion, it fades instead
  - Announcements go through a separate live region, so a hidden pill can leave the accessibility tree
  - On the server, `pill()` does nothing (it warns in development), so requests never share notifications
- `usePillQueue(name)`: the queue as a hook, to build your own host
- Twelve icons as components (`ArrowIcon`, `BoxIcon`, `CheckIcon`, `CloseIcon`, `CouponIcon`, `DocumentIcon`, `HelpIcon`, `InfoIcon`, `MailIcon`, `PhoneIcon`, `PlusIcon`, `UndoIcon`): drawn in `currentColor`, decorative by default
- A new stylesheet, `magic-pill/styles.css`:
  - every rule sits in a `magic-pill` cascade layer and targets `data-mp` attributes, so your own CSS overrides it without `!important` and no class names collide;
  - it loads no fonts (it uses your page's fonts unless you set `--mp-font-text`/`--mp-font-accent`);
  - it's sized in `rem`, fits phone screens and safe areas, and supports reduced motion and forced colours

- A migration guide from 8.x, [MIGRATING.md](./MIGRATING.md), shipped in the package
- The README is rewritten for v9: quick start, notifications, the host and its base layer, the primitive, React Server Components, styling and tokens, accessibility and security

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
