/**
 * Routing Configuration
 * Maps project/issue type combinations to view components
 */

import { getViewType } from './projects';

/**
 * Determine which view component to render
 * Returns 'table', 'tree', or 'empty'
 */
export function getViewComponent(projectKey, issueType) {
  if (!projectKey || !issueType) {
    return 'empty';
  }
  
  return getViewType(projectKey, issueType);
}

/**
 * Check if selection is valid
 */
export function isValidSelection(project, issueType) {
  return Boolean(project && issueType);
}
