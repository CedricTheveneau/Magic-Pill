"use client";
import Image from "next/image";
import "magic-pill/dist/magicpill.css";
import MagicPill from "magic-pill";

export default function Home() {
  const pillData = {
    icon: "checkmark", // Valeur possible : "checkmark", "coupon", "info", "questionmark"
    message: "Félicitations, vous avez reçu un coupon !",
    cta: {
      icon: "arrow", // Valeur possible : "arrow", "box", "checkmark", "cross", "mail", "plus", "quotation", "tel", "undo"
      label: "Découvrez votre offre",
      link: "https://www.example.com", // Lien vers la destination de l'appel à l'action (peut être null si non fourni)
    },
    info: {
      title: "Détails de l'offre", // Titre de l'information
      content:
        "<p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur v", // Contenu HTML à afficher
      closeLabel: "Fermer", // Libellé du bouton pour fermer l'info
    },
  };

  return (
    <div className="demoPage">
      <div className="bg"></div>
      <main className="demoMain">
        <div className="tile"></div>
        <div className="tile"></div>
        <div className="tile"></div>
        <div className="tile"></div>
        <div className="tile"> <MagicPill pillData={pillData} /></div>
        <div className="tile"></div>
        <div className="tile"></div>
        <div className="tile"></div>
        <div className="tile"></div>
      </main>
    </div>
  );
}
