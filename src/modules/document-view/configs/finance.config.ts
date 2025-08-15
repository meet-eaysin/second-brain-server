import { createModuleConfig, createProperty, createView } from '../config/module-config.factory';
import { ModuleConfig } from '../types/document-view.types';

/**
 * Finance Module Configuration
 * Defines the document-view configuration for the finance management module
 */
export const financeModuleConfig: ModuleConfig = createModuleConfig({
    moduleType: 'finance',
    displayName: 'Transaction',
    displayNamePlural: 'Finance',
    description: 'Manage your financial transactions and budgets',
    icon: '💰',
    recordService: '../../../modules/second-brain/finance/services/finance.service',
    modelName: 'Transaction',
    databaseId: 'finance-main-db',
    
    defaultProperties: [
        createProperty({
            id: 'description',
            name: 'Description',
            type: 'text',
            description: 'Transaction description',
            required: true,
            frozen: true,
            order: 0
        }),
        createProperty({
            id: 'amount',
            name: 'Amount',
            type: 'number',
            description: 'Transaction amount',
            required: true,
            validation: {
                min: -999999,
                max: 999999
            },
            order: 1
        }),
        createProperty({
            id: 'type',
            name: 'Type',
            type: 'select',
            description: 'Transaction type',
            required: true,
            options: [
                { name: 'Income 💰', color: '#10b981', value: 'income' },
                { name: 'Expense 💸', color: '#ef4444', value: 'expense' },
                { name: 'Transfer 🔄', color: '#3b82f6', value: 'transfer' },
                { name: 'Investment 📈', color: '#8b5cf6', value: 'investment' }
            ],
            order: 2
        }),
        createProperty({
            id: 'category',
            name: 'Category',
            type: 'select',
            description: 'Transaction category',
            required: true,
            options: [
                { name: 'Food & Dining 🍽️', color: '#f59e0b', value: 'food' },
                { name: 'Transportation 🚗', color: '#3b82f6', value: 'transportation' },
                { name: 'Shopping 🛍️', color: '#8b5cf6', value: 'shopping' },
                { name: 'Entertainment 🎬', color: '#06b6d4', value: 'entertainment' },
                { name: 'Bills & Utilities ⚡', color: '#ef4444', value: 'bills' },
                { name: 'Healthcare 🏥', color: '#10b981', value: 'healthcare' },
                { name: 'Education 📚', color: '#f59e0b', value: 'education' },
                { name: 'Travel ✈️', color: '#8b5cf6', value: 'travel' },
                { name: 'Salary 💼', color: '#10b981', value: 'salary' },
                { name: 'Investment 📈', color: '#3b82f6', value: 'investment' },
                { name: 'Other 📝', color: '#6b7280', value: 'other' }
            ],
            order: 3
        }),
        createProperty({
            id: 'account',
            name: 'Account',
            type: 'select',
            description: 'Account used for transaction',
            options: [
                { name: 'Checking Account 🏦', color: '#3b82f6', value: 'checking' },
                { name: 'Savings Account 💰', color: '#10b981', value: 'savings' },
                { name: 'Credit Card 💳', color: '#ef4444', value: 'credit_card' },
                { name: 'Cash 💵', color: '#f59e0b', value: 'cash' },
                { name: 'Investment Account 📈', color: '#8b5cf6', value: 'investment' },
                { name: 'Other 📝', color: '#6b7280', value: 'other' }
            ],
            order: 4
        }),
        createProperty({
            id: 'date',
            name: 'Date',
            type: 'date',
            description: 'Transaction date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
            order: 5
        }),
        createProperty({
            id: 'payee',
            name: 'Payee/Payer',
            type: 'text',
            description: 'Who you paid or who paid you',
            order: 6
        }),
        createProperty({
            id: 'reference',
            name: 'Reference',
            type: 'text',
            description: 'Transaction reference or receipt number',
            order: 7
        }),
        createProperty({
            id: 'status',
            name: 'Status',
            type: 'select',
            description: 'Transaction status',
            options: [
                { name: 'Pending ⏳', color: '#f59e0b', value: 'pending' },
                { name: 'Completed ✅', color: '#10b981', value: 'completed' },
                { name: 'Failed ❌', color: '#ef4444', value: 'failed' },
                { name: 'Cancelled 🚫', color: '#6b7280', value: 'cancelled' }
            ],
            defaultValue: 'completed',
            order: 8
        }),
        createProperty({
            id: 'recurring',
            name: 'Recurring',
            type: 'checkbox',
            description: 'Is this a recurring transaction?',
            defaultValue: false,
            order: 9
        }),
        createProperty({
            id: 'budget',
            name: 'Budget',
            type: 'text',
            description: 'Associated budget category',
            order: 10
        }),
        createProperty({
            id: 'tags',
            name: 'Tags',
            type: 'multiSelect',
            description: 'Transaction tags',
            order: 11
        }),
        createProperty({
            id: 'notes',
            name: 'Notes',
            type: 'text',
            description: 'Additional notes',
            order: 12
        }),
        createProperty({
            id: 'balance',
            name: 'Account Balance',
            type: 'number',
            description: 'Account balance after transaction',
            frozen: true,
            order: 13
        }),
        createProperty({
            id: 'createdAt',
            name: 'Created',
            type: 'date',
            description: 'Creation date',
            frozen: true,
            order: 14
        }),
        createProperty({
            id: 'updatedAt',
            name: 'Updated',
            type: 'date',
            description: 'Last update date',
            frozen: true,
            order: 15
        })
    ],

    defaultViews: [
        createView({
            id: 'all-transactions',
            name: 'All Transactions',
            type: 'TABLE',
            description: 'View all financial transactions',
            isDefault: true,
            visibleProperties: ['date', 'description', 'amount', 'type', 'category', 'account', 'status'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'income-transactions',
            name: 'Income',
            type: 'TABLE',
            description: 'Income transactions only',
            filters: [
                { propertyId: 'type', operator: 'equals', value: 'income', enabled: true }
            ],
            visibleProperties: ['date', 'description', 'amount', 'category', 'payee', 'account'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'expense-transactions',
            name: 'Expenses',
            type: 'TABLE',
            description: 'Expense transactions only',
            filters: [
                { propertyId: 'type', operator: 'equals', value: 'expense', enabled: true }
            ],
            visibleProperties: ['date', 'description', 'amount', 'category', 'payee', 'account'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        }),
        createView({
            id: 'by-category',
            name: 'By Category',
            type: 'BOARD',
            description: 'Transactions grouped by category',
            groupBy: 'category',
            visibleProperties: ['date', 'description', 'amount', 'type'],
            config: {
                groupProperty: 'category',
                colorProperty: 'type'
            }
        }),
        createView({
            id: 'monthly-view',
            name: 'Monthly View',
            type: 'CALENDAR',
            description: 'Calendar view of transactions',
            visibleProperties: ['description', 'amount', 'type', 'category'],
            sorts: [{ propertyId: 'date', direction: 'asc', order: 0 }],
            config: {
                dateProperty: 'date',
                colorProperty: 'type'
            }
        }),
        createView({
            id: 'pending-transactions',
            name: 'Pending',
            type: 'TABLE',
            description: 'Pending transactions',
            filters: [
                { propertyId: 'status', operator: 'equals', value: 'pending', enabled: true }
            ],
            visibleProperties: ['date', 'description', 'amount', 'type', 'category', 'account'],
            sorts: [{ propertyId: 'date', direction: 'asc', order: 0 }]
        }),
        createView({
            id: 'recurring-transactions',
            name: 'Recurring',
            type: 'TABLE',
            description: 'Recurring transactions',
            filters: [
                { propertyId: 'recurring', operator: 'equals', value: true, enabled: true }
            ],
            visibleProperties: ['description', 'amount', 'type', 'category', 'account', 'date'],
            sorts: [{ propertyId: 'date', direction: 'desc', order: 0 }]
        })
    ],

    requiredProperties: ['description', 'amount', 'type', 'category', 'date'],
    frozenProperties: ['description', 'balance', 'createdAt', 'updatedAt'],

    capabilities: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: false, // Financial data is typically private
        canExport: true,
        canImport: true
    },

    ui: {
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'CALENDAR', 'LIST'],
        defaultViewType: 'TABLE'
    },

    frozenConfig: {
        viewType: 'finance',
        moduleType: 'finance',
        description: 'Finance management frozen configuration',
        frozenProperties: [
            {
                propertyId: 'description',
                reason: 'Core transaction property',
                allowEdit: true,
                allowHide: false,
                allowDelete: false
            },
            {
                propertyId: 'balance',
                reason: 'System calculated value',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            },
            {
                propertyId: 'createdAt',
                reason: 'System timestamp',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            },
            {
                propertyId: 'updatedAt',
                reason: 'System timestamp',
                allowEdit: false,
                allowHide: true,
                allowDelete: false
            }
        ]
    }
});
