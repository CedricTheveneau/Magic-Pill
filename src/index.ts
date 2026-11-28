// Magic Pill v9. Three layers (VISION.md §6):
//   1. the primitive: <Pill> and its parts
//   2. templates: <PillNotification>, <PillNavbar>
//   3. controllers: <MagicPill> + pill(name) + usePillQueue(name)

// 1. The pill primitive
export { default as Pill } from './Pill/Pill';
export { PillIcon, PillDivider, PillMessage, PillActions } from './Pill/parts';
export { PillProgress } from './Pill/PillProgress';
export type { PillProgressProps } from './Pill/PillProgress';
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
  SceneChange,
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
  NotificationLayout,
} from './PillNotification/PillNotification';
export { PillNavbar } from './PillNavbar/PillNavbar';
export type { PillNavbarProps, NavItem, NavLinkItem, NavActionItem, NavPanelItem } from './PillNavbar/PillNavbar';

// Forms: fields on native controls, for panels and pills. They need magic-pill/forms.css
export { PillForm } from './PillForm/PillForm';
export type { PillFormProps } from './PillForm/PillForm';
export type { SendHandler } from './PillForm/send';
export { PillSubmit } from './PillForm/PillSubmit';
export type { PillSubmitProps } from './PillForm/PillSubmit';
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
export { PillDate } from './PillForm/PillDate';
export type { PillDateProps } from './PillForm/PillDate';
export type { CalendarLabels } from './PillForm/Calendar';
export type { DateType } from './PillForm/dates';
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
  ElectronOptions,
  Electron,
} from './store/store';
export { usePillQueue } from './store/usePillQueue';

// Icons: currentColor, decorative by default, no "use client". Deprecated:
// apps bring their own (any React content fits an icon slot). The library
// keeps the ones it uses as defaults, internally.
import ArrowIconBase from './icons/ArrowIcon';
import BoxIconBase from './icons/BoxIcon';
import CheckIconBase from './icons/CheckIcon';
import CloseIconBase from './icons/CloseIcon';
import CouponIconBase from './icons/CouponIcon';
import DocumentIconBase from './icons/DocumentIcon';
import HelpIconBase from './icons/HelpIcon';
import InfoIconBase from './icons/InfoIcon';
import MailIconBase from './icons/MailIcon';
import PhoneIconBase from './icons/PhoneIcon';
import PlusIconBase from './icons/PlusIcon';
import UndoIconBase from './icons/UndoIcon';
import type { IconProps as IconPropsBase } from './icons/types';
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const ArrowIcon = ArrowIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const BoxIcon = BoxIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const CheckIcon = CheckIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const CloseIcon = CloseIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const CouponIcon = CouponIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const DocumentIcon = DocumentIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const HelpIcon = HelpIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const InfoIcon = InfoIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const MailIcon = MailIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const PhoneIcon = PhoneIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const PlusIcon = PlusIconBase;
/** @deprecated Bring your own icons: any svg, image or icon component works (README, "Icons"). The built-in ones go in the next major version. */
export const UndoIcon = UndoIconBase;
/** @deprecated The props of the built-in icons, which are deprecated: any `<svg>` attribute, `ComponentPropsWithoutRef<"svg">`. */
export type IconProps = IconPropsBase;
