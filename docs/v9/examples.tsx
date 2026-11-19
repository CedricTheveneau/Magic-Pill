/**
 * Magic Pill v9: usage examples for the API proposal.
 *
 * Written against `docs/v9/api.ts` as if it were the published package
 * (`tsconfig.json` maps "magic-pill" to it). Each section would be its own
 * file in a real app; comments say where "use client" would go.
 *
 * Typecheck: npx tsc -p docs/v9
 */
import { forwardRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowIcon,
  BoxIcon,
  CheckIcon,
  CloseIcon,
  CouponIcon,
  DocumentIcon,
  HelpIcon,
  InfoIcon,
  MagicPill,
  MailIcon,
  PhoneIcon,
  Pill,
  PillAction,
  PillActions,
  PillDivider,
  PillIcon,
  PillMessage,
  PillNavbar,
  PillNotification,
  PillPanel,
  PillPanelTrigger,
  UndoIcon,
  pill,
  usePill,
  usePillQueue,
  type LinkComponent,
  type NavItem,
} from "magic-pill";

// ─────────────────────────────────────────────────────────────────────────────
// 1. "Two lines": mount once, call from anywhere (replaces v8's ~135 lines)
// ─────────────────────────────────────────────────────────────────────────────

// app/layout.tsx (a Server Component: MagicPill is a client component, so this works)
//   import "magic-pill/styles.css";
export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MagicPill />
      </body>
    </html>
  );
}

// any client component, store, event handler, fetch callback…
export function onSaved() {
  pill().notify({ icon: <CheckIcon />, message: "Saved!", variant: "success" });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. The templates in the mockups (MagicPill_Concept.png)
// ─────────────────────────────────────────────────────────────────────────────

export function mockupNotifications(cartTotal: number, restoreItem: () => void) {
  // Question / prompt: the action is an answer, not a link
  pill().notify({
    icon: <HelpIcon />,
    message: "Do you need some help?",
    action: { icon: <CheckIcon />, label: "Yes", onClick: () => openHelp() },
  });

  // Success feedback, green variant
  pill().notify({
    variant: "success",
    icon: <CheckIcon />,
    message: "Item successfully added to cart!",
    action: { icon: <CloseIcon />, label: "Close", onClick: () => {} }, // dismisses by default
  });

  // Reversible action: a callback
  pill().notify({
    variant: "success",
    icon: <CheckIcon />,
    message: "Item successfully removed from cart!",
    action: { icon: <UndoIcon />, label: "Undo", onClick: restoreItem },
    duration: 8000,
  });

  // Contextual info with live data and emphasis: content is a ReactNode
  pill().notify({
    icon: <InfoIcon />,
    message: (
      <>
        Your current cart total is: <strong>{cartTotal.toFixed(2)}$</strong>
      </>
    ),
    action: { icon: <CheckIcon />, label: "Checkout", href: "/checkout" },
  });

  // Promotion: an action that keeps the pill open while it works
  pill().notify({
    icon: <CouponIcon />,
    message: "Interested in 10% off your next purchase?",
    action: {
      icon: <ArrowIcon />,
      label: "Activate the promo code",
      onClick: (event) => {
        event.preventDefault(); // stay open…
        void activatePromo().then(() => pill().dismiss()); // …until it's done
      },
    },
  });

  // Expandable info: the pill grows into a panel (replaces v8's raw-HTML `info.content`)
  pill().notify({
    icon: <InfoIcon />,
    message: "Discover the powers Magic Pill gives you!",
    panel: {
      title: "Discover the powers Magic Pill gives you!",
      content: (
        <p>
          From elegant notifications on the fly to a full-fledged <em>toolbox</em>…
        </p>
      ),
    },
    duration: Infinity,
  });
}

// Update in place: same id, no new entry in the queue
export async function saveWithProgress(save: () => Promise<void>) {
  const id = pill().notify({ message: "Saving…", duration: Infinity });
  await save();
  pill().update(id, { message: "Saved!", variant: "success", icon: <CheckIcon />, duration: 3000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Base layer + queue: a navbar that notifications take over (A2, L8)
// ─────────────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: <BoxIcon /> }, // "/" is exact: not active on /about
  { href: "/blog", label: "Blog", icon: <DocumentIcon /> }, // active on /blog/my-post
  { href: "/contact", label: "Contact", icon: <MailIcon /> },
];

// app/app-pill.tsx: "use client" (usePathname is a hook)
export function AppPill() {
  return (
    <MagicPill linkComponent={NextLink}>
      <PillNavbar items={navItems} pathname={usePathname()} linkComponent={NextLink} />
    </MagicPill>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Several pills, one interface (VISION §2.4)
// ─────────────────────────────────────────────────────────────────────────────

// "use client"
export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* A vertical sidebar pill with its own name, base layer and queue */}
      <MagicPill name="sidebar" placement="left">
        <PillNavbar items={navItems} pathname={usePathname()} linkComponent={NextLink} />
      </MagicPill>

      {/* A discreet assistant: a circle until something needs attention */}
      <MagicPill name="assistant" placement="bottom-end" idle="rest" idleIcon={<HelpIcon />} />

      {children}
    </>
  );
}

export function notifyEachPill() {
  pill("sidebar").notify({ message: "3 new posts" });
  pill("assistant").notify({ icon: <HelpIcon />, message: "Need a hand?", duration: Infinity });
}

// A user-made template in the queue: same timing, animation and queue as the built-in one
export function customTemplate() {
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

// ─────────────────────────────────────────────────────────────────────────────
// 5. The primitive on its own: anything inside, any placement
// ─────────────────────────────────────────────────────────────────────────────

// The toolbox from the mockups: no message, only actions (works in a Server Component)
export function Toolbox() {
  return (
    <Pill placement="bottom" aria-label="Contact us">
      <PillActions>
        <PillAction icon={<PhoneIcon />} label="Call us" href="tel:+33100000000" />
        <PillAction icon={<MailIcon />} label="Send an email" href="mailto:hello@example.com" />
        <PillAction icon={<DocumentIcon />} label="Ask for a quotation" href="/quote" linkComponent={NextLink} />
        <PillAction icon={<BoxIcon />} label="Track my order" href="/orders" linkComponent={NextLink} />
      </PillActions>
    </Pill>
  );
}

// A static notification in the page flow, e.g. on a landing page
export function InlinePromo() {
  return (
    <Pill placement="inline" variant="success">
      <PillNotification
        icon={<CouponIcon />}
        message="Interested in 10% off your next purchase?"
        action={{ icon: <ArrowIcon />, label: "Activate the promo code", href: "/promo" }}
        linkComponent={NextLink}
      />
    </Pill>
  );
}

// A modal pill: placement="overlay" renders a native <dialog>
// "use client"
export function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>
      <Pill
        placement="overlay"
        variant="danger"
        presence={open ? "compact" : "hidden"}
        onPresenceChange={(presence) => setOpen(presence !== "hidden")}
      >
        <PillMessage>Delete this item?</PillMessage>
        <PillActions>
          <PillAction icon={<CheckIcon />} label="Delete" expanded onClick={onConfirm} />
          <PillAction icon={<CloseIcon />} label="Cancel" onClick={() => setOpen(false)} />
        </PillActions>
      </Pill>
    </>
  );
}

// Your own template, written the way the built-in ones are: parts + usePill()
// "use client"
export function HelpTemplate() {
  const { presence } = usePill();
  return (
    <>
      <PillIcon>
        <HelpIcon />
      </PillIcon>
      <PillDivider />
      <PillMessage>{presence === "panel" ? "Here's how it works" : "Need help?"}</PillMessage>
      <PillActions>
        <PillPanelTrigger icon={<InfoIcon />} label="How it works" />
      </PillActions>
      <PillPanel title="How it works">
        <p>Anything can go in a panel.</p>
      </PillPanel>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Styling: classNames for Tailwind users, tokens for everyone
// ─────────────────────────────────────────────────────────────────────────────

export function TailwindPill() {
  return (
    <MagicPill
      className="bottom-8 shadow-xl"
      classNames={{ message: "not-italic tracking-tight", action: "font-semibold" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Other routers: React Router's Link takes `to`, so wrap it once
// ─────────────────────────────────────────────────────────────────────────────

// Stand-in for `import { Link as RouterLink } from "react-router"`
declare const RouterLink: React.ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; ref?: React.Ref<HTMLAnchorElement> }>;

export const RRLink: LinkComponent = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function RRLink({ href, ...props }, ref) {
    return <RouterLink to={href} {...props} ref={ref} />;
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Headless: build your own host on the same store
// ─────────────────────────────────────────────────────────────────────────────

// "use client"
export function QueueCounter() {
  const { current, queued } = usePillQueue();
  return <span>{current ? `${queued.length} more waiting` : "All caught up"}</span>;
}

declare function openHelp(): void;
declare function activatePromo(): Promise<void>;
