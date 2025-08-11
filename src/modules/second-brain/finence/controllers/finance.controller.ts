import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../../utils';

// Get all financial records
export const getFinances = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { 
        type, 
        category,
        startDate,
        endDate,
        currency,
        page = 1, 
        limit = 50 
    } = req.query;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const filter: any = { 
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (currency) filter.currency = currency;
    
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [finances, total] = await Promise.all([
        Finance.find(filter)
            .populate('invoice.client', 'firstName lastName company')
            .populate('linkedProject', 'title status')
            .populate('linkedGoal', 'title type')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Finance.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            finances,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single financial record
export const getFinance = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const finance = await Finance.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('invoice.client', 'firstName lastName company email')
    .populate('linkedProject', 'title status area')
    .populate('linkedGoal', 'title type status');

    if (!finance) {
        throw createAppError('Financial record not found', 404);
    }

    res.status(200).json({
        success: true,
        data: finance
    });
});

// Create financial record
export const createFinance = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const finance = await Finance.create({
        ...req.body,
        createdBy: userId
    });

    const populatedFinance = await Finance.findById(finance._id)
        .populate('invoice.client', 'firstName lastName company')
        .populate('linkedProject', 'title status')
        .populate('linkedGoal', 'title type');

    res.status(201).json({
        success: true,
        data: populatedFinance
    });
});

// Update financial record
export const updateFinance = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const finance = await Finance.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('invoice.client', 'firstName lastName company')
     .populate('linkedProject', 'title status')
     .populate('linkedGoal', 'title type');

    if (!finance) {
        throw createAppError('Financial record not found', 404);
    }

    res.status(200).json({
        success: true,
        data: finance
    });
});

// Delete financial record
export const deleteFinance = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const finance = await Finance.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!finance) {
        throw createAppError('Financial record not found', 404);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Get financial summary
export const getFinancialSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { period = 'month', year, month } = req.query;

    let startDate: Date, endDate: Date;
    const now = new Date();

    if (period === 'month') {
        const targetYear = year ? Number(year) : now.getFullYear();
        const targetMonth = month ? Number(month) - 1 : now.getMonth();
        startDate = new Date(targetYear, targetMonth, 1);
        endDate = new Date(targetYear, targetMonth + 1, 0);
    } else if (period === 'year') {
        const targetYear = year ? Number(year) : now.getFullYear();
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31);
    } else {
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const finances = await Finance.find({
        createdBy: userId,
        date: { $gte: startDate, $lte: endDate },
        archivedAt: { $exists: false }
    });

    const summary = {
        period: {
            start: startDate,
            end: endDate,
            type: period
        },
        income: {
            total: finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0),
            count: finances.filter(f => f.type === 'income').length
        },
        expenses: {
            total: finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0),
            count: finances.filter(f => f.type === 'expense').length
        },
        net: 0,
        byCategory: finances.reduce((acc, f) => {
            if (!acc[f.category]) {
                acc[f.category] = { income: 0, expense: 0, count: 0 };
            }
            if (f.type === 'income') {
                acc[f.category].income += f.amount;
            } else if (f.type === 'expense') {
                acc[f.category].expense += f.amount;
            }
            acc[f.category].count++;
            return acc;
        }, {} as Record<string, any>),
        invoices: {
            total: finances.filter(f => f.type === 'invoice').length,
            paid: finances.filter(f => f.type === 'invoice' && f.invoice?.status === 'paid').length,
            pending: finances.filter(f => f.type === 'invoice' && f.invoice?.status === 'sent').length,
            overdue: finances.filter(f => f.type === 'invoice' && f.invoice?.status === 'overdue').length
        }
    };

    summary.net = summary.income.total - summary.expenses.total;

    res.status(200).json({
        success: true,
        data: summary
    });
});

// Get invoice dashboard
export const getInvoiceDashboard = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const invoices = await Finance.find({
        createdBy: userId,
        type: 'invoice',
        archivedAt: { $exists: false }
    }).populate('invoice.client', 'firstName lastName company');

    const dashboard = {
        total: invoices.length,
        byStatus: invoices.reduce((acc, inv) => {
            const status = inv.invoice?.status || 'draft';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        paidAmount: invoices.filter(inv => inv.invoice?.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        pendingAmount: invoices.filter(inv => inv.invoice?.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0),
        overdueInvoices: invoices.filter(inv => {
            return inv.invoice?.status === 'sent' && 
                   inv.invoice?.dueDate && 
                   new Date(inv.invoice.dueDate) < new Date();
        }),
        recentInvoices: invoices
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
    };

    res.status(200).json({
        success: true,
        data: dashboard
    });
});

// Create invoice
export const createInvoice = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { clientId, items, dueDate, notes } = req.body;

    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const client = await Person.findOne({ _id: clientId, createdBy: userId });
    if (!client) {
        throw createAppError('Client not found', 404);
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);

    // Generate invoice number
    const invoiceCount = await Finance.countDocuments({
        createdBy: userId,
        type: 'invoice'
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await Finance.create({
        title: `Invoice ${invoiceNumber}`,
        type: 'invoice',
        amount: totalAmount,
        currency: 'USD',
        date: new Date(),
        category: 'Invoice',
        invoice: {
            invoiceNumber,
            client: clientId,
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            status: 'draft',
            items
        },
        description: notes,
        createdBy: userId
    });

    const populatedInvoice = await Finance.findById(invoice._id)
        .populate('invoice.client', 'firstName lastName company email');

    res.status(201).json({
        success: true,
        data: populatedInvoice
    });
});

// Update invoice status
export const updateInvoiceStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Finance.findOne({ 
        _id: id, 
        createdBy: userId,
        type: 'invoice'
    });

    if (!invoice) {
        throw createAppError('Invoice not found', 404);
    }

    if (invoice.invoice) {
        invoice.invoice.status = status;
        
        // Update overdue status automatically
        if (status === 'sent' && invoice.invoice.dueDate && new Date(invoice.invoice.dueDate) < new Date()) {
            invoice.invoice.status = 'overdue';
        }
    }

    await invoice.save();

    const populatedInvoice = await Finance.findById(invoice._id)
        .populate('invoice.client', 'firstName lastName company');

    res.status(200).json({
        success: true,
        data: populatedInvoice
    });
});
