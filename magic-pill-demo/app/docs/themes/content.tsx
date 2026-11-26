"use client";
import type { CSSProperties } from "react";
import { BoxIcon, CheckIcon, CloseIcon, InfoIcon, MailIcon, Pill, PillAction, PillActions, PillDivider, PillIcon, PillMessage } from "magic-pill";

import { Example } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};
const tokens = (values: Record<string, string | number>) => values as CSSProperties;

/** The same pill in each material, so they compare. */
function Sample({ theme, variant, style, message = "Your parcel is 5 stops away!" }: { theme: string; variant?: string; style?: CSSProperties; message?: string }) {
  return (
    <Pill theme={theme} variant={variant} style={style} role="group" aria-label={`${theme} example`}>
      <PillIcon>{variant === "success" ? <CheckIcon /> : variant === "danger" ? <CloseIcon /> : <InfoIcon />}</PillIcon>
      <PillDivider />
      <PillMessage>{message}</PillMessage>
      <PillActions>
        <PillAction icon={<BoxIcon />} label="Track it" onClick={noop} />
        <PillAction icon={<MailIcon />} label="Contact" onClick={noop} />
      </PillActions>
    </Pill>
  );
}

const ADAPTIVE = tokens({ "--mp-adaptive": 1 });
const ACTION_GLASS = tokens({ "--mp-action-glass": 1 });
const LIGHT_FOLLOW = tokens({ "--mp-light-follow": 1, "--mp-light": 1 });
const NOT_READABLE = tokens({ "--mp-readable": 0 });
const NO_FRINGE = tokens({ "--mp-fringe": 0 });

export function Content() {
  return (
    <>
      <DocsHeader title="Themes">
        <p>
          A theme is the pill’s material. <code>glass</code> (frosted glass) and <code>liquid</code> (clearer, thicker Liquid
          Glass) come in <code>magic-pill/themes.css</code>, so plain pills don’t load them. The variant picks the colour, the
          theme the material. Booleans are <code>1</code> and <code>0</code>.
        </p>
      </DocsHeader>

      <DocsSection id="materials" title="Materials">
        <div className="docs-examples">
          <Example
            title="Glass"
            preview={<Sample theme="glass" />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "glass" } }}
            code={`import "magic-pill/styles.css";
import "magic-pill/themes.css";

<MagicPill theme="glass" />`}
          >
            <p>Frosted: it blurs what’s behind it, and lets its colours glow through.</p>
          </Example>
          <Example
            title="Liquid Glass"
            preview={<Sample theme="liquid" />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "liquid" } }}
            code={`<MagicPill theme="liquid" />
<PillOptics /> {/* once, anywhere: the refraction */}`}
          >
            <p>
              Clearer, with a thick edge that bends what’s behind it. Refraction needs <code>&lt;PillOptics /&gt;</code> and a
              Chromium browser using the GPU; Safari and Firefox show the same glass without the bending.
            </p>
          </Example>
          <Example
            title="Status colours"
            preview={
              <div className="controls">
                <Sample theme="liquid" variant="success" message="Saved!" />
                <Sample theme="liquid" variant="danger" message="Payment declined" />
              </div>
            }
            previewClassName="specimen-scene specimen-column"
            stage={{ pill: { theme: "liquid" } }}
            notify={{ variant: "success", icon: <CheckIcon />, message: "Saved, on Liquid Glass." }}
            code={`<Pill theme="liquid" variant="success">…</Pill>`}
          >
            <p>
              A <code>success</code> or <code>danger</code> pill keeps at least <code>--mp-status-tint</code> of its colour, so
              it still reads as one.
            </p>
          </Example>
          <Example
            title="Your own"
            preview={<Sample theme="paper" />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "paper" } }}
            language="css"
            code={`[data-mp="pill"][data-theme="paper"] {
  --mp-tint: 0.8; --mp-frost: 24px; --mp-light: 0;
  --mp-surface: #fffaf0;
  --mp-on-neutral: #2b2118; /* --mp-on-surface would also darken success and danger */
}`}
          >
            <p>
              Any other name. With colours only, <code>themes.css</code> isn’t needed; with <code>--mp-tint</code> below 1,
              it’s built on the same glass.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="optics" title="Light, tint and actions">
        <div className="docs-examples">
          <Example
            title="Adaptive"
            preview={
              <div className="adaptive-pair">
                <div className="specimen-scene">
                  <Sample theme="liquid" style={ADAPTIVE} message="Over a light page" />
                </div>
                <div className="specimen-dark">
                  <Sample theme="liquid" style={ADAPTIVE} message="Over a dark page" />
                </div>
              </div>
            }
            stage={{ pill: { theme: "liquid", style: ADAPTIVE } }}
            code={`<MagicPill theme="liquid" style={{ "--mp-adaptive": 1 } as React.CSSProperties} />
<PillOptics />`}
          >
            <p>
              Tints the pill after the page behind it, and turns a neutral pill light over light pages. It writes{" "}
              <code>data-scheme=&quot;light&quot;</code> or <code>&quot;dark&quot;</code>. Status pills keep their colours.
            </p>
          </Example>
          <Example
            title="Glass actions"
            preview={<Sample theme="liquid" style={ACTION_GLASS} />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "liquid", style: ACTION_GLASS } }}
            language="css"
            code={`.my-pill { --mp-action-glass: 1; }`}
          >
            <p>The actions become little lenses of the same glass, with their own refraction and frosting.</p>
          </Example>
          <Example
            title="A light that follows the pointer"
            preview={<Sample theme="liquid" style={LIGHT_FOLLOW} />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "liquid", style: LIGHT_FOLLOW } }}
            language="css"
            code={`.my-pill { --mp-light-follow: 1; --mp-light: 1; }`}
          >
            <p>Move the pointer around the pill. Not a finger, nor anything with reduced motion.</p>
          </Example>
          <Example
            title="Without the readability veil"
            preview={<Sample theme="liquid" style={NOT_READABLE} />}
            previewClassName="specimen-scene"
            language="css"
            code={`.my-pill { --mp-readable: 0; }`}
          >
            <p>
              By default, a veil worked out in CSS keeps the text at 4.5:1 or more over any page. Without it, the contrast is
              yours to check.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="performance" title="Performance">
        <div className="docs-examples">
          <Example
            title="If it lags: the fringe first"
            preview={<Sample theme="liquid" style={NO_FRINGE} />}
            previewClassName="specimen-scene"
            stage={{ pill: { theme: "liquid", style: NO_FRINGE } }}
            language="css"
            code={`.my-pill { --mp-fringe: 0; }`}
          >
            <p>
              The graphics card does the work. With three Liquid Glass pills on a MacBook Pro (M2 Pro), a frame takes about
              1.1 ms, 1.4 ms with glass actions. The colour fringe is most of it: without it, 0.5 ms, glass actions included.
            </p>
          </Example>
        </div>
        <Notes>
          <ul>
            <li>
              Where the glass can’t be drawn (a browser without relative colours or <code>pow()</code> in CSS, less
              transparency, more contrast, forced colours), the pill has its plain look.
            </li>
            <li>
              A Content Security Policy needs <code>img-src data:</code> for the refraction.
            </li>
            <li>
              Adaptive can’t read <code>url()</code> backgrounds, pictures from other sites (without CORS), or elements that
              ignore the pointer.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <DocsSection id="tokens" title="Tokens">
        <Notes>
          <Reference
            head={["Token", "What it does", "`glass`", "`liquid`"]}
            rows={[
              ["`--mp-tint`", "How much of the surface's colour stays, from 0 (clear) to 1 (solid)", "`0.35`", "`0.18`"],
              ["`--mp-status-tint`", "The least a `success` or `danger` pill keeps", "`0.75`", "`0.75`"],
              ["`--mp-frost`", "The blur of what's behind", "`14px`", "`3px`"],
              ["`--mp-panel-frost`", "The least blur behind an open panel; `0px` for none", "`12px`", "`12px`"],
              ["`--mp-rays`", "`0` turns refraction, the light and the tinting off", "`1`", "`1`"],
              ["`--mp-light`", "The strength of the light on the edges, 0 to 1", "`0.7`", "`0.7`"],
              ["`--mp-light-angle` / `--mp-light-color`", "Where the light comes from, and its colour", "`235deg` / `#fff`", "same"],
              ["`--mp-vibrancy`", "How much the page's colours glow through (`1` is off)", "`1.9`", "`1.9`"],
              ["`--mp-refraction`", "With `<PillOptics>`: how much the edge bends what's behind, 0 to 1", "`0.16`", "`0.55`"],
              ["`--mp-edge` / `--mp-fringe`", "With `<PillOptics>`: how wide that edge is, and how much it splits colours", "`10px` / `0`", "`22px` / `0.15`"],
              ["`--mp-action-glass`", "`1` makes the actions little lenses of the same glass", "`0`", "`0`"],
              ["`--mp-light-follow`", "With `<PillOptics>`: `1` has the light follow the pointer", "`0`", "`0`"],
              ["`--mp-adaptive`", "With `<PillOptics>`: `1` tints the pill after the page behind it", "`0`", "`0`"],
              ["`--mp-adaptive-surface` / `--mp-adaptive-on-surface`", "The colours of that light pill", "`#f9f9f9` / `#141414`", "same"],
              ["`--mp-readable`", "Keeps the text readable over any page", "`1`", "`1`"],
            ]}
          />
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/themes/" />
    </>
  );
}
