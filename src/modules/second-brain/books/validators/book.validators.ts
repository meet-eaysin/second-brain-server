import { z } from 'zod';

// Common schemas
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Book status enum
const bookStatusSchema = z.enum(['want-to-read', 'reading', 'completed', 'paused', 'abandoned']);

// Book area enum (PARA method)
const bookAreaSchema = z.enum(['projects', 'areas', 'resources', 'archive']);

// Note type enum
const noteTypeSchema = z.enum(['note', 'highlight', 'quote']);

// Note schema
const noteSchema = z.object({
    page: z.number().int().min(1).optional(),
    chapter: z.string().trim().optional(),
    content: z.string().min(1, 'Note content is required').trim(),
    type: noteTypeSchema,
    createdAt: z.date().optional()
});

// Create book schema
export const createBookSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters').trim(),
    author: z.string().min(1, 'Author is required').max(200, 'Author must be less than 200 characters').trim(),
    isbn: z.string().trim().optional(),
    genre: z.array(z.string().trim()).optional(),
    status: bookStatusSchema.default('want-to-read'),
    rating: z.number().int().min(1).max(5).optional(),
    pages: z.number().int().min(1).optional(),
    currentPage: z.number().int().min(0).optional(),
    startDate: z.string().datetime().optional().or(z.date().optional()),
    endDate: z.string().datetime().optional().or(z.date().optional()),
    notes: z.array(noteSchema).default([]),
    keyInsights: z.array(z.string().trim()).default([]),
    actionItems: z.array(z.string().trim()).default([]),
    area: bookAreaSchema.default('resources'),
    tags: z.array(z.string().trim()).default([]),
    linkedProjects: z.array(mongoIdSchema).default([]),
    linkedGoals: z.array(mongoIdSchema).default([]),
    review: z.string().trim().optional()
});

// Update book schema
export const updateBookSchema = createBookSchema.partial();

// Book ID parameter schema
export const bookIdSchema = z.object({
    id: mongoIdSchema
});

// Record ID parameter schema (for document-view routes)
export const recordIdSchema = z.object({
    recordId: mongoIdSchema
});

// Query schemas
export const getBooksQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.string().or(z.array(z.string())).optional(),
    genre: z.string().or(z.array(z.string())).optional(),
    area: bookAreaSchema.optional(),
    tags: z.string().or(z.array(z.string())).optional(),
    rating: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().trim().optional(),
    sort: z.string().optional()
});

// Note operations schemas
export const addNoteSchema = z.object({
    page: z.number().int().min(1).optional(),
    chapter: z.string().trim().optional(),
    content: z.string().min(1, 'Note content is required').trim(),
    type: noteTypeSchema
});

export const updateNoteSchema = addNoteSchema.partial();

export const noteIdSchema = z.object({
    id: mongoIdSchema,
    noteId: z.string().min(1, 'Note ID is required')
});

// Highlight operations schemas (same as notes but with type 'highlight')
export const addHighlightSchema = z.object({
    page: z.number().int().min(1).optional(),
    chapter: z.string().trim().optional(),
    content: z.string().min(1, 'Highlight content is required').trim()
});

export const updateHighlightSchema = addHighlightSchema.partial();

export const highlightIdSchema = noteIdSchema;

// Review operations schemas
export const addReviewSchema = z.object({
    review: z.string().trim().optional(),
    rating: z.number().int().min(1).max(5).optional()
});

export const updateReviewSchema = addReviewSchema.partial();

// Progress update schema
export const updateProgressSchema = z.object({
    currentPage: z.number().int().min(0),
    status: bookStatusSchema.optional()
});

// Bulk operations schemas
export const bulkUpdateBooksSchema = z.object({
    bookIds: z.array(mongoIdSchema).min(1, 'At least one book ID is required'),
    updates: updateBookSchema
});

export const bulkDeleteBooksSchema = z.object({
    bookIds: z.array(mongoIdSchema).min(1, 'At least one book ID is required')
});

// Import/Export schemas
export const importBooksSchema = z.object({
    books: z.array(createBookSchema).min(1, 'At least one book is required'),
    skipDuplicates: z.boolean().default(false)
});

export const exportBooksQuerySchema = z.object({
    format: z.enum(['json', 'csv']).default('json'),
    status: z.string().or(z.array(z.string())).optional(),
    genre: z.string().or(z.array(z.string())).optional(),
    area: bookAreaSchema.optional()
});

// Document-view related schemas
export const documentViewQuerySchema = z.object({
    viewId: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().trim().optional(),
    filters: z.record(z.any()).optional(),
    sorts: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc'])
    })).optional()
});

export const createDocumentViewRecordSchema = z.object({
    properties: createBookSchema.optional(),
    // Allow direct properties as well
    title: z.string().optional(),
    author: z.string().optional(),
    isbn: z.string().optional(),
    genre: z.array(z.string()).optional(),
    status: bookStatusSchema.optional(),
    rating: z.number().int().min(1).max(5).optional(),
    pages: z.number().int().min(1).optional(),
    currentPage: z.number().int().min(0).optional(),
    startDate: z.string().datetime().optional().or(z.date().optional()),
    endDate: z.string().datetime().optional().or(z.date().optional()),
    notes: z.array(noteSchema).optional(),
    keyInsights: z.array(z.string()).optional(),
    actionItems: z.array(z.string()).optional(),
    area: bookAreaSchema.optional(),
    tags: z.array(z.string()).optional(),
    linkedProjects: z.array(z.string()).optional(),
    linkedGoals: z.array(z.string()).optional(),
    review: z.string().optional()
});

export const updateDocumentViewRecordSchema = createDocumentViewRecordSchema.partial();
