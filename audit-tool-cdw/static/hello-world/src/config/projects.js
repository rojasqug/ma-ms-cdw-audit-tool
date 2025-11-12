/**
 * Project Definitions
 * Defines all available projects and their issue types
 */

export const PROJECTS = [
  {
    key: 'CDR',
    label: 'Core Data Remediation',
    issueTypes: [
      {
        type: 'Remediation Request',
        label: 'Remediation Request',
        viewType: 'table',
      },
    ],
  },
  {
    key: 'CDI',
    label: 'Core Data Alert Events',
    issueTypes: [
      {
        type: 'Remediation Request',
        label: 'Remediation Request',
        viewType: 'table',
      },
      {
        type: 'Ingestion',
        label: 'Ingestion Remediation',
        viewType: 'table',
      },
    ],
  },
  {
    key: 'CWP',
    label: 'Core Workflow Privacy Request',
    issueTypes: [
      {
        type: 'GDPR',
        label: 'GDPR Request',
        viewType: 'tree',
      },
    ],
  },
];

/**
 * Get project by key
 */
export function getProject(projectKey) {
  return PROJECTS.find(p => p.key === projectKey);
}

/**
 * Get issue types for a project
 */
export function getIssueTypes(projectKey) {
  const project = getProject(projectKey);
  return project ? project.issueTypes : [];
}

/**
 * Get view type for project + issue type combination
 */
export function getViewType(projectKey, issueType) {
  const types = getIssueTypes(projectKey);
  const match = types.find(t => t.type === issueType);
  return match ? match.viewType : 'table';
}
