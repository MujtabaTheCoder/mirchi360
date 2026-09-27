/**
 * Security & Sanitization Utilities for Mirchi360
 * Protects against XSS, injection attacks, and invalid authentication attempts.
 */

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS).
 * @param {string} input 
 * @returns {string} Sanitized string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Strips dangerous HTML tags and script elements from user text inputs (notes, complaints, names).
 * Preserves normal text, punctuation, and safe whitespace.
 * @param {string} input 
 * @param {number} maxLength Optional max length constraint
 * @returns {string}
 */
export const sanitizeTextInput = (input, maxLength = 500) => {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    input = String(input);
  }

  // Remove control characters (except newline and carriage return)
  let clean = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // Strip script, iframe, object, embed, style tags and event handlers
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<(?:iframe|object|embed|applet|form|base|meta|link)[^>]*>/gi, '');
  clean = clean.replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '');
  clean = clean.replace(/javascript\s*:/gi, '');
  
  // Strip any remaining angle brackets to prevent tag injection
  clean = clean.replace(/<[^>]*>/g, '');

  clean = clean.trim();
  if (maxLength && clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
};

/**
 * Validates and sanitizes a PIN input.
 * Rejects empty, whitespace, non-numeric (when digitsOnly is true), or malformed PINs.
 * @param {any} pin 
 * @param {boolean} digitsOnly If true, strictly requires 4 numeric digits.
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export const validatePin = (pin, digitsOnly = true) => {
  if (pin === null || pin === undefined) {
    return { valid: false, sanitized: '', error: 'PIN cannot be empty.' };
  }

  const str = String(pin).trim();
  if (!str) {
    return { valid: false, sanitized: '', error: 'PIN cannot be blank.' };
  }

  if (digitsOnly) {
    if (!/^\d{4}$/.test(str)) {
      return { valid: false, sanitized: '', error: 'PIN must be exactly 4 numeric digits.' };
    }
  } else {
    // For admin credentials or extended passwords
    if (str.length < 4 || str.length > 64) {
      return { valid: false, sanitized: '', error: 'Password must be between 4 and 64 characters.' };
    }
  }

  return { valid: true, sanitized: str };
};

/**
 * Validates and sanitizes table parameter from URL.
 * Falls back to 4 if not an integer between 1 and 100.
 * @param {any} param 
 * @returns {number}
 */
export const sanitizeTableParam = (param) => {
  if (!param) return 4;
  const num = parseInt(String(param).replace(/\D/g, ''), 10);
  if (isNaN(num) || num < 1 || num > 100) return 4;
  return num;
};

/**
 * Validates and sanitizes branch parameter from URL.
 * @param {any} param 
 * @returns {string} 'branch-def' or 'branch-qas'
 */
export const sanitizeBranchParam = (param) => {
  if (!param || typeof param !== 'string') return 'branch-def';
  const clean = param.trim().toLowerCase();
  if (clean.includes('qas') || clean === 'branch-qas') return 'branch-qas';
  return 'branch-def';
};

/**
 * Validates session object structure to prevent token tampering or invalid state.
 * @param {any} session 
 * @returns {boolean}
 */
export const isValidSessionObject = (session) => {
  if (!session || typeof session !== 'object') return false;
  const validRoles = ['kitchen', 'manager', 'admin'];
  if (!session.role || !validRoles.includes(session.role)) return false;
  if (!session.id && !session.username) return false;
  return true;
};
