
import { TransactionType } from 'aws-sdk/clients/lakeformation';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';
import { TransactionStatus } from 'aws-sdk/clients/rdsdataservice';
import Transaction from '../models/transaction.model';

export interface CreateTransactionRequest {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    account?: string;
    date: Date;
    payee?: string;
    reference?: string;
    status?: TransactionStatus;
    recurring?: boolean;
    budget?: string;
    tags?: string[];
    notes?: string;
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

export interface TransactionFilters {
    type?: string | string[];
    category?: string | string[];
    account?: string | string[];
    status?: string | string[];
    tags?: string | string[];
    payee?: string;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
    recurring?: boolean;
    search?: string;
}

export interface TransactionOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get transactions with filtering and pagination
export async function getTransactions(userId: string, filters: TransactionFilters = {}, options: TransactionOptions = {}) {
    const {
        type,
        category,
        account,
        status,
        tags,
        payee,
        amountMin,
        amountMax,
        dateFrom,
        dateTo,
        recurring,
        search
    } = filters;

    const {
        page = 1,
        limit = 50,
        sort = '-date',
        populate = []
    } = options;

    // Build filter query
    const filter: any = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (type) {
        filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (category) {
        filter.category = Array.isArray(category) ? { $in: category } : category;
    }

    if (account) {
        filter.account = Array.isArray(account) ? { $in: account } : account;
    }

    if (status) {
        filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (tags) {
        filter.tags = Array.isArray(tags) ? { $in: tags } : { $in: [tags] };
    }

    if (payee) {
        filter.payee = { $regex: payee, $options: 'i' };
    }

    if (amountMin !== undefined || amountMax !== undefined) {
        filter.amount = {};
        if (amountMin !== undefined) filter.amount.$gte = amountMin;
        if (amountMax !== undefined) filter.amount.$lte = amountMax;
    }

    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (typeof recurring === 'boolean') {
        filter.recurring = recurring;
    }

    if (search) {
        filter.$or = [
            { description: { $regex: search, $options: 'i' } },
            { payee: { $regex: search, $options: 'i' } },
            { reference: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        Transaction.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Transaction.countDocuments(filter)
    ]);

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

// Get single transaction by ID
export async function getTransaction(userId: string, transactionId: string) {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw createValidationError('Invalid transaction ID');
    }

    const transaction = await Transaction.findOne({
        _id: transactionId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!transaction) {
        throw createNotFoundError('Transaction not found');
    }

    return transaction;
}

// Create new transaction
export async function createTransaction(userId: string, transactionData: CreateTransactionRequest) {
    const transaction = new Transaction({
        ...transactionData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await transaction.save();
    return transaction.toObject();
}

// Update transaction
export async function updateTransaction(userId: string, transactionId: string, updates: UpdateTransactionRequest) {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw createValidationError('Invalid transaction ID');
    }

    const transaction = await Transaction.findOneAndUpdate(
        {
            _id: transactionId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updates,
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).lean();

    if (!transaction) {
        throw createNotFoundError('Transaction not found');
    }

    return transaction;
}

// Delete transaction
export async function deleteTransaction(userId: string, transactionId: string) {
    if (!Types.ObjectId.isValid(transactionId)) {
        throw createValidationError('Invalid transaction ID');
    }

    const transaction = await Transaction.findOneAndUpdate(
        {
            _id: transactionId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!transaction) {
        throw createNotFoundError('Transaction not found');
    }

    return { message: 'Transaction deleted successfully' };
}

// Get financial statistics
export async function getFinancialStats(userId: string) {
    const stats = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                totalIncome: {
                    $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
                },
                totalExpenses: {
                    $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
                },
                netIncome: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'income'] },
                            '$amount',
                            { $cond: [{ $eq: ['$type', 'expense'] }, { $multiply: ['$amount', -1] }, 0] }
                        ]
                    }
                }
            }
        }
    ]);

    const categoryBreakdown = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: { category: '$category', type: '$type' },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } }
    ]);

    return {
        overview: stats[0] || {
            totalTransactions: 0,
            totalIncome: 0,
            totalExpenses: 0,
            netIncome: 0
        },
        categoryBreakdown
    };
}

// Get financial analytics
export async function getFinancialAnalytics(userId: string) {
    const monthlyTrends = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    type: '$type'
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
        monthlyTrends,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Get financial summary
export async function getFinancialSummary(userId: string) {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const summary = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed',
                date: { $gte: thisMonth }
            }
        },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {
        income: 0,
        expenses: 0,
        balance: 0,
        transactionCount: 0
    };

    summary.forEach(item => {
        if (item._id === 'income') {
            result.income = item.total;
        } else if (item._id === 'expense') {
            result.expenses = item.total;
        }
        result.transactionCount += item.count;
    });

    result.balance = result.income - result.expenses;

    return result;
}

// Update status
export async function updateStatus(userId: string, transactionId: string, status: TransactionStatus) {
    return await updateTransaction(userId, transactionId, { status });
}

// Duplicate transaction
export async function duplicateTransaction(userId: string, transactionId: string) {
    const originalTransaction = await getTransaction(userId, transactionId);
    const { _id, createdAt, updatedAt, ...transactionData } = originalTransaction as any;
    
    return await createTransaction(userId, {
        ...transactionData,
        description: `${transactionData.description} (Copy)`,
        date: new Date(),
        status: 'pending'
    });
}

// Bulk operations
export async function bulkUpdateTransactions(userId: string, updates: { transactionIds: string[], updates: any }) {
    const { transactionIds, updates: updateData } = updates;
    
    const result = await Transaction.updateMany(
        {
            _id: { $in: transactionIds },
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updateData,
            updatedAt: new Date()
        }
    );

    return { modifiedCount: result.modifiedCount };
}

export async function bulkDeleteTransactions(userId: string, transactionIds: string[]) {
    const result = await Transaction.updateMany(
        {
            _id: { $in: transactionIds },
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        }
    );

    return { deletedCount: result.modifiedCount };
}

// Import/Export operations
export async function importTransactions(userId: string, transactionsData: any[]) {
    const transactions = transactionsData.map(transactionData => ({
        ...transactionData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const result = await Transaction.insertMany(transactions);
    return { importedCount: result.length };
}

export async function exportTransactions(userId: string) {
    const transactions = await Transaction.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return transactions;
}

// Category operations (placeholder)
export async function getCategories(userId: string) {
    const categories = await Transaction.distinct('category', {
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    return categories.map(category => ({ name: category, id: category }));
}

export async function createCategory(userId: string, categoryData: any) {
    // TODO: Implement with separate Category model
    throw createAppError('Category management not yet implemented', 501);
}

export async function updateCategory(userId: string, categoryId: string, updates: any) {
    // TODO: Implement with separate Category model
    throw createAppError('Category management not yet implemented', 501);
}

export async function deleteCategory(userId: string, categoryId: string) {
    // TODO: Implement with separate Category model
    throw createAppError('Category management not yet implemented', 501);
}

// Budget operations (placeholder)
export async function getBudgets(userId: string) {
    // TODO: Implement with separate Budget model
    return [];
}

export async function createBudget(userId: string, budgetData: any) {
    // TODO: Implement with separate Budget model
    throw createAppError('Budget functionality not yet implemented', 501);
}

export async function updateBudget(userId: string, budgetId: string, updates: any) {
    // TODO: Implement with separate Budget model
    throw createAppError('Budget functionality not yet implemented', 501);
}

export async function deleteBudget(userId: string, budgetId: string) {
    // TODO: Implement with separate Budget model
    throw createAppError('Budget functionality not yet implemented', 501);
}

export async function getBudgetProgress(userId: string, budgetId: string) {
    // TODO: Implement with separate Budget model
    throw createAppError('Budget functionality not yet implemented', 501);
}

// Account operations (placeholder)
export async function getAccounts(userId: string) {
    const accounts = await Transaction.distinct('account', {
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    return accounts.map(account => ({ name: account, id: account, balance: 0 }));
}

export async function createAccount(userId: string, accountData: any) {
    // TODO: Implement with separate Account model
    throw createAppError('Account management not yet implemented', 501);
}

export async function updateAccount(userId: string, accountId: string, updates: any) {
    // TODO: Implement with separate Account model
    throw createAppError('Account management not yet implemented', 501);
}

export async function deleteAccount(userId: string, accountId: string) {
    // TODO: Implement with separate Account model
    throw createAppError('Account management not yet implemented', 501);
}

export async function getAccountBalance(userId: string, accountId: string) {
    const balance = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                account: accountId,
                status: 'completed',
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'income'] },
                            '$amount',
                            { $multiply: ['$amount', -1] }
                        ]
                    }
                }
            }
        }
    ]);

    return { balance: balance[0]?.balance || 0 };
}

// Financial goals (placeholder)
export async function getFinancialGoals(userId: string) {
    // TODO: Implement with separate FinancialGoal model
    return [];
}

export async function createFinancialGoal(userId: string, goalData: any) {
    // TODO: Implement with separate FinancialGoal model
    throw createAppError('Financial goals not yet implemented', 501);
}

export async function updateFinancialGoal(userId: string, goalId: string, updates: any) {
    // TODO: Implement with separate FinancialGoal model
    throw createAppError('Financial goals not yet implemented', 501);
}

export async function deleteFinancialGoal(userId: string, goalId: string) {
    // TODO: Implement with separate FinancialGoal model
    throw createAppError('Financial goals not yet implemented', 501);
}

// Reports
export async function getIncomeExpenseReport(userId: string) {
    const report = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    type: '$type'
                },
                total: { $sum: '$amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return report;
}

export async function getCategoryBreakdownReport(userId: string) {
    const report = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { total: -1 } }
    ]);

    return report;
}

export async function getMonthlySummaryReport(userId: string) {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(thisMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const report = await Transaction.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                status: 'completed',
                date: { $gte: thisMonth, $lt: nextMonth }
            }
        },
        {
            $group: {
                _id: '$category',
                income: {
                    $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
                },
                expenses: {
                    $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
                },
                transactionCount: { $sum: 1 }
            }
        },
        { $sort: { expenses: -1 } }
    ]);

    return report;
}
