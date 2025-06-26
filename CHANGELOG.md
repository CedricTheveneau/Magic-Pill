# Changelog

## [8.0.1] - 2024-03-21
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
- Improved error messages with type-aware validation
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

## [7.1.3]
### Updated
- Updated the "Disclaimer" and "What's next ?" sections of the README file

### Added
- Added a box-shadow to Magic Pill

### Fixed
- Fixed a layout shift when going from collapsed info to expanded info
- Added a min-width to Magic Pill when info is expanded to keep it looking good

## [7.1.1] -> [7.1.2]
### Fixed
- Fixed the default style of CTA with a link. It no longer is underlined and blue

## [7.1.0]
### Fixed
- Reworked the way condiotionned CTA and Button rendering work

## [7.0.1]
### Fixed
- Removed efault.props as it will not longer be supported in future versions of React

## [7.0.8]
### Fixed
- Fixed version compatibility issues with NextJS / React

## [6.1.28]
### Fixed
- Fixed a wrong display condition for info panel

## [6.1.27]
### Fixed
- Fixed the issue with stuttering exit animation 

## [6.1.26]
### Fixed
- Backtracked to V6.1.20 after various fails. V6.1.20 was the closest to actually being usable 

## [6.1.22] -> [6.1.25]
### Fixed
- Refined a bit more the logic regarding classes applied to Magic Pill upon animations to prevent buggy visuals (still in progress)

## [6.1.21]
### Fixed
- Refined a bit more the logic regarding entry and exit animations to prevent buggy visuals (still in progress)

## [6.1.20]
### Fixed
- Implemented a more refined logic to prevent animation on hover and resume it on mouse leave (still in progress)
- Simplified the info div animation and removed the ::after pseudo-element
- Added a new animation for the CTA : when the info div is expanded, the button moves to the center of Magic Pill

## [6.1.19]
### Fixed
- Added the import of useRef, which I forgot in the previous release

## [6.1.18]
### Fixed
- Reworked the logic regarding animation pausing on hover (still a work in progress)

## [6.1.17]
### Added
- Added logic to prevent exit animation when the mouse enters Magic Pill. Once the mouse leaves, a five seconds timer starts, if the mouse hasn't entered, it triggers the exit animation, if it enters again, the timer is reset to five seconds.
- Added a LICENSE file
- Added a NOTICE file
- LICENSE and NOTICE files will be added to the package

### Updated
- README file

## [6.1.16]
### Fixed
- Fixed various display issues
- Improved layout breaks
- Started fixing info pop-up display issues
- Fixed z-index issues

## [6.1.15]
### Fixed
- Fixed an issue regarding the useEffect which could create errors leading to crashes because of bad syntax. It's now fixed and the component should render correctly without causing crashes

## [6.1.14]
### Added
- Added a default props, so that Magic Pill displays a friendly default message if there is an issue with the given props

### Fixed
- Fixed a display issue when Magic Pill was active
- Fixed a display issue regarding closing button when you have information added and simplified the logic related to it
- Fixed the way Magic Pill was rendered on useEffect
- Fixed some specificity issues in CSS by wrapping Magic Pill inside html and body to raise its style priority
- Changed the name of the "entry" keyframes to "magicPillEntry" to avoid any issue, considering "entry" is a popular term for keyframes

## [6.1.13]
### Fixed
- Fixed the definition of CSS vairables which conflicted with the project's global stylesheet, now everything only extends to the scope of the Magic Pill

## [6.1.12]
### Fixed
- Fixed a wrong import line in the README file

### Removed
- Removed prefered theme based light/dark mode as it was conflincting with the rest of the project's stylesheet

## [6.1.11]
### Added
- Added prefered theme based light/dark mode

### Fixed
- Fixed a display issue regarding CTA labels

## [6.1.10]
### Added
- Added the changelog file to the package

### Fixed
- Fixed issues with useStates and reworked the timing of the exit of Magic Pill