'use client';

import { useState } from 'react';

export default function ExpandableText({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return <span className="text-muted-text">-</span>;

  const truncated = text.length > 100;

  if (!truncated || expanded) {
    return (
      <div className="whitespace-pre-wrap break-all text-xs text-primary-text max-h-96 overflow-y-auto">
        {text}
        {truncated && (
          <button
            onClick={() => setExpanded(false)}
            className="ml-1 text-accent-blue hover:underline"
          >
            collapse
          </button>
        )}
      </div>
    );
  }

  return (
    <span className="text-xs text-primary-text">
      {text.slice(0, 100)}...
      <button
        onClick={() => setExpanded(true)}
        className="ml-1 text-accent-blue hover:underline"
      >
        expand
      </button>
    </span>
  );
}
