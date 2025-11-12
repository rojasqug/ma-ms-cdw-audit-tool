/**
 * ControlBar
 * Horizontal control bar for buttons and filters
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';

const controlBarStyle = xcss({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export default function ControlBar({ children }) {
  return <Box xcss={controlBarStyle}>{children}</Box>;
}
