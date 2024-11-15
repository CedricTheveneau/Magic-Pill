
# Magic Pill
Let it empower you.
## Disclaimer
Even though Magic Pill is already available to everyone, please keep in mind that its development is not over yet.
You can technically use it but there's no real documentation yet, nor any proper license file.
I'll update this section once a real usable version is released.
#### Thank you !!
Thank you for your patience and to all people who already have shown interest in Magic Pill, it's my very first npm package and I couldn't ask for a better reception of my package after only a few days after its initial release.
## Badges
![npm version](https://img.shields.io/npm/v/magic-pill?color=blue)
![npm downloads](https://img.shields.io/npm/dt/magic-pill?color=green)
[![DeepScan grade](https://deepscan.io/api/teams/23515/projects/28307/branches/911491/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=23515&pid=28307&bid=911491)
[![Known Vulnerabilities](https://snyk.io/test/github/CedricTheveneau/Magic-Pill/badge.svg)](https://snyk.io/test/github/CedricTheveneau/Magic-Pill)
## Introduction
Magic Pill is a simple yet powerful React component that lets you show contextual information to your users. It mimicks Apple's Dynamic Island's behavior and is inspired by Xbox's achievement notification as well.
You can show notifications with a quick action, or even some additional content based on the content the users are seeing.

Magic Pill helps you build elegant and sober yet impactful interactions with your audience really easily. The goal is to empower both you, and your users.
## What comes with it ?
 - [X] Highly customizable React component with various props configurations
 - [X] Fully customized styling based on CSS variables for easy adaptation to your theme if needed
 - [X] Built with NextJS in mind right from the start, also works with vanilla React
 - [X] No external library dependency (appart from bundling)
 - [X] Lightweight and efficient
## Installation
Magic Pill is available on npm, simply use the following command and you're ready to go !
```bash
npm install magic-pill
```
## How to use it ?
### Import styles
For it to work properly, you need to import styles in your app (we recommend importing it into your app.js file).
```js
// Import dans votre projet Next.js ou React
import 'magic-pill/dist/magicpill.css';
```
### Usage with React
Add Magic Pill to any project simply by importing it into your app and calling it inside the component : 
```js
import React from 'react';
import MagicPill from 'magic-pill';

export default function App() {
// pillData would be stored in a global Context and updated dynamically through other components
const  pillData  = {
	icon: "checkmark", // Value can be : "checkmark", "coupon", "info", "questionmark"
	message:  "Congrats, you've earned a coupon!",
	cta: {
		icon:  "arrow", // Value can be : "arrow", "box", "checkmark", "cross", "mail", "plus", "quotation", "tel", "undo"
		label:  "Discover our offer",
		link:  "https://www.example.com"  // Link for the CTA (will be set to null if nothing is specified)
	},
	info: {
		title:  "Details of the offer", // Title for the "read more" section
		content:  "<p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur v", // HTML content to insert in the "read more" section
		closeLabel:  "Close"  // Label of the "read more" section closing button
}
};
  return (
    <MagicPill pillData={pillData}/>
  );
}
```
**Please note** : as Magic Pill was intended to be a system-wide glorified toast solution, we recommend adding it to your App component and keeping its props in a global Context, in which you could send contextual data from any component that uses the Context. 
### Customization
As said before, Magic Pill is easily customizable, it was intended to be right from the start. We used CSS variables to define its style. Simply replace the theme colors or fonts by changing the values in the variables set in ":root".
```css
/* Font import */
@import  url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Overlock:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');

/* CSS variables */
:root {
--themeDark: #141414;
--themeLight: #F9F9F9;
--font-text: "Overlock", sans-serif;
--font-accent: "Lexend", sans-serif;
--normal: normal;
--italic: italic;
--medium: 400;
--bold: 700;
--black: 900;
--success: #3F7253;
--danger: #FC5D6A;
--textSize: 19.4px;
--titleSize: 31.42px;
}
```
## Build your own
Maybe what I brought to the table wasn't enough but you like the idea behind it, that's why Magic Pill is under MIT License, which means you can pretty much do whatever you want and build upon my own version of Magic Pill to bring it to new heights or just make it your own.

Here's how to proceed : 
1. Clone the project : 
```bash
git clone https://github.com/CedricTheveneau/Magic-Pill.git
```
2. Install all dependencies 
```bash
npm install
```
3. You're good to go ! Though, for easier development, we recommend creating a NextJS / React app and creating a symbolic link between the app and the package. Now, when you're making changes to the code in src/, the changes should be reflected in your NextJS app.
```bash
npx create-next-app@latest // Answer the various questions, note that Magic Pill doesn't use TypeScript for now
```
```bash
npm link // Place yourself in the cloned repo's src/ folder
```
```bash
npm link // Place yourself in the app/ folder of your NextJS app
```
## Troubleshooting / Contact
Magic Pill is still under development, you'll certainly encounter issues with it.
You can send me emails anytime at [theveneacedricpro@gmail.com](mailto:theveneacedricpro@gmail.com), I'll try my best to help you out.
## License
As stated before, Magic Pill is distributed under the MIT License.
## What's next ?
| TODO | DOING |
|-----------|-----------|
| Animation fixes  | Better conditioning of displays depending on props  |
| Implementation with APIs  |   |
| Proper testing  |   |
| License file  |   |
| Changelog file  |   |
| Full documentation  |   |
