import { Request, Response } from 'express';
import { TJwtPayload } from '../../../users/types/user.types';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as financeService from '../services/finance.service';

interface AuthenticatedRequest extends Request {
  user?: TJwtPayload & { userId: string };
}

// Transactions
export const getTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { type, category, account, status, tags, payee, amountMin, amountMax, dateFrom, dateTo, recurring, search, page = 1, limit = 50, sort = '-date', populate } = req.query as any;
  const filters: financeService.TransactionFilters = {
    type: type as any,
    category: category as any,
    account: account as any,
    status: status as any,
    tags: tags as any,
    payee: payee as any,
    amountMin: amountMin ? Number(amountMin) : undefined,
    amountMax: amountMax ? Number(amountMax) : undefined,
    dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
    dateTo: dateTo ? new Date(String(dateTo)) : undefined,
    recurring: typeof recurring === 'string' ? recurring === 'true' : undefined,
    search: search as any
  };
  const options: financeService.TransactionOptions = {
    page: Number(page),
    limit: Number(limit),
    sort: String(sort),
    populate: Array.isArray(populate) ? (populate as string[]) : (populate ? [String(populate)] : [])
  };
  const result = await financeService.getTransactions(userId, filters, options);
  sendSuccessResponse(res, 'Transactions retrieved successfully', result);
});

export const getTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { id } = req.params; const data = await financeService.getTransaction(userId, id);
  sendSuccessResponse(res, 'Transaction retrieved successfully', data);
});

export const createTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const created = await financeService.createTransaction(userId, req.body);
  sendSuccessResponse(res, 'Transaction created successfully', created, 201);
});

export const updateTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { id } = req.params; const updated = await financeService.updateTransaction(userId, id, req.body);
  sendSuccessResponse(res, 'Transaction updated successfully', updated);
});

export const deleteTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { id } = req.params; await financeService.deleteTransaction(userId, id);
  sendSuccessResponse(res, 'Transaction deleted successfully', null, 204);
});

// Bulk operations
export const bulkUpdateTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.bulkUpdateTransactions(userId, req.body);
  sendSuccessResponse(res, 'Transactions updated successfully', result);
});

export const bulkDeleteTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { transactionIds } = req.body as { transactionIds: string[] };
  const result = await financeService.bulkDeleteTransactions(userId, transactionIds);
  sendSuccessResponse(res, 'Transactions deleted successfully', result);
});

// Status & duplicate
export const updateStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { id } = req.params; const { status } = req.body as { status: any };
  const updated = await financeService.updateStatus(userId, id, status);
  sendSuccessResponse(res, 'Transaction status updated successfully', updated);
});

export const duplicateTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { id } = req.params; const duplicated = await financeService.duplicateTransaction(userId, id);
  sendSuccessResponse(res, 'Transaction duplicated successfully', duplicated, 201);
});

// Categories
export const getCategories = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const categories = await financeService.getCategories(userId);
  sendSuccessResponse(res, 'Categories retrieved successfully', categories);
});

export const createCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const created = await financeService.createCategory(userId, req.body);
  sendSuccessResponse(res, 'Category created successfully', created, 201);
});

export const updateCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { categoryId } = req.params; const updated = await financeService.updateCategory(userId, categoryId, req.body);
  sendSuccessResponse(res, 'Category updated successfully', updated);
});

export const deleteCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { categoryId } = req.params; const result = await financeService.deleteCategory(userId, categoryId);
  sendSuccessResponse(res, 'Category deleted successfully', result);
});

// Import/Export
export const importTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.importTransactions(userId, req.body?.transactions || []);
  sendSuccessResponse(res, 'Transactions imported successfully', result);
});

export const exportTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.exportTransactions(userId);
  sendSuccessResponse(res, 'Transactions exported successfully', result);
});

// Stats/Analytics/Summary
export const getFinancialStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getFinancialStats(userId);
  sendSuccessResponse(res, 'Financial stats retrieved successfully', result);
});

export const getFinancialAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getFinancialAnalytics(userId);
  sendSuccessResponse(res, 'Financial analytics retrieved successfully', result);
});

export const getFinancialSummary = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getFinancialSummary(userId);
  sendSuccessResponse(res, 'Financial summary retrieved successfully', result);
});

// Accounts
export const getAccounts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getAccounts(userId);
  sendSuccessResponse(res, 'Accounts retrieved successfully', result);
});

export const createAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.createAccount(userId, req.body);
  sendSuccessResponse(res, 'Account created successfully', result, 201);
});

export const updateAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { accountId } = req.params; const result = await financeService.updateAccount(userId, accountId, req.body);
  sendSuccessResponse(res, 'Account updated successfully', result);
});

export const deleteAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { accountId } = req.params; const result = await financeService.deleteAccount(userId, accountId);
  sendSuccessResponse(res, 'Account deleted successfully', result);
});

export const getAccountBalance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { accountId } = req.params; const result = await financeService.getAccountBalance(userId, accountId);
  sendSuccessResponse(res, 'Account balance retrieved successfully', result);
});

// Budgets
export const getBudgets = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getBudgets(userId);
  sendSuccessResponse(res, 'Budgets retrieved successfully', result);
});

export const createBudget = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.createBudget(userId, req.body);
  sendSuccessResponse(res, 'Budget created successfully', result, 201);
});

export const updateBudget = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { budgetId } = req.params; const result = await financeService.updateBudget(userId, budgetId, req.body);
  sendSuccessResponse(res, 'Budget updated successfully', result);
});

export const deleteBudget = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { budgetId } = req.params; const result = await financeService.deleteBudget(userId, budgetId);
  sendSuccessResponse(res, 'Budget deleted successfully', result);
});

export const getBudgetProgress = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { budgetId } = req.params; const result = await financeService.getBudgetProgress(userId, budgetId);
  sendSuccessResponse(res, 'Budget progress retrieved successfully', result);
});

// Financial Goals
export const getFinancialGoals = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getFinancialGoals(userId);
  sendSuccessResponse(res, 'Financial goals retrieved successfully', result);
});

export const createFinancialGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.createFinancialGoal(userId, req.body);
  sendSuccessResponse(res, 'Financial goal created successfully', result, 201);
});

export const updateFinancialGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { goalId } = req.params; const result = await financeService.updateFinancialGoal(userId, goalId, req.body);
  sendSuccessResponse(res, 'Financial goal updated successfully', result);
});

export const deleteFinancialGoal = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const { goalId } = req.params; const result = await financeService.deleteFinancialGoal(userId, goalId);
  sendSuccessResponse(res, 'Financial goal deleted successfully', result);
});

// Reports
export const getIncomeExpenseReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getIncomeExpenseReport(userId);
  sendSuccessResponse(res, 'Income/Expense report retrieved successfully', result);
});

export const getCategoryBreakdownReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getCategoryBreakdownReport(userId);
  sendSuccessResponse(res, 'Category breakdown report retrieved successfully', result);
});

export const getMonthlySummaryReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId; if (!userId) return sendErrorResponse(res, 'User not authenticated', 401);
  const result = await financeService.getMonthlySummaryReport(userId);
  sendSuccessResponse(res, 'Monthly summary report retrieved successfully', result);
});

