"use client";
import Link from "next/link";
import {
  ArrowIcon,
  CheckIcon,
  CloseIcon,
  CouponIcon,
  HelpIcon,
  InfoIcon,
  Pill,
  PillNavbar,
  PillNotification,
  PlusIcon,
  UndoIcon,
  pill,
} from "magic-pill";

import { NAV_ITEMS } from "../app-pill";

const noop = () => {};

// The notifications from the design board (mockups/MagicPill_Concept.png)
const TEMPLATES = [
  {
    title: "Question",
    description: "Ask something; the action is an answer.",
    options: { icon: <HelpIcon />, message: "Do you need some help?", action: { icon: <CheckIcon />, label: "Yes", onClick: noop } },
  },
  {
    title: "Success",
    description: "The green variant, with a way to close it.",
    options: {
      variant: "success",
      icon: <CheckIcon />,
      message: "Item successfully added to cart!",
      action: { icon: <CloseIcon />, label: "Close", onClick: noop },
    },
  },
  {
    title: "Reversible action",
    description: "The action is a callback, not a link.",
    options: {
      variant: "success",
      icon: <CheckIcon />,
      message: "Item successfully removed from cart!",
      action: { icon: <UndoIcon />, label: "Undo", onClick: noop },
    },
  },
  {
    title: "Contextual info",
    description: "Live data and emphasis in the message.",
    options: {
      icon: <InfoIcon />,
      message: (
        <>
          Your current cart total is: <strong>768.99$</strong>
        </>
      ),
      action: { icon: <CheckIcon />, label: "Checkout", href: "/building-blocks/" },
    },
  },
  {
    title: "Promotion",
    description: "Engagement, with a longer action label.",
    options: {
      icon: <CouponIcon />,
      message: "Interested in 10% off your next purchase?",
      action: { icon: <ArrowIcon />, label: "Activate the promo code", onClick: noop },
    },
  },
  {
    title: "Expandable info",
    description: "The pill grows into a panel. Try it in place.",
    options: {
      icon: <InfoIcon />,
      message: "Discover the powers Magic Pill gives you!",
      panel: {
        title: "Discover the powers Magic Pill gives you!",
        trigger: { icon: <PlusIcon />, label: "Learn more" },
        content: (
          <p>
            From elegant notifications on the fly to contextual information about your products, or a full-fledged
            toolbox to engage your visitors.
          </p>
        ),
      },
    },
  },
];

export function TemplateGallery() {
  return (
    <div className="gallery gallery-templates">
      {TEMPLATES.map(({ title, description, options }) => {
        const { variant, duration, ...content } = options;
        return (
          <article key={title} className="card template">
            <h3>{title}</h3>
            <p className="hint">{description}</p>
            <div className="specimen">
              <Pill variant={variant}>
                <PillNotification {...content} linkComponent={Link} />
              </Pill>
            </div>
            <button className="button button-dark" onClick={() => pill().notify(options)}>
              Try it
            </button>
          </article>
        );
      })}
      <article className="card template">
        <h3>Navbar</h3>
        <p className="hint">Links for any router. The current page shows its label.</p>
        <div className="specimen">
          <Pill>
            <PillNavbar items={NAV_ITEMS} pathname="/templates/" linkComponent={Link} aria-label="Navbar example" />
          </Pill>
        </div>
        <p className="hint">This is the base layer of the pill at the bottom of the page.</p>
      </article>
      <article className="card template">
        <h3>Resting circles</h3>
        <p className="hint">The most discreet presence: only the icon.</p>
        <div className="specimen specimen-row">
          {[<HelpIcon key="help" />, <UndoIcon key="undo" />, <InfoIcon key="info" />].map((icon) => (
            <Pill key={icon.key} presence="rest">
              <PillNotification icon={icon} message="Hidden at rest" />
            </Pill>
          ))}
        </div>
      </article>
    </div>
  );
}
