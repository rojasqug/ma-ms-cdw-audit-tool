/**
 * Jira API Client
 * Centralized wrapper for all Jira REST API calls
 * Handles pagination, error handling, and response parsing
 */

import api, { route } from '@forge/api';

/**
 * Search for issues using JQL with automatic pagination
 * Uses CHANGE-2046 enhanced search endpoint with nextPageToken
 * @param {string} jql - JQL query string
 * @param {string[]} fields - Array of field names to retrieve
 * @param {number} pageSize - Number of results per page (default 100)
 * @returns {Promise<Array>} Array of all issues matching the query
 */
export async function searchIssues(jql, fields, pageSize = 100) {
  let nextPageToken = undefined;
  let allIssues = [];

  while (true) {
    const body = {
      jql,
      maxResults: pageSize,
      fields,
      ...(nextPageToken ? { nextPageToken } : {})
    };

    const response = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Jira search error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const pageIssues = data.issues || [];
    allIssues = allIssues.concat(pageIssues);

    nextPageToken = data.nextPageToken || null;
    if (!nextPageToken || pageIssues.length === 0) {
      break;
    }
  }

  return allIssues;
}

/**
 * Fetch complete changelog for an issue with pagination
 * @param {string} issueKey - Issue key (e.g., 'CDR-123')
 * @param {number} pageSize - Number of results per page (default 100)
 * @returns {Promise<Array>} Array of all changelog entries
 */
export async function getIssueChangelog(issueKey, pageSize = 100) {
  let startAt = 0;
  let histories = [];

  while (true) {
    const response = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueKey}/changelog?maxResults=${pageSize}&startAt=${startAt}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch changelog for ${issueKey}: ${response.status}`);
    }

    const data = await response.json();
    const pageHistories = data.values || data.histories || [];
    histories = histories.concat(pageHistories);

    const total = data.total ?? histories.length;
    startAt += pageSize;

    if (startAt >= total || pageHistories.length === 0) {
      break;
    }
  }

  return histories;
}

/**
 * Fetch a single issue with specified fields
 * @param {string} issueKey - Issue key (e.g., 'CDR-123')
 * @param {string[]} fields - Array of field names to retrieve
 * @returns {Promise<Object>} Issue object
 */
export async function getIssue(issueKey, fields) {
  const fieldsList = fields.join(',');
  const response = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=${fieldsList}`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch issue ${issueKey}: ${text}`);
  }

  return response.json();
}