/**
 * IssueTypeCell
 * Displays a small issue type icon next to the type name
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';

const wrapperStyles = xcss({
  display: 'inline-flex',
  alignItems: 'center',
  columnGap: 'space.100',
});

const iconStyles = {
  width: 16,
  height: 16,
  borderRadius: 3,
  objectFit: 'cover',
};

const TYPE_ICON_OVERRIDES = {
  GDPR: 'https://moodysdatapipeline.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10307?size=xsmall',
  'GDPR Task': 'https://moodysdatapipeline.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=xsmall',
};

export default function IssueTypeCell({ name, iconUrl }) {
  if (!name) {
    return null;
  }

  const effectiveIcon = TYPE_ICON_OVERRIDES[name] || iconUrl;

  return (
    <Box xcss={wrapperStyles}>
      {effectiveIcon ? (
        <img src={effectiveIcon} alt="" style={iconStyles} aria-hidden="true" />
      ) : null}
      <span>{name}</span>
    </Box>
  );
}
