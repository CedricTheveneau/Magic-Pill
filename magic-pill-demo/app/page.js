'use client'
import Image from "next/image";
import 'magic-pill/dist/magicpill.css';
import styles from "./page.module.css";
import MagicPill from 'magic-pill'

export default function Home() {
  const pillData = {
    icon: "checkmark", // Valeur possible : "checkmark", "coupon", "info", "questionmark"
    message: "Félicitations, vous avez reçu un coupon !",
    cta: {
      icon: "arrow", // Valeur possible : "arrow", "box", "checkmark", "cross", "mail", "plus", "quotation", "tel", "undo"
      label: "Découvrez votre offre",
      link: "https://www.example.com" // Lien vers la destination de l'appel à l'action (peut être null si non fourni)
    },
    info: {
      title: "Détails de l'offre", // Titre de l'information
      content: "<p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur vos prochains achats avec ce coupon !</p><p>Profitez de 10% de réduction sur v", // Contenu HTML à afficher
      closeLabel: "Fermer" // Libellé du bouton pour fermer l'info
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <MagicPill pillData={pillData}/>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>app/page.js</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
