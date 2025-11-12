/**
 * Formatters
 * Pure functions for formatting data for display
 */

/**
 * Format duration in milliseconds to human-readable string
 * Example: 125000 ms -> "2m 5s"
 */
export function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '0s';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format date to locale string
 */
export function formatDate(date) {
  if (!date) return '';
  
  try {
    return new Date(date).toLocaleString();
  } catch (error) {
    return String(date);
  }
}

/**
 * Shorten name for display in charts
 * "John Smith" -> "John S."
 */
export function shortenName(name, maxLength = 14) {
  if (!name) return 'Unassigned';
  
  const nameParts = String(name).split(/\s+/).filter(Boolean);
  
  // If multiple parts, use "FirstName L."
  if (nameParts.length >= 2) {
    const lastInitial = nameParts[1].slice(0, 1).toUpperCase();
    return `${nameParts[0]} ${lastInitial}.`;
  }
  
  // If single part, truncate if too long
  if (name.length > maxLength) {
    return `${name.slice(0, maxLength - 1)}…`;
  }
  
  return name;
}

/**
 * Check if string looks like HTML error response
 */
export function looksLikeHtml(str) {
  if (!str || typeof str !== 'string') return false;
  
  const lowercased = str.toLowerCase();
  return lowercased.includes('<html') || lowercased.includes('<!doctype');
}

/**
 * Sanitize error message from bridge.invoke
 * Replaces HTML errors with user-friendly message
 */
export function sanitizeInvokeError(error) {
  const rawMessage = error?.message || String(error || 'Unknown error');
  
  if (looksLikeHtml(rawMessage)) {
    return 'Unexpected HTML error response received. See console for details.';
  }
  
  return rawMessage;
}
