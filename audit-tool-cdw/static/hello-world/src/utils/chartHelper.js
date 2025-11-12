/**
 * Chart Helpers
 * Utilities specific to chart rendering (Recharts components)
 */

import React from 'react';
import { shortenName } from './formatters';

/**
 * Custom tick component for rotated assignee names in bar charts
 * Shortens names and rotates them -30 degrees
 */
export function AssigneeTick(props) {
  const { x, y, payload } = props;
  const label = shortenName(payload?.value || '');
  const dy = 12;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={dy}
        textAnchor="end"
        transform="rotate(-30)"
        fill="#6B778C"
        fontSize="11"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * XCSS style tokens for chart containers
 */
export const chartCardStyle = {
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'border.radius.300',
  padding: 'space.200',
};

export const chartInnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
};

export const chartsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: 'space.300',
  rowGap: 'space.300',
};
