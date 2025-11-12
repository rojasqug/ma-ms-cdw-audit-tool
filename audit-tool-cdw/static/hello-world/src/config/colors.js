/**
 * Color Configuration and Utilities
 * Centralized color logic for status badges, charts, and visualizations
 * Following Atlassian Design System color guidelines
 */

/**
 * Explicit status color mappings
 * These take precedence over generated colors
 */
export const STATUS_COLORS = {
  'NEW TICKET': '#2684FF',                 // Blue 400
  'INITIAL REVIEW': '#FFAB00',             // Yellow 400
  'EMAIL TO VENDOR': '#FF7452',            // Red 300
  'DATA REMEDIATION IN PROGRESS': '#00B8D9', // Teal 400
  'DATA REMEDIATION COMPLETED': '#36B37E',   // Green 400
  'NEED MORE INFO': '#8777D9',             // Purple 300
  'DECLINED': '#FFB57D',                   // Orange 300
  'DONE': '#4CC3A6',                       // Soft green
  'DENIED': '#FF5630',                     // Red 500
};

/**
 * Fallback color palette for dynamic assignment
 * Used when explicit status colors are not defined
 */
export const CHART_COLORS = [
  '#2684FF', // Blue
  '#FF7452', // Red
  '#57D9A3', // Green
  '#FFE380', // Yellow
  '#8777D9', // Purple
  '#79E2F2', // Cyan
  '#FFB57D', // Orange
  '#B3D4FF', // Light blue
  '#F797FF', // Pink
  '#A5D6A7', // Light green
];

/**
 * Normalize status name for consistent mapping
 */
export function normalizeStatus(name) {
  return String(name || 'Unknown').trim().toUpperCase();
}

/**
 * Normalize priority name for consistent mapping
 */
export function normalizePriority(name) {
  return String(name || 'None').trim().toUpperCase();
}

/**
 * Convert hex color to rgba with alpha channel
 */
export function hexToRgba(hex, alpha) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return `rgba(145, 158, 171, ${alpha})`;
  
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darken a hex color by a given factor (0-1)
 */
export function darkenHex(hex, amount = 0.35) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!match) return '#172B4D';
  
  const r = Math.max(0, Math.floor(parseInt(match[1], 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(match[2], 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(match[3], 16) * (1 - amount)));
  
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate brightness of a hex color (0-255 scale)
 */
function getBrightness(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!match) return 0;
  
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Get accessible text color for a given background
 * For bright backgrounds, returns a darkened version of the same color
 */
export function getAccessibleTextColor(hex) {
  const brightness = getBrightness(hex);
  return brightness > 170 ? darkenHex(hex, 0.35) : hex;
}

/**
 * Get text color for status badge
 * Special handling for 'Initial Review' to maintain readability
 */
export function getStatusTextColor(status, baseHex) {
  const normalized = normalizeStatus(status);
  
  // Special case: Initial Review uses darker yellow for text
  if (normalized === 'INITIAL REVIEW') {
    return '#CC8B00';
  }
  
  return getAccessibleTextColor(baseHex);
}

/**
 * Get color for a status name
 * Uses explicit mapping first, then deterministic hash-based fallback
 */
export function getStatusColor(name) {
  const normalized = normalizeStatus(name);
  
  // Check explicit color map first
  if (STATUS_COLORS[normalized]) {
    return STATUS_COLORS[normalized];
  }
  
  // Deterministic hash-based color selection
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  
  const index = hash % CHART_COLORS.length;
  return CHART_COLORS[index];
}

/**
 * Get deterministic color for an agent/assignee name
 */
export function getAgentColor(name) {
  const key = String(name || 'Unassigned');
  
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  
  const index = hash % CHART_COLORS.length;
  return CHART_COLORS[index];
}

/**
 * Get bar fill color ensuring uniqueness across the color map
 * Returns mapped color if exists, otherwise finds unused color
 */
export function getBarFill(name, colorMap) {
  // If name is already mapped, use it
  if (colorMap && colorMap.has(name)) {
    return colorMap.get(name);
  }
  
  // Find first unused color from palette
  const usedColors = new Set(colorMap ? Array.from(colorMap.values()) : []);
  
  for (const color of CHART_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  
  // Fallback to hash-based color if all palette colors are used
  return getAgentColor(name);
}
