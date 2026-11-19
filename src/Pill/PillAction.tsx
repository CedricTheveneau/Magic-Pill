// No "use client": a Server Component can render a link action, with its
// `linkComponent`, without shipping it to the client.
import { forwardRef, type Ref } from "react";

import type { PillActionProps } from "./types";
import { isSafeHref } from "../utils/url";
import { devWarn } from "../utils/react";

/**
 * The light round button: its icon at rest, icon + bold label when expanded.
 * A <button> with `onClick`, a link with `href`.
 */
const PillAction = forwardRef<HTMLElement, PillActionProps>(function PillAction(props, ref) {
  const { icon, label, expanded } = props;
  const hasIcon = icon !== undefined && icon !== null;
  const shared = {
    "data-mp": "action",
    // Without an icon, the label is all there is to show
    "data-expanded": expanded || !hasIcon ? "" : undefined,
  };
  const content = (
    <>
      {hasIcon && (
        <span data-mp="action-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span data-mp="label">{label}</span>
    </>
  );

  if (props.href !== undefined) {
    const { icon: _icon, label: _label, expanded: _expanded, href, linkComponent: Link, ...rest } = props;
    const anchorRef = ref as Ref<HTMLAnchorElement>;

    // L16: never render a `javascript:` (or any other unexpected scheme) link
    if (!isSafeHref(href)) {
      devWarn(
        `<PillAction label="${label}"> got an unsafe href and renders without a link. ` +
          "Only relative, http(s):, mailto: and tel: URLs are allowed.",
      );
      return (
        <a {...rest} {...shared} ref={anchorRef} aria-disabled="true">
          {content}
        </a>
      );
    }

    if (Link) {
      return (
        <Link {...rest} {...shared} ref={anchorRef} href={href}>
          {content}
        </Link>
      );
    }

    return (
      <a {...rest} {...shared} ref={anchorRef} href={href}>
        {content}
      </a>
    );
  }

  const { icon: _icon, label: _label, expanded: _expanded, href: _href, ...rest } = props;
  return (
    <button type="button" {...rest} {...shared} ref={ref as Ref<HTMLButtonElement>}>
      {content}
    </button>
  );
});

export default PillAction;
