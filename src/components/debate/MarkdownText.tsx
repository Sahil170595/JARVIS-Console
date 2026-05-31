"use client";

/**
 * P109.4 — Render LLM output as markdown.
 *
 * `react-markdown` does NOT execute scripts and escapes raw HTML by default —
 * we explicitly DON'T pass `rehype-raw`, so a malicious model output like
 * `<script>...</script>` renders as inert text. `remark-gfm` adds GitHub-
 * flavored extras (tables, strikethrough, autolinks) without enabling any
 * unsafe surface.
 *
 * Tailwind `prose` classes style the output. Variant `prose-invert` for the
 * dark console; `prose-sm` for the smaller round-card context.
 */

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownTextProps {
  text: string;
  /** "card" = inline-ish, used inside DebateRoundCard. "panel" = larger,
   *  used in the Final response section. */
  variant?: "card" | "panel";
}

const COMMON_CLASSES =
  "prose prose-invert prose-sm max-w-none " +
  // Tighten defaults: lists, code, paragraphs shouldn't waste vertical space
  "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 " +
  "prose-headings:mt-2 prose-headings:mb-1 " +
  "prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:rounded " +
  "prose-pre:my-2 prose-pre:bg-muted/50 " +
  "prose-strong:text-foreground prose-em:text-foreground/90 " +
  "prose-a:text-primary";

const PANEL_EXTRA = " prose-base";

// Force external links to open in a new tab + safe rel.
const components: Components = {
  a: ({ href, children, ...rest }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      {...rest}
    >
      {children}
    </a>
  ),
};

export function MarkdownText({ text, variant = "card" }: MarkdownTextProps) {
  if (!text) return null;
  return (
    <div className={COMMON_CLASSES + (variant === "panel" ? PANEL_EXTRA : "")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Note: NOT passing rehypePlugins=[rehypeRaw] — keep raw HTML escaped.
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
