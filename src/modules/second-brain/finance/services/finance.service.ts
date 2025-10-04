import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import {
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
} from '../types/finance.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

/**
 * Create a new transaction
 */
export const createTransaction = async (
  data: ICreateTransactionRequest,
  userId: string
): Promise<ITransaction> => {
  try {
    // Verify the database exists and is a finance database
    const database = await DatabaseModel.findOne({
      _id: data.databaseId,
      isDeleted: { $ne: true }
    }).exec();

    if (!database) {
      throw createNotFoundError('Database', data.databaseId);
    }

    if (database.type !== EDatabaseType.FINANCE) {
      throw createValidationError('Database must be of type FINANCE');
    }

    // Check permission to create transactions in this database
    const hasPermission = await permissionService.hasPermission(
      EShareScope.DATABASE,
      data.databaseId,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError(
        'Insufficient permissions to create transactions in this database'
      );
    }

    // Create transaction record
    const transactionRecord = new RecordModel({
      _id: generateId(),
      databaseId: data.databaseId,
      properties: {
        Type: data.type,
        Category: data.category,
        Amount: data.amount,
        Currency: data.currency,
        Description: data.description,
        Date: data.date,
        'From Account': data.fromAccountId,
        'To Account': data.toAccountId,
        Merchant: data.merchant || '',
        Location: data.location || '',
        Notes: data.notes || '',
        Tags: data.tags || [],
        'Is Recurring': data.isRecurring || false,
        'Recurrence Pattern': data.recurrencePattern || '',
        'Is Verified': false,
        'Receipt URL': '',
        Attachments: [],
        'Budget ID': data.budgetId,
        'Goal ID': data.goalId,
        'Project ID': data.projectId
      },
      content: [],
      createdBy: userId,
      updatedBy: userId,
      order: await getNextOrder(data.databaseId)
    });

    const savedRecord = await transactionRecord.save();

    // Update account balances if specified
    if (data.fromAccountId || data.toAccountId) {
      await updateAccountBalances(data, userId);
    }

    // Update budget spending if specified
    if (data.budgetId && data.type === ETransactionType.EXPENSE) {
      await updateBudgetSpending(data.budgetId, data.category, data.amount, userId);
    }

    // Update goal progress if specified
    if (
      data.goalId &&
      (data.type === ETransactionType.INCOME || data.type === ETransactionType.INVESTMENT)
    ) {
      await updateGoalProgress(data.goalId, data.amount, userId);
    }

    // Update database record count and activity
    await DatabaseModel.findByIdAndUpdate(data.databaseId, {
      $inc: { recordCount: 1 },
      lastActivityAt: new Date()
    });

    return formatTransactionResponse(savedRecord);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to create transaction: ${error.message}`, 500);
  }
};

/**
 * Get transactions with pagination and filtering
 */
export const getTransactions = async (
  params: ITransactionQueryParams,
  userId: string
): Promise<{
  transactions: ITransaction[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  try {
    const query = buildTransactionQuery(params, userId);
    const { page = 1, limit = 25, sortBy = 'date', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

    const [transactions, total] = await Promise.all([
      RecordModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      RecordModel.countDocuments(query)
    ]);

    const formattedTransactions = transactions.map(transaction =>
      formatTransactionResponse(transaction)
    );

    const hasNext = skip + limit < total;
    const hasPrev = page > 1;

    return {
      transactions: formattedTransactions,
      total,
      page,
      limit,
      hasNext,
      hasPrev
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get transactions: ${error.message}`, 500);
  }
};

/**
 * Get a transaction by ID
 */
export const getTransactionById = async (id: string, userId: string): Promise<ITransaction> => {
  try {
    const transaction = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!transaction) {
      throw createNotFoundError('Transaction', id);
    }

    // Check permission to read this transaction
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.READ
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to view this transaction');
    }

    return formatTransactionResponse(transaction);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to get transaction: ${error.message}`, 500);
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (
  id: string,
  data: IUpdateTransactionRequest,
  userId: string
): Promise<ITransaction> => {
  try {
    const transaction = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!transaction) {
      throw createNotFoundError('Transaction', id);
    }

    // Check permission to edit this transaction
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.EDIT
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to edit this transaction');
    }

    // Build update object
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date()
    };

    if (data.type !== undefined) {
      updateData['properties.Type'] = data.type;
    }
    if (data.category !== undefined) {
      updateData['properties.Category'] = data.category;
    }
    if (data.amount !== undefined) {
      updateData['properties.Amount'] = data.amount;
    }
    if (data.currency !== undefined) {
      updateData['properties.Currency'] = data.currency;
    }
    if (data.description !== undefined) {
      updateData['properties.Description'] = data.description;
    }
    if (data.date !== undefined) {
      updateData['properties.Date'] = data.date;
    }
    if (data.fromAccountId !== undefined) {
      updateData['properties.From Account'] = data.fromAccountId;
    }
    if (data.toAccountId !== undefined) {
      updateData['properties.To Account'] = data.toAccountId;
    }
    if (data.merchant !== undefined) {
      updateData['properties.Merchant'] = data.merchant;
    }
    if (data.location !== undefined) {
      updateData['properties.Location'] = data.location;
    }
    if (data.notes !== undefined) {
      updateData['properties.Notes'] = data.notes;
    }
    if (data.tags !== undefined) {
      updateData['properties.Tags'] = data.tags;
    }
    if (data.isRecurring !== undefined) {
      updateData['properties.Is Recurring'] = data.isRecurring;
    }
    if (data.recurrencePattern !== undefined) {
      updateData['properties.Recurrence Pattern'] = data.recurrencePattern;
    }
    if (data.isVerified !== undefined) {
      updateData['properties.Is Verified'] = data.isVerified;
      if (data.isVerified) {
        updateData['properties.Verified At'] = new Date();
      }
    }
    if (data.budgetId !== undefined) {
      updateData['properties.Budget ID'] = data.budgetId;
    }
    if (data.goalId !== undefined) {
      updateData['properties.Goal ID'] = data.goalId;
    }
    if (data.projectId !== undefined) {
      updateData['properties.Project ID'] = data.projectId;
    }

    const updatedTransaction = await RecordModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).exec();

    if (!updatedTransaction) {
      throw createNotFoundError('Transaction', id);
    }

    // Update database activity
    await DatabaseModel.findByIdAndUpdate(updatedTransaction.databaseId, {
      lastActivityAt: new Date()
    });

    return formatTransactionResponse(updatedTransaction);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to update transaction: ${error.message}`, 500);
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  id: string,
  userId: string,
  permanent: boolean = false
): Promise<void> => {
  try {
    const transaction = await RecordModel.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).exec();

    if (!transaction) {
      throw createNotFoundError('Transaction', id);
    }

    // Check permission to delete this transaction
    const hasPermission = await permissionService.hasPermission(
      EShareScope.RECORD,
      id,
      userId,
      EPermissionLevel.FULL_ACCESS
    );

    if (!hasPermission) {
      throw createForbiddenError('Insufficient permissions to delete this transaction');
    }

    if (permanent) {
      await RecordModel.findByIdAndDelete(id);
    } else {
      await RecordModel.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      });
    }

    // Update database record count
    await DatabaseModel.findByIdAndUpdate(transaction.databaseId, {
      $inc: { recordCount: -1 },
      lastActivityAt: new Date()
    });
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError(`Failed to delete transaction: ${error.message}`, 500);
  }
};

/**
 * Build transaction query from parameters
 */
const buildTransactionQuery = (params: ITransactionQueryParams, userId: string): any => {
  const query: any = {
    isDeleted: { $ne: true }
  };

  if (params.databaseId) {
    query.databaseId = params.databaseId;
  }

  if (params.type && params.type.length > 0) {
    query['properties.Type'] = { $in: params.type };
  }

  if (params.category && params.category.length > 0) {
    query['properties.Category'] = { $in: params.category };
  }

  if (params.accountId) {
    query.$or = [
      { 'properties.From Account': params.accountId },
      { 'properties.To Account': params.accountId }
    ];
  }

  if (params.budgetId) {
    query['properties.Budget ID'] = params.budgetId;
  }

  if (params.goalId) {
    query['properties.Goal ID'] = params.goalId;
  }

  if (params.projectId) {
    query['properties.Project ID'] = params.projectId;
  }

  if (params.minAmount !== undefined || params.maxAmount !== undefined) {
    const amountQuery: any = {};
    if (params.minAmount !== undefined) {
      amountQuery.$gte = params.minAmount;
    }
    if (params.maxAmount !== undefined) {
      amountQuery.$lte = params.maxAmount;
    }
    query['properties.Amount'] = amountQuery;
  }

  if (params.startDate || params.endDate) {
    const dateQuery: any = {};
    if (params.startDate) {
      dateQuery.$gte = params.startDate;
    }
    if (params.endDate) {
      dateQuery.$lte = params.endDate;
    }
    query['properties.Date'] = dateQuery;
  }

  if (params.isRecurring !== undefined) {
    query['properties.Is Recurring'] = params.isRecurring;
  }

  if (params.isVerified !== undefined) {
    query['properties.Is Verified'] = params.isVerified;
  }

  if (params.search) {
    query.$or = [
      { 'properties.Description': { $regex: params.search, $options: 'i' } },
      { 'properties.Merchant': { $regex: params.search, $options: 'i' } },
      { 'properties.Notes': { $regex: params.search, $options: 'i' } }
    ];
  }

  if (params.tags && params.tags.length > 0) {
    query['properties.Tags'] = { $in: params.tags };
  }

  return query;
};

/**
 * Map sort field to database field
 */
const mapSortField = (sortBy: string): string => {
  const fieldMap: Record<string, string> = {
    date: 'properties.Date',
    amount: 'properties.Amount',
    description: 'properties.Description',
    category: 'properties.Category'
  };
  return fieldMap[sortBy] || 'properties.Date';
};

/**
 * Format transaction response from database record
 */
const formatTransactionResponse = (record: any): ITransaction => {
  return {
    id: record._id.toString(),
    databaseId: record.databaseId,
    type: record.properties.Type || ETransactionType.EXPENSE,
    category: record.properties.Category || ETransactionCategory.OTHER_EXPENSE,
    amount: record.properties.Amount || 0,
    currency: record.properties.Currency || 'USD',
    description: record.properties.Description || '',
    date: record.properties.Date || record.createdAt,
    fromAccountId: record.properties['From Account'],
    toAccountId: record.properties['To Account'],
    accountName: record.properties['Account Name'],
    merchant: record.properties.Merchant,
    location: record.properties.Location,
    notes: record.properties.Notes,
    tags: record.properties.Tags || [],
    isRecurring: record.properties['Is Recurring'] || false,
    recurrencePattern: record.properties['Recurrence Pattern'],
    nextDueDate: record.properties['Next Due Date'],
    isVerified: record.properties['Is Verified'] || false,
    verifiedAt: record.properties['Verified At'],
    receiptUrl: record.properties['Receipt URL'],
    attachments: record.properties.Attachments || [],
    budgetId: record.properties['Budget ID'],
    goalId: record.properties['Goal ID'],
    projectId: record.properties['Project ID'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy
  };
};

/**
 * Get next order number for database records
 */
const getNextOrder = async (databaseId: string): Promise<number> => {
  const lastRecord = await RecordModel.findOne(
    { databaseId, isDeleted: { $ne: true } },
    { order: 1 }
  )
    .sort({ order: -1 })
    .exec();

  return (lastRecord?.order || 0) + 1;
};

/**
 * Update account balances after transaction creation
 */
const updateAccountBalances = async (
  data: ICreateTransactionRequest,
  userId: string
): Promise<void> => {
  // Implementation for updating account balances
  // This would involve finding the account records and updating their balances
  // For now, this is a placeholder
};

/**
 * Update budget spending after transaction creation
 */
const updateBudgetSpending = async (
  budgetId: string,
  category: ETransactionCategory,
  amount: number,
  userId: string
): Promise<void> => {
  // Implementation for updating budget spending
  // This would involve finding the budget record and updating the category spending
  // For now, this is a placeholder
};

/**
 * Update goal progress after transaction creation
 */
const updateGoalProgress = async (
  goalId: string,
  amount: number,
  userId: string
): Promise<void> => {
  // Implementation for updating goal progress
  // This would involve finding the goal record and updating the current amount
  // For now, this is a placeholder
};
