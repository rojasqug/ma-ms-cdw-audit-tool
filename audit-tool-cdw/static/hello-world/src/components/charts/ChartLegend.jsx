/**
 * ChartLegend
 * Reusable legend component for charts
 * Displays colored dots with labels
 */

import React from 'react';

export default function ChartLegend({ payload = [] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        marginTop: 8,
      }}
    >
      {payload.map((item, index) => (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: item.color || '#A5ADBA',
            }}
          />
          <span
            style={{
              color: '#172B4D',
              fontSize: 12,
            }}
          >
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}
