"use client";
import type { MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowIcon,
  CheckIcon,
  CloseIcon,
  CouponIcon,
  HelpIcon,
  InfoIcon,
  MailIcon,
  UndoIcon,
  pill,
  type NotifyOptions,
} from "magic-pill";

import { Example, NotificationPreview } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};

const MESSAGE_ONLY: NotifyOptions = { message: "Your changes are saved." };
const WITH_ICON: NotifyOptions = { icon: <InfoIcon />, message: "Your parcel is 5 stops away!" };
const SUCCESS: NotifyOptions = { variant: "success", icon: <CheckIcon />, message: "Item successfully added to cart!" };
const DANGER: NotifyOptions = { variant: "danger", icon: <CloseIcon />, message: "Your payment didn’t go through." };
const QUESTION: NotifyOptions = {
  icon: <HelpIcon />,
  message: "Do you need some help?",
  action: { icon: <CheckIcon />, label: "Yes", onClick: noop },
};
const UNDO: NotifyOptions = {
  variant: "success",
  icon: <CheckIcon />,
  message: "Item successfully removed from cart!",
  action: { icon: <UndoIcon />, label: "Undo", onClick: noop, expanded: true },
};
const LINK: NotifyOptions = {
  icon: <InfoIcon />,
  message: (
    <>
      Your current cart total is: <strong>768.99$</strong>
    </>
  ),
  action: { icon: <CheckIcon />, label: "Checkout", href: "/docs/host/" },
};
const PANEL: NotifyOptions = {
  icon: <InfoIcon />,
  message: "Discover the powers Magic Pill gives you!",
  panel: {
    title: "Discover the powers Magic Pill gives you!",
    content: (
      <>
        <p>Anything can go in a panel: text, links, a form, a picture.</p>
        <p>It closes on Escape or with its close button, and gives the focus back to the action that opened it.</p>
      </>
    ),
  },
  duration: Infinity,
};

function promo() {
  const id = pill().notify({
    icon: <CouponIcon />,
    message: "Interested in 10% off your next purchase?",
    duration: Infinity,
    action: {
      icon: <ArrowIcon />,
      label: "Activate the promo code",
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        pill().update(id, { message: "Activating your code…", action: undefined });
        setTimeout(() => pill().update(id, { variant: "success", icon: <CheckIcon />, message: "10% off, on your next order!", duration: 3000 }), 1500);
      },
    },
  });
}

function saveWithUpdate() {
  const id = pill().notify({ icon: <InfoIcon />, message: "Saving…", duration: Infinity });
  setTimeout(() => pill().update(id, { icon: <CheckIcon />, message: "Saved", variant: "success", duration: 3000 }), 1500);
}

function threeInARow() {
  pill().notify({ variant: "success", icon: <CheckIcon />, message: "Saved!", duration: 2500 });
  pill().notify({
    icon: <MailIcon />,
    message: "Camille replied to your message about the order you placed last week, and attached two photos of the parcel.",
    duration: 4000,
  });
  pill().notify({ variant: "danger", icon: <CloseIcon />, message: "Your session expires in 2 minutes.", duration: 3000 });
}

function withDismissReason() {
  pill().notify({
    icon: <InfoIcon />,
    message: "Close me, or wait 4 seconds.",
    duration: 4000,
    action: { icon: <CloseIcon />, label: "Close", onClick: noop },
    onDismiss: (_id, reason) => pill().notify({ message: `Dismissed: "${reason}"`, duration: 2500 }),
  });
}

export function Content() {
  return (
    <>
      <DocsHeader title="Notifications">
        <p>
          <code>pill().notify(options)</code> shows a message in the pill, from anywhere in your client code. Notifications
          queue up and show one at a time: over the base layer (here, this site’s navbar), which comes back afterwards.
        </p>
      </DocsHeader>

      <DocsSection id="messages" title="Messages">
        <div className="docs-examples">
          <Example title="A message" preview={<NotificationPreview options={MESSAGE_ONLY} />} notify={MESSAGE_ONLY} code={`pill().notify({ message: "Your changes are saved." });`}>
            <p>Any React content: never parsed as HTML.</p>
          </Example>
          <Example
            title="With an icon"
            preview={<NotificationPreview options={WITH_ICON} />}
            notify={WITH_ICON}
            code={`pill().notify({ icon: <InfoIcon />, message: "Your parcel is 5 stops away!" });`}
          >
            <p>The leading icon comes with the divider.</p>
          </Example>
          <Example
            title="Success"
            preview={<NotificationPreview options={SUCCESS} />}
            notify={SUCCESS}
            code={`pill().notify({ variant: "success", icon: <CheckIcon />, message: "Item successfully added to cart!" });`}
          />
          <Example
            title="Danger"
            preview={<NotificationPreview options={DANGER} />}
            notify={DANGER}
            code={`pill().notify({ variant: "danger", icon: <CloseIcon />, message: "Your payment didn’t go through." });`}
          >
            <p>
              Any other string works too, for <Link href="/docs/styling/#variants">a variant of your own</Link>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="actions" title="Actions">
        <div className="docs-examples">
          <Example
            title="A question"
            preview={<NotificationPreview options={QUESTION} />}
            notify={QUESTION}
            code={`pill().notify({
  icon: <HelpIcon />,
  message: "Do you need some help?",
  action: { icon: <CheckIcon />, label: "Yes", onClick: openHelp },
});`}
          >
            <p>The action is the answer. Its label shows on hover and focus. Clicking it dismisses the notification.</p>
          </Example>
          <Example
            title="Always labelled"
            preview={<NotificationPreview options={UNDO} />}
            notify={UNDO}
            code={`pill().notify({
  variant: "success",
  icon: <CheckIcon />,
  message: "Item successfully removed from cart!",
  action: { icon: <UndoIcon />, label: "Undo", onClick: restoreItem, expanded: true },
});`}
          >
            <p>
              <code>expanded: true</code> shows the label all the time: phones don’t hover.
            </p>
          </Example>
          <Example
            title="A link, and live data"
            preview={<NotificationPreview options={LINK} />}
            notify={LINK}
            code={`pill().notify({
  icon: <InfoIcon />,
  message: <>Your current cart total is: <strong>{total}$</strong></>,
  action: { icon: <CheckIcon />, label: "Checkout", href: "/checkout" },
});`}
          >
            <p>
              With <code>href</code>, the action is a link, rendered by the host’s <code>linkComponent</code> (here, Next’s{" "}
              <code>Link</code>).
            </p>
          </Example>
          <Example
            title="Stay open while it works"
            notify={promo}
            code={`const id = pill().notify({
  icon: <CouponIcon />,
  message: "Interested in 10% off your next purchase?",
  duration: Infinity,
  action: {
    icon: <ArrowIcon />,
    label: "Activate the promo code",
    onClick: (event) => {
      event.preventDefault(); // keeps it open
      pill().update(id, { message: "Activating your code…", action: undefined });
      activatePromo().then(() =>
        pill().update(id, { variant: "success", message: "10% off, on your next order!", duration: 3000 }),
      );
    },
  },
});`}
          >
            <p>
              <code>event.preventDefault()</code> in <code>onClick</code> keeps the notification open.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="panel" title="A panel">
        <div className="docs-examples">
          <Example
            title="Learn more"
            preview={<NotificationPreview options={PANEL} />}
            notify={PANEL}
            code={`pill().notify({
  icon: <InfoIcon />,
  message: "Discover the powers Magic Pill gives you!",
  panel: {
    title: "Discover the powers Magic Pill gives you!",
    content: <p>Anything can go in a panel.</p>,
  },
  duration: Infinity,
});`}
          >
            <p>
              A “Learn more” action grows the pill into a panel. <code>trigger</code> changes its icon and label;{" "}
              <code>titleAction</code> and <code>footer</code> are <Link href="/docs/panels/">the panel’s</Link>.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="queue" title="The queue and the controller">
        <div className="docs-examples">
          <Example
            title="Three in a row"
            notify={threeInARow}
            tryLabel="Notify 3 in a row"
            code={`pill().notify({ variant: "success", icon: <CheckIcon />, message: "Saved!" });
pill().notify({ icon: <MailIcon />, message: "Camille replied to your message about…" });
pill().notify({ variant: "danger", icon: <CloseIcon />, message: "Your session expires in 2 minutes." });`}
          >
            <p>
              First in, first out. Each one slides into the next: watch the pill resize and change colour.{" "}
              <code>swap</code> on the host changes that.
            </p>
          </Example>
          <Example
            title="Update in place"
            notify={saveWithUpdate}
            code={`const id = pill().notify({ icon: <InfoIcon />, message: "Saving…", duration: Infinity });

await save();
pill().update(id, { icon: <CheckIcon />, message: "Saved", variant: "success", duration: 3000 });`}
          >
            <p>The countdown starts again. Notifying again with the same <code>id</code> does the same.</p>
          </Example>
          <Example
            title="Why it went"
            notify={withDismissReason}
            code={`pill().notify({
  message: "Close me, or wait 4 seconds.",
  duration: 4000,
  action: { icon: <CloseIcon />, label: "Close", onClick: () => {} },
  onDismiss: (id, reason) => console.log(reason), // "timeout", "action", "dismissed" or "cleared"
});`}
          />
          <Example
            title="Dismiss and clear"
            notify={() => {
              threeInARow();
              setTimeout(() => pill().clear(), 1200);
            }}
            tryLabel="Notify 3, clear after 1 s"
            code={`pill().dismiss(id); // or pill().dismiss() for the visible one
pill().clear();     // empty the queue`}
          />
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            caption="Options"
            head={["Option", "Type", "Notes"]}
            rows={[
              ["`message`", "`ReactNode`", "Required (unless you use `render`). Never parsed as HTML."],
              ["`icon`", "`ReactNode`", "The leading icon, followed by the divider."],
              ["`action`", "`{ icon?, label, onClick }` or `{ icon?, label, href }`, plus `expanded?`", "The round button. Clicking it dismisses the notification; `event.preventDefault()` in `onClick` keeps it open."],
              ["`panel`", "`{ title?, titleAction?, content, footer?, trigger?, closeLabel?, closeExpanded? }`", "A “Learn more” action that grows the pill into a panel. `trigger` defaults to `{ icon: <PlusIcon />, label: \"Learn more\" }`."],
              ["`variant`", "`\"neutral\"` · `\"success\"` · `\"danger\"` · any string", "Defaults to the host's variant."],
              ["`duration`", "`number` (ms)", "Defaults to the host's (5000). `Infinity` keeps it until dismissed."],
              ["`id`", "`string`", "Notifying again with the same id updates the notification in place."],
              ["`announce`", "`string` · `false`", "What screen readers hear. Defaults to the message's text."],
              ["`onDismiss`", "`(id, reason) => void`", "`reason` is `\"timeout\"`, `\"action\"`, `\"dismissed\"` or `\"cleared\"`."],
              ["`render`", "`({ id, dismiss }) => ReactNode`", "Your own content instead of the template, with the same queue, timing and animation. See the pill's page."],
            ]}
          />
          <Reference
            caption="The controller"
            head={["Call", "Does"]}
            rows={[
              ["`pill(name?)`", "The controller of the host with that name (`\"main\"` by default)."],
              ["`.notify(options)`", "Queues a notification, and returns its id."],
              ["`.update(id, options)`", "Changes it in place; its countdown starts again."],
              ["`.dismiss(id?)`", "Dismisses that one, or the visible one."],
              ["`.clear()`", "Empties the queue."],
            ]}
          />
          <h3>How it behaves</h3>
          <ul>
            <li>Notifications queue up and show one at a time, first in, first out.</li>
            <li>
              The countdown starts once the pill is fully shown. It pauses while the pill is hovered, holds keyboard focus
              or has its panel open, or while the tab is hidden, and starts again from the full duration afterwards.
            </li>
            <li>Calls made before the host mounts are kept, and shown once it mounts.</li>
            <li>
              <code>pill()</code> is for client code. Called on the server, it does nothing (it warns in development), so
              visitors never see each other’s notifications.
            </li>
          </ul>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/notifications/" />
    </>
  );
}
