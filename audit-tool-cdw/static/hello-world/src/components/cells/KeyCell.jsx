/**
 * KeyCell
 * Displays issue key as a clickable link
 */

import React from 'react';

export default function KeyCell({ issueKey }) {
  if (!issueKey) return null;

  return (
    <a
      href={`/browse/${issueKey}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {issueKey}
    </a>
  );
}
