// =============================================================================
// HTML Sanitizer Utility
// =============================================================================
// WHY:
//   Validation rejects bad input.
//   Sanitization cleans input to make it safe.
//   Encoding makes output safe for the rendering context.
//
//   These are three DIFFERENT things:
//     Validation: "Is this input acceptable?" → Reject if not.
//     Sanitization: "Make this input safe." → Remove dangerous parts.
//     Encoding: "Make this output safe for HTML/JS/URL context."
//
//   Input validation alone does NOT prevent XSS because:
//   1. Validation rules may miss edge cases or encoding tricks
//   2. Rich content (blog posts) intentionally allows some HTML
//   3. Data may enter the system through multiple paths
//   4. Mutation XSS can bypass validation but not sanitization
//
// This sanitizer strips dangerous tags (script, iframe, event handlers)
// while allowing safe formatting tags for blog content.
// =============================================================================

// Allowlisted tags for blog content
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div'
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'span': ['class'],
  'div': ['class'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan']
};

// Event handler attributes that must always be removed
const DANGEROUS_ATTRS = /^on\w+/i;

// Dangerous protocols in URLs
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // Remove script tags and their content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe tags
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: protocol from href/src attributes
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*javascript\s*:/gi, '$1="about:blank"');

  // Remove data: protocol from src (except for images)
  clean = clean.replace(/src\s*=\s*["']?\s*data\s*:(?!image)/gi, 'src="about:blank"');

  return clean;
}

// Simple text-only sanitizer for comments (no HTML allowed)
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { sanitizeHtml, sanitizeText, ALLOWED_TAGS, ALLOWED_ATTRIBUTES };
