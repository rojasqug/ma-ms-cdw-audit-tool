/**
 * Project configuration
 * Defines available projects, issue types, and JQL templates
 */

export const PROJECTS = {
  CDR: {
    key: 'CDR',
    name: 'CDR',
    issueTypes: ['Remediation Request']
  },
  CDI: {
    key: 'CDI',
    name: 'CDI',
    issueTypes: ['Remediation Request', 'Ingestion']
  },
  CWP: {
    key: 'CWP',
    name: 'CWP',
    issueTypes: ['GDPR', 'GDPR Task']
  }
};

/**
 * Build JQL query for project and issue type
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {string} JQL query string
 */
export function buildJQL(projectKey, issueType) {
  return `project = ${projectKey} AND issuetype = "${issueType}" AND statusCategory != Done ORDER BY updated DESC`;
}

/**
 * Get standard fields for issue search
 * @returns {string[]} Array of field names
 */
export function getStandardFields() {
  return [
    'summary',
    'assignee',
    'status',
    'priority',
    'created',
    'statuscategorychangedate'
  ];
}
