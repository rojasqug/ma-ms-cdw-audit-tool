/**
 * StatusCell
 * Displays status as a colored badge with accessible text
 */

import React from 'react';
import {
  normalizeStatus,
  getStatusColor,
  hexToRgba,
  getStatusTextColor,
} from '../../config/colors';

export default function StatusCell({ status, colorMap }) {
  const normalized = normalizeStatus(status);
  const baseColor = colorMap?.get(normalized) || getStatusColor(status);
  const backgroundColor = hexToRgba(baseColor, 0.1);
  const borderColor = hexToRgba(baseColor, 0.5);
  const textColor = getStatusTextColor(status, baseColor);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: 'none',
        padding: '2px 8px',
        borderRadius: 0,
        border: `1px solid ${borderColor}`,
        backgroundColor,
        color: textColor,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      title={status}
    >
      {status || 'Unknown'}
    </span>
  );
}
