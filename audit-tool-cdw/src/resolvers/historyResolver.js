/**
 * History Resolver
 * Resolves status history for issues
 */

import * as JiraApiClient from '../services/JiraAPIclient.js';
import { msBetween, now } from '../utils/dateUtils.js';

/**
 * Get status history for an issue
 * Returns timeline of status changes with duration in each status
 * @param {Object} req - Request object with payload
 * @returns {Promise<Object>} Response with segments array or error
 */
export async function getIssueStatusHistory(req) {
  try {
    const { key } = req.payload || {};
    
    if (!key) {
      return { 
        key: null, 
        segments: [], 
        error: 'Missing issue key' 
      };
    }

    // Fetch issue and changelog in parallel
    const [issue, histories] = await Promise.all([
      JiraApiClient.getIssue(key, ['created', 'status']),
      JiraApiClient.getIssueChangelog(key)
    ]);

    // Extract status changes from changelog
    const statusChanges = histories
      .flatMap(h => 
        (h.items || [])
          .filter(i => i.field === 'status')
          .map(i => ({
            created: h.created,
            from: i.fromString,
            to: i.toString
          }))
      )
      .sort((a, b) => new Date(a.created) - new Date(b.created));

    // Build segments showing time in each status
    const segments = [];
    let cursorTime = issue.fields.created;
    let cursorStatus = statusChanges.length > 0 
      ? statusChanges[0].from 
      : issue.fields.status?.name;

    for (const change of statusChanges) {
      if (cursorStatus) {
        segments.push({
          status: cursorStatus,
          started: cursorTime,
          ended: change.created,
          durationMs: msBetween(cursorTime, change.created)
        });
      }
      cursorStatus = change.to;
      cursorTime = change.created;
    }

    // Add current status segment
    const currentTime = now();
    if (cursorStatus) {
      segments.push({
        status: cursorStatus,
        started: cursorTime,
        ended: currentTime,
        durationMs: msBetween(cursorTime, currentTime)
      });
    }

    return { key, segments };
  } catch (error) {
    console.error('[getIssueStatusHistory] Error:', error);
    return { 
      key: req?.payload?.key || null, 
      segments: [], 
      error: error?.message || String(error) 
    };
  }
}