"use client";
import { useState, type ReactNode } from "react";
import { ArrowIcon, BoxIcon, CheckIcon, Pill, PillDate, PillDivider, PillFormPanel, PillIcon, PillMessage, PillActions, PillPanelTrigger, pill } from "magic-pill";

import { CalendarIcon } from "../../icons";
import { DemoNavbar } from "../_components/demo-navbar";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

/** `day` is written like the value: 2026-12-24. */
const isWeekend = (day: string) => [0, 6].includes(new Date(`${day}T12:00`).getDay());

/** An open panel holding a few dates. Closed, it's a pill that opens it again. */
function DatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Pill defaultPresence="panel" role="group" aria-label={title}>
      <PillIcon>
        <CalendarIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>{title}</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<ArrowIcon />} label="Open" expanded />
      </PillActions>
      <PillFormPanel title={title} onSubmit={() => false}>
        {children}
      </PillFormPanel>
    </Pill>
  );
}

/** A booking form in a navbar's panel: for the main pill. */
function Booking() {
  return (
    <DemoNavbar
      items={[
        { href: "/", label: "Home", icon: <BoxIcon /> },
        { panel: "book", label: "Book a table", icon: <CalendarIcon />, expanded: true },
      ]}
      pathname="/"
      label="Booking example"
    >
      <PillFormPanel
        name="book"
        title="Book a table"
        submitLabel="Book"
        onSubmit={(data) => {
          const when = new Date(String(data.get("when")));
          pill().notify({
            variant: "success",
            icon: <CheckIcon />,
            message: `Booked for ${when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`,
            duration: 3500,
          });
        }}
      >
        <PillDate name="when" label="When" type="datetime-local" defaultValue="2026-12-24T19:30" min="2026-11-26T12:00" step={900} required />
      </PillFormPanel>
    </DemoNavbar>
  );
}

function Controlled() {
  const [value, setValue] = useState("2026-12-24");
  return (
    <div className="controls">
      <DatePanel title="Controlled">
        <PillDate name="day" label="Day" value={value} onChange={setValue} />
      </DatePanel>
      <p className="hint">
        <code>value</code>: {value || "(empty)"}
      </p>
    </div>
  );
}

export function Content() {
  return (
    <>
      <DocsHeader title="Calendar">
        <p>
          <code>PillInput type=&quot;date&quot;</code> opens the browser’s own calendar: the one people know on their device,
          and it costs nothing. <code>PillDate</code> draws one in the pill’s language instead, with the same values, so one
          can replace the other. It’s optional, with a stylesheet of its own: <code>magic-pill/calendar.css</code>, after{" "}
          <code>forms.css</code>.
        </p>
      </DocsHeader>

      <DocsSection id="types" title="Every kind of date">
        <div className="docs-examples">
          <Example
            title="Date, month, week, time"
            wide
            preview={
              <DatePanel title="Dates">
                <PillDate name="date" label="Date" defaultValue="2026-12-24" />
                <PillDate name="month" label="Month" type="month" defaultValue="2026-12" />
                <PillDate name="week" label="Week" type="week" defaultValue="2026-W52" />
                <PillDate name="time" label="Time" type="time" defaultValue="19:30" />
                <PillDate name="slot" label="Date and time" type="datetime-local" defaultValue="2026-12-24T19:30" step={900} />
              </DatePanel>
            }
            code={`import "magic-pill/forms.css";
import "magic-pill/calendar.css";

<PillDate name="date" label="Date" defaultValue="2026-12-24" />
<PillDate name="month" label="Month" type="month" />
<PillDate name="week" label="Week" type="week" />
<PillDate name="time" label="Time" type="time" />
<PillDate name="slot" label="Date and time" type="datetime-local" step={900} />`}
          >
            <p>
              Values are written as the native input of that type writes them: <code>2026-12-24</code>,{" "}
              <code>2026-12</code>, <code>2026-W52</code>, <code>19:30</code>, <code>2026-12-24T19:30</code>. The title goes up
              to the months, then to the years.
            </p>
          </Example>
          <Example
            title="Book a table"
            preview={
              <Pill role="group" aria-label="Booking example">
                <Booking />
              </Pill>
            }
            stage={{ content: <Booking /> }}
            code={`<PillFormPanel name="book" title="Book a table" submitLabel="Book" onSubmit={book}>
  <PillDate name="when" label="When" type="datetime-local" min={now} step={900} required />
</PillFormPanel>`}
          >
            <p>
              <code>step</code> is in seconds: how far apart the times are (five minutes by default).
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="limits" title="Limits, languages, always open">
        <div className="docs-examples">
          <Example
            title="Weekdays in December"
            preview={
              <DatePanel title="Delivery day">
                <PillDate name="delivery" label="Delivery day" min="2026-12-01" max="2026-12-31" disabledDate={isWeekend} defaultValue="2026-12-02" />
              </DatePanel>
            }
            code={`<PillDate name="delivery" label="Delivery day"
  min="2026-12-01" max="2026-12-31"
  disabledDate={(day) => [0, 6].includes(new Date(\`\${day}T12:00\`).getDay())} /> {/* day: "2026-12-24" */}`}
          />
          <Example
            title="In French, from Sunday"
            preview={
              <DatePanel title="Rendez-vous">
                <PillDate name="rdv" label="Rendez-vous" locale="fr-FR" firstDay={0} format={{ dateStyle: "full" }} defaultValue="2026-12-24" labels={{ today: "Aujourd’hui", clear: "Effacer" }} />
              </DatePanel>
            }
            code={`<PillDate name="rdv" label="Rendez-vous" locale="fr-FR" firstDay={0}
  format={{ dateStyle: "full" }} labels={{ today: "Aujourd’hui", clear: "Effacer" }} />`}
          >
            <p>The reader’s language, first day and format by default.</p>
          </Example>
          <Example
            title="Always open"
            preview={
              <DatePanel title="Check-in">
                <PillDate name="checkin" label="Check-in" inline defaultValue="2026-12-24" />
              </DatePanel>
            }
            code={`<PillDate name="checkin" label="Check-in" inline />`}
          >
            <p>
              <code>inline</code> puts it in the form instead of a popover, made of the pill itself.
            </p>
          </Example>
          <Example title="Controlled" preview={<Controlled />} code={`const [value, setValue] = useState("2026-12-24");

<PillDate name="day" label="Day" value={value} onChange={setValue} />`} />
        </div>
        <Notes>
          <p>
            With the keyboard: the arrows, Home and End (the week), Page Up and Page Down (the month; the year with Shift),
            Enter, and Escape, which closes it alone. It looks like open lists do (<code>--mp-list</code>,{" "}
            <code>--mp-on-list</code>): made of the fields, of the form’s <code>look</code>, or of the pill’s glass.
          </p>
        </Notes>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            head={["Prop", "Notes"]}
            rows={[
              ["`type`", "`\"date\"`, `\"month\"`, `\"week\"`, `\"time\"`, `\"datetime-local\"`."],
              ["`value` / `defaultValue` / `onChange(value)`", "As the native input of that type writes it. It's sent with the form the same way."],
              ["`min` / `max` / `step` / `required` / `disabled`", "As on the native input (`step` in seconds)."],
              ["`disabledDate(day)`", "Days that can't be chosen, e.g. weekends."],
              ["`inline`", "Always there, in the form, instead of in a popover."],
              ["`locale` / `firstDay` / `format`", "The reader's by default: the language, the first day of the week, how the value is written (`Intl.DateTimeFormat` options)."],
              ["`labels` / `placeholder`", "Its own words (`today`, `now`, `clear`, `done`, `previous`, `next`, `hours`, `minutes`…)."],
              ["`--mp-calendar-cell`", "Its days' size: `2.25rem`."],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/calendar/" />
    </>
  );
}
