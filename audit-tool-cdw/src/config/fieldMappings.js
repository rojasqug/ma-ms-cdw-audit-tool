/**
 * Field mappings for different project/issue type combinations
 * Defines which Jira fields are required for each query
 */

/**
 * Get required fields for a project/issue type combination
 * @param {string} projectKey - Project key
 * @param {string} issueType - Issue type name
 * @returns {string[]} Array of field names
 */
export function getRequiredFields(projectKey, issueType) {
  // Standard fields for most issue types
  const standardFields = [
    'summary',
    'assignee',
    'status',
    'issuetype',
    'priority',
    'created',
    'statuscategorychangedate',
    'resolutiondate'
  ];

  // Add custom fields based on project/type if needed
  // For GDPR issues, we need the resolution date
  if (projectKey === 'CWP' && issueType === 'GDPR') {
    return [...standardFields];
  }

  return standardFields;
}