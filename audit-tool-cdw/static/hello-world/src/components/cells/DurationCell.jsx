/**
 * DurationCell
 * Displays formatted duration (milliseconds to human-readable)
 */

import React from 'react';
import { formatDuration } from '../../utils/formatters';

export default function DurationCell({ milliseconds }) {
  return <span>{formatDuration(milliseconds)}</span>;
}
