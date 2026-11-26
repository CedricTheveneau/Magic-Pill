"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowIcon,
  BoxIcon,
  CheckIcon,
  DocumentIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  Pill,
  PillAction,
  PillActions,
  PillCheckbox,
  PillChoices,
  PillCode,
  PillColor,
  PillDivider,
  PillFields,
  PillFile,
  PillForm,
  PillFormPanel,
  PillIcon,
  PillInput,
  PillMessage,
  PillPanelTrigger,
  PillSelect,
  PillSlider,
  PillStepper,
  PillSubmit,
  PillSwitch,
  PillTextarea,
  UndoIcon,
  pill,
  type PillFormPanelProps,
} from "magic-pill";

import { ChipGroup } from "../../controls";
import { CalendarIcon, GearIcon, HeartIcon, SkipIcon, UserIcon } from "../../icons";
import { DemoNavbar } from "../_components/demo-navbar";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

type Look = "solid" | "soft" | "outline";
type Layout = "stacked" | "inline";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BUSY = ["Just a moment…", "Still on it…", "Nearly there…"];

/** An open panel of the galleries. Closed, it's a pill that opens it again. */
function Gallery({ title, icon, children, ...panel }: { title: string; icon: ReactNode; children: ReactNode } & Partial<PillFormPanelProps>) {
  return (
    <Pill defaultPresence="panel" role="group" aria-label={title}>
      <PillIcon>{icon}</PillIcon>
      <PillDivider />
      <PillMessage>{title}</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<ArrowIcon />} label="Open" expanded />
      </PillActions>
      <PillFormPanel title={title} onSubmit={() => wait(2500)} {...panel}>
        {children}
      </PillFormPanel>
    </Pill>
  );
}

const GENRES = ["Pop", "Jazz", "Rock", "Folk", "Techno"].map((label) => ({ value: label.toLowerCase(), label }));
const COUNTRIES = [
  { label: "Europe", options: ["France", "Belgium", "Switzerland", "Portugal"] },
  { label: "Americas", options: ["Canada", "Brazil", "Mexico"] },
  { label: "Asia", options: ["Japan", "Vietnam"] },
];

/** A contact form, opened from a navbar item. */
function Contact({ look }: { look: Look }) {
  return (
    <DemoNavbar
      items={[
        { href: "/", label: "Home", icon: <BoxIcon /> },
        { panel: "contact", label: "Write to us", icon: <MailIcon />, expanded: true },
      ]}
      pathname="/"
      label="Contact example"
    >
      <PillFormPanel
        name="contact"
        title="Write to us"
        look={look}
        submitLabel="Send"
        submitIcon={<ArrowIcon />}
        busyLabel={BUSY}
        busyInterval={1200}
        onSubmit={async () => {
          await wait(2500);
          pill().notify({ variant: "success", icon: <CheckIcon />, message: "Sent! We’ll answer within a day.", duration: 3000 });
        }}
      >
        <PillInput name="email" label="Email" type="email" icon={<MailIcon />} placeholder="you@example.com" autoComplete="off" required />
        <PillSelect name="about" label="About" options={["An order", "A return", "Something else"]} />
        <PillTextarea name="message" label="Message" required maxLength={400} />
      </PillFormPanel>
    </DemoNavbar>
  );
}

/** Fields in the pill itself: one field, one action. */
function Newsletter({ look, standalone }: { look: Look; standalone?: boolean }) {
  const [done, setDone] = useState(false);
  const form = (
    <>
      <PillIcon>
        <MailIcon />
      </PillIcon>
      <PillDivider />
      <PillForm
        look={look}
        onSend={async () => {
          await wait(2500);
          if (standalone) setDone(true);
          else pill().notify({ variant: "success", icon: <CheckIcon />, message: "You’re in. See you on Sunday!", duration: 3000 });
        }}
      >
        <PillInput label="Your email" hideLabel type="email" name="email" required placeholder="you@example.com" autoComplete="off" />
        <PillSubmit icon={<ArrowIcon />} label="Subscribe" expanded busyLabel={["Adding you…", "Nearly there…"]} busyInterval={1200} />
      </PillForm>
    </>
  );
  if (!standalone) return form;
  return (
    <Pill scene={done ? "done" : "form"} variant={done ? "success" : "neutral"} role="group" aria-label="Newsletter">
      {done ? (
        <>
          <PillIcon>
            <CheckIcon />
          </PillIcon>
          <PillDivider />
          <PillMessage>You’re in. See you on Sunday!</PillMessage>
          <PillActions>
            <PillAction icon={<UndoIcon />} label="Again" onClick={() => setDone(false)} />
          </PillActions>
        </>
      ) : (
        form
      )}
    </Pill>
  );
}

const DEFAULT_TIMER = { work: 25, pause: 5, long: 30 };

/** The Pomodoro mockup: settings that apply at once, and a reset in the title's row. */
function Pomodoro({ look }: { look: Look }) {
  const [timer, setTimer] = useState(DEFAULT_TIMER);
  const minutes = (value: number) => `${value} min`;
  return (
    <DemoNavbar
      items={[
        { panel: "timer", label: "Timer settings", icon: <GearIcon /> },
        { onClick: () => pill().notify({ icon: <SkipIcon />, message: "Break time!", duration: 2000 }), label: "Skip session", icon: <SkipIcon />, expanded: true },
        { href: "/quotes/", label: "Quotes", icon: <DocumentIcon /> },
        { href: "/profile/", label: "Profile", icon: <UserIcon /> },
      ]}
      pathname="/none/"
      label="Pomodoro"
    >
      <PillFormPanel name="timer" title="Timer settings" look={look} titleAction={<PillAction label="Default" onClick={() => setTimer(DEFAULT_TIMER)} />}>
        <PillSlider label="Sessions" min={5} max={60} step={5} value={timer.work} onChange={(event) => setTimer({ ...timer, work: Number(event.target.value) })} format={minutes} />
        <PillSlider label="Pauses" min={1} max={15} value={timer.pause} onChange={(event) => setTimer({ ...timer, pause: Number(event.target.value) })} format={minutes} />
        <PillSlider label="Long pauses" min={10} max={60} step={5} value={timer.long} onChange={(event) => setTimer({ ...timer, long: Number(event.target.value) })} format={minutes} />
      </PillFormPanel>
    </DemoNavbar>
  );
}

const LOOKS = (["solid", "soft", "outline"] as const).map((value) => ({ value, label: value }));
const LAYOUTS = (["stacked", "inline"] as const).map((value) => ({ value, label: value }));

export function Content() {
  const [look, setLook] = useState<Look>("solid");
  const [layout, setLayout] = useState<Layout>("stacked");

  return (
    <>
      <DocsHeader title="Forms">
        <p>
          Fields for a panel, or for the pill itself, on native controls: phones keep their keyboards and date pickers, and
          autofill, <code>FormData</code> and form libraries work as usual. Their look comes in a stylesheet of its own,{" "}
          <code>magic-pill/forms.css</code>.
        </p>
        <div className="controls form-looks">
          <ChipGroup legend="Every example’s look" name="look" options={LOOKS} value={look} onChange={setLook} />
          <ChipGroup legend="Text fields’ labels" name="layout" options={LAYOUTS} value={layout} onChange={setLayout} />
        </div>
      </DocsHeader>

      <DocsSection id="panels" title="In a panel, in the pill">
        <div className="docs-examples">
          <Example
            title="A form panel"
            preview={
              <Pill role="group" aria-label="Contact example">
                <Contact look={look} />
              </Pill>
            }
            stage={{ content: <Contact look={look} /> }}
            code={`import "magic-pill/forms.css";

<MagicPill>
  <PillNavbar items={[{ href: "/", label: "Home", icon: <BoxIcon /> }, { panel: "contact", label: "Write to us", icon: <MailIcon /> }]} />
  <PillFormPanel name="contact" title="Write to us" submitLabel="Send" onSubmit={send}>
    <PillInput name="email" label="Email" type="email" required />
    <PillSelect name="about" label="About" options={["An order", "A return", "Something else"]} />
    <PillTextarea name="message" label="Message" required maxLength={400} />
  </PillFormPanel>
</MagicPill>;

async function send(data: FormData) {
  await api.send(Object.fromEntries(data)); // the panel waits, then closes
  pill().notify({ message: "Sent", variant: "success" });
}`}
          >
            <p>
              <code>&lt;PillFormPanel&gt;</code> is a panel that is a form. While <code>onSubmit</code>’s promise is pending,
              the fields wait; if it’s rejected, the panel stays open, keeps what was typed and says why.
            </p>
          </Example>
          <Example
            title="In the pill itself"
            preview={<Newsletter look={look} standalone />}
            stage={{ content: <Newsletter look={look} /> }}
            code={`<Pill scene={done ? "done" : "form"} variant={done ? "success" : "neutral"}>
  {done ? <Thanks /> : (
    <PillForm onSend={subscribe}>
      <PillInput label="Your email" hideLabel type="email" name="email" required />
      <PillSubmit icon={<ArrowIcon />} label="Subscribe" expanded busyLabel={["Adding you…", "Nearly there…"]} />
    </PillForm>
  )}
</Pill>`}
          >
            <p>
              A <code>&lt;PillForm&gt;</code> in the pill is a row, with fields as tall as the actions: one field, one action.
              Here, a scene says thank you; in the main pill, a notification does.
            </p>
          </Example>
          <Example
            title="Settings that apply at once"
            preview={
              <Pill role="group" aria-label="Pomodoro example">
                <Pomodoro look={look} />
              </Pill>
            }
            stage={{ content: <Pomodoro look={look} /> }}
            code={`<PillFormPanel name="timer" title="Timer settings"
  titleAction={<PillAction label="Default" onClick={reset} />}>
  <PillSlider label="Sessions" min={5} max={60} step={5} value={work} onChange={…} format={(v) => \`\${v} min\`} />
  …
</PillFormPanel>`}
          >
            <p>
              Without <code>submitLabel</code>, there’s no main action: no Save for settings that apply at once.{" "}
              <code>resetLabel</code>, or your own <code>titleAction</code>, resets them.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="fields" title="The fields">
        <div className="docs-examples">
          <Example
            title="Text"
            wide
            preview={
              <Gallery title="Text" icon={<DocumentIcon />} look={look} layout={layout} submitLabel="Save" resetLabel="Reset" busyLabel={BUSY} busyInterval={1200}>
                <PillInput label="Name" name="name" defaultValue="Camille Laurent" autoComplete="off" />
                <PillInput label="Email" name="email" type="email" icon={<MailIcon />} placeholder="you@example.com" autoComplete="off" required />
                <PillInput label="Password" name="password" type="password" defaultValue="correct horse" autoComplete="off" minLength={8} hint="8 characters or more." />
                <PillInput label="Phone" name="tel" type="tel" icon={<PhoneIcon />} placeholder="+33 6 12 34 56 78" optional />
                <PillInput label="City" name="city" placeholder="Start typing" suggestions={["Lisbon", "London", "Lyon", "Lille", "Los Angeles"]} hint="With suggestions." />
                <PillTextarea label="About you" name="about" maxLength={160} defaultValue="I build small things and keep most of them." />
              </Gallery>
            }
            code={`<PillInput label="Email" name="email" type="email" icon={<MailIcon />} required />
<PillInput label="Password" name="password" type="password" minLength={8} hint="8 characters or more." />
<PillInput label="Phone" name="tel" type="tel" optional />
<PillInput label="City" name="city" suggestions={["Lisbon", "London", "Lyon"]} />
<PillTextarea label="About you" name="about" maxLength={160} />`}
          >
            <p>
              <code>PillInput</code> takes every text type, an <code>icon</code>, a <code>suffix</code> and{" "}
              <code>suggestions</code>; a password gets a button that shows it. <code>PillTextarea</code> grows with its text
              and counts it with <code>maxLength</code>.
            </p>
          </Example>
          <Example
            title="Numbers"
            wide
            preview={
              <Gallery title="Numbers" icon={<CalendarIcon />} look={look} layout={layout} submitLabel="Book">
                <PillFields columns={layout === "inline" ? undefined : 2}>
                  <PillInput label="Amount" name="amount" type="number" min={0} step="0.01" defaultValue="768.99" suffix="$" inputMode="decimal" />
                  <PillInput label="Weight" name="weight" type="number" min={0} defaultValue="12" suffix="kg" />
                </PillFields>
                <PillStepper label="Guests" name="guests" min={1} max={12} defaultValue={2} />
                <PillStepper label="Nights" name="nights" min={1} max={30} defaultValue={3} unit="nights" hint="30 at most." />
                <PillCode label="Confirmation code" name="code" hint="Paste it in one go." />
              </Gallery>
            }
            code={`<PillFields columns={2}>
  <PillInput label="Amount" name="amount" type="number" step="0.01" suffix="$" />
  <PillInput label="Weight" name="weight" type="number" suffix="kg" />
</PillFields>
<PillStepper label="Nights" name="nights" min={1} max={30} unit="nights" />
<PillCode label="Confirmation code" name="code" onComplete={verify} />`}
          >
            <p>
              <code>PillStepper</code> goes one step at a time. <code>PillCode</code> is one input drawn as slots, so pasting
              and SMS autofill work. <code>PillFields</code> groups fields, in <code>columns</code>.
            </p>
          </Example>
          <Example
            title="Choices"
            wide
            preview={
              <Gallery title="Choices" icon={<CheckIcon />} look={look} layout={layout}>
                <PillSelect label="Country" name="country" placeholder="Pick one" options={COUNTRIES} />
                <PillSelect label="Language" name="lang" layout="inline" options={["FR", "EN", "PT"]} />
                <PillChoices label="Plan" name="plan" look="segmented" defaultValue="month" options={[{ value: "week", label: "Weekly" }, { value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }]} />
                <PillChoices
                  label="Delivery"
                  name="delivery"
                  defaultValue="home"
                  options={[
                    { value: "home", label: "At home", hint: "Tomorrow before noon" },
                    { value: "point", label: "Pick-up point", hint: "Friday" },
                    { value: "store", label: "In store", hint: "Closed this week", disabled: true },
                  ]}
                />
                <PillChoices label="Music you like" name="genres" look="chips" multiple defaultValue={["jazz", "folk"]} options={GENRES} />
              </Gallery>
            }
            code={`<PillSelect label="Country" name="country" placeholder="Pick one" options={[{ label: "Europe", options: ["France", "Belgium"] }]} />
<PillSelect label="Language" name="lang" layout="inline" options={["FR", "EN", "PT"]} />
<PillChoices label="Plan" name="plan" look="segmented" options={["Weekly", "Monthly", "Yearly"]} />
<PillChoices label="Delivery" name="delivery" options={[{ value: "home", label: "At home", hint: "Tomorrow" }]} />
<PillChoices label="Music you like" name="genres" look="chips" multiple options={genres} />`}
          >
            <p>
              Open lists are drawn in the pill’s language where the browser lets them be (Chromium). <code>PillChoices</code>{" "}
              is one of several, or several with <code>multiple</code>: a <code>list</code>, a <code>segmented</code> bar
              where the choice slides, or <code>chips</code>.
            </p>
          </Example>
          <Example
            title="Sliders, switches and more"
            wide
            preview={
              <Gallery title="Sliders and switches" icon={<GearIcon />} look={look} layout={layout} resetLabel="Default">
                <PillSlider label="Volume" name="volume" defaultValue={60} format={(value) => `${value}%`} />
                <PillSlider label="Text size" name="text" min={12} max={24} defaultValue={16} format={(value) => `${value} px`} hint="Follows your system at 16." />
                <PillSwitch label="Dark mode" name="dark" defaultChecked />
                <PillSwitch label="Reduce motion" name="motion" hint="Animations become short fades." />
                <PillSwitch label="Beta features" name="beta" disabled />
                <PillColor label="Highlight" name="color" defaultValue="#d5d2e8" />
                <PillCheckbox label="Remember these settings on this device" name="remember" defaultChecked />
              </Gallery>
            }
            code={`<PillSlider label="Volume" name="volume" format={(v) => \`\${v}%\`} />
<PillSwitch label="Dark mode" name="dark" defaultChecked />
<PillColor label="Highlight" name="color" defaultValue="#d5d2e8" />
<PillCheckbox label="Remember these settings on this device" name="remember" />`}
          >
            <p>
              A slider shows its value at the end of the label’s line. A switch is on or off, at once; a checkbox is
              something to agree to, sent with the form.
            </p>
          </Example>
          <Example
            title="Files"
            wide
            preview={
              <Gallery title="Files" icon={<BoxIcon />} look={look} layout={layout} submitLabel="Send" busyLabel={BUSY} busyInterval={1200}>
                <PillFile label="Invoice" name="invoice" accept=".pdf,image/*" hint="PDF or picture." required />
                <PillFile label="Photos" name="photos" multiple optional prompt="Choose pictures or drop them here" />
              </Gallery>
            }
            code={`<PillFile label="Invoice" name="invoice" accept=".pdf,image/*" required />
<PillFile label="Photos" name="photos" multiple optional prompt="Choose pictures or drop them here" />`}
          >
            <p>An area to click or drop files on, which names them.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="validation" title="Validation, waiting and errors">
        <div className="docs-examples">
          <Example
            title="The browser’s validation"
            wide
            preview={
              <Gallery title="States" icon={<InfoIcon />} look={look} layout={layout} submitLabel="Try to save">
                <PillInput label="Required" name="r" required placeholder="Leave it empty and save" />
                <PillInput label="Email" name="e" type="email" defaultValue="camille@" hint="Checked as you leave the field." />
                <PillInput label="Username" name="u" defaultValue="camille" error="This username is taken." />
                <PillInput label="Read only" name="ro" defaultValue="MP-2026-1125" readOnly />
                <PillInput label="Disabled" name="di" defaultValue="Not available yet" disabled />
                <PillCheckbox label="I agree to the terms" name="agree" required />
              </Gallery>
            }
            code={`<PillInput label="Required" name="r" required />
<PillInput label="Email" name="e" type="email" />
<PillInput label="Username" name="u" error="This username is taken." /> {/* yours wins */}`}
          >
            <p>
              <code>required</code>, <code>type</code>, <code>pattern</code>, <code>min</code>… in the reader’s language: on an
              attempt to submit, which focuses the first wrong field, or on leaving a changed field. A message goes as soon
              as the value is right.
            </p>
          </Example>
          <Example
            title="Busy, then an error"
            wide
            preview={
              <Gallery
                title="Payment"
                icon={<HeartIcon />}
                look={look}
                layout={layout}
                submitLabel="Pay 24$"
                busyLabel={["Contacting your bank…", "Waiting for its answer…"]}
                busyInterval={1500}
                onSubmit={async () => {
                  await wait(3500);
                  throw new Error("Your bank declined the payment. Nothing was charged.");
                }}
              >
                <PillInput label="Card number" name="card" inputMode="numeric" defaultValue="4242 4242 4242 4242" autoComplete="off" />
              </Gallery>
            }
            code={`<PillFormPanel
  title="Payment"
  submitLabel="Pay 24$"
  busyLabel={["Contacting your bank…", "Waiting for its answer…"]}
  onSubmit={async (data) => {
    await pay(data); // throws: the panel stays open and shows the message
  }}
>…</PillFormPanel>`}
          >
            <p>
              <code>busyLabel</code>: one label, or several that follow one another (every <code>busyInterval</code> ms; the
              last one stays). Default “Just a moment…”.
            </p>
          </Example>
        </div>
        <Notes>
          <ul>
            <li>On phones, the pill stays above the keyboard while one of its fields has the focus.</li>
            <li>Escape closes an open list, not the panel.</li>
            <li>
              Notifications wait while a form of the base layer is open, so what’s being typed isn’t taken away. The base
              layer unmounts while a notification shows: keep what must last in your own state.
            </li>
            <li>
              Your app’s resets: CSS like <code>input &#123; border: 1px solid &#125;</code> that isn’t in a layer also
              reaches the pill’s fields. Scope such rules, or put them in a layer.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            caption="<PillFormPanel>"
            head={["Prop", "Notes"]}
            rows={[
              ["`onSubmit(data, event)`", "Called once every field is valid. The panel closes after it, unless it returns `false`. While its promise is pending, the fields wait; if it's rejected, the panel stays open and shows the error's message."],
              ["`submitLabel` / `submitIcon`", "The main action. Without a label there's none: for settings that apply at once."],
              ["`busyLabel` / `busyInterval`", "Its label while it waits: one, or several (every 2500 ms; the last one stays)."],
              ["`resetLabel`", "An action in the title's row that resets the fields."],
              ["`errorLabel`", "Shown when the error has no message. Default \"Something went wrong.\""],
              ["Also", "The panel's `name`, `title`, `titleAction`, `closeLabel`, `closeIcon`, `closeExpanded`, and the form's `look`, `layout`, `errors`, `disabled`."],
            ]}
          />
          <Reference
            caption="The fields"
            head={["Component", "Notes"]}
            rows={[
              ["`PillInput`", "`type`: `text`, `email`, `password`, `search`, `tel`, `url`, `number`, `date`, `time`, `datetime-local`, `month`, `week`. Also `icon`, `suffix`, `suggestions`, `revealLabel`."],
              ["`PillTextarea`", "Grows with its text, and counts it with `maxLength`."],
              ["`PillSelect`", "`options`: strings, `{ value, label, disabled? }`, or groups. `placeholder`, `icon`, `layout=\"inline\"`."],
              ["`PillSlider`", "A range, with its value at the end of the label's line: `format`."],
              ["`PillSwitch`", "On or off, at once."],
              ["`PillCheckbox`", "Something to agree to, sent with the form. `indeterminate`."],
              ["`PillChoices`", "One of several, or several with `multiple`. `look`: `\"list\"`, `\"segmented\"` or `\"chips\"`. `onChange(value)`."],
              ["`PillStepper`", "A number, one step at a time, with a `unit`."],
              ["`PillCode`", "A one-time code of `length` digits (6). `onComplete(code)`."],
              ["`PillFile`", "`multiple`, `accept`, `prompt`."],
              ["`PillColor`", "A colour."],
              ["`PillDate`", "A calendar of the pill's: see the calendar's page."],
              ["`PillFields`", "Fields that go together: a `label`, `columns={2}`, `separators`."],
              ["`PillSubmit`", "The action that sends the form, which says so meanwhile (`busyLabel`, `busyInterval`)."],
              ["`PillField`", "The label, the hint and the error, wired to a control of yours: `{(control) => <input {...control} />}`."],
            ]}
          />
          <Reference
            caption="Every field's props"
            head={["Prop", "Notes"]}
            rows={[
              ["`label`", "Required: the accessible name. `hideLabel` keeps it for assistive technology."],
              ["`hint`", "Under the control, and read with it."],
              ["`error`", "Your own error, e.g. from the server. It wins over the browser's."],
              ["`optional`", "Writes \"optional\" after the label, or your own word."],
              ["`layout`", "For text: the label above (`\"stacked\"`) or beside (`\"inline\"`)."],
              ["Any other", "Goes to the native control: `name`, `value`, `defaultValue`, `required`, `onChange`, `ref`…"],
            ]}
          />
          <Reference
            caption="<PillForm>"
            head={["Prop", "Default", "Notes"]}
            rows={[
              ["`look`", "`\"solid\"`", "Of every field: `\"solid\"`, `\"soft\"`, `\"outline\"`, or any string (written to `data-look`)."],
              ["`layout`", "`\"stacked\"`", "Its text fields' labels: above, or beside (`\"inline\"`)."],
              ["`errors`", "`\"inline\"`", "The browser's messages: under the fields, or in its bubbles (`\"native\"`)."],
              ["`onSend(data, event)`", "none", "Instead of `onSubmit`: called once every field is valid, with no page load. Busy while its promise is pending."],
              ["`disabled` / `busy`", "`false`", "Disables every field."],
            ]}
          />
          <Reference
            caption="Tokens"
            head={["Token", "Default"]}
            rows={[
              ["`--mp-field` / `--mp-on-field` / `--mp-field-rim`", "The actions' colours and outline."],
              ["`--mp-placeholder`", "`--mp-on-field` at 70% (92% on glass)."],
              ["`--mp-field-size` / `--mp-field-radius` / `--mp-field-gap`", "An action's height / half of it / 1.25 times `--mp-gap`."],
              ["`--mp-field-scheme`", "`light` (`dark` on glass, `soft` and `outline`): what the browser draws."],
              ["`--mp-label-font` / `--mp-label-style` / `--mp-label-weight`", "`--mp-font-accent` / `normal` / `400`."],
              ["`--mp-error`", "`--mp-danger` mixed with the pill's text."],
              ["`--mp-list` / `--mp-on-list` / `--mp-picker`", "What opens over the page. `--mp-picker: none` keeps the system's lists."],
              ["`--mp-accent` / `--mp-on-accent`", "The pill's text / its surface: switches, sliders, ticks, the submit action."],
              ["`--mp-track` / `--mp-track-size` / `--mp-thumb`", "The pill's text at 48% / `4px` / `1.25rem`."],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/forms/" />
    </>
  );
}
