"use client";
import { useState, type CSSProperties } from "react";
import { CheckIcon, CloseIcon, InfoIcon, Pill, PillAction, PillActions, PillIcon, PillDivider, PillMessage, PillPanel, PillPanelTrigger, type PillPresence } from "magic-pill";

import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

interface ModalDemoProps {
  button: string;
  closeOnBackdropClick?: boolean;
  backdrop?: string;
  className?: string;
  style?: CSSProperties;
  withPanel?: boolean;
}

/** A button that opens a confirmation modal, with the given backdrop. */
function ModalDemo({ button, closeOnBackdropClick, backdrop, className, style, withPanel }: ModalDemoProps) {
  const [presence, setPresence] = useState<PillPresence>("hidden");
  const [answer, setAnswer] = useState<string | null>(null);
  const close = (result: string) => {
    setAnswer(result);
    setPresence("hidden");
  };
  return (
    <div className="controls modal-demo">
      <button type="button" className="button button-dark" onClick={() => setPresence("compact")}>
        {button}
      </button>
      {answer && <p className="hint">You chose: {answer}</p>}
      <Pill
        placement="overlay"
        variant={withPanel ? "neutral" : "danger"}
        presence={presence}
        onPresenceChange={setPresence}
        closeOnBackdropClick={closeOnBackdropClick}
        backdrop={backdrop}
        className={className}
        style={style}
        aria-label={withPanel ? "Cookies" : "Confirm deletion"}
      >
        {withPanel ? (
          <>
            <PillIcon>
              <InfoIcon />
            </PillIcon>
            <PillDivider />
            <PillMessage>We use one cookie, to remember your theme.</PillMessage>
            <PillActions>
              <PillPanelTrigger icon={<InfoIcon />} label="Why?" />
              <PillAction icon={<CheckIcon />} label="OK" expanded onClick={() => close("OK")} />
            </PillActions>
            <PillPanel title="Why one cookie?">
              <p>It keeps the theme you picked, on this device only. Nothing else is stored, and nothing leaves the site.</p>
            </PillPanel>
          </>
        ) : (
          <>
            <PillMessage>Delete this item?</PillMessage>
            <PillActions>
              <PillAction icon={<CheckIcon />} label="Delete" expanded onClick={() => close("Delete")} />
              <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => close("Cancel")} />
            </PillActions>
          </>
        )}
      </Pill>
    </div>
  );
}

export function Content() {
  return (
    <>
      <DocsHeader title="Modal">
        <p>
          <code>placement=&quot;overlay&quot;</code> renders a native modal <code>&lt;dialog&gt;</code>, which brings a focus
          trap, Escape and an inert page with it. It pops in and scales out like any other pill while its backdrop fades:
          the dialog closes, and gives the focus back, once the exit has played.
        </p>
      </DocsHeader>

      <DocsSection id="confirm" title="Confirmations">
        <div className="docs-examples">
          <Example
            title="Delete this item?"
            preview={<ModalDemo button="Delete this item" />}
            code={`const [open, setOpen] = useState(false);

<Pill placement="overlay" variant="danger"
  presence={open ? "compact" : "hidden"}
  onPresenceChange={(p) => setOpen(p !== "hidden")}>
  <PillMessage>Delete this item?</PillMessage>
  <PillActions>
    <PillAction icon={<CheckIcon />} label="Delete" expanded onClick={confirmDelete} />
    <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => setOpen(false)} />
  </PillActions>
</Pill>`}
          >
            <p>Escape cancels. A click outside doesn’t, by default, so a confirmation isn’t dismissed by accident.</p>
          </Example>
          <Example
            title="Close with a click outside"
            preview={<ModalDemo button="Open it, then click outside" closeOnBackdropClick withPanel />}
            code={`<Pill placement="overlay" closeOnBackdropClick …>
  …
  <PillPanel title="Why one cookie?">…</PillPanel>
</Pill>`}
          >
            <p>
              <code>closeOnBackdropClick</code> does what Escape does: it closes the panel if it’s open, the modal otherwise.
              Call <code>event.preventDefault()</code> in your <code>onClick</code> to keep it open.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="backdrops" title="Backdrops">
        <div className="docs-examples">
          <Example
            title="Blurred"
            preview={<ModalDemo button="A blurred backdrop" className="blurred-backdrop" />}
            language="css"
            code={`.my-modal { --mp-backdrop-blur: 10px; }`}
          >
            <p>
              <code>--mp-backdrop</code> is a colour, or any CSS background; <code>--mp-backdrop-blur</code> also blurs the
              page.
            </p>
          </Example>
          <Example
            title="Glow"
            preview={<ModalDemo button="A glowing backdrop" backdrop="glow" className="glow-backdrop" />}
            code={`import "magic-pill/themes.css";

<Pill placement="overlay" backdrop="glow" style={{ "--mp-glow-1": "#ff9a62", "--mp-glow-2": "#4f8cff" }}>…</Pill>`}
          >
            <p>
              Two soft lights drift over the backdrop: <code>--mp-glow-1</code>, <code>--mp-glow-2</code> and{" "}
              <code>--mp-glow-duration</code> (a full turn, <code>14s</code>). They stand still with reduced motion.
            </p>
          </Example>
          <Example
            title="Your own"
            preview={<ModalDemo button="A dotted backdrop" backdrop="dots" />}
            language="css"
            code={`/* <Pill placement="overlay" backdrop="dots"> */
[data-mp="pill"][data-backdrop="dots"]::backdrop {
  background: radial-gradient(circle, rgb(20 20 20 / 0.5) 1.5px, transparent 2px) 0 0 / 14px 14px;
}`}
          >
            <p>
              Any other string is written to <code>data-backdrop</code>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            head={["Prop or token", "Notes"]}
            rows={[
              ["`placement=\"overlay\"`", "A native modal `<dialog>`. A pill doesn't travel to or from it."],
              ["`closeOnBackdropClick`", "A click outside does what Escape does. Default `false`."],
              ["`backdrop`", "`\"plain\"` (default), `\"glow\"` (with `themes.css`), or any string, written to `data-backdrop`."],
              ["`--mp-backdrop`", "The backdrop: `rgb(20 20 20 / 0.4)`, or any CSS background."],
              ["`--mp-backdrop-blur`", "Blurs the page behind. None by default."],
              ["`--mp-glow-1` / `--mp-glow-2` / `--mp-glow-duration`", "The glow's colours, and a full turn (`14s`)."],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/modal/" />
    </>
  );
}
