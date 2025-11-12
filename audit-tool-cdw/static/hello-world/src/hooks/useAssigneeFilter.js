/**
 * useAssigneeFilter Hook
 * Manages assignee filtering state and logic
 */

import { useState, useMemo } from 'react';
import {
  buildAssigneeOptions,
  filterIssuesByAssignee,
} from '../utils/transformers';

export function useAssigneeFilter(issues) {
  const [assigneeFilter, setAssigneeFilter] = useState(null);

  // Build filter options from issues
  const assigneeOptions = useMemo(
    () => buildAssigneeOptions(issues),
    [issues]
  );

  // Apply filter to issues
  const filteredIssues = useMemo(
    () => filterIssuesByAssignee(issues, assigneeFilter),
    [issues, assigneeFilter]
  );

  return {
    assigneeFilter,
    setAssigneeFilter,
    assigneeOptions,
    filteredIssues,
  };
}
