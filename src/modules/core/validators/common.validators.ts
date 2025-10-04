import { z } from 'zod';

// Validation schemas for common types
export const StatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold'
]);
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const FrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']);
export const ContentTypeSchema = z.enum([
  'article',
  'video',
  'podcast',
  'book',
  'course',
  'note',
  'idea',
  'reference'
]);
export const MoodScaleSchema = z.enum(['1', '2', '3', '4', '5']);
export const FinanceTypeSchema = z.enum(['income', 'expense', 'transfer', 'investment']);
export const FinanceCategorySchema = z.enum([
  // Income categories
  'salary',
  'freelance',
  'business',
  'investment_return',
  'other_income',
  // Expense categories
  'food',
  'transportation',
  'housing',
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'education',
  'travel',
  'other_expense'
]);

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
