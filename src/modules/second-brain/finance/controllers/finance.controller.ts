import { Request, Response } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from '../services/finance.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateTransactionRequest,
  IUpdateTransactionRequest,
  ITransactionQueryParams,
  ETransactionType,
  ETransactionCategory
} from '../types/finance.types';

// ===== TRANSACTION CONTROLLERS =====

export const createTransactionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const data: ICreateTransactionRequest = req.body;
    const userId = getUserId(req);

    const transaction = await createTransaction(data, userId);

    sendSuccessResponse(res, 'Transaction created successfully', transaction, 201);
  }
);

export const getTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const params: ITransactionQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(res, 'Transactions retrieved successfully', result.transactions, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getTransactionByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const transaction = await getTransactionById(id, userId);

    sendSuccessResponse(res, 'Transaction retrieved successfully', transaction);
  }
);

export const updateTransactionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateTransactionRequest = req.body;
    const userId = getUserId(req);

    const transaction = await updateTransaction(id, data, userId);

    sendSuccessResponse(res, 'Transaction updated successfully', transaction);
  }
);

export const deleteTransactionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await deleteTransaction(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Transaction deleted successfully', null, 204);
  }
);

// ===== TRANSACTION ANALYTICS =====

export const getIncomeTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      type: [ETransactionType.INCOME]
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(res, 'Income transactions retrieved successfully', result.transactions, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getExpenseTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      type: [ETransactionType.EXPENSE]
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(res, 'Expense transactions retrieved successfully', result.transactions, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getTransactionsByCategoryController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      category: [category as ETransactionCategory]
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(
      res,
      `Transactions in category "${category}" retrieved successfully`,
      result.transactions,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getTransactionsByAccountController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { accountId } = req.params;
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      accountId
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(res, 'Account transactions retrieved successfully', result.transactions, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getRecurringTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      isRecurring: true
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(
      res,
      'Recurring transactions retrieved successfully',
      result.transactions,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getUnverifiedTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const params: ITransactionQueryParams = {
      ...(req.query as any),
      isVerified: false
    };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(
      res,
      'Unverified transactions retrieved successfully',
      result.transactions,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const searchTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { q: search } = req.query;
    const params: ITransactionQueryParams = { ...(req.query as any), search: search as string };
    const userId = getUserId(req);

    const result = await getTransactions(params, userId);

    sendPaginatedResponse(res, 'Transaction search completed successfully', result.transactions, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const verifyTransactionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const transaction = await updateTransaction(id, { isVerified: true }, userId);

    sendSuccessResponse(res, 'Transaction verified successfully', transaction);
  }
);

export const duplicateTransactionController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { date, amount, description } = req.body;
    const userId = getUserId(req);

    // Get the original transaction
    const originalTransaction = await getTransactionById(id, userId);

    // Create duplicate with new values
    const duplicateData: ICreateTransactionRequest = {
      databaseId: originalTransaction.databaseId,
      type: originalTransaction.type,
      category: originalTransaction.category,
      amount: amount || originalTransaction.amount,
      currency: originalTransaction.currency,
      description: description || `${originalTransaction.description} (Copy)`,
      date: date ? new Date(date) : new Date(),
      fromAccountId: originalTransaction.fromAccountId,
      toAccountId: originalTransaction.toAccountId,
      merchant: originalTransaction.merchant,
      location: originalTransaction.location,
      notes: originalTransaction.notes,
      tags: [...originalTransaction.tags],
      isRecurring: false, // Don't duplicate recurring settings
      budgetId: originalTransaction.budgetId,
      goalId: originalTransaction.goalId,
      projectId: originalTransaction.projectId
    };

    const duplicatedTransaction = await createTransaction(duplicateData, userId);

    sendSuccessResponse(res, 'Transaction duplicated successfully', duplicatedTransaction, 201);
  }
);

export const bulkUpdateTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { transactionIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      transactionIds.map((transactionId: string) =>
        updateTransaction(transactionId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: transactionIds.length,
      results: results.map((result, index) => ({
        transactionId: transactionIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteTransactionsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { transactionIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      transactionIds.map((transactionId: string) =>
        deleteTransaction(transactionId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: transactionIds.length
    });
  }
);

// ===== STATISTICS =====

export const getFinanceStatsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { databaseId, period } = req.query;
    const userId = getUserId(req);

    // This would be implemented in the service
    // For now, return a placeholder response
    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      accountsCount: 0,
      transactionsCount: 0,
      averageTransactionAmount: 0,
      topExpenseCategories: [],
      topIncomeCategories: [],
      monthlyTrend: [],
      activeGoalsCount: 0,
      completedGoalsCount: 0,
      totalGoalProgress: 0,
      activeBudgetsCount: 0,
      budgetUtilization: 0
    };

    sendSuccessResponse(res, 'Finance statistics retrieved successfully', stats);
  }
);
