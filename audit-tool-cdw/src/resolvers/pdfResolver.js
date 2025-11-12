/**
 * PDF Resolvers
 * Handles PDF report generation for GDPR issues
 */

import { generateGDPRReport } from '../services/PdfGenerator.js';
import * as IssueSearchService from '../services/IssueSearchService.js';

/**
 * Generate PDF report for a GDPR issue with its subtasks
 * @param {Object} req - Request object with payload containing issueKey
 * @returns {Promise<Object>} Response with base64 PDF or error
 */
export async function generateGDPRPdfReport(req) {
  try {
    const { issueKey } = req.payload || {};
    
    if (!issueKey) {
      return { error: 'Missing issue key parameter' };
    }
    
    console.log('[generateGDPRPdfReport] Generating PDF for:', issueKey);
    
    // Fetch the parent GDPR issue
    console.log('[generateGDPRPdfReport] Fetching parent issue...');
    const parentIssue = await fetchParentIssue(issueKey);
    
    if (!parentIssue) {
      return { error: `Issue ${issueKey} not found` };
    }
    
    // Fetch parent comments and activity
    console.log('[generateGDPRPdfReport] Fetching parent comments and activity...');
    const parentComments = await fetchIssueComments(issueKey);
    const parentActivity = await fetchIssueActivity(issueKey);
    
    parentIssue.comments = parentComments;
    parentIssue.activity = parentActivity;
    
    // Fetch subtasks for this parent
    console.log('[generateGDPRPdfReport] Fetching subtasks...');
    const subtasks = await IssueSearchService.fetchSubtasks(issueKey);
    console.log('[generateGDPRPdfReport] Found', subtasks.length, 'subtasks');
    
    // Fetch comments and activity for each subtask
    console.log('[generateGDPRPdfReport] Fetching comments and activity for subtasks...');
    const subtasksWithDetails = await Promise.all(
      subtasks.map(async (subtask) => {
        const comments = await fetchIssueComments(subtask.key);
        const activity = await fetchIssueActivity(subtask.key);
        
        return {
          ...subtask,
          comments: comments,
          activity: activity
        };
      })
    );
    
    // Generate the PDF
    console.log('[generateGDPRPdfReport] Generating PDF document...');
    const pdfBuffer = await generateGDPRReport(parentIssue, subtasksWithDetails);
    
    // Convert buffer to base64 for transmission
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('[generateGDPRPdfReport] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return {
      pdf: pdfBase64,
      filename: `${issueKey} - Audit Report.pdf`,
      size: pdfBuffer.length
    };
  } catch (error) {
    console.error('[generateGDPRPdfReport] Error:', error);
    console.error('[generateGDPRPdfReport] Error stack:', error?.stack);
    return {
      error: error?.message || String(error)
    };
  }
}

/**
 * Fetch a single parent issue by key
 * @param {string} issueKey - Issue key (e.g., 'CWP-904')
 * @returns {Promise<Object>} Issue object
 */
async function fetchParentIssue(issueKey) {
  try {
    // Use JQL to find the specific issue
    const jql = `key = ${issueKey}`;
    const fields = [
      'summary',
      'assignee',
      'status',
      'issuetype',
      'resolutiondate',
      'priority'
    ];
    
    const { searchIssues } = await import('../services/JiraAPIclient.js');
    const rawIssues = await searchIssues(jql, fields);
    
    if (rawIssues.length === 0) {
      return null;
    }
    
    const { transformIssue } = await import('../services/IssueTransformer.js');
    return transformIssue(rawIssues[0]);
  } catch (error) {
    console.error('[fetchParentIssue] Error fetching issue:', issueKey, error);
    throw error;
  }
}

/**
 * Fetch comments for an issue
 * @param {string} issueKey - Issue key
 * @returns {Promise<Array>} Array of comments
 */
async function fetchIssueComments(issueKey) {
  try {
    const { route } = await import('@forge/api');
    const api = await import('@forge/api');
    
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[fetchIssueComments] Error for', issueKey, ':', data);
      return [];
    }
    
    return (data.comments || []).map(comment => ({
      author: comment.author?.displayName || 'Unknown',
      created: comment.created,
      body: extractTextFromComment(comment.body)
    }));
  } catch (error) {
    console.error('[fetchIssueComments] Error for', issueKey, ':', error);
    return [];
  }
}

/**
 * Fetch activity (changelog) for an issue
 * @param {string} issueKey - Issue key
 * @returns {Promise<Array>} Array of activity items
 */
async function fetchIssueActivity(issueKey) {
  try {
    const { route } = await import('@forge/api');
    const api = await import('@forge/api');
    
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/changelog`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[fetchIssueActivity] Error for', issueKey, ':', data);
      return [];
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
    
    return activities;
  } catch (error) {
    console.error('[fetchIssueActivity] Error for', issueKey, ':', error);
    return [];
  }
}

/**
 * Extract text from Atlassian Document Format (ADF) comment body
 * @param {Object} adfNode - ADF node
 * @returns {string} Plain text
 */
function extractTextFromComment(adfNode) {
  if (!adfNode) return '';
  
  if (typeof adfNode === 'string') return adfNode;
  
  let text = '';
  
  if (adfNode.text) {
    text += adfNode.text;
  }
  
  if (Array.isArray(adfNode.content)) {
    for (const child of adfNode.content) {
      text += extractTextFromComment(child);
      if (child.type === 'paragraph' && text && !text.endsWith('\n')) {
        text += ' ';
      }
    }
  }
  
  return text.trim();
}
