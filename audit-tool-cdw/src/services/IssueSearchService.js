/**
 * Issue Search Service
 * Business logic for searching and retrieving issues
 */

import * as JiraApiClient from './JiraAPIclient.js';
import { transformIssues } from './IssueTransformer.js';
import { buildJQL } from '../config/projectConfig.js';
import { getRequiredFields } from '../config/fieldMappings.js';

/**
 * Search for issues by project and issue type
 * @param {string} projectKey - Project key (e.g., 'CDR', 'CDI')
 * @param {string} issueType - Issue type name (e.g., 'Remediation Request')
 * @returns {Promise<Array>} Array of transformed issues
 */
export async function searchByProjectAndType(projectKey, issueType) {
  console.log('[IssueSearchService] searchByProjectAndType called with:', { projectKey, issueType });
  
  // Build JQL query
  const jql = buildJQL(projectKey, issueType);
  console.log('[IssueSearchService] Built JQL:', jql);
  
  // Get required fields for this project/type combination
  const fields = getRequiredFields(projectKey, issueType);
  console.log('[IssueSearchService] Required fields:', fields);
  
  // Fetch raw issues from Jira
  console.log('[IssueSearchService] Calling JiraApiClient.searchIssues...');
  const rawIssues = await JiraApiClient.searchIssues(jql, fields);
  console.log('[IssueSearchService] Received', rawIssues.length, 'raw issues from Jira');
  
  // Transform to app format
  console.log('[IssueSearchService] Transforming issues...');
  const transformed = transformIssues(rawIssues);
  console.log('[IssueSearchService] Transformed to', transformed.length, 'issues');
  
  return transformed;
}

/**
 * Search for issues by project, type, and explicit allowed statuses
 * Only returns issues whose status name is in the provided list
 */
export async function searchByProjectTypeAndStatuses(projectKey, issueType, statuses) {
  console.log('[IssueSearchService] searchByProjectTypeAndStatuses called with:', { projectKey, issueType, statuses });

  // Build JQL with explicit status filter
  const quoted = (Array.isArray(statuses) ? statuses : []).map(s => `"${String(s)}"`).join(', ');
  const jql = `project = ${projectKey} AND issuetype = "${issueType}" AND status in (${quoted}) ORDER BY updated DESC`;
  console.log('[IssueSearchService] Built JQL (status filter):', jql);

  const fields = getRequiredFields(projectKey, issueType);
  console.log('[IssueSearchService] Required fields:', fields);

  console.log('[IssueSearchService] Calling JiraApiClient.searchIssues (status filtered)...');
  const rawIssues = await JiraApiClient.searchIssues(jql, fields);
  console.log('[IssueSearchService] Received', rawIssues.length, 'raw issues from Jira');

  const transformed = transformIssues(rawIssues);
  console.log('[IssueSearchService] Transformed to', transformed.length, 'issues');

  return transformed;
}

/**
 * Search for issues by project, type, statuses, and date range
 * Filters by resolutiondate (when issue was closed)
 */
export async function searchByProjectTypeStatusesAndDateRange(projectKey, issueType, statuses, fromDate, toDate) {
  console.log('[IssueSearchService] searchByProjectTypeStatusesAndDateRange called with:', { projectKey, issueType, statuses, fromDate, toDate });

  // Build JQL with explicit status filter
  const quoted = (Array.isArray(statuses) ? statuses : []).map(s => `"${String(s)}"`).join(', ');
  let jql = `project = ${projectKey} AND issuetype = "${issueType}" AND status in (${quoted})`;
  
  // Add date range filter if provided
  if (fromDate) {
    jql += ` AND resolutiondate >= "${fromDate}"`;
  }
  if (toDate) {
    jql += ` AND resolutiondate <= "${toDate}"`;
  }
  
  jql += ' ORDER BY updated DESC';
  
  console.log('[IssueSearchService] Built JQL (with date range):', jql);

  const fields = getRequiredFields(projectKey, issueType);
  console.log('[IssueSearchService] Required fields:', fields);

  console.log('[IssueSearchService] Calling JiraApiClient.searchIssues (date range filtered)...');
  const rawIssues = await JiraApiClient.searchIssues(jql, fields);
  console.log('[IssueSearchService] Received', rawIssues.length, 'raw issues from Jira');

  const transformed = transformIssues(rawIssues);
  console.log('[IssueSearchService] Transformed to', transformed.length, 'issues');

  return transformed;
}

/**
 * Fetch subtasks for a parent issue
 * @param {string} parentKey - Parent issue key (e.g., 'CWP-123')
 * @returns {Promise<Array>} Array of subtask issues
 */
export async function fetchSubtasks(parentKey) {
  console.log('[IssueSearchService] fetchSubtasks called for:', parentKey);
  
  // JQL to find subtasks of a specific parent
  const jql = `parent = ${parentKey} ORDER BY created ASC`;
  console.log('[IssueSearchService] Built subtask JQL:', jql);
  
  // Get standard fields for subtasks - use same fields as parent issues
  const fields = getRequiredFields('CWP', 'GDPR Task');
  console.log('[IssueSearchService] Required fields for subtasks:', fields);
  
  const rawIssues = await JiraApiClient.searchIssues(jql, fields);
  console.log('[IssueSearchService] Found', rawIssues.length, 'subtasks for', parentKey);
  
  const transformed = transformIssues(rawIssues);
  return transformed;
}