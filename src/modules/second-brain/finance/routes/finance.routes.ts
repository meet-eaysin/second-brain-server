import { Router } from 'express';
import { authenticateToken } from '../../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../../middlewares/validation';
import * as financeController from '../controllers/finance.controller.impl';

const router = Router();

// Get all transactions with filtering and pagination
router.get(
    '/',
    authenticateToken,
    financeController.getTransactions
);

// Create new transaction
router.post(
    '/',
    authenticateToken,
    financeController.createTransaction
);

// Financial analytics and reporting (MUST be before /:id routes)
router.get(
    '/stats',
    authenticateToken,
    financeController.getFinancialStats
);

router.get(
    '/analytics',
    authenticateToken,
    financeController.getFinancialAnalytics
);

router.get(
    '/summary',
    authenticateToken,
    financeController.getFinancialSummary
);

// Transaction categories (MUST be before /:id routes)
router.get(
    '/categories',
    authenticateToken,
    financeController.getCategories
);

router.post(
    '/categories',
    authenticateToken,
    financeController.createCategory
);

router.patch(
    '/categories/:categoryId',
    authenticateToken,
    financeController.updateCategory
);

router.delete(
    '/categories/:categoryId',
    authenticateToken,
    financeController.deleteCategory
);

// Financial import/export (MUST be before /:id routes)
router.post(
    '/import',
    authenticateToken,
    financeController.importTransactions
);

router.get(
    '/export',
    authenticateToken,
    financeController.exportTransactions
);

// Get transaction by ID
router.get(
    '/:id',
    authenticateToken,
    financeController.getTransaction
);

// Update transaction
router.put(
    '/:id',
    authenticateToken,
    financeController.updateTransaction
);

// Update transaction (PATCH)
router.patch(
    '/:id',
    authenticateToken,
    financeController.updateTransaction
);

// Delete transaction
router.delete(
    '/:id',
    authenticateToken,
    financeController.deleteTransaction
);

// Bulk operations
router.patch(
    '/bulk',
    authenticateToken,
    financeController.bulkUpdateTransactions
);

router.delete(
    '/bulk',
    authenticateToken,
    financeController.bulkDeleteTransactions
);

// Transaction-specific operations
router.patch(
    '/:id/status',
    authenticateToken,
    financeController.updateStatus
);

router.post(
    '/:id/duplicate',
    authenticateToken,
    financeController.duplicateTransaction
);

// Budgets
router.get(
    '/budgets',
    authenticateToken,
    financeController.getBudgets
);

router.post(
    '/budgets',
    authenticateToken,
    financeController.createBudget
);

router.patch(
    '/budgets/:budgetId',
    authenticateToken,
    financeController.updateBudget
);

router.delete(
    '/budgets/:budgetId',
    authenticateToken,
    financeController.deleteBudget
);

router.get(
    '/budgets/:budgetId/progress',
    authenticateToken,
    financeController.getBudgetProgress
);

// Accounts
router.get(
    '/accounts',
    authenticateToken,
    financeController.getAccounts
);

router.post(
    '/accounts',
    authenticateToken,
    financeController.createAccount
);

router.patch(
    '/accounts/:accountId',
    authenticateToken,
    financeController.updateAccount
);

router.delete(
    '/accounts/:accountId',
    authenticateToken,
    financeController.deleteAccount
);

router.get(
    '/accounts/:accountId/balance',
    authenticateToken,
    financeController.getAccountBalance
);

// Financial goals
router.get(
    '/goals',
    authenticateToken,
    financeController.getFinancialGoals
);

router.post(
    '/goals',
    authenticateToken,
    financeController.createFinancialGoal
);

router.patch(
    '/goals/:goalId',
    authenticateToken,
    financeController.updateFinancialGoal
);

router.delete(
    '/goals/:goalId',
    authenticateToken,
    financeController.deleteFinancialGoal
);

// Reports
router.get(
    '/reports/income-expense',
    authenticateToken,
    financeController.getIncomeExpenseReport
);

router.get(
    '/reports/category-breakdown',
    authenticateToken,
    financeController.getCategoryBreakdownReport
);

router.get(
    '/reports/monthly-summary',
    authenticateToken,
    financeController.getMonthlySummaryReport
);

export default router;
