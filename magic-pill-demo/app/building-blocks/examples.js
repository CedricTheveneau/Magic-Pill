"use client";
import { useState } from "react";
import {
  BoxIcon,
  CheckIcon,
  CloseIcon,
  DocumentIcon,
  HelpIcon,
  MagicPill,
  MailIcon,
  PhoneIcon,
  Pill,
  PillAction,
  PillActions,
  PillDivider,
  PillIcon,
  PillMessage,
  pill,
} from "magic-pill";

/** placement="overlay": a native modal <dialog> (focus trap, Escape, inert page). */
export function ModalExample() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <button className="button button-dark" onClick={() => setOpen(true)}>
        {deleted ? "Deleted! Open it again" : "Delete this item"}
      </button>
      <Pill
        placement="overlay"
        variant="danger"
        presence={open ? "compact" : "hidden"}
        onPresenceChange={(presence) => setOpen(presence !== "hidden")}
        aria-label="Confirm deletion"
      >
        <PillMessage>Delete this item?</PillMessage>
        <PillActions>
          <PillAction
            icon={<CheckIcon />}
            label="Delete"
            expanded
            onClick={() => {
              setDeleted(true);
              setOpen(false);
            }}
          />
          <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => setOpen(false)} />
        </PillActions>
      </Pill>
    </>
  );
}

/** A user-made template in the queue, through `render`. */
export function CallExample() {
  const call = () =>
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
  return (
    <button className="button button-dark" onClick={call}>
      Receive a call
    </button>
  );
}

/** A second, named host: a discreet resting circle until it has something to say. */
export function AssistantExample() {
  return (
    <>
      <MagicPill name="assistant" placement="top-end" idle="rest" idleIcon={<HelpIcon />} aria-label="Assistant" />
      <button
        className="button button-dark"
        onClick={() =>
          pill("assistant").notify({
            icon: <HelpIcon />,
            message: "Need a hand?",
            action: { icon: <MailIcon />, label: "Write to us", href: "mailto:hello@example.com" },
          })
        }
      >
        Ping the assistant
      </button>
    </>
  );
}

/** A vertical pill, like a sidebar (inline here, `placement="left"` in a real layout). */
export function SidebarExample() {
  const [active, setActive] = useState("Box");
  const items = [
    ["Box", <BoxIcon key="box" />],
    ["Documents", <DocumentIcon key="doc" />],
    ["Mail", <MailIcon key="mail" />],
  ];
  return (
    <Pill orientation="vertical" aria-label="Sidebar example">
      <PillActions>
        {items.map(([label, icon]) => (
          <PillAction key={label} icon={icon} label={label} aria-current={active === label ? "true" : undefined} onClick={() => setActive(label)} />
        ))}
      </PillActions>
    </Pill>
  );
}
