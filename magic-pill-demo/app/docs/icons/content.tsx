"use client";
import type { NotifyOptions } from "magic-pill";

import { HeartIcon } from "../../icons";
import { Example, NotificationPreview } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};

/** An SVG file with colours of its own, inlined so the page needs no asset: an `<img>` keeps them. */
const PARCEL_FILE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2 3 6.5v11L12 22l9-4.5v-11Z" fill="#e8a33d"/><path d="M12 11.5 3 6.5M12 11.5l9-5M12 11.5V22" stroke="#7a4a12" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>`,
  );

const OWN_SVG: NotifyOptions = {
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5c.6 4.4 2.6 6.9 8.5 8.5-5.9 1.6-7.9 4.1-8.5 8.5-.6-4.4-2.6-6.9-8.5-8.5 5.9-1.6 7.9-4.1 8.5-8.5Z" />
    </svg>
  ),
  message: "Drawn in currentColor: the pill's text colour.",
  action: { icon: <HeartIcon />, label: "Like it", onClick: noop },
};

const IMAGE: NotifyOptions = {
  // eslint-disable-next-line @next/next/no-img-element -- an icon, sized by the slot: next/image has nothing to add
  icon: <img src={PARCEL_FILE} alt="" />,
  message: "An image keeps its own colours.",
};

const EMOJI: NotifyOptions = {
  variant: "success",
  icon: "📦",
  message: "An emoji takes the slot's font size.",
};

export function Content() {
  return (
    <>
      <DocsHeader title="Icons">
        <p>
          Bring your own. Every icon slot takes any React content: an SVG, an image, a font icon, an emoji, or an icon
          library’s component. The slot sizes it and gives it the pill’s text colour, so there’s nothing to set.
        </p>
      </DocsHeader>

      <DocsSection id="yours" title="Your icons">
        <div className="docs-examples">
          <Example
            title="An SVG of your own"
            preview={<NotificationPreview options={OWN_SVG} label="An SVG of your own" />}
            notify={OWN_SVG}
            code={`pill().notify({
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M12 3.5c.6 4.4 2.6 6.9 8.5 8.5…" />
    </svg>
  ),
  message: "Drawn in currentColor: the pill's text colour.",
  action: { icon: <HeartIcon />, label: "Like it", onClick: like },
});`}
          >
            <p>
              Drawn 1em square whatever its <code>width</code> and <code>height</code>. Draw it in <code>currentColor</code>{" "}
              to follow the pill’s text, on every variant and theme. This site’s icons are drawn like that.
            </p>
          </Example>
          <Example
            title="An image"
            preview={<NotificationPreview options={IMAGE} label="An image" />}
            notify={IMAGE}
            code={`pill().notify({
  icon: <img src="/icons/parcel.svg" alt="" />,
  message: "An image keeps its own colours.",
});`}
          >
            <p>
              Sized like an SVG. <code>currentColor</code> doesn’t reach into an image, so it keeps its file’s colours. Leave
              its <code>alt</code> empty: the message says what it means.
            </p>
          </Example>
          <Example
            title="An emoji or a font icon"
            preview={<NotificationPreview options={EMOJI} label="An emoji" />}
            notify={EMOJI}
            code={`pill().notify({ variant: "success", icon: "📦", message: "An emoji takes the slot's font size." });

// Font Awesome's web font
pill().notify({ icon: <i className="fa-solid fa-truck" />, message: "Shipped today" });`}
          >
            <p>Text takes the slot’s font size, so a font icon is as large as an SVG would be.</p>
          </Example>
          <Example
            title="An icon library"
            code={`import { ShoppingCart } from "lucide-react"; // or Heroicons, Phosphor, Material…
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck } from "@fortawesome/free-solid-svg-icons";

pill().notify({ icon: <ShoppingCart />, message: "Added to your cart" });
pill().notify({ icon: <FontAwesomeIcon icon={faTruck} />, message: "Shipped today" });`}
          >
            <p>
              Most libraries draw in <code>currentColor</code>, so their icons follow the pill with no setting. Magic Pill
              doesn’t depend on any of them.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="slots" title="Where icons go">
        <Notes>
          <Reference
            head={["Slot", "Size"]}
            rows={[
              ["A notification's `icon`, `<PillIcon>`, `idleIcon` on `<MagicPill>`", "60% of `--mp-action-size`: about `1.65rem`"],
              ["An action's `icon` (a notification's `action`, `<PillAction>`, a navbar item)", "`1.25rem`"],
              ["A panel's `trigger`", "`1.25rem`, like an action (default: a plus)"],
              ["A field's `icon` (`PillInput`, `PillSelect`, `PillDate`, `PillChoices`)", "`1.15rem`"],
            ]}
          />
          <p>
            Icons are decorative (<code>aria-hidden</code>): an action’s label or the message says what they mean. Give{" "}
            <code>&lt;PillIcon&gt;</code> a <code>label</code> when the icon carries meaning of its own.
          </p>
        </Notes>
      </DocsSection>

      <DocsSection id="built-in" title="The built-in icons, deprecated">
        <Notes>
          <p>
            Since 9.3, the twelve icons Magic Pill exports are deprecated: <code>ArrowIcon</code>, <code>BoxIcon</code>,{" "}
            <code>CheckIcon</code>, <code>CloseIcon</code>, <code>CouponIcon</code>, <code>DocumentIcon</code>,{" "}
            <code>HelpIcon</code>, <code>InfoIcon</code>, <code>MailIcon</code>, <code>PhoneIcon</code>,{" "}
            <code>PlusIcon</code>, <code>UndoIcon</code>, and <code>IconProps</code>. They still work, unchanged, and editors
            strike them through. They go in the next major version.
          </p>
          <p>
            The library keeps the three it draws as defaults (the panel’s trigger, its close button, the submit’s tick), so
            nothing changes where you don’t pass your own. To keep one of the others, copy its SVG from{" "}
            <a href="https://github.com/CedricTheveneau/Magic-Pill/tree/main/src/icons">
              <code>src/icons/</code>
            </a>{" "}
            (MIT).
          </p>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/icons/" />
    </>
  );
}
