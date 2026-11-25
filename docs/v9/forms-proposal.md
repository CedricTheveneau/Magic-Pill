# Forms: API proposal

> **Status: approved by the maintainer on 2026-11-25** (§12), with the prototype, the **Forms lab**. Additions from that review are marked *added*. The delivery is §11.

## 1. What was asked

- The **forms** template: fields in a panel, inside the pill (VISION §3.5).
- **All the regular types of fields at once**, so the set is complete from the start.
- From the mockups: an action in the panel's title row ("Default"), navbar items that are actions ("Skip session") or that open a panel ("Preferences"), and a pill with **two** panels (Profile: *Update profile information* and *Preferences*).

## 2. At a glance

```tsx
import "magic-pill/styles.css";
import "magic-pill/forms.css"; // only for apps with forms
import { MagicPill, PillNavbar, PillFormPanel, PillInput, PillSwitch, pill } from "magic-pill";

<MagicPill>
  <PillNavbar
    items={[
      { href: "/", label: "Home", icon: <HomeIcon /> },
      { onClick: skip, label: "Skip session", icon: <SkipIcon />, expanded: true },
      { panel: "profile", label: "Update profile", icon: <UserIcon /> },
    ]}
  />
  <PillFormPanel name="profile" title="Update profile information" submitLabel="Save" onSubmit={saveProfile}>
    <PillInput name="username" label="Username" defaultValue={user.name} required />
    <PillInput name="birth" label="Date of birth" type="date" />
    <PillSwitch name="public" label="Public profile" />
  </PillFormPanel>
</MagicPill>;

async function saveProfile(data: FormData) {
  await api.save(Object.fromEntries(data)); // the panel waits, then closes; if this throws, it stays open and says why
  pill().notify({ message: "Profile updated", variant: "success" });
}
```

**Principles**
- **Native controls only**: `<input>`, `<textarea>`, `<select>`. So: the phone's own keyboards and date pickers, autofill, password managers, `FormData`, form libraries (React Hook Form's `register`, React 19's `action`…), and accessibility, with no dependency.
- **Every other prop goes to the control**, `ref` included. Controlled or not, as with any React input.
- **Separate exports, one stylesheet of their own.** An app without forms ships none of it.

## 3. Panels (the primitive)

| New | What it does |
|---|---|
| `<PillPanel titleAction={…}>` | At the end of the title's row, in the accent colour |
| `<PillPanel footer={…}>` | Actions before the close button |
| `<PillPanel name="prefs">` and `<PillPanelTrigger panel="prefs">` | **Several panels in one pill.** Without a name, as today |
| `usePill()` gets `openPanel(name?)` and `closePanel()` | For your own parts |
| `pill().notify({ panel: { …, titleAction, footer } })` | The same slots in a notification's panel |

- **Close shows its icon, and its label on hover and focus** (*added*, #96; `closeExpanded` shows it for good).
- **Next to a main action, Close is quiet** (an outline), so Save stands out; `--mp-close`, `--mp-on-close` and `--mp-close-rim` change it (*added*: every setting of the lab is in the library). Alone, it looks like the other actions.
- `name` is kept by the pill, next to its presence: closing goes back to where it was, and the focus goes back to the trigger that opened *that* panel.
- In the DOM, the title gets a wrapper (`data-mp="panel-head"`). `data-mp="panel-title"` is unchanged.
- **Not included:** going from one open panel straight to another (a wizard). The pill animates when its presence changes, and here it doesn't.

## 4. The navbar

`NavItem` becomes one of three. Links are unchanged.

```ts
type NavItem =
  | { href: string; label: string; icon?: ReactNode; match?: NavMatch }            // as today
  | { onClick: (event: MouseEvent<HTMLButtonElement>) => void; label: string; icon?: ReactNode; expanded?: boolean }
  | { panel: string; label: string; icon?: ReactNode; expanded?: boolean };        // opens the panel with that name
```

## 5. The fields

| Component | What it is | Layout |
|---|---|---|
| `PillInput` | `type`: `text`, `email`, `password` (with a *show* button), `search` (its icon), `tel`, `url`, `number`, `date`, `time`, `datetime-local`, `month`, `week` | label above, or beside |
| `PillTextarea` | grows with its text; counts with `maxLength` | above |
| `PillSelect` | a native `<select>`: `options`, groups, `placeholder` | above, or a **chip** at the end of the row (`layout="inline"`) |
| `PillSlider` | a range: its value at the end of the label's line (`format`, e.g. to add "min") | above |
| `PillSwitch` | on or off, at once (`role="switch"`) | row |
| `PillCheckbox` | something to agree to, sent with the form; `indeterminate` | row |
| `PillChoices` | one of several (radios), or several (`multiple`, checkboxes). `look`: `list`, `segmented` (*added*: the choice **slides** from one to the next instead of fading), `chips` | above |
| `PillStepper` | a number, one step at a time (− 2 +), with a `unit` | row |
| `PillCode` | a one-time code: one input drawn as slots, so pasting and SMS autofill work; `onComplete` | above |
| `PillFile` | one or more files: a drop area that names them | above |
| `PillColor` | a colour | row |
| `PillField` | the shell alone (label, hint, error, wired): **for any control of yours** | either |
| `PillFields` | fields that go together: a title, `columns={2}`, `separators` | |
| `PillForm` | the `<form>`: stacked in a panel, **a row in the pill itself** (§7). `look`: `solid`, `soft`, `outline` or your own, `layout`, `errors`, `disabled` (*added*: the lab's settings) | |
| `PillFormPanel` | the template: `PillPanel` + `PillForm` + Save (§6) | |

Every field takes:

| Prop | |
|---|---|
| `label` | Required: the accessible name. `hideLabel` hides it on screen |
| `hint` | Under the control, read with it |
| `error` | Your own error (from the server, for instance). Wins over the browser's |
| `optional` | Writes "optional" after the label (`optional="facultatif"` for another language) |
| `layout` | `stacked` or `inline`, where both make sense. `<PillForm layout="inline">` sets it for its text fields |

`PillInput` also has `icon`, `suffix` (`"kg"`, `"$"`) and `suggestions` (a native `<datalist>`).

**Left out on purpose** (each can be made with `PillField`): a slider with two thumbs, tags, a rating, rich text. *(A custom calendar was left out too; the maintainer asked for an optional one: `PillDate`, §13.)* The native calendar is the one people know on their device, and the only one that costs nothing.

## 6. `PillFormPanel`

| Prop | |
|---|---|
| `title`, `name`, `titleAction`, `closeLabel` | As on `PillPanel` |
| `onSubmit(data: FormData, event)` | Called once everything is valid. **Returns a promise:** the fields wait (disabled), then the panel closes; if it's rejected, the panel stays open, keeps what was typed and shows the error's message. **Returns `false`:** it stays open |
| `submitLabel`, `submitIcon`, `busyLabel` | The main action. **Without a label there's none**: for settings that apply at once, like the mockups' *Preferences* |
| `resetLabel` | The mockups' *Default*: a reset in the title's row |
| `layout`, `errors` | Passed to its `PillForm` |

Enter in a field submits. Closing keeps what was typed (the panel stays in the page), as a panel does today.

## 7. Fields in the pill itself

A `PillForm` outside a panel is a row: one field, one action. Fields are as tall as actions, so the pill keeps its height.

```tsx
<Pill>
  <PillIcon><MailIcon /></PillIcon>
  <PillDivider />
  <PillForm onSubmit={subscribe}>
    <PillInput label="Your email" hideLabel type="email" name="email" required />
    <PillAction type="submit" icon={<ArrowIcon />} label="Subscribe" expanded />
  </PillForm>
</Pill>
```

There's no room for an error's text there: the field's outline tells, and screen readers hear the message.

## 8. Validation

**The browser's own** (`required`, `type`, `pattern`, `min`, `maxLength`…), in the reader's language, shown **under the field** instead of in a bubble:
- on an attempt to submit (the first invalid field gets the focus), or on leaving a field that was edited and is wrong;
- it goes as soon as the value is right;
- announced politely, and tied to the control (`aria-describedby`, `aria-invalid`).

`<PillForm errors="native">` brings the bubbles back.

## 9. Tokens

Set like the others. **Each defaults to what the pill already has**, so fields follow the actions' colours, per variant too (#93), and the themes.

| Token | What | Default |
|---|---|---|
| `--mp-field` / `--mp-on-field` / `--mp-field-rim` | Text fields, lists, files | the actions' colours and rim |
| `--mp-placeholder` | | `--mp-on-field` at 70% (88% on glass) |
| `--mp-field-size` / `--mp-field-radius` / `--mp-field-gap` | Height, corners, space between fields | an action's height / half of it / 1.25 times `--mp-gap` |
| `--mp-field-scheme` | `light` or `dark`, for what the browser draws (calendars…) | `light`; `dark` on glass |
| `--mp-accent` / `--mp-on-accent` | Switches, sliders, ticks, the title's action, Save | the pill's text / its surface |
| `--mp-track` / `--mp-track-size` / `--mp-thumb` | What's off; a slider's thickness; its thumb | the pill's text at 48% / `4px` / `1.25rem` |
| `--mp-label-font` / `--mp-label-style` / `--mp-label-weight` | | `--mp-font-accent` / `normal` / `400` |
| `--mp-error` | | `--mp-danger` mixed with the pill's text; its text alone on the status colours |
| `--mp-list` / `--mp-on-list` | An open drop-down list (where the browser lets us draw it) | `#f9f9f9` / `#141414` |
| `--mp-picker` (*added*) | `none` for the system's lists everywhere | `base-select` |

The three looks of the lab, **solid** (the default), **soft** and **outline**, are `<PillForm look>` (*added*), which sets these tokens' defaults from the pill's own text.

```css
/* The mockups */
:root { --mp-surface: #0d3142; --mp-on-surface: #f2efea; --mp-action: #f2efea; --mp-on-action: #0d3142; --mp-accent: #ff4f00; --mp-on-accent: #f2efea; }
```

**App-wide resets** (`input { border: … }`) reach a native control whatever we do (unlayered CSS beats layers). As with the actions, the look is therefore on what's around it, and switches, ticks, sliders, slots and swatches are drawn next to a transparent native control. Text controls only need to stay bare: an app that gives every `input` a border or a padding will see it in the pill too. The lab's own page did (`textarea { border… }`) before it was scoped. The README will say so.

## 10. What it degrades to

| Situation | Result |
|---|---|
| No `appearance: base-select` (it's in Chromium today) | The system's list, which is also what phones show best |
| No `field-sizing` | Text areas keep their `rows` and scroll |
| iOS: the keyboard covers the bottom of the page | While a field has the focus, the pill moves above it (`visualViewport`) and its panel shrinks to fit |
| Forced colours | The system's own controls |
| Reduced motion | No movement; states change at once |
| Escape with a list open | Closes the list, not the panel |
| `unstyled` | Bare native controls, with the same wiring |

## 11. Checks, cost, delivery

**Checked in the prototype** (Chromium 140): opening, submitting by click and by Enter, waiting, failing, succeeding, Escape and focus, two panels in one pill, sliders by pointer and keyboard, reset, steppers, codes, lists, the modal, phone width, right to left; every control has a name; no duplicated id. Contrast on the computed colours, in six palettes and variants: text, placeholders, hints, errors and chips at 4.5:1 or more, controls at 3:1 or more. Two exceptions: **the mockups' own orange** (cream on `#ff4f00` is 2.9:1, for the *Default* and *Save* labels; `--mp-on-accent: #141414` gives 5.6:1), and the **soft** look, whose fields barely stand out from the pill (1.4:1) and rely on their label and placeholder.
**Not in the prototype:** `busyLabel`, `onSubmit` returning `false`, and `optional` in another language.
**Not tested:** Safari, Firefox, phones and their keyboards (the page runs in a frame, where the keyboard can't be measured), screen readers by ear, real pixels on glass (the themes' method, part of the work).

**Estimated size** (gzipped, from the prototype's code):

| | Now | After |
|---|---|---|
| Quick start, primitive | 9.24 kB / 4.80 kB | about +0.2 kB each (panels) |
| An app with a form panel, text fields and a switch | | about 3.9 kB of JavaScript more |
| Everything | 17.19 kB | about 21.6 kB |
| `forms.css` | | 4.8 kB, only if imported |

**Delivery**, each its own PR, with tests that fail without it, the README and the CHANGELOG:
1. **Panels** (§3). 2. **Navbar items** (§4).
3. **Text**: `forms.css`, `PillField`, `PillForm`, `PillInput`, `PillTextarea`, `PillSelect`, validation.
4. **Settings**: `PillSwitch`, `PillSlider`, `PillCheckbox`, `PillChoices`, `PillStepper`, `PillFields`.
5. **The rest**: `PillCode`, `PillFile`, `PillColor`.
6. **The template**: `PillFormPanel`, the keyboard, notifications' panels.
7. **A QA pass**: the themes on real pixels, Safari, Firefox, phones.

## 12. Decisions (the maintainer, 2026-11-25: "I validate everything")

| | Decided |
|---|---|
| 1. Names | As above: `PillInput`…, `PillFormPanel`, the tokens of §9, `name`/`panel` for several panels |
| 2. Default look | **Solid**: light fields, like the mockups and the actions |
| 3. Default accent | **The pill's own text** (white on black): nothing new on a page until an app picks its colour |
| 4. Close, next to Save | **Quiet** |
| 5. Labels | **Above**, in the accent font (Lexend), regular weight |
| 6. Errors | **Under the field** |
| 7. Drop-down lists | **The pill's where the browser lets us**, the system's elsewhere. `--mp-picker: none` for the system's everywhere |
| 8. The set of fields | §5, with what it leaves out |
| 9. `forms.css` apart, and the sizes of §11 | Yes |

## 13. After trying the built forms (the maintainer, 2026-11-25)

| Asked | Built |
|---|---|
| A label while it's sending, several if possible (the prototype's was lost on the way) | `busyLabel` and `busyInterval`, on `PillFormPanel` and on the new `PillSubmit`; `onSend` on `PillForm`, for forms in the pill itself |
| The navbar/notification transitions for every template | `scene` on `<Pill>` and on a host's base layer; `sceneChange`: `circle`, `slide`, `none` |
| Soft and outline switches and segmented choices, for a consistent look | `look` reaches every kind of field |
| An optional calendar, for every format | `PillDate` and `magic-pill/calendar.css`: dates, months, weeks, times, dates and times; a popover or `inline` |
