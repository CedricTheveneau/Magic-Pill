"use client";
import { useId, type ReactNode } from "react";
import { Pill, PillNotification, pill, type NotifyInput, type NotifyOptions } from "magic-pill";

import { useStage, type Stage } from "../../stage";
import { Code } from "./code";

export interface ExampleProps {
  title: string;
  /** What it shows, under the title. */
  children?: ReactNode;
  /** A live version, in the card. */
  preview?: ReactNode;
  /** Classes for the preview's backdrop, e.g. a busy page for the glass. */
  previewClassName?: string;
  code: string;
  language?: "tsx" | "css" | "bash";
  /** "Try it" sends this notification to the main pill. */
  notify?: NotifyInput | (() => void);
  /** "Try it" puts this in the main pill, in the navbar's place (or with the navbar, given only `pill`). */
  stage?: Omit<Stage, "id">;
  /** The button's label. Default "Try it". */
  tryLabel?: string;
  /** The card spans the whole row. */
  wide?: boolean;
}

/** One variation: its title, a live preview, the code, and "Try it" in the main pill. */
export function Example({ title, children, preview, previewClassName, code, language, notify, stage, tryLabel = "Try it", wide }: ExampleProps) {
  const id = useId();
  const { stage: current, setStage } = useStage();
  const onStage = current?.id === id;
  const canTry = notify !== undefined || stage !== undefined;

  const tryIt = () => {
    if (onStage) {
      setStage(null);
      return;
    }
    if (stage) setStage({ id, ...stage });
    if (typeof notify === "function") notify();
    else if (notify) pill().notify(notify);
  };

  const back = stage?.content !== undefined ? "Back to the navbar" : "Back to the usual pill";

  return (
    <article className={wide ? "card example example-wide" : "card example"}>
      <h3>{title}</h3>
      {children && <div className="example-note">{children}</div>}
      {preview && <div className={previewClassName ? `specimen ${previewClassName}` : "specimen"}>{preview}</div>}
      <Code label={`Code: ${title}`} language={language}>
        {code}
      </Code>
      {canTry && (
        <div className="button-row">
          <button type="button" className={onStage ? "button button-outline" : "button button-dark"} onClick={tryIt} aria-pressed={stage ? onStage : undefined}>
            {onStage ? back : tryLabel}
          </button>
        </div>
      )}
    </article>
  );
}

/** A notification's look, in an inline pill: what `pill().notify(options)` shows. */
export function NotificationPreview({ options, label = "Preview" }: { options: NotifyOptions; label?: string }) {
  const { variant, icon, message, action, panel } = options;
  return (
    <Pill variant={variant} role="group" aria-label={label}>
      <PillNotification icon={icon} message={message} action={action} panel={panel} />
    </Pill>
  );
}
