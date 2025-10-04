import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Finance controllers
import {
  // Transaction CRUD
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
} from '../controllers/finance.controller';

// Validators
import {
  transactionIdSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  duplicateTransactionSchema,
  bulkUpdateTransactionsSchema,
  bulkDeleteTransactionsSchema,
  searchTransactionsSchema,
  financeStatsQuerySchema,
  categoryParamSchema,
  accountIdSchema
} from '../validators/finance.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== TRANSACTION CRUD OPERATIONS =====

router.post('/transactions', validateBody(createTransactionSchema), createTransaction);

router.get('/transactions', validateQuery(getTransactionsQuerySchema), getTransactions);

router.get('/transactions/stats', validateQuery(financeStatsQuerySchema), getFinanceStats);

router.get(
  '/transactions/income',
  validateQuery(getTransactionsQuerySchema),
  getIncomeTransactions
);

router.get(
  '/transactions/expenses',
  validateQuery(getTransactionsQuerySchema),
  getExpenseTransactions
);

router.get(
  '/transactions/recurring',
  validateQuery(getTransactionsQuerySchema),
  getRecurringTransactions
);

router.get(
  '/transactions/unverified',
  validateQuery(getTransactionsQuerySchema),
  getUnverifiedTransactions
);

router.get('/transactions/search', validateQuery(searchTransactionsSchema), searchTransactions);

router.get(
  '/transactions/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getTransactionsQuerySchema),
  getTransactionsByCategory
);

router.get(
  '/transactions/account/:accountId',
  validateParams(accountIdSchema),
  validateQuery(getTransactionsQuerySchema),
  getTransactionsByAccount
);

router.get('/transactions/:id', validateParams(transactionIdSchema), getTransactionById);

router.put(
  '/transactions/:id',
  validateParams(transactionIdSchema),
  validateBody(updateTransactionSchema),
  updateTransaction
);

router.delete('/transactions/:id', validateParams(transactionIdSchema), deleteTransaction);

// ===== TRANSACTION ACTIONS =====

router.post('/transactions/:id/verify', validateParams(transactionIdSchema), verifyTransaction);

router.post(
  '/transactions/:id/duplicate',
  validateParams(transactionIdSchema),
  validateBody(duplicateTransactionSchema),
  duplicateTransaction
);

// ===== BULK OPERATIONS =====

router.post(
  '/transactions/bulk/update',
  validateBody(bulkUpdateTransactionsSchema),
  bulkUpdateTransactions
);

router.post(
  '/transactions/bulk/delete',
  validateBody(bulkDeleteTransactionsSchema),
  bulkDeleteTransactions
);

export default router;
