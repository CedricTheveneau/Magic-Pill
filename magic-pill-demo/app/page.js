import { Playground } from "./playground";

export default function Home() {
  return (
    <main className="page">
      <header className="hero card">
        <h1>Magic Pill</h1>
        <p className="tagline">Let it empower you.</p>
        <p className="pitch">
          A design primitive for React: one pill, endless roles. Notifications, a navbar, a toolbox, a modal… or several
          pills building a whole interface.
        </p>
        <pre className="code code-inline">
          <code>npm install magic-pill@next</code>
        </pre>
        <p className="links">
          <a href="https://github.com/CedricTheveneau/Magic-Pill#readme">Documentation</a>
          <a href="https://www.npmjs.com/package/magic-pill">npm</a>
          <a href="https://github.com/CedricTheveneau/Magic-Pill/blob/main/MIGRATING.md">Migrating from 8.x</a>
        </p>
      </header>
      <Playground />
    </main>
  );
}
