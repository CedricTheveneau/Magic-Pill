import { TemplateGallery } from "./templates";

export const metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <main className="page">
      <header className="card section-header">
        <h1>Templates</h1>
        <p>
          Ready-made arrangements of the same parts. Hover an action to see its label, then send the template to the pill
          below with <em>Try it</em>.
        </p>
      </header>
      <TemplateGallery />
    </main>
  );
}
