"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BoxIcon,
  CheckIcon,
  CloseIcon,
  DocumentIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  Pill,
  PillAction,
  PillActions,
  PillDivider,
  PillIcon,
  PillMessage,
  PillPanel,
  PillPanelTrigger,
  UndoIcon,
  pill,
  usePill,
  type PillPlacement,
  type PillPresence,
  type SceneChange,
} from "magic-pill";

import { ChipGroup } from "../../controls";
import { useStage } from "../../stage";
import { Code } from "../_components/code";
import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};

function Anatomy() {
  return (
    <>
      <PillIcon>
        <InfoIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>Your parcel is 5 stops away!</PillMessage>
      <PillActions>
        <PillAction icon={<PhoneIcon />} label="Call the driver" onClick={noop} />
        <PillAction icon={<BoxIcon />} label="Track it" onClick={noop} />
      </PillActions>
    </>
  );
}

const PRESENCES: { value: PillPresence; label: string }[] = [
  { value: "hidden", label: "hidden" },
  { value: "rest", label: "rest" },
  { value: "compact", label: "compact" },
  { value: "expanded", label: "expanded" },
  { value: "panel", label: "panel" },
];

function Presence() {
  const [presence, setPresence] = useState<PillPresence>("compact");
  return (
    <div className="controls">
      <ChipGroup legend="presence" name="presence" options={PRESENCES} value={presence} onChange={setPresence} />
      <div className="presence-stage">
        <Pill presence={presence} onPresenceChange={setPresence} role="group" aria-label="Presence example">
          <PillIcon>
            <MailIcon />
          </PillIcon>
          <PillDivider />
          <PillMessage>Camille replied</PillMessage>
          <PillActions>
            <PillAction icon={<MailIcon />} label="Read" onClick={noop} />
            <PillPanelTrigger icon={<DocumentIcon />} label="Preview" />
          </PillActions>
          <PillPanel title="Camille replied">
            <p>“The parcel arrived this morning, thank you! Two photos attached.”</p>
          </PillPanel>
        </Pill>
      </div>
    </div>
  );
}

const PLACEMENTS: PillPlacement[] = ["bottom", "bottom-start", "bottom-end", "top", "top-start", "top-end", "left", "right"];

/** Moves the main pill: it travels to its new place, resizing on the way. */
function Placements() {
  const { stage, setStage } = useStage();
  const current = stage?.id === "placement" ? (stage.pill?.placement ?? "bottom") : "bottom";
  return (
    <div className="button-row placement-row">
      {PLACEMENTS.map((placement) => (
        <button
          key={placement}
          type="button"
          className={placement === current ? "button button-dark" : "button button-outline"}
          aria-pressed={placement === current}
          onClick={() => setStage(placement === "bottom" ? null : { id: "placement", pill: { placement } })}
        >
          {placement}
        </button>
      ))}
    </div>
  );
}

const VARIANTS = ["neutral", "success", "danger", "brand"];

function SceneDemo() {
  const [done, setDone] = useState(false);
  const [change, setChange] = useState<SceneChange>("circle");
  return (
    <div className="controls">
      <ChipGroup
        legend="sceneChange"
        name="scene-change"
        options={(["circle", "slide", "none"] as const).map((value) => ({ value, label: value }))}
        value={change}
        onChange={setChange}
      />
      <Pill scene={done ? "done" : "ask"} sceneChange={change} variant={done ? "success" : "neutral"} role="group" aria-label="Scene example">
        {done ? (
          <>
            <PillIcon>
              <CheckIcon />
            </PillIcon>
            <PillDivider />
            <PillMessage>Order confirmed</PillMessage>
            <PillActions>
              <PillAction icon={<UndoIcon />} label="Back" onClick={() => setDone(false)} />
            </PillActions>
          </>
        ) : (
          <>
            <PillMessage>Confirm your order of 3 items?</PillMessage>
            <PillActions>
              <PillAction icon={<CheckIcon />} label="Confirm" expanded onClick={() => setDone(true)} />
            </PillActions>
          </>
        )}
      </Pill>
    </div>
  );
}

/** A part of your own: usePill() gives it its pill. */
function ShowLabels() {
  const { presence, setPresence } = usePill();
  const expanded = presence === "expanded";
  return (
    <PillAction
      icon={expanded ? <CloseIcon /> : <InfoIcon />}
      label={expanded ? "Hide the labels" : "Show the labels"}
      onClick={() => setPresence(expanded ? "compact" : "expanded")}
    />
  );
}

function call() {
  pill().notify({
    announce: "Incoming call from Alex",
    duration: Infinity,
    render: ({ dismiss }) => (
      <>
        <PillIcon>
          <PhoneIcon />
        </PillIcon>
        <PillDivider />
        <PillMessage>Alex is calling</PillMessage>
        <PillActions>
          <PillAction icon={<CheckIcon />} label="Answer" onClick={dismiss} />
          <PillAction icon={<CloseIcon />} label="Decline" onClick={dismiss} />
        </PillActions>
      </>
    ),
  });
}

export function Content() {
  return (
    <>
      <DocsHeader title="The pill">
        <p>
          Everything is built from <code>&lt;Pill&gt;</code> and its parts, and you can use them directly. A pill you write
          yourself isn’t connected to <code>pill()</code>: you control it with props.
        </p>
      </DocsHeader>

      <DocsSection id="parts" title="Parts">
        <div className="docs-examples">
          <Example
            title="Icon, divider, message, actions"
            preview={
              <Pill role="group" aria-label="Parts example">
                <Anatomy />
              </Pill>
            }
            stage={{ content: <Anatomy /> }}
            code={`<Pill aria-label="Delivery">
  <PillIcon><InfoIcon /></PillIcon>
  <PillDivider />
  <PillMessage>Your parcel is 5 stops away!</PillMessage>
  <PillActions>
    <PillAction icon={<PhoneIcon />} label="Call the driver" onClick={call} />
    <PillAction icon={<BoxIcon />} label="Track it" href="/track" linkComponent={Link} />
  </PillActions>
</Pill>`}
          >
            <p>
              A <code>PillAction</code> is a <code>&lt;button&gt;</code> with <code>onClick</code>, or a link with{" "}
              <code>href</code>. Its <code>label</code> is required: the accessible name, shown on hover and focus.
            </p>
          </Example>
          <Example
            title="Only actions"
            preview={
              <Pill role="group" aria-label="Contact us">
                <PillActions>
                  <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
                  <PillAction icon={<MailIcon />} label="Send an email" href="mailto:hello@example.com" />
                  <PillAction icon={<DocumentIcon />} label="Ask for a quotation" href="/docs/forms/" linkComponent={Link} />
                </PillActions>
              </Pill>
            }
            code={`<Pill aria-label="Contact us">
  <PillActions>
    <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
    <PillAction icon={<MailIcon />} label="Send an email" href="mailto:hello@example.com" />
    <PillAction icon={<DocumentIcon />} label="Ask for a quotation" href="/quote" linkComponent={Link} />
  </PillActions>
</Pill>`}
          >
            <p>A toolbox.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="presence" title="Presence">
        <div className="docs-examples">
          <Example
            title="From hidden to panel"
            preview={<Presence />}
            wide
            code={`const [presence, setPresence] = useState<PillPresence>("compact");

<Pill presence={presence} onPresenceChange={setPresence}>…</Pill>`}
          >
            <p>
              <code>hidden</code>, <code>rest</code> (a circle with the icon only), <code>compact</code>,{" "}
              <code>expanded</code> (every action label shown) and <code>panel</code>. The pill animates its real size from
              one to the other. Uncontrolled: <code>defaultPresence</code>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="placement" title="Placement">
        <Notes>
          <p>
            <code>inline</code> (in the page flow, the default), the edges and corners (fixed; <code>start</code> and{" "}
            <code>end</code> follow the text direction), or <code>overlay</code> (<Link href="/docs/modal/">a modal</Link>).
            Change it and the pill goes there through the circle: it closes where it is, the circle travels, and it opens at
            its new place, so nothing jumps, even where it turns vertical. Move this site’s pill:
          </p>
          <Placements />
          <Code label="Code: placement">{`<MagicPill placement="top-end">…</MagicPill>
<MagicPill placement="top-end" moveThroughCircle={false}>…</MagicPill> {/* travels at full size */}`}</Code>
          <p className="hint">
            On <code>left</code>, it lines up next to the docs’ pill instead of covering it:{" "}
            <Link href="/docs/several-pills/">pills that share a spot</Link>.
          </p>
        </Notes>
      </DocsSection>

      <DocsSection id="looks" title="Orientation and variants">
        <div className="docs-examples">
          <Example
            title="Vertical"
            preview={
              <Pill orientation="vertical" role="group" aria-label="Vertical example">
                <PillActions>
                  <PillAction icon={<BoxIcon />} label="Orders" aria-current="true" onClick={noop} />
                  <PillAction icon={<DocumentIcon />} label="Invoices" onClick={noop} />
                  <PillAction icon={<MailIcon />} label="Messages" onClick={noop} />
                </PillActions>
              </Pill>
            }
            code={`<Pill orientation="vertical">
  <PillActions>…</PillActions>
</Pill>`}
          >
            <p>
              The default for <code>left</code> and <code>right</code> pills, like the docs’ own.
            </p>
          </Example>
          <Example
            title="Variants"
            preview={
              <div className="controls">
                {VARIANTS.map((variant) => (
                  <Pill key={variant} variant={variant} role="group" aria-label={`${variant} example`}>
                    <PillMessage>variant=&quot;{variant}&quot;</PillMessage>
                  </Pill>
                ))}
              </div>
            }
            code={`<Pill variant="success">…</Pill>
<Pill variant="brand">…</Pill> /* yours: [data-variant="brand"] { --mp-surface: #4b2bd6; } */`}
          >
            <p>
              The variant picks the colour, <Link href="/docs/themes/">the theme</Link> the material.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="scenes" title="Scenes">
        <div className="docs-examples">
          <Example
            title="From one content to the next"
            preview={<SceneDemo />}
            code={`<Pill scene={done ? "done" : "ask"} sceneChange="circle" variant={done ? "success" : "neutral"}>
  {done ? <Confirmed /> : <Question />}
</Pill>`}
          >
            <p>
              When what a pill shows changes altogether, name it. <code>circle</code> closes to a circle and opens on the
              new content, <code>slide</code> slides one out and the other in, <code>none</code> switches at once. A focus
              that leaves with the old content goes to the pill.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="templates" title="Your own templates">
        <div className="docs-examples">
          <Example
            title="In the queue: render"
            notify={call}
            code={`pill().notify({
  announce: "Incoming call from Alex",
  duration: Infinity,
  render: ({ dismiss }) => (
    <>
      <PillIcon><PhoneIcon /></PillIcon>
      <PillDivider />
      <PillMessage>Alex is calling</PillMessage>
      <PillActions>
        <PillAction icon={<CheckIcon />} label="Answer" onClick={() => { answer(); dismiss(); }} />
        <PillAction icon={<CloseIcon />} label="Decline" onClick={dismiss} />
      </PillActions>
    </>
  ),
});`}
          >
            <p>Templates are plain arrangements of the parts: yours get the same queue, timing and animation.</p>
          </Example>
          <Example
            title="A part of your own: usePill"
            preview={
              <Pill role="group" aria-label="usePill example">
                <PillMessage>Three actions</PillMessage>
                <PillActions>
                  <PillAction icon={<MailIcon />} label="Reply" onClick={noop} />
                  <PillAction icon={<BoxIcon />} label="Archive" onClick={noop} />
                  <ShowLabels />
                </PillActions>
              </Pill>
            }
            code={`function ShowLabels() {
  const { presence, setPresence } = usePill();
  const expanded = presence === "expanded";
  return (
    <PillAction
      icon={<InfoIcon />}
      label={expanded ? "Hide the labels" : "Show the labels"}
      onClick={() => setPresence(expanded ? "compact" : "expanded")}
    />
  );
}`}
          >
            <p>
              <code>usePill()</code> gives a part its pill: <code>presence</code>, <code>setPresence</code>,{" "}
              <code>openPanel(name?)</code>, <code>closePanel()</code>, <code>placement</code>, <code>orientation</code>,{" "}
              <code>variant</code>.
            </p>
          </Example>
          <Example
            title="Unstyled"
            preview={
              <Pill unstyled role="group" aria-label="Unstyled example">
                <PillMessage>The behaviour, without the look</PillMessage>
                <PillActions>
                  <PillAction icon={<CheckIcon />} label="OK" onClick={noop} />
                </PillActions>
              </Pill>
            }
            code={`<Pill unstyled className="my-pill">…</Pill>`}
          />
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            head={["Prop", "Values", "Default"]}
            rows={[
              ["`placement`", "`\"inline\"`, `\"top\"`, `\"bottom\"`, `\"left\"`, `\"right\"`, `\"top-start\"`, `\"top-end\"`, `\"bottom-start\"`, `\"bottom-end\"`, `\"overlay\"`", "`\"inline\"`"],
              ["`presence` / `defaultPresence` / `onPresenceChange`", "`\"hidden\"`, `\"rest\"`, `\"compact\"`, `\"expanded\"`, `\"panel\"`", "`\"compact\"`"],
              ["`closeOnBackdropClick`", "`boolean`, for `\"overlay\"`: a click outside does what Escape does", "`false`"],
              ["`backdrop`", "`\"plain\"`, `\"glow\"`, or any string, for `\"overlay\"`", "`\"plain\"`"],
              ["`ladder`", "`boolean`, for the fixed placements: pills with the same placement line up. `false` leaves this one out", "`true`"],
              ["`moveThroughCircle`", "`boolean`, for the fixed placements: a new placement (or orientation) is reached through the circle. `false` travels at full size; at once with reduced motion", "`true`"],
              ["`scene` / `sceneChange`", "A name for what the pill shows / `\"circle\"`, `\"slide\"` or `\"none\"`", "none / `\"circle\"`"],
              ["`orientation`", "`\"horizontal\"`, `\"vertical\"`", "`\"vertical\"` for `left`/`right`"],
              ["`variant`", "`\"neutral\"`, `\"success\"`, `\"danger\"`, or any string", "`\"neutral\"`"],
              ["`theme`", "`\"plain\"`, `\"glass\"`, `\"liquid\"`, or any string", "`\"plain\"`"],
              ["`unstyled`", "`boolean`: keep the behaviour, drop the look", "`false`"],
            ]}
          />
          <p>
            Any other prop (<code>className</code>, <code>aria-label</code>, <code>ref</code>…) goes to the element.
          </p>
          <h3>The parts</h3>
          <ul>
            <li>
              <code>PillIcon</code>: the leading icon. Decorative unless you give it a <code>label</code>.
            </li>
            <li>
              <code>PillDivider</code>: the thin line after the icon.
            </li>
            <li>
              <code>PillMessage</code>: the message, in the italic serif.
            </li>
            <li>
              <code>PillActions</code> and <code>PillAction</code>: round buttons or links, with <code>expanded</code> to
              always show the label.
            </li>
            <li>
              <code>PillPanel</code> and <code>PillPanelTrigger</code>: see <Link href="/docs/panels/">Panels</Link>.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/pill/" />
    </>
  );
}
