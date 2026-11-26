import type { ReactNode } from "react";
import { PillOptics } from "magic-pill";
// The optional stylesheets, for the docs' themes, forms and calendars
import "magic-pill/themes.css";
import "magic-pill/forms.css";
import "magic-pill/calendar.css";
import "./docs.css";

import { DocsPill } from "./_components/docs-pill";

export const metadata = {
  title: { default: "Docs", template: "%s · Magic Pill docs" },
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsPill />
      {/* Refraction and adaptive tinting for the glass examples: it costs nothing to plain pills */}
      <PillOptics />
      <main className="page docs">{children}</main>
    </>
  );
}
