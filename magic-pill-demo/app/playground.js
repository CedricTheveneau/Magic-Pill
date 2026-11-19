"use client";
import { useState } from "react";
import {
  ArrowIcon,
  BoxIcon,
  CheckIcon,
  CloseIcon,
  CouponIcon,
  DocumentIcon,
  HelpIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  UndoIcon,
  pill,
} from "magic-pill";

import { ChipGroup, TextField } from "./controls";
import { useDemo } from "./demo-context";

const ICONS = { CheckIcon, InfoIcon, HelpIcon, CouponIcon, UndoIcon, MailIcon, PhoneIcon, BoxIcon, ArrowIcon, CloseIcon, PlusIcon, DocumentIcon };
const iconOption = (name) => ({ value: name, label: name.replace("Icon", "") });

const MAIN_ICONS = [{ value: "", label: "None" }, ...["CheckIcon", "InfoIcon", "HelpIcon", "CouponIcon", "BoxIcon"].map(iconOption)];
const ACTION_ICONS = ["ArrowIcon", "CheckIcon", "CloseIcon", "UndoIcon", "PhoneIcon", "MailIcon", "BoxIcon", "PlusIcon", "DocumentIcon"].map(iconOption);
const MESSAGES = ["Your parcel is 5 stops away!", "Welcome back, Alex!", "Item successfully added to cart!"];
const LABELS = ["View parcel details", "Go to cart", "Undo"];
const LINKS = ["/templates/", "/building-blocks/", "https://github.com/CedricTheveneau/Magic-Pill"];
const VARIANTS = ["neutral", "success", "danger"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));
const ACTION_KINDS = [
  { value: "none", label: "None" },
  { value: "button", label: "Button" },
  { value: "link", label: "Link" },
  { value: "panel", label: "Panel" },
];
const DURATIONS = [
  { value: "3000", label: "3 s" },
  { value: "5000", label: "5 s" },
  { value: "10000", label: "10 s" },
  { value: "Infinity", label: "Until dismissed" },
];
const BASE_LAYER = [
  { value: "on", label: "Navbar" },
  { value: "off", label: "None" },
];

const INITIAL = {
  icon: "CheckIcon",
  message: MESSAGES[0],
  variant: "neutral",
  actionKind: "link",
  actionIcon: "ArrowIcon",
  actionLabel: LABELS[0],
  href: LINKS[0],
  panelTitle: "About your parcel n°123456",
  panelContent: "It left the warehouse this morning.\n\nIt will be at your door before 6 pm.",
  duration: "5000",
};

/** The panel's text as paragraphs: plain text, never parsed as HTML. */
const paragraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => <p key={index}>{paragraph}</p>);

function buildOptions(form) {
  const options = { message: form.message || " ", variant: form.variant, duration: Number(form.duration) };
  if (form.icon) {
    const Icon = ICONS[form.icon];
    options.icon = <Icon />;
  }
  const ActionIcon = ICONS[form.actionIcon];
  if (form.actionKind === "button") {
    options.action = { icon: <ActionIcon />, label: form.actionLabel, onClick: () => {} };
  } else if (form.actionKind === "link") {
    options.action = { icon: <ActionIcon />, label: form.actionLabel, href: form.href };
  } else if (form.actionKind === "panel") {
    options.panel = { title: form.panelTitle, content: paragraphs(form.panelContent), trigger: { icon: <ActionIcon />, label: form.actionLabel } };
  }
  return options;
}

const quote = (text) => JSON.stringify(text);

/** The code a user would write for the current settings. */
function buildCode(form) {
  const lines = [];
  if (form.variant !== "neutral") lines.push(`variant: ${quote(form.variant)},`);
  if (form.icon) lines.push(`icon: <${form.icon} />,`);
  lines.push(`message: ${quote(form.message)},`);
  const action = `icon: <${form.actionIcon} />, label: ${quote(form.actionLabel)}`;
  if (form.actionKind === "button") lines.push(`action: { ${action}, onClick: () => {} },`);
  if (form.actionKind === "link") lines.push(`action: { ${action}, href: ${quote(form.href)} },`);
  if (form.actionKind === "panel") {
    lines.push(`panel: {`, `  trigger: { ${action} },`, `  title: ${quote(form.panelTitle)},`, `  content: <p>…</p>,`, `},`);
  }
  if (form.duration !== "5000") lines.push(`duration: ${form.duration},`);
  return `pill().notify({\n${lines.map((line) => `  ${line}`).join("\n")}\n});`;
}

export function Playground() {
  const [form, setForm] = useState(INITIAL);
  const { showNavbar, setShowNavbar } = useDemo();
  const set = (field) => (value) => setForm((previous) => ({ ...previous, [field]: value }));

  const notify = () => pill().notify(buildOptions(form));
  const notifyThree = () => {
    const base = buildOptions(form);
    ["First", "Second", "Third"].forEach((rank) => pill().notify({ ...base, message: `${rank} in the queue: ${form.message}` }));
  };

  const hasAction = form.actionKind !== "none";

  return (
    <section className="playground" aria-labelledby="playground-title">
      <div className="card card-dark playground-intro">
        <h2 id="playground-title">Playground</h2>
        <p>Compose a notification and send it to the pill at the bottom of the page.</p>
        <div className="button-row">
          <button className="button button-light" onClick={notify}>
            Notify
          </button>
          <button className="button button-outline" onClick={notifyThree}>
            Notify 3 in a row
          </button>
          <button className="button button-outline" onClick={() => pill().clear()}>
            Clear
          </button>
        </div>
        <pre className="code" aria-label="Code for this notification">
          <code>{buildCode(form)}</code>
        </pre>
      </div>

      <div className="card">
        <ChipGroup legend="Icon" name="icon" options={MAIN_ICONS} value={form.icon} onChange={set("icon")} />
      </div>
      <div className="card">
        <ChipGroup legend="Message" name="message" options={MESSAGES.map((message) => ({ value: message, label: message }))} value={form.message} onChange={set("message")} />
        <TextField label="Or write your own" value={form.message} onChange={set("message")} />
      </div>
      <div className="card">
        <ChipGroup legend="Variant" name="variant" options={VARIANTS} value={form.variant} onChange={set("variant")} />
        <ChipGroup legend="Duration" name="duration" options={DURATIONS} value={form.duration} onChange={set("duration")} />
      </div>
      <div className="card">
        <ChipGroup legend="Action" name="actionKind" options={ACTION_KINDS} value={form.actionKind} onChange={set("actionKind")} />
        {hasAction && (
          <ChipGroup legend="Action icon" name="actionIcon" options={ACTION_ICONS} value={form.actionIcon} onChange={set("actionIcon")} />
        )}
      </div>
      {hasAction && (
        <div className="card">
          <ChipGroup legend="Action label" name="actionLabel" options={LABELS.map((label) => ({ value: label, label }))} value={form.actionLabel} onChange={set("actionLabel")} />
          <TextField label="Or write your own" value={form.actionLabel} onChange={set("actionLabel")} />
        </div>
      )}
      {form.actionKind === "link" && (
        <div className="card">
          <ChipGroup legend="Link" name="href" options={LINKS.map((href) => ({ value: href, label: href.replace("https://", "") }))} value={form.href} onChange={set("href")} />
          <TextField label="Or type a URL" value={form.href} onChange={set("href")} hint="Only relative, http(s), mailto and tel links are rendered: try javascript:alert(1)." />
        </div>
      )}
      {form.actionKind === "panel" && (
        <div className="card">
          <TextField label="Panel title" value={form.panelTitle} onChange={set("panelTitle")} />
          <TextField
            label="Panel content"
            value={form.panelContent}
            onChange={set("panelContent")}
            multiline
            hint="Plain text, never parsed as HTML: tags show as typed."
          />
        </div>
      )}
      <div className="card">
        <ChipGroup
          legend="Base layer"
          name="base"
          options={BASE_LAYER}
          value={showNavbar ? "on" : "off"}
          onChange={(value) => setShowNavbar(value === "on")}
        />
        <p className="hint">With a navbar, notifications take the pill over, then hand it back. Without one, the pill hides between notifications.</p>
      </div>
    </section>
  );
}
