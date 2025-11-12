/**
 * EmptyView
 * Displayed when no project/issue type is selected
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import EmptyState from '@atlaskit/empty-state';

const containerStyle = xcss({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
});

export default function EmptyView() {
  return (
    <Box xcss={containerStyle}>
      <EmptyState
        header="Select a project and issue type"
        description="Choose a project and request type from the dropdown menus above to view the dashboard."
      />
    </Box>
  );
}
