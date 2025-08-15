import mongoose, { Document, Schema, Types, model } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'invoice';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface IInvoiceItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface IInvoiceInfo {
  invoiceNumber: string;
  client: Types.ObjectId; // ref Person
  dueDate?: Date;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  items?: IInvoiceItem[];
}

export interface ITransaction {
  description: string;
  amount: number;
  currency: string;
  type: TransactionType;
  category: string; // could be ObjectId in future
  account?: string; // could be ObjectId in future
  status?: TransactionStatus;
  date: Date;
  tags?: string[];
  payee?: string;
  reference?: string;
  notes?: string;
  recurring?: boolean;
  budget?: string; // could be ObjectId in future
  invoice?: IInvoiceInfo;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface ITransactionDocument extends Document<unknown, any, ITransaction>, ITransaction {}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  quantity: { type: Number }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoiceInfo>({
  invoiceNumber: { type: String, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  items: { type: [InvoiceItemSchema], default: undefined }
}, { _id: false });

const TransactionSchema = new Schema<ITransactionDocument>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
  type: { type: String, enum: ['income', 'expense', 'transfer', 'investment', 'invoice'], required: true },
  category: { type: String, required: true },
  account: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  date: { type: Date, required: true },
  tags: { type: [String], default: [] },
  payee: { type: String },
  reference: { type: String },
  notes: { type: String },
  recurring: { type: Boolean },
  budget: { type: String },
  invoice: { type: InvoiceSchema },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  archivedAt: { type: Date }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_: unknown, ret: any) => {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    }
  }
});

TransactionSchema.index({ createdBy: 1, date: -1 });
TransactionSchema.index({ createdBy: 1, type: 1 });
TransactionSchema.index({ createdBy: 1, category: 1 });
TransactionSchema.index({ createdBy: 1, account: 1 });
TransactionSchema.index({ createdBy: 1, status: 1 });
TransactionSchema.index({ createdBy: 1, tags: 1 });

export const Transaction = model<ITransactionDocument>('Transaction', TransactionSchema);
export default Transaction;

