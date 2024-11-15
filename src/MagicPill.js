import React, { useEffect, useState, useRef } from 'react';
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
  const [active, setActive] = useState(false);
  const [exit, setExit] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const timeoutRef = useRef(null);
  const { icon, message, cta, info } = pillData;
  const { icon: ctaIcon, label: ctaLabel, link: ctaLink } = cta || {};
  const { title, content, closeLabel } = info || {};

  const [collapsed, setCollapsed] = useState(true);

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

  const currentCTAIcon = collapsed ? ctaIcon : 'cross';
  switch (currentCTAIcon) {
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
    setExit(false);
    setTimeout(() => {
      setActive(true);
      setTimeout(() => setHasEntered(true), 2500);
    }, 2500);
  };

  const startExitAnimation = () => {
    clearExitAnimation();
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      setTimeout(() => setExit(true), 500);
    }, 5000);
  };

  const clearExitAnimation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    setHovering(true);
    clearExitAnimation();
  };

  const handleMouseLeave = () => {
    setHovering(false);
    startExitAnimation();
  };

  useEffect(() => {
    if (!hasEntered) {
      displayMagicPill();
    }

    return () => {
      clearExitAnimation();
    };
  }, [hasEntered]);

  useEffect(() => {
    if (active && !hovering) {
      startExitAnimation();
    }
  }, [active, hovering]);

  return (
    <div className={exit ? 'magicPill out' : active ? 'magicPill active' : hasEntered ? 'magicPill active' : 'magicPill entry'} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} >
      {IconComponent && <IconComponent className="icon"/>}
      <p className='message'>{message}</p>
      {ctaLink && !info && <a className='CTA' href={ctaLink}>{CTAIconComponent && <CTAIconComponent className="label" />}<span>{ctaLabel}</span></a>}
      {ctaLink && info && 
  <button 
    className='CTA' 
    onClick={() => {setCollapsed(!collapsed)}}>
    {CTAIconComponent && <CTAIconComponent className="label" />}
    <span>{collapsed ? ctaLabel : closeLabel}</span>
  </button>
}
      {info && <div className={!collapsed ? 'info active' : 'info'}><p className='title'>{title}</p><div className='content' dangerouslySetInnerHTML={ {__html: content} }></div></div>}
    </div>
  );
};

MagicPill.defaultProps = {
  pillData: {
    icon: 'info',
    message: 'Hey ! I\'m Magic Pill, your omnipotent toolbox !',
    cta: {
      icon: 'arrow',
      label: 'Discover what I can do',
      link: null
    },
    info: {
      title: 'I\'m Magic Pill, let me empower you !',
      content: '<p>I\'ll appear sometimes, depending on context, either to send you notifications regarding your experience on this website or to give you indications and hints at what you cn do !</p><p>See you around !</p>',
      closeLabel: 'Close'
    }
  }
};

export default MagicPill;