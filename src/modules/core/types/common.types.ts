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
  searchText?: string;
}

export type TId = string;
export type TUserId = string;
export type TDatabaseId = string;
export type TRecordId = string;
export type TPropertyId = string;
export type TViewId = string;
export type TWorkspaceId = string;
