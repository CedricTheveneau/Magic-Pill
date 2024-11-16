# Changelog

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