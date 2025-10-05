import { randomBytes } from 'crypto';

/**
 * Generate a unique ID for database records
 * Format: timestamp-random (e.g., "1703123456789-a1b2c3d4")
 */
export function generateId(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

/**
 * Generate a short ID for UI elements
 * Format: random string (e.g., "a1b2c3d4")
 */
export function generateShortId(): string {
  return randomBytes(4).toString('hex');
}

/**
 * Generate a UUID-like ID
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a human-readable ID
 * Format: adjective-noun-number (e.g., "happy-table-123")
 */
export function generateReadableId(): string {
  const adjectives = [
    'happy', 'clever', 'bright', 'swift', 'calm', 'bold', 'wise', 'kind',
    'quick', 'smart', 'cool', 'warm', 'fresh', 'clean', 'sharp', 'smooth'
  ];

  const nouns = [
    'table', 'view', 'record', 'field', 'data', 'list', 'board', 'card',
    'item', 'entry', 'note', 'task', 'project', 'goal', 'plan', 'idea'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective}-${noun}-${number}`;
}

/**
 * Validate if a string is a valid ID format
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;

  // Check for timestamp-random format
  const timestampRandomPattern = /^\d{13}-[a-f0-9]{8}$/;
  if (timestampRandomPattern.test(id)) return true;

  // Check for UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) return true;

  // Check for readable format
  const readablePattern = /^[a-z]+-[a-z]+-\d+$/;
  if (readablePattern.test(id)) return true;

  // Check for short hex format
  const shortPattern = /^[a-f0-9]{8}$/;
  if (shortPattern.test(id)) return true;

  return false;
}

/**
 * Extract timestamp from ID if it contains one
 */
export function extractTimestamp(id: string): number | null {
  const timestampRandomPattern = /^(\d{13})-[a-f0-9]{8}$/;
  const match = id.match(timestampRandomPattern);

  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Generate a property ID based on name
 */
export function generatePropertyId(name: string): string {
  // Convert name to snake_case and add random suffix
  const snakeCase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const suffix = randomBytes(2).toString('hex');
  return `${snakeCase}_${suffix}`;
}

/**
 * Generate a view ID based on name and type
 */
export function generateViewId(name: string, type: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const typeSlug = type.toLowerCase();
  const suffix = randomBytes(2).toString('hex');

  return `${nameSlug}_${typeSlug}_${suffix}`;
}

export default {
  generateId,
  generateShortId,
  generateUUID,
  generateReadableId,
  isValidId,
  extractTimestamp,
  generatePropertyId,
  generateViewId
};
