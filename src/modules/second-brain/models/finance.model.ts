import mongoose, { Schema, Document } from 'mongoose';

export interface IFinance extends Document {
    // Transaction Details
    title: string;
    description?: string;
    type: 'income' | 'expense' | 'invoice' | 'investment';
    category: string; // e.g., 'Food', 'Transport', 'Freelance', 'Salary'
    
    // Amount & Currency
    amount: number;
    currency: string; // USD, EUR, etc.
    
    // Transaction Info
    date: Date;
    account?: string; // Bank account, credit card, etc.
    paymentMethod?: 'cash' | 'card' | 'bank-transfer' | 'paypal' | 'crypto' | 'other';
    
    // Invoice Specific (for freelancers)
    invoice?: {
        invoiceNumber?: string;
        client?: mongoose.Types.ObjectId; // Reference to Person
        dueDate?: Date;
        status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
        items?: {
            description: string;
            quantity: number;
            rate: number;
            amount: number;
        }[];
    };
    
    // Recurring Transactions
    isRecurring: boolean;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        endDate?: Date;
    };
    
    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    
    // Relationships
    linkedProject?: mongoose.Types.ObjectId;
    linkedGoal?: mongoose.Types.ObjectId;
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

const FinanceSchema = new Schema<IFinance>({
    // Transaction Details
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { 
        type: String, 
        enum: ['income', 'expense', 'invoice', 'investment'],
        required: true
    },
    category: { type: String, required: true, trim: true },
    
    // Amount & Currency
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD', trim: true },
    
    // Transaction Info
    date: { type: Date, required: true },
    account: { type: String, trim: true },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'bank-transfer', 'paypal', 'crypto', 'other']
    },
    
    // Invoice Specific
    invoice: {
        invoiceNumber: { type: String, trim: true },
        client: { type: Schema.Types.ObjectId, ref: 'Person' },
        dueDate: { type: Date },
        status: { 
            type: String, 
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            default: 'draft'
        },
        items: [{
            description: { type: String, required: true, trim: true },
            quantity: { type: Number, required: true, min: 0 },
            rate: { type: Number, required: true, min: 0 },
            amount: { type: Number, required: true, min: 0 }
        }]
    },
    
    // Recurring Transactions
    isRecurring: { type: Boolean, default: false },
    recurrence: {
        frequency: { 
            type: String, 
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: { type: Number, min: 1 },
        endDate: { type: Date }
    },
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'areas'
    },
    tags: [{ type: String, trim: true }],
    
    // Relationships
    linkedProject: { type: Schema.Types.ObjectId, ref: 'Project' },
    linkedGoal: { type: Schema.Types.ObjectId, ref: 'Goal' },
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
FinanceSchema.index({ createdBy: 1, type: 1 });
FinanceSchema.index({ createdBy: 1, category: 1 });
FinanceSchema.index({ createdBy: 1, date: -1 });
FinanceSchema.index({ createdBy: 1, area: 1 });
FinanceSchema.index({ 'invoice.status': 1 });

export const Finance = mongoose.model<IFinance>('Finance', FinanceSchema);
