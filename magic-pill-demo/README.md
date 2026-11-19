# Magic Pill demo

The live demo of [Magic Pill](../README.md), built with Next.js (App Router, static export) on the published `magic-pill` package.

- `/`: the playground. Compose a notification and send it to the pill.
- `/templates/`: the templates from the design board.
- `/building-blocks/`: the primitive: a toolbox rendered by a Server Component, a modal, a custom template, several pills, a vertical pill.

```bash
nvm use        # Node from the repo's .nvmrc
npm install
npm run dev    # http://localhost:3000/Magic-Pill
npm run build  # static export in out/
npm run lint
```

It's deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main` that touches the demo.
