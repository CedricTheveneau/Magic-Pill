import ArrowLabel from "../icons/arrow_label.js";
import BoxLabel from "../icons/box_label.js";
import CheckmarkLabel from "../icons/checkmark_label.js";
import CrossLabel from "../icons/cross_label.js";
import MailLabel from "../icons/mail_label.js";
import PlusLabel from "../icons/plus_label.js";
import QuotationLabel from "../icons/quotation_label.js";
import TelLabel from "../icons/tel_label.js";
import UndoLabel from "../icons/undo_label.js";

import CheckmarkIcon from "../icons/checkmark.js";
import CouponIcon from "../icons/coupon.js";
import InfoIcon from "../icons/info.js";
import QuestionmarkIcon from "../icons/questionmark.js";

export const Icons = {
  checkmark: CheckmarkIcon,
  coupon: CouponIcon,
  info: InfoIcon,
  questionmark: QuestionmarkIcon,
};

export const CTAIcons = {
  arrow: ArrowLabel,
  box: BoxLabel,
  checkmark: CheckmarkLabel,
  cross: CrossLabel,
  mail: MailLabel,
  plus: PlusLabel,
  quotation: QuotationLabel,
  tel: TelLabel,
  undo: UndoLabel,
};

export function getIconComponent(iconName: string, iconsMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>) {
  if (!iconName) return null;
  return iconsMap[iconName] || null;
}