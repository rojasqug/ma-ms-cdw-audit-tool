/**
 * DateRangeFilter
 * Date range picker for filtering issues by date range
 */

import React from 'react';
import { Box, xcss, Inline } from '@atlaskit/primitives';
import { DatePicker } from '@atlaskit/datetime-picker';

const filterContainer = xcss({
  display: 'flex',
  alignItems: 'center',
  gap: 'space.200',
});

export default function DateRangeFilter({ fromDate, toDate, onFromChange, onToChange }) {
  return (
    <Box xcss={filterContainer}>
      <Inline space="space.100" alignBlock="center">
        <span>From:</span>
        <DatePicker
          value={fromDate}
          onChange={onFromChange}
          dateFormat="YYYY-MM-DD"
          placeholder="Select start date"
        />
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <span>To:</span>
        <DatePicker
          value={toDate}
          onChange={onToChange}
          dateFormat="YYYY-MM-DD"
          placeholder="Select end date"
        />
      </Inline>
    </Box>
  );
}
