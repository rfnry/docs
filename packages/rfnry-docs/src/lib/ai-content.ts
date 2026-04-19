export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) return markdown;
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) return markdown;
  const rest = markdown.slice(end + 4);
  return rest.replace(/^\s*\n/, "");
}

export interface Section {
  heading: string;
  anchor: string;
  markdown: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function sliceSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let inFence = false;
  let current: { heading: string; anchor: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (/^```|^~~~/.test(line)) inFence = !inFence;

    if (!inFence && /^##\s+/.test(line)) {
      if (current) {
        sections.push({
          heading: current.heading,
          anchor: current.anchor,
          markdown: current.lines.join("\n").trimEnd(),
        });
      }
      const heading = line.replace(/^##\s+/, "").trim();
      current = { heading, anchor: slugify(heading), lines: [line] };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) {
    sections.push({
      heading: current.heading,
      anchor: current.anchor,
      markdown: current.lines.join("\n").trimEnd(),
    });
  }

  return sections;
}

export interface ContextArgs {
  url: string;
  version: string;
  locale: string;
  anchor?: string;
}

export function buildContextHeader(args: ContextArgs): string {
  const lines = [`> Source: ${args.url}`, `> Version: ${args.version}`, `> Locale: ${args.locale}`];
  if (args.anchor) lines.push(`> Anchor: #${args.anchor}`);
  lines.push("");
  return lines.join("\n");
}
