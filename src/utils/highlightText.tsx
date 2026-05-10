import React from 'react';

/**
 * Wrap matching substrings of `query` in a highlighted <mark> element.
 * Case-insensitive. Returns the original string if query is empty or no match.
 */
export function highlightText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: React.ReactNode[] = [];

  let i = 0;
  let keyIdx = 0;
  while (i < text.length) {
    const matchIdx = lowerText.indexOf(lowerQuery, i);
    if (matchIdx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (matchIdx > i) {
      parts.push(text.slice(i, matchIdx));
    }
    parts.push(
      <mark
        key={`hl-${keyIdx++}`}
        className="bg-primary/20 text-foreground rounded px-0.5 not-italic"
      >
        {text.slice(matchIdx, matchIdx + q.length)}
      </mark>
    );
    i = matchIdx + q.length;
  }

  return <>{parts}</>;
}
