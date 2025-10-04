// Finance Module - Personal finance management and tracking
// This module provides comprehensive financial management with transactions, budgets, and goals

// Routes - Finance-specific operations
export { default as financeRoutes } from './routes/finance.routes';

// Controllers - Finance business logic
export {
  // Transaction CRUD operations
  createTransactionController as createTransaction,
  getTransactionsController as getTransactions,
  getTransactionByIdController as getTransactionById,
  updateTransactionController as updateTransaction,
  deleteTransactionController as deleteTransaction,

  // Transaction analytics
  getIncomeTransactionsController as getIncomeTransactions,
  getExpenseTransactionsController as getExpenseTransactions,
  getTransactionsByCategoryController as getTransactionsByCategory,
  getTransactionsByAccountController as getTransactionsByAccount,
  getRecurringTransactionsController as getRecurringTransactions,
  getUnverifiedTransactionsController as getUnverifiedTransactions,
  searchTransactionsController as searchTransactions,
  verifyTransactionController as verifyTransaction,
  duplicateTransactionController as duplicateTransaction,
  bulkUpdateTransactionsController as bulkUpdateTransactions,
  bulkDeleteTransactionsController as bulkDeleteTransactions,

  // Statistics
  getFinanceStatsController as getFinanceStats
} from './controllers/finance.controller';

// Services - Finance-specific services
export {
  createTransaction as createTransactionService,
  getTransactions as getTransactionsService,
  getTransactionById as getTransactionByIdService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService
} from './services/finance.service';

// Types
export type * from './types/finance.types';

// Types - Specific exports for better IDE support
export type {
  ITransaction,
  IAccount,
  IBudget,
  IFinancialGoal,
  IFinanceStats,
  ICreateTransactionRequest,
  IUpdateTransactionRequest,
  ITransactionQueryParams,
  ICreateAccountRequest,
  IUpdateAccountRequest,
  ICreateBudgetRequest,
  IUpdateBudgetRequest,
  ICreateFinancialGoalRequest,
  IUpdateFinancialGoalRequest,
  ETransactionType,
  ETransactionCategory,
  EAccountType,
  EBudgetPeriod,
  EFinancialGoalType
} from './types/finance.types';

// Validators
export {
  financeValidators,
  transactionIdSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  duplicateTransactionSchema,
  bulkUpdateTransactionsSchema,
  bulkDeleteTransactionsSchema,
  createAccountSchema,
  updateAccountSchema,
  createBudgetSchema,
  updateBudgetSchema,
  createFinancialGoalSchema,
  updateFinancialGoalSchema,
  searchTransactionsSchema,
  financeStatsQuerySchema,
  categoryParamSchema,
  accountIdSchema
} from './validators/finance.validators';
