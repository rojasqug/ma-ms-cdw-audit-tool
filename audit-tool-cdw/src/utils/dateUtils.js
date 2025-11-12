/**
 * Date utility functions
 * Pure functions with no external dependencies
 */

/**
 * Calculate milliseconds between two ISO date strings
 * @param {string} start - ISO date string
 * @param {string} end - ISO date string
 * @returns {number} Milliseconds between dates (always >= 0)
 */
export function msBetween(start, end) {
  return Math.max(0, new Date(end).getTime() - new Date(start).getTime());
}

/**
 * Get current ISO timestamp
 * @returns {string} Current date/time in ISO format
 */
export function now() {
  return new Date().toISOString();
}