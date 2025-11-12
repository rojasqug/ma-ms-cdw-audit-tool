/**
 * Table Configuration
 * Defines columns, charts, and features for each project/issue type combination
 */

/**
 * Table configurations by project_issueType key
 */
export const TABLE_CONFIGS = {
  'CDR_Remediation Request': {
    columns: [
      { id: 'key', label: 'Key', width: 140 },
      { id: 'summary', label: 'Summary', width: 420 },
      { id: 'assignee', label: 'Assignee', width: 220 },
      { id: 'priority', label: 'Priority', width: 120 },
      { id: 'status', label: 'Status', width: 160 },
      { id: 'currentStatusDurationMs', label: 'Current Status Time', width: 180 },
      { id: 'history', label: 'Status History', width: 200 },
    ],
    hasCharts: true,
    hasAssigneeFilter: true,
    charts: ['statusPie', 'assigneeBar'],
    emptyMessage: 'No open Remediation Request issues in CDR',
  },
  
  'CDI_Remediation Request': {
    columns: [
      { id: 'key', label: 'Key', width: 140 },
      { id: 'summary', label: 'Summary', width: 420 },
      { id: 'assignee', label: 'Assignee', width: 220 },
      { id: 'priority', label: 'Priority', width: 120 },
      { id: 'status', label: 'Status', width: 160 },
      { id: 'currentStatusDurationMs', label: 'Current Status Time', width: 180 },
      { id: 'history', label: 'Status History', width: 200 },
    ],
    hasCharts: true,
    hasAssigneeFilter: true,
    charts: ['statusPie', 'assigneeBar'],
    emptyMessage: 'No open Remediation Request issues in CDI',
  },
  
  'CDI_Ingestion': {
    columns: [
      { id: 'key', label: 'Key', width: 140 },
      { id: 'summary', label: 'Summary', width: 420 },
      { id: 'assignee', label: 'Assignee', width: 220 },
      { id: 'priority', label: 'Priority', width: 120 },
      { id: 'status', label: 'Status', width: 160 },
      { id: 'currentStatusDurationMs', label: 'Current Status Time', width: 180 },
      { id: 'history', label: 'Status History', width: 200 },
    ],
    hasCharts: true,
    hasAssigneeFilter: true,
    charts: ['statusPie', 'assigneeBar'],
    emptyMessage: 'No open Ingestion issues in CDI',
  },
  
  'CWP_GDPR': {
    columns: [
      { id: 'key', label: 'Key', width: 120 },
      { id: 'summary', label: 'Summary', width: 450 },
      { id: 'type', label: 'Type', width: 80 },
      { id: 'assignee', label: 'Assignee', width: 160 },
      { id: 'status', label: 'Status', width: 100 },
      { id: 'resolutiondate', label: 'Closed Date', width: 140 },
      { id: 'comments', label: 'Comments', width: 180 },
      { id: 'activity', label: 'Activity', width: 170 },
      { id: 'report', label: 'Report', width: 200 },
    ],
    hasCharts: false,
    hasAssigneeFilter: false,
    charts: [],
    emptyMessage: 'No GDPR issues found in CWP',
  },
};

/**
 * Get table configuration for a project/issue type combination
 */
export function getTableConfig(projectKey, issueType) {
  const key = `${projectKey}_${issueType}`;
  return TABLE_CONFIGS[key] || {
    columns: [],
    hasCharts: false,
    hasAssigneeFilter: false,
    charts: [],
    emptyMessage: 'No issues found',
  };
}
