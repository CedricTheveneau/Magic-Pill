import type { ReactNode } from "react";
// The optional stylesheets, for the docs' forms and calendars (the themes are the whole site's)
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
      <main className="page docs">{children}</main>
    </>
  );
}
