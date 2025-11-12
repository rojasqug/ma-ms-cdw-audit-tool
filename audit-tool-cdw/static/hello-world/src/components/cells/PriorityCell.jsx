/**
 * PriorityCell
 * Displays priority icon from Jira
 */

import React from 'react';
import { normalizePriority } from '../../config/colors';

const PRIORITY_ICON_BASE = 'https://moodysdatapipeline.atlassian.net/images/icons/priorities/';

const PRIORITY_ICON_MAP = {
  HIGHEST: 'highest_new.svg',
  HIGH: 'high.svg',
  MEDIUM: 'medium.svg',
  LOW: 'low.svg',
  LOWEST: 'lowest.svg',
};

export default function PriorityCell({ priority }) {
  const normalized = normalizePriority(priority);
  const iconFile = PRIORITY_ICON_MAP[normalized];

  if (!iconFile) {
    return <span title={priority || 'None'} />;
  }

  const iconUrl = `${PRIORITY_ICON_BASE}${iconFile}`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
      title={priority}
    >
      <img
        src={iconUrl}
        alt={priority}
        width={16}
        height={16}
        style={{ display: 'block' }}
      />
    </span>
  );
}
