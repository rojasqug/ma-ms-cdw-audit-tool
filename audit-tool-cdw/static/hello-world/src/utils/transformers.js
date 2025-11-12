/**
 * Data Transformers
 * Pure functions to transform backend data into UI-ready formats
 */

import {
  normalizeStatus,
  getStatusColor,
  STATUS_COLORS,
  CHART_COLORS,
} from '../config/colors';

/**
 * Build status color map ensuring distinct colors for all statuses
 * Prioritizes explicit STATUS_COLORS, then assigns from CHART_COLORS palette
 */
export function buildStatusColorMap(issues) {
  const presentStatuses = new Set(
    (issues || []).map(issue => normalizeStatus(issue.status || 'Unknown'))
  );
  
  const colorMap = new Map();
  const usedColors = new Set();
  
  // First pass: assign explicit colors from STATUS_COLORS
  presentStatuses.forEach(status => {
    if (STATUS_COLORS[status]) {
      colorMap.set(status, STATUS_COLORS[status]);
      usedColors.add(STATUS_COLORS[status]);
    }
  });
  
  // Second pass: assign remaining statuses from CHART_COLORS palette
  let colorIndex = 0;
  presentStatuses.forEach(status => {
    if (colorMap.has(status)) return; // Already mapped
    
    // Find next unused color
    while (usedColors.has(CHART_COLORS[colorIndex % CHART_COLORS.length])) {
      colorIndex++;
    }
    
    const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
    colorMap.set(status, color);
    usedColors.add(color);
    colorIndex++;
  });
  
  return colorMap;
}

/**
 * Build agent/assignee color map with stable color assignments
 * Ensures each agent gets a consistent color across all views
 */
export function buildAgentColorMap(issues) {
  const agentNames = new Set();
  
  (issues || []).forEach(issue => {
    const name = issue.assignee?.name || 'Unassigned';
    agentNames.add(name);
  });
  
  // Sort for stable ordering
  const sortedNames = Array.from(agentNames).sort((a, b) => a.localeCompare(b));
  
  const colorMap = new Map();
  
  sortedNames.forEach((name, index) => {
    if (index < CHART_COLORS.length) {
      // Use palette colors first
      colorMap.set(name, CHART_COLORS[index]);
    } else {
      // Generate HSL colors for overflow
      const hue = Math.floor((360 / sortedNames.length) * index);
      colorMap.set(name, `hsl(${hue}, 60%, 65%)`);
    }
  });
  
  return colorMap;
}

/**
 * Transform issues to status pie chart data
 * Returns array of {name, value, color}
 */
export function transformToStatusData(issues, statusColorMap) {
  const statusCounts = {};
  
  (issues || []).forEach(issue => {
    const statusName = issue.status || 'Unknown';
    statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
  });
  
  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: statusColorMap.get(normalizeStatus(name)) || getStatusColor(name),
  }));
}

/**
 * Transform issues to assignee bar chart data
 * Returns top N assignees plus 'Others' bucket
 */
export function transformToAssigneeData(issues, topN = 10) {
  const assigneeCounts = {};
  
  (issues || []).forEach(issue => {
    const name = issue.assignee?.name || 'Unassigned';
    assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
  });
  
  // Sort by count descending
  const sortedEntries = Object.entries(assigneeCounts)
    .sort((a, b) => b[1] - a[1]);
  
  const topEntries = sortedEntries.slice(0, topN);
  const remainingEntries = sortedEntries.slice(topN);
  
  // Calculate 'Others' bucket
  const othersCount = remainingEntries.reduce((sum, [, count]) => sum + count, 0);
  
  const data = topEntries.map(([name, count]) => ({ name, count }));
  
  if (othersCount > 0) {
    data.push({ name: 'Others', count: othersCount });
  }
  
  return data;
}

/**
 * Build assignee filter options from issues
 * Returns array of {label, value} for Select component
 */
export function buildAssigneeOptions(issues) {
  const assigneeNames = new Set();
  
  (issues || []).forEach(issue => {
    const name = issue.assignee?.name;
    if (name && name.trim()) {
      assigneeNames.add(name.trim());
    }
  });
  
  const sortedNames = Array.from(assigneeNames).sort((a, b) => a.localeCompare(b));
  
  const options = [
    { label: 'All', value: '__ALL__' },
    { label: 'Unassigned', value: '__UNASSIGNED__' },
  ];
  
  sortedNames.forEach(name => {
    options.push({ label: name, value: name });
  });
  
  return options;
}

/**
 * Filter issues by assignee selection
 */
export function filterIssuesByAssignee(issues, assigneeFilter) {
  const allIssues = issues || [];
  const selectedValue = assigneeFilter?.value;
  
  if (!selectedValue || selectedValue === '__ALL__') {
    return allIssues;
  }
  
  if (selectedValue === '__UNASSIGNED__') {
    return allIssues.filter(issue => !issue.assignee?.name);
  }
  
  return allIssues.filter(issue => issue.assignee?.name === selectedValue);
}
