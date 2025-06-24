# Magic Pill
Let it empower you.

## Disclaimer
Even though Magic Pill is already available to everyone, please keep in mind that its development is not over yet.
You can technically use it but the documentation is still being improved.
I'll update this section once a real usable version is released.

#### Thank you !!
Thank you for your patience and to all people who already have shown interest in Magic Pill, it's my very first npm package and I couldn't ask for a better reception of my package after only a few days after its initial release.

## Badges
![npm version](https://img.shields.io/npm/v/magic-pill?color=blue)
![npm downloads](https://img.shields.io/npm/dt/magic-pill?color=green)
[![DeepScan grade](https://deepscan.io/api/teams/23515/projects/28307/branches/911491/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=23515&pid=28307&bid=911491)
[![Known Vulnerabilities](https://snyk.io/test/github/CedricTheveneau/Magic-Pill/badge.svg)](https://snyk.io/test/github/CedricTheveneau/Magic-Pill)
[![install size](https://packagephobia.com/badge?p=magic-pill@8.0.0)](https://packagephobia.com/result?p=magic-pill@8.0.0)
[<svg width=20 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96"><path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"></path></svg>](https://github.com/CedricTheveneau/Magic-Pill)
[<svg width=20 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331zm4 0v1.336H8.001V8.667h5.334v5.332zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002z"></path><path d="M10.665 10H12v2.667h-1.335z"></path></svg>](https://www.npmjs.com/package/magic-pill)

## Introduction
Magic Pill is a powerful React component that lets you show contextual information to your users in multiple ways. It can function as a notification system mimicking Apple's Dynamic Island, or as a dynamic navbar for seamless navigation. Built with TypeScript for enhanced type safety and developer experience.

## Features
 - [X] Multiple modes: Notification system and Dynamic Navbar
 - [X] Written in TypeScript with comprehensive type definitions
 - [X] Highly customizable React component with strongly typed props
 - [X] Fully customized styling based on CSS variables for easy theme adaptation
 - [X] Built with NextJS in mind, also works with vanilla React
 - [X] No external library dependency (apart from bundling)
 - [X] Lightweight and efficient
 - [X] Full TypeScript support with proper type checking

## Installation
### CDN
Want to quickly give it a try? Add Magic Pill to any React/NextJS project within 10 seconds with our CDN links!
#### jsDelivr
```html
<script src="https://cdn.jsdelivr.net/npm/magic-pill/dist/index.js"></script>
<link href="https://cdn.jsdelivr.net/npm/magic-pill@latest/dist/magicpill.css" rel="stylesheet" />
```
#### unpkg
```html
<script src="https://unpkg.com/magic-pill@latest/dist/index.js"></script>
<link href="https://unpkg.com/magic-pill@latest/dist/magicpill.css" rel="stylesheet" />
```

### npm
Magic Pill is available on npm, simply use the following command and you're ready to go!
```bash
npm install magic-pill
```

## How to use it?
### Import styles
For it to work properly, you need to import styles in your app (we recommend importing it into your app.tsx file).
```typescript
// Import in your Next.js or React project
import 'magic-pill/dist/magicpill.css';
```

### Usage with React/Next.js
Add Magic Pill to any project simply by importing it into your app and calling it inside the component:

```typescript
import React from 'react';
import MagicPill from 'magic-pill';
import { MagicPillType } from 'magic-pill/dist/types';

export default function App() {
  // pillData would be stored in a global Context and updated dynamically through other components
  const pillData: MagicPillType = {
    mode: "notification",
    notification: {
      icon: "checkmark", // Value can be: "checkmark", "coupon", "info", "questionmark"
      message: "Congrats, you've earned a coupon!",
      cta: {
        icon: "arrow", // Value can be: "arrow", "box", "checkmark", "cross", "mail", "plus", "quotation", "tel", "undo"
        label: "Discover our offer",
      },
      info: {
        title: "Details of the offer", // Title for the "read more" section
        content: "<p>Get 10% off on your next purchase with this coupon!</p><p>MP-10P</p>",
        closeLabel: "Close"  // Label of the "read more" section closing button
      }
    }
  };

  return (
    <MagicPill pillData={pillData} />
  );
}
```

**Please note**: as Magic Pill was intended to be a system-wide glorified toast solution, we recommend adding it to your App component and keeping its props in a global Context, in which you could send contextual data from any component that uses the Context.

### Navbar Mode
Magic Pill can also function as a dynamic navbar:

```typescript
const navbarData: MagicPillType = {
  mode: "navbar",
  navbar: {
    navItems: [
      {
        icon: "home",
        label: "Home",
        link: "/"
      },
      {
        icon: "settings",
        label: "Settings",
        link: "/settings"
      }
    ]
  }
};
```

### Customization
Magic Pill is easily customizable through CSS variables. Simply replace the theme colors or fonts by changing the values in the variables set in ":root".

```css
/* Font import */
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Overlock:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');

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
Maybe what I brought to the table wasn't enough but you like the idea behind it, that's why Magic Pill is under [MIT License](https://www.tldrlegal.com/license/mit-license), which means you can pretty much do whatever you want and build upon my own version of Magic Pill to bring it to new heights or just make it your own.

Here's how to proceed:
1. Clone the project:
```bash
git clone https://github.com/CedricTheveneau/Magic-Pill.git
```

2. Install all dependencies:
```bash
npm install
```

3. You're good to go! For easier development, we recommend creating a Next.js app and creating a symbolic link between the app and the package. Now, when you're making changes to the code in src/, the changes should be reflected in your Next.js app.
```bash
# Create a new Next.js app
npx create-next-app@latest my-app --typescript

# Link the package (from the Magic-Pill directory)
npm link

# Link to your app (from your app directory)
npm link magic-pill
```

## Troubleshooting / Contact
Magic Pill is still under development, you'll certainly encounter issues with it.
You can send me emails anytime at [theveneacedricpro@gmail.com](mailto:theveneacedricpro@gmail.com), I'll try my best to help you out.

## License
Magic Pill is distributed under the [MIT License](https://www.tldrlegal.com/license/mit-license).

## What's next?
| TODO | DOING |
|-----------|-----------|
| Support of custom svg icons | Animation fixes |
| Transition between two modes | Responsive version + Proportions rework |
| Implementation of function triggers on CTAs | Full documentation |
| Transition between two modes | Proper testing |
| Add new modes | |