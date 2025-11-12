/**
 * AssigneeCell
 * Displays assignee with avatar and name
 */

import React from 'react';
import Avatar from '@atlaskit/avatar';

export default function AssigneeCell({ assignee }) {
  if (!assignee || !assignee.name) {
    return (
      <span style={{ color: 'var(--ds-text-subtle, #6B778C)' }}>
        Unassigned
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Avatar
        size="small"
        src={assignee.avatarUrl || undefined}
        name={assignee.name}
      />
      <span>{assignee.name}</span>
    </span>
  );
}
