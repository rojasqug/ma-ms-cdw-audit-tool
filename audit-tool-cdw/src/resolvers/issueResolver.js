/**
 * Issue Resolvers
 * Thin resolver functions that delegate to service layer
 */

import * as IssueSearchService from '../services/IssueSearchService.js';

/**
 * Helper function to extract text from Atlassian Document Format (ADF)
 */
function extractTextFromADF(adfNode) {
  if (!adfNode) return '';
  
  let text = '';
  
  // If it has text directly
  if (adfNode.text) {
    text += adfNode.text;
  }
  
  // If it has content array, recurse through it
  if (Array.isArray(adfNode.content)) {
    for (const child of adfNode.content) {
      text += extractTextFromADF(child);
      // Add space between paragraphs
      if (child.type === 'paragraph' && text && !text.endsWith('\n')) {
        text += '\n';
      }
    }
  }
  
  return text;
}

/**
 * Generic resolver to search issues by project and issue type
 * @param {Object} req - Request object with payload
 * @returns {Promise<Object>} Response with issues array or error
 */
export async function searchIssues(req) {
  try {
    const { projectKey, issueType } = req.payload || {};
    
    if (!projectKey || !issueType) {
      return { 
        issues: [], 
        error: 'Missing required parameters: projectKey and issueType' 
      };
    }

    const issues = await IssueSearchService.searchByProjectAndType(projectKey, issueType);
    return { issues };
  } catch (error) {
    console.error('[searchIssues] Error:', error);
    return { 
      issues: [], 
      error: error?.message || String(error) 
    };
  }
}

/**
 * Legacy resolver for CDR Remediation Request issues
 * Maintained for backward compatibility
 */
export async function searchCDROpenRemediation() {
  try {
    const issues = await IssueSearchService.searchByProjectAndType('CDR', 'Remediation Request');
    return { issues };
  } catch (error) {
    console.error('[searchCDROpenRemediation] Error:', error);
    return { 
      issues: [], 
      error: error?.message || String(error) 
    };
  }
}

/**
 * Legacy resolver for CDI Ingestion issues
 * Maintained for backward compatibility
 */
export async function searchCDIOpenIngestion() {
  try {
    const issues = await IssueSearchService.searchByProjectAndType('CDI', 'Ingestion');
    return { issues };
  } catch (error) {
    console.error('[searchCDIOpenIngestion] Error:', error);
    return { 
      issues: [], 
      error: error?.message || String(error) 
    };
  }
}

/**
 * GDPR Tree resolver
 * Fetches GDPR Request issues with their subtasks (GDPR Task)
 * Returns hierarchical tree structure for TableTree component
 * Supports date range filtering by resolutiondate
 */
export async function searchCwpGdprTree(req) {
  try {
    console.log('[searchCwpGdprTree] Starting with payload:', req.payload);
    const { projectKey = 'CWP', fromDate, toDate } = req.payload || {};
    
    console.log('[searchCwpGdprTree] Using projectKey:', projectKey);
    console.log('[searchCwpGdprTree] Date range:', { fromDate, toDate });
    
    // Search for GDPR issues (parent issues) restricted to final statuses
    console.log('[searchCwpGdprTree] Searching for GDPR issues (Done/Denied)...');
    const allowedStatuses = ['Done', 'Denied'];
    
    let gdprIssues;
    if (fromDate || toDate) {
      // Use date range filtering
      gdprIssues = await IssueSearchService.searchByProjectTypeStatusesAndDateRange(
        projectKey, 
        'GDPR', 
        allowedStatuses,
        fromDate,
        toDate
      );
    } else {
      // No date filter
      gdprIssues = await IssueSearchService.searchByProjectTypeAndStatuses(projectKey, 'GDPR', allowedStatuses);
    }
    
    console.log('[searchCwpGdprTree] Found', gdprIssues.length, 'GDPR issues');
    
    // Fetch subtasks for each parent issue
    console.log('[searchCwpGdprTree] Fetching subtasks for each parent...');
    const items = await Promise.all(
      gdprIssues.map(async (issue) => {
        // Fetch subtasks for this parent
        const subtasks = await IssueSearchService.fetchSubtasks(issue.key);
        console.log(`[searchCwpGdprTree] Found ${subtasks.length} subtasks for ${issue.key}`);
        
        // Transform subtasks to tree format
        const children = subtasks.map(subtask => ({
          key: subtask.key,
          summary: subtask.summary,
          type: subtask.type || 'GDPR Task',
          typeIcon: subtask.typeIcon || null,
          assignee: subtask.assignee || null,
          status: subtask.status,
          resolutiondate: subtask.resolutiondate || null,
          children: [] // Subtasks don't have children
        }));
        
        return {
          key: issue.key,
          summary: issue.summary,
          type: issue.type || 'GDPR',
          typeIcon: issue.typeIcon || null,
          assignee: issue.assignee || null,
          status: issue.status,
          resolutiondate: issue.resolutiondate || null,
          children: children
        };
      })
    );
    
    console.log('[searchCwpGdprTree] Returning', items.length, 'items with subtasks');
    return { items };
  } catch (error) {
    console.error('[searchCwpGdprTree] Error:', error);
    console.error('[searchCwpGdprTree] Error stack:', error?.stack);
    return { 
      items: [], 
      error: error?.message || String(error) 
    };
  }
}

/**
 * Get comments for an issue
 */
export async function getIssueComments(req) {
  try {
    const { key } = req.payload || {};
    
    if (!key) {
      return { comments: [], error: 'Missing issue key' };
    }
    
    console.log('[getIssueComments] Fetching comments for:', key);
    
    const { route } = await import('@forge/api');
    const api = await import('@forge/api');
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${key}/comment`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${data.errorMessages || data.message || 'Unknown error'}`);
    }
    
    const comments = (data.comments || []).map(comment => {
      // Extract text from Atlassian Document Format (ADF)
      let bodyText = '';
      
      if (typeof comment.body === 'string') {
        bodyText = comment.body;
      } else if (comment.body?.content) {
        // Parse ADF structure
        bodyText = extractTextFromADF(comment.body);
      }
      
      return {
        author: comment.author?.displayName || 'Unknown',
        created: comment.created,
        body: bodyText || '(No text content)'
      };
    });
    
    console.log('[getIssueComments] Found', comments.length, 'comments');
    return { comments };
  } catch (error) {
    console.error('[getIssueComments] Error:', error);
    return {
      comments: [],
      error: error?.message || String(error)
    };
  }
}

/**
 * Get activity (changelog) for an issue
 */
export async function getIssueActivity(req) {
  try {
    const { key } = req.payload || {};
    
    if (!key) {
      return { activities: [], error: 'Missing issue key' };
    }
    
    console.log('[getIssueActivity] Fetching activity for:', key);
    
    const { route } = await import('@forge/api');
    const api = await import('@forge/api');
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${key}/changelog`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${data.errorMessages || data.message || 'Unknown error'}`);
    }
    
    const activities = [];
    
    (data.values || []).forEach(history => {
      const created = history.created;
      const author = history.author?.displayName || 'System';
      
      (history.items || []).forEach(item => {
        activities.push({
          created: created,
          author: author,
          field: item.field || '',
          fromString: String(item.fromString || ''),
          toString: String(item.toString || '')
        });
      });
    });
    
    console.log('[getIssueActivity] Found', activities.length, 'activity items');
    return { activities };
  } catch (error) {
    console.error('[getIssueActivity] Error:', error);
    return {
      activities: [],
      error: error?.message || String(error)
    };
  }
}