import { z } from 'zod';

// Common enums and base types
export enum EStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum EPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum EFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export enum EContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  PODCAST = 'podcast',
  BOOK = 'book',
  COURSE = 'course',
  NOTE = 'note',
  IDEA = 'idea',
  REFERENCE = 'reference'
}

export enum EMoodScale {
  VERY_BAD = 1,
  BAD = 2,
  NEUTRAL = 3,
  GOOD = 4,
  VERY_GOOD = 5
}

export enum EFinanceType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  INVESTMENT = 'investment'
}

export enum EFinanceCategory {
  // Income categories
  SALARY = 'salary',
  FREELANCE = 'freelance',
  BUSINESS = 'business',
  INVESTMENT_RETURN = 'investment_return',
  OTHER_INCOME = 'other_income',

  // Expense categories
  FOOD = 'food',
  TRANSPORTATION = 'transportation',
  HOUSING = 'housing',
  UTILITIES = 'utilities',
  HEALTHCARE = 'healthcare',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  EDUCATION = 'education',
  TRAVEL = 'travel',
  OTHER_EXPENSE = 'other_expense'
}

// Base interfaces
export interface IBaseEntity {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserReference {
  createdBy: string;
  updatedBy?: string;
}

export interface ISoftDelete {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface IArchivable {
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
}

export interface ITaggable {
  tags: string[];
}

export interface ISearchable {
  searchText?: string; // Computed field for full-text search
}

// Validation schemas
export const StatusSchema = z.enum(EStatus);
export const PrioritySchema = z.enum(EPriority);
export const FrequencySchema = z.enum(EFrequency);
export const ContentTypeSchema = z.enum(EContentType);
export const MoodScaleSchema = z.enum(EMoodScale);
export const FinanceTypeSchema = z.enum(EFinanceType);
export const FinanceCategorySchema = z.enum(EFinanceCategory);

export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const TimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserReferenceSchema = z.object({
  createdBy: z.string(),
  updatedBy: z.string().optional()
});

export const SoftDeleteSchema = z.object({
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  deletedBy: z.string().optional()
});

export const ArchivableSchema = z.object({
  isArchived: z.boolean().default(false),
  archivedAt: z.date().optional(),
  archivedBy: z.string().optional()
});

export const TaggableSchema = z.object({
  tags: z.array(z.string()).default([])
});

export const SearchableSchema = z.object({
  searchText: z.string().optional()
});

// Common utility types
export type TId = string;
export type TUserId = string;
export type TDatabaseId = string;
export type TRecordId = string;
export type TPropertyId = string;
export type TViewId = string;
export type TWorkspaceId = string;
