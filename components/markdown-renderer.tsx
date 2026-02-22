'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** Renders a single inline segment: bold, bold+italic, italic, inline code, or plain text */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match: **bold**, *italic*, `code`, ***bolditalic***
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={`${keyPrefix}-t${i++}`}>{text.slice(lastIdx, match.index)}</span>);
    }
    if (match[2]) {
      parts.push(<strong key={`${keyPrefix}-bi${i++}`} className="font-bold italic">{renderRiskBadge(match[2])}</strong>);
    } else if (match[3]) {
      parts.push(<strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-foreground">{renderRiskBadge(match[3])}</strong>);
    } else if (match[4]) {
      parts.push(<em key={`${keyPrefix}-i${i++}`} className="italic">{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <code key={`${keyPrefix}-c${i++}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {match[5]}
        </code>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<span key={`${keyPrefix}-end`}>{text.slice(lastIdx)}</span>);
  }
  return parts.length > 0 ? parts : [<span key={`${keyPrefix}-raw`}>{text}</span>];
}

/** Wraps CRITICAL / HIGH / MEDIUM / LOW risk labels in colored badges */
function renderRiskBadge(text: string): React.ReactNode {
  const riskMap: Record<string, string> = {
    CRITICAL: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    LOW: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  };
  const upper = text.trim().toUpperCase();
  if (riskMap[upper]) {
    return (
      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold', riskMap[upper])}>
        {text}
      </span>
    );
  }
  return text;
}

/** Parse and render a markdown table block */
function MarkdownTable({ lines }: { lines: string[] }) {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line.split('|').map((c) => c.trim()).filter(Boolean);

  const headers = parseRow(lines[0]);
  // Skip alignment row (lines[1])
  const rows = lines.slice(2).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-foreground">
                {renderInline(h, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted-foreground">
                  {renderInline(cell, `td-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Dollar amount highlighting */
function highlightDollars(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') {
    const regex = /(\$[\d,]+(?:\.\d+)?(?:[MBK])?(?:\+)?)/g;
    const parts = node.split(regex);
    if (parts.length <= 1) return node;
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-primary">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }
  return node;
}

/** Full markdown renderer */
export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-6 border-border" />);
      i++;
      continue;
    }

    // Table block
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={key++} lines={tableLines} />);
      continue;
    }

    // Headers
    const h1Match = line.match(/^# (.+)$/);
    if (h1Match) {
      elements.push(
        <h1 key={key++} className="mb-4 mt-6 text-2xl font-bold text-foreground first:mt-0">
          {renderInline(h1Match[1], `h1-${key}`)}
        </h1>
      );
      i++;
      continue;
    }
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      elements.push(
        <h2 key={key++} className="mb-3 mt-6 text-xl font-bold text-foreground first:mt-0">
          {renderInline(h2Match[1], `h2-${key}`)}
        </h2>
      );
      i++;
      continue;
    }
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      elements.push(
        <h3 key={key++} className="mb-2 mt-5 text-lg font-semibold text-foreground first:mt-0">
          {renderInline(h3Match[1], `h3-${key}`)}
        </h3>
      );
      i++;
      continue;
    }
    const h4Match = line.match(/^#### (.+)$/);
    if (h4Match) {
      elements.push(
        <h4 key={key++} className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
          {renderInline(h4Match[1], `h4-${key}`)}
        </h4>
      );
      i++;
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      const items: { num: string; text: string; sub: string[] }[] = [];
      while (i < lines.length) {
        const olLine = lines[i].match(/^(\d+)\.\s+(.+)$/);
        if (olLine) {
          items.push({ num: olLine[1], text: olLine[2], sub: [] });
          i++;
        } else if (lines[i].match(/^\s+\*\s+/) && items.length > 0) {
          // Sub-bullet under ordered list
          items[items.length - 1].sub.push(lines[i].replace(/^\s+\*\s+/, ''));
          i++;
        } else if (lines[i].trim() === '' && i + 1 < lines.length && lines[i + 1].match(/^\s+\*/)) {
          i++; // skip blank line before sub-bullets
        } else {
          break;
        }
      }
      elements.push(
        <ol key={key++} className="my-3 ml-1 space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.num}
              </span>
              <div className="flex-1">
                <div className="text-sm leading-relaxed text-foreground">
                  {renderInline(item.text, `ol-${key}-${idx}`)}
                </div>
                {item.sub.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {item.sub.map((s, si) => (
                      <li key={si} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span className="leading-relaxed">{renderInline(s, `ol-sub-${key}-${idx}-${si}`)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list items
    const ulMatch = line.match(/^[\*\-]\s+(.+)$/);
    if (ulMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\*\-]\s+/)) {
        items.push(lines[i].replace(/^[\*\-]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-3 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{renderInline(item, `ul-${key}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-muted-foreground">
        {renderInline(line, `p-${key}`)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0">{elements}</div>;
}
