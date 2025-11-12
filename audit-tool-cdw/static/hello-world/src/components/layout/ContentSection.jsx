/**
 * ContentSection
 * Reusable section container with elevation and padding
 */

import React, { forwardRef } from 'react';
import { Box, xcss } from '@atlaskit/primitives';

const sectionStyle = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'border.radius.300',
  padding: 'space.200',
  overflowX: 'auto',
});

const ContentSection = forwardRef(function ContentSection({ children }, ref) {
  return (
    <Box xcss={sectionStyle} ref={ref}>
      {children}
    </Box>
  );
});

export default ContentSection;
