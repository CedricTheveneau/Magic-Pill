// No "use client": the template holds no state. A Server Component can render
// it (with `href` actions); the panel parts it uses are client components.
import type { MouseEvent, ReactNode } from "react";

import { PillActions, PillDivider, PillIcon, PillMessage } from "../Pill/parts";
import PillAction from "../Pill/PillAction";
import { PillPanel, PillPanelTrigger } from "../Pill/PillPanel";
import type { LinkComponent } from "../Pill/types";
import PlusIcon from "../icons/PlusIcon";

/** Same rules as the matching <PillAction> props. */
export type NotificationAction =
  | {
      icon?: ReactNode;
      label: string;
      /** Always show the label, not only on hover and focus (phones don't hover). */
      expanded?: boolean;
      /**
       * Inside a <MagicPill>, clicking an action dismisses the notification.
       * Call `event.preventDefault()` to keep it open.
       */
      onClick: (event: MouseEvent<HTMLButtonElement>) => void;
      href?: undefined;
    }
  | { icon?: ReactNode; label: string; expanded?: boolean; href: string; onClick?: undefined };

export interface NotificationPanel {
  title?: ReactNode;
  /** At the end of the title's row, e.g. a <PillAction>. */
  titleAction?: ReactNode;
  content: ReactNode;
  /** In the footer, before the close button, e.g. a <PillAction>. */
  footer?: ReactNode;
  /** The action that opens the panel. Default `{ icon: <PlusIcon />, label: "Learn more" }`. */
  trigger?: { icon?: ReactNode; label: string; expanded?: boolean };
  /** Default "Close". */
  closeLabel?: string;
  /** Always show the close button's label, not only on hover and focus. */
  closeExpanded?: boolean;
}

export interface PillNotificationClassNames {
  icon?: string;
  divider?: string;
  message?: string;
  actions?: string;
  action?: string;
  panel?: string;
}

export interface PillNotificationProps {
  icon?: ReactNode;
  /** Any content: strings, emphasis, live data. Never parsed as HTML (L3). */
  message: ReactNode;
  action?: NotificationAction;
  panel?: NotificationPanel;
  linkComponent?: LinkComponent;
  classNames?: PillNotificationClassNames;
}

interface NotificationContentProps extends PillNotificationProps {
  /**
   * Internal: <MagicPill> uses it to dismiss the notification after an action
   * click (link or button), unless the action's handler prevented the default.
   */
  onAction?: (event: MouseEvent<HTMLElement>) => void;
}

/** The implementation, with the host-only `onAction` hook. */
export function NotificationContent({
  icon,
  message,
  action,
  panel,
  linkComponent,
  classNames = {},
  onAction,
}: NotificationContentProps) {
  const hasIcon = icon !== undefined && icon !== null;

  const renderAction = (notificationAction: NotificationAction) => {
    const { icon: actionIcon, label, expanded } = notificationAction;
    if (notificationAction.href !== undefined) {
      return (
        <PillAction
          icon={actionIcon}
          label={label}
          expanded={expanded}
          href={notificationAction.href}
          linkComponent={linkComponent}
          className={classNames.action}
          onClick={onAction}
        />
      );
    }
    const { onClick } = notificationAction;
    return (
      <PillAction
        icon={actionIcon}
        label={label}
        expanded={expanded}
        className={classNames.action}
        onClick={(event) => {
          onClick(event);
          onAction?.(event);
        }}
      />
    );
  };

  return (
    <>
      {hasIcon && (
        <>
          <PillIcon className={classNames.icon}>{icon}</PillIcon>
          <PillDivider className={classNames.divider} />
        </>
      )}
      <PillMessage className={classNames.message}>{message}</PillMessage>
      {(action || panel) && (
        <PillActions className={classNames.actions}>
          {action && renderAction(action)}
          {panel && (
            <PillPanelTrigger
              icon={panel.trigger ? panel.trigger.icon : <PlusIcon />}
              label={panel.trigger?.label ?? "Learn more"}
              expanded={panel.trigger?.expanded}
              className={classNames.action}
            />
          )}
        </PillActions>
      )}
      {panel && (
        <PillPanel
          title={panel.title}
          titleAction={panel.titleAction}
          footer={panel.footer}
          closeLabel={panel.closeLabel}
          closeExpanded={panel.closeExpanded}
          className={classNames.panel}
        >
          {panel.content}
        </PillPanel>
      )}
    </>
  );
}

/**
 * Icon · divider · message · action, with an optional expandable panel.
 * Render it inside a <Pill>, or let <MagicPill> render it for pill().notify().
 */
export const PillNotification = NotificationContent as (props: PillNotificationProps) => ReactNode;
