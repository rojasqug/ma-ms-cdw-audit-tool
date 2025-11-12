/**
 * AssigneeBarChart
 * Bar chart showing issue distribution by assignee
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AssigneeTick, chartCardStyle, chartInnerStyle } from '../../utils/chartHelper';
import { getBarFill } from '../../config/colors';

const chartCard = xcss(chartCardStyle);
const chartInner = xcss(chartInnerStyle);

export default function AssigneeBarChart({ data, colorMap }) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box xcss={chartCard}>
      <h4 style={{ margin: 0, marginBottom: 8 }}>Issues per Agent</h4>
      <Box xcss={chartInner}>
        <ResponsiveContainer width="100%" height={460}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 24, left: 24, bottom: 52 }}
            barCategoryGap="6%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
            <XAxis
              dataKey="name"
              tick={<AssigneeTick />}
              interval={0}
              height={84}
              padding={{ left: 48, right: 48 }}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#6B778C', fontSize: 11 }}
              width={36}
            />
            <Tooltip formatter={(value) => [`${value}`, 'Issues']} />
            <Bar dataKey="count" name="Issues" maxBarSize={64}>
              {data.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={getBarFill(entry.name, colorMap)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
