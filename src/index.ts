export { default as MagicPill } from './MagicPill';
export * from './types';
export * from './utils/handlers';
export * from './utils/icons';
export * from './defaultPillData';

// v9: the pill primitive (the 8.x API above goes away in 9.0.0)
export { default as Pill } from './Pill/Pill';
export { PillIcon, PillDivider, PillMessage, PillActions } from './Pill/parts';
export { default as PillAction } from './Pill/PillAction';
export { PillPanel, PillPanelTrigger } from './Pill/PillPanel';
export { usePill } from './Pill/PillContext';
export type {
  PillProps,
  PillPresence,
  PillPlacement,
  PillOrientation,
  PillVariant,
  PillActionProps,
  PillButtonActionProps,
  PillLinkActionProps,
  PillPanelProps,
  PillContextValue,
  LinkComponent,
} from './Pill/types';

// v9 icons: currentColor, decorative by default, no "use client"
export { default as ArrowIcon } from './icons/ArrowIcon';
export { default as BoxIcon } from './icons/BoxIcon';
export { default as CheckIcon } from './icons/CheckIcon';
export { default as CloseIcon } from './icons/CloseIcon';
export { default as CouponIcon } from './icons/CouponIcon';
export { default as DocumentIcon } from './icons/DocumentIcon';
export { default as HelpIcon } from './icons/HelpIcon';
export { default as InfoIcon } from './icons/InfoIcon';
export { default as MailIcon } from './icons/MailIcon';
export { default as PhoneIcon } from './icons/PhoneIcon';
export { default as PlusIcon } from './icons/PlusIcon';
export { default as UndoIcon } from './icons/UndoIcon';
export type { IconProps } from './icons/types';
