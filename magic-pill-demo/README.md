# Magic Pill demo

The live demo of [Magic Pill](../README.md), built with Next.js (App Router, static export) on the published `magic-pill` package.

- `/`: the playground. Compose a notification and send it to the pill.
- `/templates/`: the templates from the design board.
- `/building-blocks/`: the primitive: a toolbox rendered by a Server Component, a modal, a custom template, several pills, a vertical pill.
- `/docs/`: the documentation, one page per section (in the README's order), with a pill of sections on the left. Each example has a live preview, its code, and a "Try it" that plays it in the main pill: notifications go through its queue, anything else takes the navbar's place until you bring it back (`app/stage.tsx`). The docs pages are TypeScript; the others are still JavaScript.
- `/migrating-from-8/`: the migration guide, rendered from [`MIGRATING.md`](../MIGRATING.md) at build time. npm's deprecation message on 8.x links here: keep this URL.

A second pill, at the top right, points people coming from 8.x to the guide.

```bash
nvm use        # Node from the repo's .nvmrc
npm install
npm run dev    # http://localhost:3000/Magic-Pill
npm run build  # static export in out/
npm run lint
```

It's deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main` that touches the demo or `MIGRATING.md`.
