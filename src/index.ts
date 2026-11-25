// Magic Pill v9. Three layers (VISION.md §6):
//   1. the primitive: <Pill> and its parts
//   2. templates: <PillNotification>, <PillNavbar>
//   3. controllers: <MagicPill> + pill(name) + usePillQueue(name)

// 1. The pill primitive
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
  PillTheme,
  PillActionProps,
  PillButtonActionProps,
  PillLinkActionProps,
  PillPanelProps,
  PillPanelTriggerProps,
  PillContextValue,
  LinkComponent,
} from './Pill/types';

// What themes can't do in CSS: refraction
export { PillOptics } from './PillOptics/PillOptics';

// 2. Templates: arrangements of the parts above
export { PillNotification } from './PillNotification/PillNotification';
export type {
  PillNotificationProps,
  PillNotificationClassNames,
  NotificationAction,
  NotificationPanel,
} from './PillNotification/PillNotification';
export { PillNavbar } from './PillNavbar/PillNavbar';
export type { PillNavbarProps, NavItem, NavLinkItem, NavActionItem, NavPanelItem } from './PillNavbar/PillNavbar';

// Forms: fields on native controls, for panels and pills. They need magic-pill/forms.css
export { PillForm } from './PillForm/PillForm';
export type { PillFormProps } from './PillForm/PillForm';
export { PillFormPanel } from './PillForm/PillFormPanel';
export type { PillFormPanelProps } from './PillForm/PillFormPanel';
export { PillField } from './PillForm/PillField';
export type { PillFieldProps, FieldProps, FieldControlProps } from './PillForm/PillField';
export { PillInput } from './PillForm/PillInput';
export type { PillInputProps, PillInputType } from './PillForm/PillInput';
export { PillTextarea } from './PillForm/PillTextarea';
export type { PillTextareaProps } from './PillForm/PillTextarea';
export { PillSelect } from './PillForm/PillSelect';
export type { PillSelectProps, PillOption, PillOptionGroup } from './PillForm/PillSelect';
export { PillSlider } from './PillForm/PillSlider';
export type { PillSliderProps } from './PillForm/PillSlider';
export { PillSwitch } from './PillForm/PillSwitch';
export type { PillSwitchProps } from './PillForm/PillSwitch';
export { PillCheckbox } from './PillForm/PillCheckbox';
export type { PillCheckboxProps } from './PillForm/PillCheckbox';
export { PillChoices } from './PillForm/PillChoices';
export type {
  PillChoicesProps,
  PillSingleChoiceProps,
  PillMultipleChoiceProps,
  PillChoice,
} from './PillForm/PillChoices';
export { PillStepper } from './PillForm/PillStepper';
export type { PillStepperProps } from './PillForm/PillStepper';
export { PillFields } from './PillForm/PillFields';
export type { PillFieldsProps } from './PillForm/PillFields';
export { PillCode } from './PillForm/PillCode';
export type { PillCodeProps } from './PillForm/PillCode';
export { PillFile } from './PillForm/PillFile';
export type { PillFileProps } from './PillForm/PillFile';
export { PillColor } from './PillForm/PillColor';
export type { PillColorProps } from './PillForm/PillColor';

// 3. Controllers: a host per named pill, driven from anywhere
export { default as MagicPill } from './MagicPill/MagicPill';
export type { MagicPillProps } from './MagicPill/MagicPill';
export { pill } from './store/store';
export type {
  PillController,
  NotifyInput,
  NotifyOptions,
  NotifyRenderOptions,
  QueuedNotification,
  PillQueueState,
  DismissReason,
} from './store/store';
export { usePillQueue } from './store/usePillQueue';

// Icons: currentColor, decorative by default, no "use client"
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
