"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { CopyIcon } from "../../icons";

// A small highlighter for the snippets of these pages (TSX, CSS and shell),
// with no dependency: comments, strings, tags, keywords and numbers. It only
// colours; what isn't recognised stays plain text.
const TOKENS =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?<=^|\s)# [^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|(?<!=)\/?>)|\b(import|from|export|default|const|let|function|return|async|await|new|if|else|true|false|null|undefined|type|interface|extends)\b|(\b\d+(?:\.\d+)?(?:ms|px|rem|s|deg|%)?\b|--[\w-]+)/g;

const KINDS = ["comment", "string", "tag", "keyword", "number"] as const;

function highlight(code: string, language: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let end = 0;
  for (const match of code.matchAll(TOKENS)) {
    const kindIndex = match.slice(1).findIndex((group) => group !== undefined);
    let kind: string = KINDS[kindIndex];
    // Apostrophes in plain text (CSS, shell) aren't strings
    if (kind === "string" && match[0].startsWith("'") && language !== "tsx") continue;
    if (kind === "tag" && language !== "tsx") kind = "";
    if (match.index > end) nodes.push(code.slice(end, match.index));
    nodes.push(kind ? <span key={match.index} className={`token-${kind}`}>{match[0]}</span> : match[0]);
    end = match.index + match[0].length;
  }
  if (end < code.length) nodes.push(code.slice(end));
  return nodes;
}

/** A snippet, with a copy button that shows on hover and focus. */
export function Code({ children, language = "tsx", label }: { children: string; language?: "tsx" | "css" | "bash"; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard (an insecure origin, a refusal): the text can still be selected
    }
  };

  return (
    <div className="code-block">
      <pre className="code" aria-label={label}>
        <code>{highlight(children, language)}</code>
      </pre>
      <button type="button" className="copy" onClick={copy} aria-label={copied ? "Copied" : "Copy the code"}>
        <CopyIcon />
        <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
