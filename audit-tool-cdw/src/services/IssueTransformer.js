/**
 * Issue Transformer
 * Pure functions to transform raw Jira API responses into app-friendly format
 * No external dependencies or API calls
 */

import { msBetween, now } from '../utils/dateUtils.js';

/**
 * Transform a raw Jira issue to application format
 * @param {Object} rawIssue - Raw issue from Jira API
 * @returns {Object} Transformed issue
 */
export function transformIssue(rawIssue) {
  const fields = rawIssue.fields || {};
  const started = fields.statuscategorychangedate || fields.created;
  const currentTime = now();

  return {
    key: rawIssue.key,
    summary: fields.summary || '',
    assignee: transformAssignee(fields.assignee),
    status: fields.status?.name || 'Unassigned',
    priority: fields.priority?.name || 'None',
    currentStatusDurationMs: msBetween(started, currentTime),
    resolutiondate: fields.resolutiondate || null,
    type: fields.issuetype?.name || 'Unknown',
    typeIcon: fields.issuetype?.iconUrl || null,
  };
}

/**
 * Transform raw assignee object to simplified format
 * @param {Object|null} assignee - Raw assignee from Jira API
 * @returns {Object|null} Transformed assignee or null
 */
export function transformAssignee(assignee) {
  if (!assignee) {
    return null;
  }

  return {
    name: assignee.displayName || 'Unknown',
    avatarUrl: assignee.avatarUrls?.['24x24'] || 
               assignee.avatarUrls?.['32x32'] || 
               null
  };
}

/**
 * Transform an array of raw issues
 * @param {Array} rawIssues - Array of raw issues from Jira API
 * @returns {Array} Array of transformed issues
 */
export function transformIssues(rawIssues) {
  return rawIssues.map(transformIssue);
}
