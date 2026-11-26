import { Lexend, Overlock } from "next/font/google";
import "magic-pill/styles.css";
import "./globals.css";

import { AppPill } from "./app-pill";
import { DemoProvider } from "./demo-context";
import { HelpPill } from "./help-pill";
import { StageProvider } from "./stage";

// The README's font recipe: next/font self-hosts the fonts (nothing is loaded
// from Google at runtime) and `variable` sets Magic Pill's font tokens
const overlock = Overlock({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700", "900"],
  variable: "--mp-font-text",
});
const lexend = Lexend({ subsets: ["latin"], weight: ["400", "700"], variable: "--mp-font-accent" });

export const metadata = {
  title: { default: "Magic Pill", template: "%s · Magic Pill" },
  description: "Magic Pill, a design primitive for React: one pill, endless roles. Let it empower you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${overlock.variable} ${lexend.variable}`}>
      <body>
        <DemoProvider>
          <StageProvider>
            {/* Before the pages: pills that share a spot line up in the order they mount, and this one keeps its own */}
            <HelpPill />
            {children}
            <AppPill />
          </StageProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
