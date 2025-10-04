// Transaction type enum
export enum ETransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  INVESTMENT = 'investment',
  REFUND = 'refund'
}

// Transaction category enum
export enum ETransactionCategory {
  // Income categories
  SALARY = 'salary',
  FREELANCE = 'freelance',
  BUSINESS = 'business',
  INVESTMENT_INCOME = 'investment_income',
  RENTAL = 'rental',
  OTHER_INCOME = 'other_income',

  // Expense categories
  FOOD = 'food',
  TRANSPORTATION = 'transportation',
  HOUSING = 'housing',
  UTILITIES = 'utilities',
  HEALTHCARE = 'healthcare',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  EDUCATION = 'education',
  TRAVEL = 'travel',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  DEBT_PAYMENT = 'debt_payment',
  SAVINGS = 'savings',
  CHARITY = 'charity',
  OTHER_EXPENSE = 'other_expense'
}

// Account type enum
export enum EAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CASH = 'cash',
  LOAN = 'loan',
  OTHER = 'other'
}

// Budget period enum
export enum EBudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Financial goal type enum
export enum EFinancialGoalType {
  SAVINGS = 'savings',
  DEBT_PAYOFF = 'debt_payoff',
  INVESTMENT = 'investment',
  EMERGENCY_FUND = 'emergency_fund',
  RETIREMENT = 'retirement',
  MAJOR_PURCHASE = 'major_purchase',
  OTHER = 'other'
}

// Transaction interface
export interface ITransaction {
  id: string;
  databaseId: string;
  type: ETransactionType;
  category: ETransactionCategory;
  amount: number;
  currency: string;
  description: string;
  date: Date;

  // Account information
  fromAccountId?: string;
  toAccountId?: string;
  accountName?: string;

  // Additional details
  merchant?: string;
  location?: string;
  notes?: string;
  tags: string[];

  // Recurring transaction
  isRecurring: boolean;
  recurrencePattern?: string;
  nextDueDate?: Date;

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;

  // Attachments
  receiptUrl?: string;
  attachments: string[];

  // Relations
  budgetId?: string;
  goalId?: string;
  projectId?: string;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Account interface
export interface IAccount {
  id: string;
  databaseId: string;
  name: string;
  type: EAccountType;
  balance: number;
  currency: string;

  // Account details
  accountNumber?: string;
  bankName?: string;
  description?: string;

  // Settings
  isActive: boolean;
  includeInNetWorth: boolean;

  // Tracking
  lastSyncedAt?: Date;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Budget interface
export interface IBudget {
  id: string;
  databaseId: string;
  name: string;
  period: EBudgetPeriod;
  startDate: Date;
  endDate: Date;

  // Budget categories
  categories: IBudgetCategory[];

  // Totals
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;

  // Settings
  isActive: boolean;
  currency: string;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Budget category interface
export interface IBudgetCategory {
  id: string;
  category: ETransactionCategory;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

// Financial goal interface
export interface IFinancialGoal {
  id: string;
  databaseId: string;
  name: string;
  type: EFinancialGoalType;
  targetAmount: number;
  currentAmount: number;
  currency: string;

  // Timeline
  targetDate?: Date;
  startDate: Date;

  // Progress
  progressPercentage: number;
  monthlyContribution?: number;

  // Settings
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';

  // Description
  description?: string;
  notes?: string;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Financial statistics interface
export interface IFinanceStats {
  // Overview
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  netWorth: number;

  // Accounts
  totalAssets: number;
  totalLiabilities: number;
  accountsCount: number;

  // Transactions
  transactionsCount: number;
  averageTransactionAmount: number;

  // Categories
  topExpenseCategories: Array<{
    category: ETransactionCategory;
    amount: number;
    percentage: number;
  }>;

  topIncomeCategories: Array<{
    category: ETransactionCategory;
    amount: number;
    percentage: number;
  }>;

  // Trends
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    netIncome: number;
  }>;

  // Goals
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalGoalProgress: number;

  // Budgets
  activeBudgetsCount: number;
  budgetUtilization: number;
}

// Request/Response interfaces
export interface ICreateTransactionRequest {
  databaseId: string;
  type: ETransactionType;
  category: ETransactionCategory;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  fromAccountId?: string;
  toAccountId?: string;
  merchant?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  budgetId?: string;
  goalId?: string;
  projectId?: string;
}

export interface IUpdateTransactionRequest {
  type?: ETransactionType;
  category?: ETransactionCategory;
  amount?: number;
  currency?: string;
  description?: string;
  date?: Date;
  fromAccountId?: string;
  toAccountId?: string;
  merchant?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  isVerified?: boolean;
  budgetId?: string;
  goalId?: string;
  projectId?: string;
}

export interface ITransactionQueryParams {
  databaseId?: string;
  type?: ETransactionType[];
  category?: ETransactionCategory[];
  accountId?: string;
  budgetId?: string;
  goalId?: string;
  projectId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
  isVerified?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ICreateAccountRequest {
  databaseId: string;
  name: string;
  type: EAccountType;
  balance: number;
  currency: string;
  accountNumber?: string;
  bankName?: string;
  description?: string;
  includeInNetWorth?: boolean;
}

export interface IUpdateAccountRequest {
  name?: string;
  type?: EAccountType;
  balance?: number;
  currency?: string;
  accountNumber?: string;
  bankName?: string;
  description?: string;
  isActive?: boolean;
  includeInNetWorth?: boolean;
}

export interface ICreateBudgetRequest {
  databaseId: string;
  name: string;
  period: EBudgetPeriod;
  startDate: Date;
  endDate: Date;
  currency: string;
  categories: Array<{
    category: ETransactionCategory;
    budgetedAmount: number;
  }>;
}

export interface IUpdateBudgetRequest {
  name?: string;
  period?: EBudgetPeriod;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  isActive?: boolean;
  categories?: Array<{
    category: ETransactionCategory;
    budgetedAmount: number;
  }>;
}

export interface ICreateFinancialGoalRequest {
  databaseId: string;
  name: string;
  type: EFinancialGoalType;
  targetAmount: number;
  currency: string;
  targetDate?: Date;
  monthlyContribution?: number;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  notes?: string;
}

export interface IUpdateFinancialGoalRequest {
  name?: string;
  type?: EFinancialGoalType;
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: Date;
  monthlyContribution?: number;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  notes?: string;
  isActive?: boolean;
}
