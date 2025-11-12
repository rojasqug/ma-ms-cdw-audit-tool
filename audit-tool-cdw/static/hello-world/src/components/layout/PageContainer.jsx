/**
 * PageContainer
 * Top-level page wrapper with consistent spacing
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';

const containerStyle = xcss({
  display: 'flex',
  flexDirection: 'column',
  rowGap: 'space.300',
});

export default function PageContainer({ children }) {
  return <Box xcss={containerStyle}>{children}</Box>;
}
