/**
 * StatusPieChart
 * Pie chart showing issue distribution by status
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import ChartLegend from './ChartLegend';
import { chartCardStyle, chartInnerStyle } from '../../utils/chartHelper';

const chartCard = xcss(chartCardStyle);
const chartInner = xcss(chartInnerStyle);

const legendContainer = xcss({
  display: 'flex',
  justifyContent: 'center',
  marginBlockStart: 'space.100',
});

export default function StatusPieChart({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box xcss={chartCard}>
      <h4 style={{ margin: 0, marginBottom: 8 }}>Issues by Status</h4>
      <Box xcss={chartInner}>
        <ResponsiveContainer width="100%" height={380}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              labelLine={{ stroke: '#DFE1E6' }}
              label={({ cx, cy, midAngle, outerRadius, percent }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 18;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#42526E"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={600}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {`${Math.round(percent * 100)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}`, 'Cases']} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box xcss={legendContainer}>
        <ChartLegend
          payload={data.map(item => ({
            color: item.color,
            value: item.name,
          }))}
        />
      </Box>
    </Box>
  );
}
