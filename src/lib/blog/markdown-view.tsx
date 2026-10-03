import Link from "next/link";
import type { ReactNode } from "react";
import { parseBlocks, type InlineNode } from "@/lib/blog/markdown";
import { resolveInlineHref } from "@/lib/inline-links";
import type { Locale } from "@/i18n/pathnames";

// Maps the Markdown AST to React. No dangerouslySetInnerHTML anywhere: every
// string is a React child (escaped), so an article body cannot inject markup.
// Links resolve ONLY to a known internal route (resolveInlineHref) or an
// absolute http(s) URL; anything else renders as its label text (no dead links).

function externalHref(target: string): string | null {
  try {
    const url = new URL(target);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderInline(nodes: InlineNode[], locale: Locale, keyBase: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyBase}-${index}`;
    switch (node.type) {
      case "text":
        return node.value;
      case "strong":
        return <strong key={key}>{renderInline(node.children, locale, key)}</strong>;
      case "em":
        return <em key={key}>{renderInline(node.children, locale, key)}</em>;
      case "code":
        return <code key={key}>{node.value}</code>;
      case "link": {
        const children = renderInline(node.children, locale, key);
        const internal = resolveInlineHref(locale, node.target);
        if (internal) {
          return (
            <Link key={key} href={internal}>
              {children}
            </Link>
          );
        }
        const external = externalHref(node.target);
        if (external) {
          return (
            <a key={key} href={external} rel="noopener noreferrer">
              {children}
            </a>
          );
        }
        return <span key={key}>{children}</span>;
      }
    }
  });
}

export function Markdown({ markdown, locale }: { markdown: string; locale: Locale }) {
  const blocks = parseBlocks(markdown);
  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={key}>{renderInline(block.children, locale, key)}</h2>
            ) : (
              <h3 key={key}>{renderInline(block.children, locale, key)}</h3>
            );
          case "paragraph":
            return <p key={key}>{renderInline(block.children, locale, key)}</p>;
          case "list":
            return block.ordered ? (
              <ol key={key}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item, locale, `${key}-${itemIndex}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="tick-list">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item, locale, `${key}-${itemIndex}`)}</li>
                ))}
              </ul>
            );
          case "blockquote":
            return (
              <blockquote key={key}>
                {renderInline(block.children, locale, key)}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
