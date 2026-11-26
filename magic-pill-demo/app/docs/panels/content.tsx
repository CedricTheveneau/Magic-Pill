"use client";
import {
  ArrowIcon,
  CheckIcon,
  DocumentIcon,
  InfoIcon,
  MailIcon,
  Pill,
  PillAction,
  PillActions,
  PillDivider,
  PillIcon,
  PillMessage,
  PillPanel,
  PillPanelTrigger,
  PlusIcon,
  pill,
  type NotifyOptions,
} from "magic-pill";

import { GearIcon } from "../../icons";
import { Example, NotificationPreview } from "../_components/example";
import { DocsHeader, DocsSection, Notes, PageLinks, Reference } from "../_components/text";

const noop = () => {};

function Basic() {
  return (
    <>
      <PillIcon>
        <InfoIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>Free delivery from 50$</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<PlusIcon />} label="Learn more" />
      </PillActions>
      <PillPanel title="Free delivery">
        <p>Orders of 50$ or more ship for free, anywhere in Europe.</p>
        <p>Under that, delivery costs 4.90$, and it’s free to pick up in store.</p>
      </PillPanel>
    </>
  );
}

function WithActions() {
  return (
    <>
      <PillMessage>Your cart: 3 items</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<DocumentIcon />} label="See the cart" expanded />
      </PillActions>
      <PillPanel
        title="Your cart"
        titleAction={<PillAction label="Empty it" onClick={() => pill().notify({ message: "Cart emptied", duration: 2000 })} />}
        footer={<PillAction icon={<ArrowIcon />} label="Checkout" expanded onClick={() => pill().notify({ variant: "success", icon: <CheckIcon />, message: "On to checkout!", duration: 2000 })} />}
      >
        <p>Linen shirt, size M: 59$</p>
        <p>Canvas tote bag: 24$</p>
        <p>Socks, pack of 3: 15$</p>
      </PillPanel>
    </>
  );
}

function Several() {
  return (
    <>
      <PillMessage>Camille Laurent</PillMessage>
      <PillActions>
        <PillPanelTrigger panel="contact" icon={<MailIcon />} label="Contact" />
        <PillPanelTrigger panel="settings" icon={<GearIcon />} label="Settings" />
      </PillActions>
      <PillPanel name="contact" title="Contact">
        <p>camille@example.com</p>
        <p>+33 6 12 34 56 78</p>
      </PillPanel>
      <PillPanel name="settings" title="Settings" closeLabel="Done" closeIcon={<CheckIcon />} closeExpanded>
        <p>Notifications by email: on.</p>
        <p>Language: English.</p>
      </PillPanel>
    </>
  );
}

const IN_A_NOTIFICATION: NotifyOptions = {
  icon: <InfoIcon />,
  message: "A new version is available",
  duration: Infinity,
  panel: {
    trigger: { icon: <DocumentIcon />, label: "What’s new", expanded: true },
    title: "What’s new in 9.1",
    content: (
      <>
        <p>Themes, forms and a calendar, scenes, and pills that make room for each other.</p>
      </>
    ),
    footer: <PillAction icon={<ArrowIcon />} label="Update now" expanded onClick={noop} />,
    closeLabel: "Later",
  },
};

export function Content() {
  return (
    <>
      <DocsHeader title="Panels">
        <p>
          A pill grows into a panel: its content shows at the <code>panel</code> presence, opened by a{" "}
          <code>PillPanelTrigger</code>. The panel takes the focus when it opens, closes on Escape or with its close button,
          and gives the focus back to its trigger.
        </p>
      </DocsHeader>

      <DocsSection id="panel" title="A panel">
        <div className="docs-examples">
          <Example
            title="Learn more"
            preview={
              <Pill role="group" aria-label="Panel example">
                <Basic />
              </Pill>
            }
            stage={{ content: <Basic /> }}
            code={`<Pill>
  <PillIcon><InfoIcon /></PillIcon>
  <PillDivider />
  <PillMessage>Free delivery from 50$</PillMessage>
  <PillActions>
    <PillPanelTrigger icon={<PlusIcon />} label="Learn more" />
  </PillActions>
  <PillPanel title="Free delivery">
    <p>Orders of 50$ or more ship for free, anywhere in Europe.</p>
  </PillPanel>
</Pill>`}
          >
            <p>Long panels scroll inside the pill.</p>
          </Example>
          <Example
            title="A title action and a footer"
            preview={
              <Pill role="group" aria-label="Cart example">
                <WithActions />
              </Pill>
            }
            stage={{ content: <WithActions /> }}
            code={`<PillPanel
  title="Your cart"
  titleAction={<PillAction label="Empty it" onClick={empty} />}
  footer={<PillAction icon={<ArrowIcon />} label="Checkout" expanded onClick={checkout} />}
>
  …
</PillPanel>`}
          >
            <p>
              <code>titleAction</code> goes at the end of the title’s row, <code>footer</code> before the close button,
              which is then quieter: an outline. One main action per panel.
            </p>
          </Example>
          <Example
            title="Several panels"
            preview={
              <Pill role="group" aria-label="Several panels example">
                <Several />
              </Pill>
            }
            stage={{ content: <Several /> }}
            code={`<PillActions>
  <PillPanelTrigger panel="contact" icon={<MailIcon />} label="Contact" />
  <PillPanelTrigger panel="settings" icon={<GearIcon />} label="Settings" />
</PillActions>
<PillPanel name="contact" title="Contact">…</PillPanel>
<PillPanel name="settings" title="Settings" closeLabel="Done" closeIcon={<CheckIcon />} closeExpanded>…</PillPanel>`}
          >
            <p>
              Give each panel a <code>name</code>, and its trigger the same <code>panel</code>. Here, the second one’s close
              button says “Done”, all the time.
            </p>
          </Example>
          <Example
            title="In a notification"
            preview={<NotificationPreview options={IN_A_NOTIFICATION} />}
            notify={IN_A_NOTIFICATION}
            code={`pill().notify({
  icon: <InfoIcon />,
  message: "A new version is available",
  duration: Infinity,
  panel: {
    trigger: { icon: <DocumentIcon />, label: "What’s new", expanded: true },
    title: "What’s new in 9.1",
    content: <p>…</p>,
    footer: <PillAction icon={<ArrowIcon />} label="Update now" expanded onClick={update} />,
    closeLabel: "Later",
  },
});`}
          >
            <p>
              The <code>panel</code> option takes the same <code>titleAction</code>, <code>footer</code> and close button.
            </p>
          </Example>
        </div>
      </DocsSection>

      <DocsSection id="reference" title="Reference">
        <Notes>
          <Reference
            caption="<PillPanel>"
            head={["Prop", "Notes"]}
            rows={[
              ["`title`", "The panel's heading."],
              ["`name`", "For several panels in one pill: its trigger takes the same `panel`."],
              ["`titleAction`", "At the end of the title's row, e.g. a `<PillAction>`."],
              ["`footer`", "Before the close button, which is then an outline (`--mp-close`)."],
              ["`closeLabel` / `closeIcon` / `closeExpanded`", "The close button: `\"Close\"`, a cross, its label on hover and focus (or always)."],
            ]}
          />
          <Reference
            caption="<PillPanelTrigger>"
            head={["Prop", "Notes"]}
            rows={[
              ["`icon` / `label` / `expanded`", "As on a `PillAction`."],
              ["`panel`", "The `name` of the panel it opens."],
            ]}
          />
          <p>
            From a part of your own, <code>usePill()</code> gives <code>openPanel(name?)</code> and <code>closePanel()</code>.
          </p>
        </Notes>
      </DocsSection>

      <PageLinks href="/docs/panels/" />
    </>
  );
}

