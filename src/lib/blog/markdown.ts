// A deliberately small Markdown subset, parsed to a plain AST (no HTML string,
// no dependency). The renderer (markdown.tsx) maps this AST to React elements,
// so text is escaped by React and a body can never inject markup. Supported:
// ## / ### headings, paragraphs, - / * bullet lists, 1. ordered lists,
// > blockquotes; inline **bold**, *italic*, `code`, and [label](/target) links.
// Anything else is plain text — the same "render only what's intended" stance as
// the site's existing Inline component.

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; target: string; children: InlineNode[] };

export type Block =
  | { type: "heading"; level: 2 | 3; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "blockquote"; children: InlineNode[] };

interface InlinePattern {
  re: RegExp;
  build: (match: RegExpExecArray) => InlineNode;
}

// Order is priority: `code` before links before **bold** before *italic* so a
// tie at the same index resolves to the stronger delimiter.
const INLINE_PATTERNS: InlinePattern[] = [
  { re: /`([^`]+)`/, build: (m) => ({ type: "code", value: m[1] }) },
  { re: /\[([^\]]+)\]\(([^)]+)\)/, build: (m) => ({ type: "link", target: m[2], children: parseInline(m[1]) }) },
  { re: /\*\*([^*]+)\*\*/, build: (m) => ({ type: "strong", children: parseInline(m[1]) }) },
  { re: /\*([^*]+)\*/, build: (m) => ({ type: "em", children: parseInline(m[1]) }) },
];

export function parseInline(text: string): InlineNode[] {
  if (text === "") return [];
  let best: { pattern: InlinePattern; match: RegExpExecArray } | null = null;
  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.re.exec(text);
    if (match && (best === null || match.index < best.match.index)) best = { pattern, match };
  }
  if (!best) return [{ type: "text", value: text }];

  const { pattern, match } = best;
  const nodes: InlineNode[] = [];
  if (match.index > 0) nodes.push({ type: "text", value: text.slice(0, match.index) });
  nodes.push(pattern.build(match));
  nodes.push(...parseInline(text.slice(match.index + match[0].length)));
  return nodes;
}

const HEADING = /^(#{2,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const ORDERED = /^\d+\.\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

/** Split a Markdown body into a block AST. Blank lines separate blocks. */
export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length === 3 ? 3 : 2, children: parseInline(heading[2].trim()) });
      i += 1;
      continue;
    }

    const bulletMatch = BULLET.exec(line);
    const orderedMatch = ORDERED.exec(line);
    if (bulletMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: InlineNode[][] = [];
      while (i < lines.length) {
        const itemMatch = (ordered ? ORDERED : BULLET).exec(lines[i]);
        if (!itemMatch) break;
        items.push(parseInline(itemMatch[1].trim()));
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (QUOTE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoteLines.push((QUOTE.exec(lines[i]) as RegExpExecArray)[1]);
        i += 1;
      }
      blocks.push({ type: "blockquote", children: parseInline(quoteLines.join(" ").trim()) });
      continue;
    }

    // Paragraph: consecutive plain lines until a blank line or a block starter.
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !HEADING.test(lines[i]) && !BULLET.test(lines[i]) && !ORDERED.test(lines[i]) && !QUOTE.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
  }

  return blocks;
}
