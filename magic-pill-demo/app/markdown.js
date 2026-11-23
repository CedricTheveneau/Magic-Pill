// Renders the Markdown our own docs use (headings, paragraphs, lists, task
// lists, tables, quotes, fenced code, bold, code and links) as React nodes:
// nothing is injected as HTML. Build-time only, and only for files of this repo.

const REPO = "https://github.com/CedricTheveneau/Magic-Pill/blob/main/";
const resolveHref = (href) => (href.startsWith("./") ? REPO + href.slice(2) : href);

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

// Code first: nothing is formatted inside it
const INLINE = /(`[^`]+`)|\*\*((?:`[^`]*`|[^*])+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text) {
  const nodes = [];
  let end = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, code, bold, label, href] = match;
    if (match.index > end) nodes.push(text.slice(end, match.index));
    end = match.index + whole.length;
    if (code) nodes.push(<code key={end}>{code.slice(1, -1)}</code>);
    else if (bold) nodes.push(<strong key={end}>{inline(bold)}</strong>);
    else {
      nodes.push(
        <a key={end} href={resolveHref(href)}>
          {inline(label)}
        </a>,
      );
    }
  }
  if (end < text.length) nodes.push(text.slice(end));
  return nodes;
}

const cells = (row) =>
  row
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

// Each block: the lines it takes, and what they become
const BLOCKS = [
  {
    matches: (line) => line.startsWith("#"),
    continues: () => false,
    render: ([line], key) => {
      const [, marks, text] = /^(#+)\s+(.*)$/.exec(line);
      const Heading = `h${marks.length}`;
      return (
        <Heading key={key} id={slug(text)}>
          {inline(text)}
        </Heading>
      );
    },
  },
  {
    matches: (line) => line.startsWith("|"),
    continues: (line) => line.startsWith("|"),
    render: ([head, , ...rows], key) => (
      <div key={key} className="table" role="region" aria-label={cells(head).join(" / ")} tabIndex={0}>
        <table>
          <thead>
            <tr>
              {cells(head).map((cell, index) => (
                <th key={index} scope="col">
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {cells(row).map((cell, column) => (
                  <td key={column}>{inline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    matches: (line) => line.startsWith("> "),
    continues: (line) => line.startsWith(">"),
    render: (lines, key) => (
      <blockquote key={key}>{inline(lines.map((line) => line.replace(/^>\s?/, "")).join(" "))}</blockquote>
    ),
  },
  {
    matches: (line) => /^- /.test(line),
    continues: (line) => /^- /.test(line),
    render: (lines, key) => (
      <ul key={key} className={lines[0].startsWith("- [ ]") ? "checklist" : undefined}>
        {lines.map((line, index) => (
          <li key={index}>{inline(line.replace(/^- (\[ \] )?/, ""))}</li>
        ))}
      </ul>
    ),
  },
  {
    matches: (line) => /^\d+\. /.test(line),
    continues: (line) => /^\d+\. /.test(line),
    render: (lines, key) => (
      <ol key={key}>
        {lines.map((line, index) => (
          <li key={index}>{inline(line.replace(/^\d+\. /, ""))}</li>
        ))}
      </ol>
    ),
  },
];
const PARAGRAPH = {
  continues: (line) => line.trim() !== "" && !line.startsWith("```") && !BLOCKS.some((block) => block.matches(line)),
  render: (lines, key) => <p key={key}>{inline(lines.join(" "))}</p>,
};

/** @param {{ source: string }} props */
export function Markdown({ source }) {
  const lines = source.split("\n");
  const nodes = [];
  let at = 0;
  while (at < lines.length) {
    const start = at;
    if (lines[at].trim() === "") {
      at += 1;
    } else if (lines[at].startsWith("```")) {
      at += 1;
      while (at < lines.length && !lines[at].startsWith("```")) at += 1;
      nodes.push(
        <pre key={start} className="code" tabIndex={0}>
          <code>{lines.slice(start + 1, at).join("\n")}</code>
        </pre>,
      );
      at += 1;
    } else {
      const block = BLOCKS.find((candidate) => candidate.matches(lines[at])) ?? PARAGRAPH;
      at += 1;
      while (at < lines.length && block.continues(lines[at])) at += 1;
      nodes.push(block.render(lines.slice(start, at), start));
    }
  }
  return nodes;
}
