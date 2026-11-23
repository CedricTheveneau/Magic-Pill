// The guide is MIGRATING.md, the one shipped in the package, read when the
// site is built. npm's deprecation message on 8.x links here: keep this URL.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Markdown } from "../markdown";

export const metadata = {
  title: "Migrating from 8.x",
  description: "How to move an app from Magic Pill 8 to 9, step by step.",
};

const guide = readFileSync(join(process.cwd(), "..", "MIGRATING.md"), "utf8");

export default function MigratingPage() {
  return (
    <main className="page">
      <article className="card guide">
        <Markdown source={guide} />
      </article>
    </main>
  );
}
