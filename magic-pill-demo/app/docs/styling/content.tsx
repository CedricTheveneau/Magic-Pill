"use client";
import type { CSSProperties } from "react";
import { BoxIcon, CheckIcon, CloseIcon, InfoIcon, MailIcon, Pill, PillAction, PillActions, PillDivider, PillIcon, PillMessage } from "magic-pill";

import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};

/** The same message in each palette, so they compare. */
function Sample({ className, variant, style }: { className?: string; variant?: string; style?: CSSProperties }) {
  return (
    <Pill className={className} variant={variant} style={style} role="group" aria-label="Styled example">
      <PillIcon>
        <InfoIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>Your parcel is 5 stops away!</PillMessage>
      <PillActions>
        <PillAction icon={<BoxIcon />} label="Track it" onClick={noop} />
        <PillAction icon={<MailIcon />} label="Contact" onClick={noop} />
      </PillActions>
    </Pill>
  );
}

const MESSAGE = { icon: <InfoIcon />, message: "Your parcel is 5 stops away!", action: { icon: <BoxIcon />, label: "Track it", onClick: noop } };

export function Content() {
  return (
    <>
      <DocsHeader title="Styling">
        <p>
          Every rule sits in a <code>magic-pill</code> cascade layer: any CSS of yours that isn’t in a layer wins, whatever its
          specificity, with no <code>!important</code>. Most of the look is <strong>tokens</strong>: set them on{" "}
          <code>:root</code>, on one pill, or anywhere in between.
        </p>
      </DocsHeader>

      <DocsSection id="variants" title="Variants and palettes">
        <div className="docs-examples">
          <Example
            title="A variant of your own"
            preview={<Sample variant="brand" />}
            notify={{ ...MESSAGE, variant: "brand" }}
            language="css"
            code={`/* <Pill variant="brand"> or pill().notify({ variant: "brand", … }) */
[data-variant="brand"] {
  --mp-surface: #4b2bd6;
  --mp-on-surface: #f6f3ff;
  --mp-action: #f6f3ff;
  --mp-on-action: #4b2bd6;
}`}
          >
            <p>
              Any string: <code>variant=&quot;brand&quot;</code> gives <code>data-variant=&quot;brand&quot;</code>.
            </p>
          </Example>
          <Example
            title="A light pill"
            preview={<Sample className="palette-paper" />}
            stage={{ pill: { className: "palette-paper" } }}
            language="css"
            code={`:root {
  --mp-surface: #fffaf0; --mp-on-neutral: #2b2118;               /* a light neutral pill, with dark text… */
  --mp-neutral-action: #2b2118; --mp-on-neutral-action: #fffaf0; /* …and dark actions */
}`}
          >
            <p>
              The text and action colours can be set for every pill at once, or for one variant: success and danger stay as
              they are here.
            </p>
          </Example>
          <Example
            title="Navy, with an accent"
            preview={<Sample className="palette-navy" />}
            stage={{ pill: { className: "palette-navy" } }}
            language="css"
            code={`.my-app {
  --mp-surface: #0d3142; --mp-on-surface: #f2efea;
  --mp-action: #f2efea; --mp-on-action: #0d3142;
  --mp-accent: #ff4f00; --mp-on-accent: #141414; /* switches, sliders, a panel's titleAction */
}`}
          >
            <p>
              Check an accent’s text against the accent: cream on this orange is 2.9:1, near-black 5.6:1.
            </p>
          </Example>
          <Example
            title="Smaller"
            preview={<Sample className="palette-small" />}
            stage={{ pill: { className: "palette-small" } }}
            language="css"
            code={`.compact-pill {
  --mp-padding: 0.5rem;
  --mp-action-size: 2.25rem;
  --mp-gap: 0.625rem;
  --mp-text-size: 0.875rem;
}`}
          >
            <p>Sizes are tokens too, like the docs’ pill on the left.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="motion" title="Motion and shape">
        <div className="docs-examples">
          <Example
            title="Out of the edge"
            stage={{ pill: { style: { "--mp-scale-origin": "bottom" } as CSSProperties } }}
            notify={{ variant: "success", icon: <CheckIcon />, message: "I grew out of the bottom edge.", duration: 3000 }}
            language="css"
            code={`.my-pill { --mp-scale-origin: bottom; }`}
          >
            <p>
              Where the pill pops in from and scales out to: its centre by default.
            </p>
          </Example>
          <Example
            title="Slower"
            stage={{ pill: { style: { "--mp-duration-enter": "1200ms", "--mp-duration-change": "700ms", "--mp-duration-exit": "900ms" } as CSSProperties } }}
            notify={{ variant: "danger", icon: <CloseIcon />, message: "Everything takes its time now.", duration: 3000 }}
            language="css"
            code={`.my-pill {
  --mp-duration-enter: 1200ms;  /* 500ms */
  --mp-duration-change: 700ms;  /* 250ms */
  --mp-duration-exit: 900ms;    /* 300ms */
}`}
          >
            <p>With reduced motion, shape changes become short fades whatever these say.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="css" title="Classes, selectors and layers">
        <div className="docs-examples">
          <Example
            title="Parts and states"
            language="css"
            code={`[data-mp="pill"][data-variant="danger"] [data-mp="message"] { font-weight: 700; }

/* An action's look is on its body, so resets like a { color: inherit } don't break it */
.my-pill [data-mp="action-body"] { border-radius: 0.75rem; }`}
          >
            <p>
              Parts are selected by <code>data-mp</code> attributes, states by <code>data-presence</code>,{" "}
              <code>data-placement</code>, <code>data-orientation</code>, <code>data-variant</code>, <code>data-theme</code>,{" "}
              <code>data-backdrop</code> and <code>data-scheme</code>. No class names of ours clash with yours.
            </p>
          </Example>
          <Example
            title="Classes"
            code={`<Pill className="my-pill">
  <PillMessage className="my-message">…</PillMessage>
</Pill>

<MagicPill classNames={{ message: "my-message", action: "my-action" }} />`}
          >
            <p>
              Every part takes a <code>className</code>; templates and hosts take <code>classNames</code>.
            </p>
          </Example>
          <Example title="Tailwind CSS v4" language="css" code={`@layer theme, base, magic-pill, components, utilities;`}>
            <p>Declare the layer order once, before your imports, so utilities win.</p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="tokens" title="Tokens">
        <Notes>
          <Reference
            head={["Token", "Default"]}
            rows={[
              ["`--mp-surface` / `--mp-on-surface`", "`#141414` / `#f9f9f9`"],
              ["`--mp-action` / `--mp-on-action`", "`#f9f9f9` / `#141414`"],
              ["`--mp-on-neutral` / `--mp-on-success` / `--mp-on-danger`", "`--mp-on-surface`: the text of one variant"],
              ["`--mp-neutral-action` / `--mp-success-action` / `--mp-danger-action`", "`--mp-action`: the actions of one variant"],
              ["`--mp-on-neutral-action` / `--mp-on-success-action` / `--mp-on-danger-action`", "`--mp-on-action`: the text of one variant's actions"],
              ["`--mp-action-rim`", "`transparent`: a thin outline on the actions"],
              ["`--mp-action-current` / `--mp-on-action-current`", "The action's own colours: the action with `aria-current`"],
              ["`--mp-accent` / `--mp-on-accent`", "The pill's text / its surface: what stands out, such as a panel's `titleAction`"],
              ["`--mp-close` / `--mp-on-close` / `--mp-close-rim`", "`transparent` / the pill's text / the same at 48%: the close button next to a `footer`"],
              ["`--mp-success` / `--mp-danger`", "`#3f7253` / `#c2303e`"],
              ["`--mp-font-text` / `--mp-font-accent`", "`inherit`"],
              ["`--mp-text-size` / `--mp-title-size`", "Fluid, about 1rem / 1.5–2rem"],
              ["`--mp-padding` / `--mp-gap` / `--mp-action-size`", "`0.875rem` / `1rem` / `2.75rem`"],
              ["`--mp-max-width` / `--mp-message-width` / `--mp-panel-width`", "`48rem` / `24rem` / `32rem`"],
              ["`--mp-card-width`", "`12.5rem`: a sidebar's notification card, at the least"],
              ["`--mp-radius-panel` / `--mp-shadow`", "`2.5rem` / a soft drop shadow"],
              ["`--mp-offset` / `--mp-z-index`", "`1.5rem` from the viewport edges (plus safe areas) / `50`"],
              ["`--mp-backdrop` / `--mp-backdrop-blur`", "`rgb(20 20 20 / 0.4)` / no blur"],
              ["`--mp-duration-enter` / `--mp-duration-change` / `--mp-duration-exit`", "`500ms` / `250ms` / `300ms`"],
              ["`--mp-scale-origin`", "`center`"],
              ["`--mp-align`", "How a vertical pill lines up its items: `start`, `center` or `end`. Along the screen edge for `left`/`right`"],
            ]}
          />
          <p className="hint">
            The fields’ tokens are on the forms page, the glass’s on the themes page.
          </p>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/styling/" />
    </>
  );
}
