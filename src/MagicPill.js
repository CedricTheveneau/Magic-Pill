import React, { useEffect, useState } from 'react';
import './magicpill.css';

import ArrowLabel from './icons/arrow_label.js';
import BoxLabel from './icons/box_label.js';
import CheckmarkLabel from './icons/checkmark_label.js';
import CrossLabel from './icons/cross_label.js';
import MailLabel from './icons/mail_label.js';
import PlusLabel from './icons/plus_label.js';
import QuotationLabel from './icons/quotation_label.js';
import TelLabel from './icons/tel_label.js';
import UndoLabel from './icons/undo_label.js';

import CheckmarkIcon from './icons/checkmark.js';
import CouponIcon from './icons/coupon.js';
import InfoIcon from './icons/info.js';
import QuestionmarkIcon from './icons/questionmark.js';

const MagicPill = ({ pillData }) => {
  const [active, setActive] = useState(false)
  const [exit, setExit] = useState(true)
  const { icon, message, cta, info } = pillData;
  const { icon: ctaIcon, label: ctaLabel, link: ctaLink } = cta || {};
  const { title, content, closeLabel } = info || {};

  const [collapsed, setCollapsed] = useState(true);
  const [temporaryCTAIcon, setTemporaryCTAIcon] = useState(ctaIcon)

  let IconComponent;
  let CTAIconComponent;

  switch (icon) {
    case 'checkmark':
      IconComponent = CheckmarkIcon;
      break;
    case 'coupon':
      IconComponent = CouponIcon;
      break;
    case 'info':
      IconComponent = InfoIcon;
      break;
    case 'questionmark':
      IconComponent = QuestionmarkIcon;
      break;
    default:
      IconComponent = null;
  }

  switch (ctaIcon) {
    case 'arrow':
      CTAIconComponent = ArrowLabel;
      break;
    case 'box':
      CTAIconComponent = BoxLabel;
      break;
    case 'checkmark':
      CTAIconComponent = CheckmarkLabel;
      break;
    case 'cross':
      CTAIconComponent = CrossLabel;
      break;
    case 'mail':
      CTAIconComponent = MailLabel;
      break;
    case 'plus':
      CTAIconComponent = PlusLabel;
      break;
    case 'quotation':
      CTAIconComponent = QuotationLabel;
      break;
    case 'tel':
      CTAIconComponent = TelLabel;
      break;
    case 'undo':
      CTAIconComponent = UndoLabel;
      break;
    default:
      CTAIconComponent = null;
  }

  const displayMagicPill = () => {
    setExit(false)
    setTimeout(() => setActive(true), 2500)
    setTimeout(() => {setActive(false); setExit(true)}, 5000)
  }

  useEffect((
    displayMagicPill
  ), [])

  return (
    <div className={exit ? 'magicPill out' : active ? 'magicPill active' : 'magicPill entry'}>
      {IconComponent && <IconComponent className="icon"/>}
      <p className='message'>{message}</p>
      {ctaLink && !info && <a className='CTA' href={ctaLink}>{CTAIconComponent && <CTAIconComponent className="label" />}<span>{ctaLabel}</span></a>}
      {ctaLink && info && 
  <button 
    className='CTA' 
    onClick={() => {
      setCollapsed(!collapsed);
      setTemporaryCTAIcon('cross');
    }}
  >
    {CTAIconComponent && <CTAIconComponent className="label" />}
    <span>{!temporaryCTAIcon === ctaIcon ? ctaLabel : closeLabel}</span>
  </button>
}
      {info && <div className={!collapsed ? 'info active' : 'info'}><p className='title'>{title}</p><div className='content' dangerouslySetInnerHTML={ {__html: content} }></div></div>}
    </div>
  );
};

export default MagicPill;