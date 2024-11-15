# Changelog

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