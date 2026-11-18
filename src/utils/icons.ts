import type { ComponentType, SVGProps } from "react";

import ArrowLabel from "../icons/arrow_label";
import BoxLabel from "../icons/box_label";
import CheckmarkLabel from "../icons/checkmark_label";
import CrossLabel from "../icons/cross_label";
import InfoLabel from "../icons/info_label";
import MailLabel from "../icons/mail_label";
import PlusLabel from "../icons/plus_label";
import QuotationLabel from "../icons/quotation_label";
import TelLabel from "../icons/tel_label";
import UndoLabel from "../icons/undo_label";

import CheckmarkIcon from "../icons/checkmark";
import CouponIcon from "../icons/coupon";
import InfoIcon from "../icons/info";
import QuestionmarkIcon from "../icons/questionmark";

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
  info: InfoLabel,
  mail: MailLabel,
  plus: PlusLabel,
  quotation: QuotationLabel,
  tel: TelLabel,
  undo: UndoLabel,
};

export function getIconComponent(
  iconName: string,
  iconsMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>>,
): ComponentType<SVGProps<SVGSVGElement>> | null {
  return iconsMap[iconName] || null;
}