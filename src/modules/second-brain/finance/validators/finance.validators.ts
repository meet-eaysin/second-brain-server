import { z } from 'zod';
import {
  ETransactionType,
  ETransactionCategory,
  EAccountType,
  EBudgetPeriod,
  EFinancialGoalType
} from '../types/finance.types';

// Base schemas
export const transactionIdSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required')
});

export const accountIdSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required')
});

export const categoryParamSchema = z.object({
  category: z.enum(ETransactionCategory)
});

// Transaction CRUD schemas
export const createTransactionSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  type: z.enum(ETransactionType),
  category: z.enum(ETransactionCategory),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  date: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  merchant: z.string().max(200, 'Merchant name too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  budgetId: z.string().optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional()
});

export const updateTransactionSchema = z.object({
  type: z.enum(ETransactionType).optional(),
  category: z.enum(ETransactionCategory).optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description too long')
    .optional(),
  date: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  merchant: z.string().max(200, 'Merchant name too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional(),
  isVerified: z.boolean().optional(),
  budgetId: z.string().optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional()
});

export const getTransactionsQuerySchema = z.object({
  databaseId: z.string().optional(),
  type: z
    .array(z.enum(ETransactionType))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as ETransactionType)))
    .optional(),
  category: z
    .array(z.enum(ETransactionCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as ETransactionCategory)))
    .optional(),
  accountId: z.string().optional(),
  budgetId: z.string().optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional(),
  minAmount: z
    .number()
    .min(0)
    .or(z.string().transform(val => parseFloat(val)))
    .optional(),
  maxAmount: z
    .number()
    .min(0)
    .or(z.string().transform(val => parseFloat(val)))
    .optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  isRecurring: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  isVerified: z
    .boolean()
    .or(z.string().transform(val => val === 'true'))
    .optional(),
  search: z.string().optional(),
  tags: z
    .array(z.string())
    .or(z.string().transform(val => val.split(',')))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['date', 'amount', 'description', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const duplicateTransactionSchema = z.object({
  date: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description too long')
    .optional()
});

export const bulkUpdateTransactionsSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1, 'At least one transaction ID is required'),
  updates: updateTransactionSchema
});

export const bulkDeleteTransactionsSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1, 'At least one transaction ID is required'),
  permanent: z.boolean().default(false)
});

// Account schemas
export const createAccountSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Account name is required').max(200, 'Name too long'),
  type: z.enum(EAccountType),
  balance: z.number().default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  accountNumber: z.string().max(50, 'Account number too long').optional(),
  bankName: z.string().max(200, 'Bank name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  includeInNetWorth: z.boolean().default(true)
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(200, 'Name too long').optional(),
  type: z.enum(EAccountType).optional(),
  balance: z.number().optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  accountNumber: z.string().max(50, 'Account number too long').optional(),
  bankName: z.string().max(200, 'Bank name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  isActive: z.boolean().optional(),
  includeInNetWorth: z.boolean().optional()
});

// Budget schemas
export const createBudgetSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Budget name is required').max(200, 'Name too long'),
  period: z.enum(EBudgetPeriod),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val)),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  categories: z
    .array(
      z.object({
        category: z.enum(ETransactionCategory),
        budgetedAmount: z.number().min(0, 'Budgeted amount must be non-negative')
      })
    )
    .min(1, 'At least one budget category is required')
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(200, 'Name too long').optional(),
  period: z.enum(EBudgetPeriod).optional(),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  isActive: z.boolean().optional(),
  categories: z
    .array(
      z.object({
        category: z.enum(ETransactionCategory),
        budgetedAmount: z.number().min(0, 'Budgeted amount must be non-negative')
      })
    )
    .optional()
});

// Financial goal schemas
export const createFinancialGoalSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  name: z.string().min(1, 'Goal name is required').max(200, 'Name too long'),
  type: z.enum(EFinancialGoalType),
  targetAmount: z.number().min(0.01, 'Target amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  targetDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  monthlyContribution: z.number().min(0, 'Monthly contribution must be non-negative').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  description: z.string().max(1000, 'Description too long').optional(),
  notes: z.string().max(2000, 'Notes too long').optional()
});

export const updateFinancialGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(200, 'Name too long').optional(),
  type: z.enum(EFinancialGoalType).optional(),
  targetAmount: z.number().min(0.01, 'Target amount must be greater than 0').optional(),
  currentAmount: z.number().min(0, 'Current amount must be non-negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  targetDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  monthlyContribution: z.number().min(0, 'Monthly contribution must be non-negative').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  isActive: z.boolean().optional()
});

// Search schemas
export const searchTransactionsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  type: z
    .array(z.enum(ETransactionType))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as ETransactionType)))
    .optional(),
  category: z
    .array(z.enum(ETransactionCategory))
    .or(z.string().transform(val => val.split(',').map(s => s.trim() as ETransactionCategory)))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1)
    .or(z.string().transform(val => parseInt(val, 10))),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .or(z.string().transform(val => parseInt(val, 10)))
});

// Statistics schemas
export const financeStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  startDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional()
});

// Export all schemas
export const financeValidators = {
  // Transaction CRUD
  transactionIdSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  duplicateTransactionSchema,
  bulkUpdateTransactionsSchema,
  bulkDeleteTransactionsSchema,

  // Account management
  accountIdSchema,
  createAccountSchema,
  updateAccountSchema,

  // Budget management
  createBudgetSchema,
  updateBudgetSchema,

  // Financial goals
  createFinancialGoalSchema,
  updateFinancialGoalSchema,

  // Search and analytics
  searchTransactionsSchema,
  financeStatsQuerySchema,
  categoryParamSchema
};
