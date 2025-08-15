import { documentViewService } from '../../../document-view/services/document-view.service';
import { ModuleType, Record, RecordQueryOptions } from '../../../document-view/types/document-view.types';
import * as bookService from './book.service';
import { IBook } from '../models/book.model';

// Initialize document view service instance
const moduleType: ModuleType = 'books';

/**
 * Transform a book model to document-view record format
 */
function transformBookToRecord(book: IBook): Record {
    return {
        id: (book._id as any).toString(),
        properties: {
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            status: book.status,
            rating: book.rating,
            pages: book.pages,
            currentPage: book.currentPage,
            startDate: book.startDate,
            endDate: book.endDate,
            notes: book.notes,
            tags: book.tags || [],
            createdAt: book.createdAt,
            updatedAt: book.updatedAt
        },
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        createdBy: (book.createdBy as any).toString()
    };
}

/**
 * Transform document-view record format to book data
 */
function transformRecordToBook(record: any): any {
    if (record.properties) {
        return record.properties;
    }
    return record;
}

/**
 * Get books as document-view records
 */
export async function getRecords(userId: string, options: RecordQueryOptions = {}): Promise<{
    records: Record[];
    pagination?: any;
}> {
    // Convert document-view query options to book service options
    const bookOptions = {
        page: (options as any).page,
        limit: (options as any).limit,
        search: (options as any).search,
        sort: (options as any).sort,
        filters: (options as any).filters
    };

    const result = await bookService.getBooks(userId, bookOptions);

    const records = result.books.map(book => transformBookToRecord(book));

    return {
        records,
        pagination: result.pagination
    };
}

/**
 * Get a single book as document-view record
 */
export async function getRecord(userId: string, recordId: string): Promise<Record | null> {
    const book = await bookService.getBook(userId, recordId);
    if (!book) {
        return null;
    }

    return transformBookToRecord(book);
}

/**
 * Create a new book from document-view record
 */
export async function createRecord(userId: string, recordData: any): Promise<Record> {
    const bookData = transformRecordToBook(recordData);
    const newBook = await bookService.createBook(userId, bookData);

    return transformBookToRecord(newBook);
}

/**
 * Update a book from document-view record
 */
export async function updateRecord(userId: string, recordId: string, updateData: any): Promise<Record | null> {
    const bookData = transformRecordToBook(updateData);
    const updatedBook = await bookService.updateBook(userId, recordId, bookData);

    if (!updatedBook) {
        return null;
    }

    return transformBookToRecord(updatedBook);
}

/**
 * Delete a book record
 */
export async function deleteRecord(userId: string, recordId: string): Promise<boolean> {
    const result = await bookService.deleteBook(userId, recordId);
    return !!result; // Convert to boolean
}

/**
 * Search books with document-view compatible results
 */
export async function searchRecords(userId: string, query: string, options: RecordQueryOptions = {}): Promise<{
    records: Record[];
    pagination?: any;
}> {
    const searchOptions = {
        ...options,
        search: query
    };

    return await getRecords(userId, searchOptions);
}

/**
 * Get books filtered by view configuration
 */
export async function getRecordsByView(userId: string, viewId: string, options: RecordQueryOptions = {}): Promise<{
    records: Record[];
    pagination?: any;
}> {
    // Get the view configuration
    const view = await documentViewService.getView(userId, moduleType, viewId);
    if (!view) {
        throw new Error('View not found');
    }

    // Apply view filters to the query options
    const viewOptions = {
        ...options,
        filters: view.filters,
        sorts: view.sorts,
        visibleProperties: view.visibleProperties
    };

    return await getRecords(userId, viewOptions);
}

/**
 * Bulk operations for books
 */
export async function bulkUpdateRecords(userId: string, recordIds: string[], updateData: any): Promise<{
    modifiedCount: number;
}> {
    const bookData = transformRecordToBook(updateData);
    return await bookService.bulkUpdateBooks(userId, { bookIds: recordIds, updates: bookData });
}

export async function bulkDeleteRecords(userId: string, recordIds: string[]): Promise<{
    deletedCount: number;
}> {
    return await bookService.bulkDeleteBooks(userId, recordIds);
}

/**
 * Get book statistics for document-view dashboard
 */
export async function getRecordStats(userId: string): Promise<any> {
    const stats = await bookService.getBookStats(userId);

    // Transform status breakdown to object
    const statusMap: Record<string, number> = {};
    stats.statusBreakdown.forEach((item: any) => {
        statusMap[item._id] = item.count;
    });

    // Transform genre breakdown to object
    const genreMap: Record<string, number> = {};
    stats.genreBreakdown.forEach((item: any) => {
        genreMap[item._id] = item.count;
    });

    // Transform to document-view compatible format
    return {
        totalRecords: stats.overview.totalBooks || 0,
        recordsByStatus: {
            'want_to_read': statusMap['want_to_read'] || 0,
            'currently_reading': statusMap['reading'] || 0,
            'completed': statusMap['completed'] || 0,
            'on_hold': statusMap['paused'] || 0,
            'abandoned': statusMap['abandoned'] || 0
        },
        recordsByGenre: genreMap,
        recentRecords: [], // Would need to implement recent books query
        monthlyTrends: [] // Would need to implement monthly trends
    };
}

/**
 * Export books in document-view format
 */
export async function exportRecords(userId: string, format: 'json' | 'csv' = 'json', options: RecordQueryOptions = {}): Promise<any> {
    const result = await getRecords(userId, options);

    if (format === 'csv') {
        // Convert to CSV format
        const headers = ['id', 'title', 'author', 'isbn', 'genre', 'status', 'rating', 'pages', 'currentPage', 'startDate', 'endDate', 'notes', 'tags', 'createdAt', 'updatedAt'];
        const csvData = result.records.map(record => {
            return headers.map(header => {
                const value = record.properties[header];
                if (Array.isArray(value)) {
                    return value.join(';');
                }
                return value || '';
            });
        });

        return {
            headers,
            data: csvData,
            format: 'csv'
        };
    }

    return {
        records: result.records,
        format: 'json'
    };
}

/**
 * Import books from document-view format
 */
export async function importRecords(userId: string, data: any[], options: { skipDuplicates?: boolean } = {}): Promise<{
    imported: number;
    skipped: number;
    errors: any[];
}> {
    let imported = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const recordData of data) {
        try {
            // Check for duplicates if requested
            if (options.skipDuplicates && recordData.properties?.isbn) {
                const existing = await bookService.getBooks(userId, {
                    search: recordData.properties.isbn
                }, { limit: 1 });

                if (existing.books.length > 0) {
                    skipped++;
                    continue;
                }
            }

            await createRecord(userId, recordData);
            imported++;
        } catch (error) {
            errors.push({
                record: recordData,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    return {
        imported,
        skipped,
        errors
    };
}
