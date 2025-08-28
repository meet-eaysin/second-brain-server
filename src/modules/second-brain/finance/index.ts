// Finance Module - Personal finance management and tracking
// This module provides comprehensive financial management with transactions, budgets, and goals

// Routes - Finance-specific operations
export { default as financeRoutes } from './routes/finance.routes';

// Controllers - Finance business logic
export {
  // Transaction CRUD operations
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  
  // Transaction analytics
  getIncomeTransactions,
  getExpenseTransactions,
  getTransactionsByCategory,
  getTransactionsByAccount,
  getRecurringTransactions,
  getUnverifiedTransactions,
  searchTransactions,
  verifyTransaction,
  duplicateTransaction,
  bulkUpdateTransactions,
  bulkDeleteTransactions,
  
  // Statistics
  getFinanceStats
} from './controllers/finance.controller';

// Services - Finance-specific services
export {
  FinanceService,
  financeService
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
