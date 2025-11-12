/**
 * Validators
 * Validation utilities for data integrity checks
 */

/**
 * Validate that required fields exist on an issue object
 */
export function validateIssue(issue) {
  if (!issue) return false;
  if (!issue.key) return false;
  if (!issue.summary) return false;
  return true;
}

/**
 * Validate project key format
 */
export function isValidProjectKey(key) {
  if (!key || typeof key !== 'string') return false;
  // Project keys are typically uppercase alphanumeric
  return /^[A-Z][A-Z0-9]*$/.test(key);
}

/**
 * Validate that a value is not null/undefined
 */
export function isPresent(value) {
  return value !== null && value !== undefined;
}
