// Type guards for property values and common types
import { TPropertyValue, TPrimitiveValue } from '../types/property.types';
import { EStatus, EPriority } from '../types/common.types';

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if a value is a valid date string or Date
 */
export function isValidDateValue(value: unknown): value is string | number | Date {
  if (isDate(value)) return true;
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Type guard to check if a value is a primitive property value
 */
export function isPrimitiveValue(value: unknown): value is TPrimitiveValue {
  return (
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isDate(value) ||
    value === null
  );
}

/**
 * Type guard to check if a value is a valid property value
 */
export function isValidPropertyValue(value: unknown): value is TPropertyValue {
  if (isPrimitiveValue(value)) return true;
  if (Array.isArray(value)) return true;
  if (value && typeof value === 'object') return true;
  return false;
}

/**
 * Type guard to check if a value is a valid status
 */
export function isValidStatus(value: unknown): value is EStatus {
  return isString(value) && Object.values(EStatus).includes(value as EStatus);
}

/**
 * Type guard to check if a value is a valid priority
 */
export function isValidPriority(value: unknown): value is EPriority {
  return isString(value) && Object.values(EPriority).includes(value as EPriority);
}

/**
 * Type guard to check if a value is a string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => isString(item));
}

/**
 * Type guard to check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array of objects
 */
export function isObjectArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(item => isObject(item));
}

/**
 * Safe property accessor with type guard
 */
export function getPropertyValue<T>(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  const value = properties?.[key];
  return guard(value) ? value : defaultValue;
}

/**
 * Safe string property accessor
 */
export function getStringProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: string = ''
): string {
  return getPropertyValue(properties, key, isString, defaultValue);
}

/**
 * Safe number property accessor
 */
export function getNumberProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: number = 0
): number {
  return getPropertyValue(properties, key, isNumber, defaultValue);
}

/**
 * Safe boolean property accessor
 */
export function getBooleanProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: boolean = false
): boolean {
  return getPropertyValue(properties, key, isBoolean, defaultValue);
}

/**
 * Safe date property accessor
 */
export function getDateProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue?: Date
): Date | null {
  const value = properties?.[key];
  if (isValidDateValue(value)) {
    return new Date(value);
  }
  return defaultValue || null;
}

/**
 * Safe status property accessor
 */
export function getStatusProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: EStatus = EStatus.NOT_STARTED
): EStatus {
  return getPropertyValue(properties, key, isValidStatus, defaultValue);
}

/**
 * Safe priority property accessor
 */
export function getPriorityProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: EPriority = EPriority.MEDIUM
): EPriority {
  return getPropertyValue(properties, key, isValidPriority, defaultValue);
}

/**
 * Safe string array property accessor
 */
export function getStringArrayProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: string[] = []
): string[] {
  return getPropertyValue(properties, key, isStringArray, defaultValue);
}

/**
 * Safe object array property accessor
 */
export function getObjectArrayProperty<T extends Record<string, unknown>>(
  properties: Record<string, TPropertyValue> | undefined,
  key: string,
  defaultValue: T[] = []
): T[] {
  const value = properties?.[key];
  return isObjectArray(value) ? value as T[] : defaultValue;
}

/**
 * Type guard to check if a value is a time entry array
 */
export function isTimeEntryArray(value: unknown): value is Array<{
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
  userId: string;
  createdAt: Date;
}> {
  return Array.isArray(value) && value.every(item =>
    isObject(item) &&
    isString(item.id) &&
    isValidDateValue(item.startTime) &&
    isNumber(item.duration) &&
    isString(item.userId) &&
    isValidDateValue(item.createdAt)
  );
}

/**
 * Type guard to check if a value is an active time tracking object
 */
export function isActiveTimeTracking(value: unknown): value is {
  userId: string;
  entryId: string;
  startTime: Date;
} {
  return isObject(value) &&
    isString(value.userId) &&
    isString(value.entryId) &&
    isValidDateValue(value.startTime);
}

/**
 * Safe time entries property accessor
 */
export function getTimeEntriesProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string = 'time_entries'
): Array<{
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
  userId: string;
  createdAt: Date;
}> {
  const value = properties?.[key];
  return isTimeEntryArray(value) ? value : [];
}

/**
 * Safe active time tracking property accessor
 */
export function getActiveTimeTrackingProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string = 'active_time_tracking'
): {
  userId: string;
  entryId: string;
  startTime: Date;
} | null {
  const value = properties?.[key];
  return isActiveTimeTracking(value) ? value : null;
}

/**
 * Type guard to check if a value is a task comment
 * Note: content is stored as mixed type in DB, so we validate structure but trust the type
 */
export function isTaskComment(value: unknown): value is Record<string, unknown> & {
  id: string;
  taskId: string;
  content: unknown[];
  isResolved: boolean;
  createdAt: Date | string;
  createdBy: string;
  createdByName: string;
} {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.taskId) &&
    Array.isArray(value.content) &&
    isBoolean(value.isResolved) &&
    isValidDateValue(value.createdAt) &&
    isString(value.createdBy) &&
    isString(value.createdByName);
}

/**
 * Type guard to check if a value is a task comment array
 */
export function isTaskCommentArray(value: unknown): value is Array<Record<string, unknown> & {
  id: string;
  taskId: string;
  content: unknown[];
  isResolved: boolean;
  createdAt: Date | string;
  createdBy: string;
  createdByName: string;
}> {
  return Array.isArray(value) && value.every(item => isTaskComment(item));
}

/**
 * Safe task comments property accessor
 */
export function getTaskCommentsProperty(
  properties: Record<string, TPropertyValue> | undefined,
  key: string = 'comments'
): Array<Record<string, unknown> & {
  id: string;
  taskId: string;
  content: unknown[];
  isResolved: boolean;
  createdAt: Date | string;
  createdBy: string;
  createdByName: string;
}> {
  const value = properties?.[key];
  return isTaskCommentArray(value) ? value : [];
}
