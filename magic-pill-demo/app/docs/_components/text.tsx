import Link from "next/link";
import type { ReactNode } from "react";

import { SECTIONS } from "./sections";

const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*/g;

/** `code` and **bold** in a short text, as React nodes: nothing is parsed as HTML. */
export function md(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let end = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > end) nodes.push(text.slice(end, match.index));
    nodes.push(match[1] !== undefined ? <code key={match.index}>{match[1]}</code> : <strong key={match.index}>{match[2]}</strong>);
    end = match.index + match[0].length;
  }
  if (end < text.length) nodes.push(text.slice(end));
  return nodes;
}

/** A reference table. Cells are short texts with `code` and **bold**. */
export function Reference({ head, rows, caption }: { head: readonly string[]; rows: readonly (readonly string[])[]; caption?: string }) {
  return (
    <div className="table">
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {md(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={index}>{md(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A page's title and introduction. */
export function DocsHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="card docs-header">
      <h1>{title}</h1>
      <div className="docs-intro">{children}</div>
    </header>
  );
}

/** A part of a page: a heading people can link to, then its examples and notes. */
export function DocsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="docs-section" aria-labelledby={id}>
      <h2 id={id}>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  );
}

/** Notes that aren't examples: a card of prose. */
export function Notes({ children }: { children: ReactNode }) {
  return <div className="card notes">{children}</div>;
}

/** The previous and next pages, at the bottom of each page. */
export function PageLinks({ href }: { href: string }) {
  const index = SECTIONS.findIndex((section) => section.href === href);
  const previous = SECTIONS[index - 1];
  const next = SECTIONS[index + 1];
  return (
    <nav className="page-links" aria-label="Other pages">
      {previous ? (
        <Link className="card page-link" href={previous.href}>
          <span className="hint">Previous</span>
          {previous.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link className="card page-link page-link-next" href={next.href}>
          <span className="hint">Next</span>
          {next.label}
        </Link>
      )}
    </nav>
  );
}
