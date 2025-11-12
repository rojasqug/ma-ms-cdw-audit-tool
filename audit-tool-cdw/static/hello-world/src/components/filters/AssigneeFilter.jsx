/**
 * AssigneeFilter
 * Dropdown filter for selecting assignees
 */

import React from 'react';
import { Box } from '@atlaskit/primitives';
import Select from '@atlaskit/select';

export default function AssigneeFilter({ options, value, onChange }) {
  return (
    <Box style={{ minWidth: 280 }}>
      <Select
        options={options}
        value={value || options[0]}
        onChange={onChange}
        placeholder="Filter by assignee"
        aria-label="Filter by assignee"
      />
    </Box>
  );
}
