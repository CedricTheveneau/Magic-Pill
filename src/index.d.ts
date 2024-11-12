declare module 'magic-pill' {
 import * as React from 'react';

 // Déclaration des icônes comme composants React
 export const ArrowLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const BoxLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const CheckmarkLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const CrossLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const MailLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const PlusLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const QuotationLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const TelLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 export const UndoLabel: React.FC<React.SVGProps<SVGSVGElement>>;
 
 export const CheckmarkIcon: React.FC<React.SVGProps<SVGSVGElement>>;
 export const CouponIcon: React.FC<React.SVGProps<SVGSVGElement>>;
 export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>>;
 export const QuestionmarkIcon: React.FC<React.SVGProps<SVGSVGElement>>;

 // Déclaration des types pour le props de MagicPill
 export interface MagicPillProps {
   pillData: {
     icon: 'checkmark' | 'coupon' | 'info' | 'questionmark'; // Types d'icônes disponibles
     message: string;
     cta?: {
       icon: 'arrow' | 'box' | 'checkmark' | 'cross' | 'mail' | 'plus' | 'quotation' | 'tel' | 'undo'; // Types d'icônes CTA disponibles
       label: string;
       link: string;
     };
     info?: {
       title: string;
       content: string;
       closeLabel: string;
     };
   };
 }

 // Déclaration du composant MagicPill
 const MagicPill: React.FC<MagicPillProps>;

 export default MagicPill;
}