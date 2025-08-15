import { Book } from '../models/book.model';
import { createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateBookRequest {
    title: string;
    author: string;
    isbn?: string;
    genre?: string[];
    status?: 'want-to-read' | 'reading' | 'completed' | 'paused' | 'abandoned';
    rating?: number;
    pages?: number;
    currentPage?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: {
        page?: number;
        chapter?: string;
        content: string;
        type: 'note' | 'highlight' | 'quote';
        createdAt: Date;
    }[];
    keyInsights?: string[];
    actionItems?: string[];
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags?: string[];
    linkedProjects?: string[];
    linkedGoals?: string[];
    review?: string;
}

export interface UpdateBookRequest extends Partial<CreateBookRequest> {
    archivedAt?: Date;
}

export interface BookFilters {
    status?: string | string[];
    genre?: string | string[];
    area?: string;
    tags?: string | string[];
    rating?: number;
    search?: string;
}

export interface BookOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get books with filtering and pagination
export async function getBooks(userId: string, filters: BookFilters = {}, options: BookOptions = {}) {
    const {
        status,
        genre,
        area,
        tags,
        rating,
        search
    } = filters;

    const {
        page = 1,
        limit = 50,
        sort = '-createdAt',
        populate = []
    } = options;

    // Build filter query
    const filter: any = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (status) {
        filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (genre) {
        filter.genre = Array.isArray(genre) ? { $in: genre } : { $in: [genre] };
    }

    if (area) {
        filter.area = area;
    }

    if (tags) {
        filter.tags = Array.isArray(tags) ? { $in: tags } : { $in: [tags] };
    }

    if (rating) {
        filter.rating = { $gte: rating };
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
        Book.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Book.countDocuments(filter)
    ]);

    return {
        books,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

// Get single book by ID
export async function getBook(userId: string, bookId: string) {
    if (!Types.ObjectId.isValid(bookId)) {
        throw createValidationError('Invalid book ID');
    }

    const book = await Book.findOne({
        _id: bookId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!book) {
        throw createNotFoundError('Book not found');
    }

    return book;
}

// Create new book
export async function createBook(userId: string, bookData: CreateBookRequest) {
    const book = new Book({
        ...bookData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await book.save();
    return book.toObject();
}

// Update book
export async function updateBook(userId: string, bookId: string, updates: UpdateBookRequest) {
    if (!Types.ObjectId.isValid(bookId)) {
        throw createValidationError('Invalid book ID');
    }

    const book = await Book.findOneAndUpdate(
        {
            _id: bookId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updates,
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).lean();

    if (!book) {
        throw createNotFoundError('Book not found');
    }

    return book;
}

// Delete book
export async function deleteBook(userId: string, bookId: string) {
    if (!Types.ObjectId.isValid(bookId)) {
        throw createValidationError('Invalid book ID');
    }

    const book = await Book.findOneAndUpdate(
        {
            _id: bookId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!book) {
        throw createNotFoundError('Book not found');
    }

    return { message: 'Book deleted successfully' };
}

// Get book statistics
export async function getBookStats(userId: string) {
    const stats = await Book.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: null,
                totalBooks: { $sum: 1 },
                completedBooks: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                currentlyReading: {
                    $sum: { $cond: [{ $eq: ['$status', 'reading'] }, 1, 0] }
                },
                wantToRead: {
                    $sum: { $cond: [{ $eq: ['$status', 'want_to_read'] }, 1, 0] }
                },
                totalPages: { $sum: '$pages' },
                pagesRead: { $sum: '$currentPage' },
                averageRating: { $avg: '$rating' }
            }
        }
    ]);

    const statusBreakdown = await Book.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const genreBreakdown = await Book.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        { $unwind: '$genre' },
        {
            $group: {
                _id: '$genre',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    return {
        overview: stats[0] || {
            totalBooks: 0,
            completedBooks: 0,
            currentlyReading: 0,
            wantToRead: 0,
            totalPages: 0,
            pagesRead: 0,
            averageRating: 0
        },
        statusBreakdown,
        genreBreakdown
    };
}

// Get book analytics
export async function getBookAnalytics(userId: string) {
    const readingTrends = await Book.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false },
                dateCompleted: { $exists: true }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$dateCompleted' },
                    month: { $month: '$dateCompleted' }
                },
                booksCompleted: { $sum: 1 },
                pagesRead: { $sum: '$pages' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const readingGoalProgress = await Book.countDocuments({
        createdBy: userId,
        status: 'completed',
        dateCompleted: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lte: new Date(new Date().getFullYear(), 11, 31)
        }
    });

    return {
        readingTrends,
        readingGoalProgress,
        currentYear: new Date().getFullYear()
    };
}

// Update reading status
export async function updateReadingStatus(userId: string, bookId: string, status: string) {
    const updates: any = { status, updatedAt: new Date() };

    if (status === 'reading' && !await Book.findOne({ _id: bookId, dateStarted: { $exists: true } })) {
        updates.dateStarted = new Date();
    }

    if (status === 'completed') {
        updates.dateCompleted = new Date();
        const book = await Book.findById(bookId);
        if (book && book.pages) {
            updates.currentPage = book.pages;
        }
    }

    return await updateBook(userId, bookId, updates);
}

// Toggle favorite status (using tags to mark favorites)
export async function toggleFavorite(userId: string, bookId: string) {
    const book = await getBook(userId, bookId);
    const isFavorite = book.tags.includes('favorite');

    if (isFavorite) {
        // Remove favorite tag
        const updatedTags = book.tags.filter(tag => tag !== 'favorite');
        return await updateBook(userId, bookId, { tags: updatedTags });
    } else {
        // Add favorite tag
        const updatedTags = [...book.tags, 'favorite'];
        return await updateBook(userId, bookId, { tags: updatedTags });
    }
}

// Archive book
export async function archiveBook(userId: string, bookId: string) {
    return await updateBook(userId, bookId, { archivedAt: new Date() });
}

// Duplicate book
export async function duplicateBook(userId: string, bookId: string) {
    const originalBook = await getBook(userId, bookId);
    const { _id, createdAt, updatedAt, linkedProjects, linkedGoals, ...bookData } = originalBook;

    return await createBook(userId, {
        title: bookData.title + ' (Copy)',
        author: bookData.author,
        isbn: bookData.isbn,
        genre: bookData.genre,
        pages: bookData.pages,
        status: 'want-to-read',
        currentPage: 0,
        startDate: undefined,
        endDate: undefined,
        area: bookData.area,
        tags: bookData.tags,
        linkedProjects: [],
        linkedGoals: []
    });
}

// Update reading progress
export async function updateProgress(userId: string, bookId: string, progress: { currentPage: number }) {
    return await updateBook(userId, bookId, progress);
}

// Get reading progress
export async function getProgress(userId: string, bookId: string) {
    const book = await getBook(userId, bookId);
    const currentPage = book.currentPage || 0;
    const progressPercentage = book.pages ? Math.round((currentPage / book.pages) * 100) : 0;

    return {
        currentPage,
        totalPages: book.pages || 0,
        progressPercentage,
        status: book.status
    };
}

// Bulk operations
export async function bulkUpdateBooks(userId: string, updates: { bookIds: string[], updates: any }) {
    const { bookIds, updates: updateData } = updates;
    
    const result = await Book.updateMany(
        {
            _id: { $in: bookIds },
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

export async function bulkDeleteBooks(userId: string, bookIds: string[]) {
    const result = await Book.updateMany(
        {
            _id: { $in: bookIds },
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
export async function importBooks(userId: string, booksData: any[]) {
    const books = booksData.map(bookData => ({
        ...bookData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const result = await Book.insertMany(books);
    return { importedCount: result.length };
}

export async function exportBooks(userId: string) {
    const books = await Book.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return books;
}

// Note operations using the notes array in the book model
export async function addNote(userId: string, bookId: string, noteData: {
    page?: number;
    chapter?: string;
    content: string;
    type: 'note' | 'highlight' | 'quote';
}) {
    const book = await Book.findOneAndUpdate(
        {
            _id: bookId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            $push: {
                notes: {
                    ...noteData,
                    createdAt: new Date()
                }
            },
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!book) {
        throw createNotFoundError('Book not found');
    }

    return book.notes[book.notes.length - 1]; // Return the newly added note
}

export async function getNotes(userId: string, bookId: string) {
    const book = await getBook(userId, bookId);
    return book.notes || [];
}

export async function updateNote(userId: string, bookId: string, noteId: string, updates: {
    page?: number;
    chapter?: string;
    content?: string;
    type?: 'note' | 'highlight' | 'quote';
}) {
    const book = await Book.findOneAndUpdate(
        {
            _id: bookId,
            createdBy: userId,
            archivedAt: { $exists: false },
            'notes._id': noteId
        },
        {
            $set: {
                'notes.$.page': updates.page,
                'notes.$.chapter': updates.chapter,
                'notes.$.content': updates.content,
                'notes.$.type': updates.type
            },
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!book) {
        throw createNotFoundError('Book or note not found');
    }

    return book.notes.find(note => (note as any)._id?.toString() === noteId);
}

export async function deleteNote(userId: string, bookId: string, noteId: string) {
    const book = await Book.findOneAndUpdate(
        {
            _id: bookId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            $pull: {
                notes: { _id: noteId }
            },
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!book) {
        throw createNotFoundError('Book not found');
    }

    return { message: 'Note deleted successfully' };
}

// Highlight operations (using notes array with type 'highlight')
export async function addHighlight(userId: string, bookId: string, highlightData: {
    page?: number;
    chapter?: string;
    content: string;
}) {
    return await addNote(userId, bookId, {
        ...highlightData,
        type: 'highlight'
    });
}

export async function getHighlights(userId: string, bookId: string) {
    const notes = await getNotes(userId, bookId);
    return notes.filter(note => note.type === 'highlight');
}

export async function updateHighlight(userId: string, bookId: string, highlightId: string, updates: {
    page?: number;
    chapter?: string;
    content?: string;
}) {
    return await updateNote(userId, bookId, highlightId, {
        ...updates,
        type: 'highlight'
    });
}

export async function deleteHighlight(userId: string, bookId: string, highlightId: string) {
    return await deleteNote(userId, bookId, highlightId);
}

// Review operations (placeholder)
export async function addReview(userId: string, bookId: string, reviewData: any) {
    return await updateBook(userId, bookId, { review: reviewData.review, rating: reviewData.rating });
}

export async function getReview(userId: string, bookId: string) {
    const book = await getBook(userId, bookId);
    return { review: book.review, rating: book.rating };
}

export async function updateReview(userId: string, bookId: string, updates: any) {
    return await updateBook(userId, bookId, updates);
}

export async function deleteReview(userId: string, bookId: string) {
    return await updateBook(userId, bookId, { review: undefined, rating: undefined });
}

// Additional utility functions

// Get books by status
export async function getBooksByStatus(userId: string, status: string) {
    return await getBooks(userId, { status });
}

// Get favorite books
export async function getFavoriteBooks(userId: string) {
    return await getBooks(userId, { tags: 'favorite' });
}

// Get books by genre
export async function getBooksByGenre(userId: string, genre: string) {
    return await getBooks(userId, { genre });
}

// Get currently reading books
export async function getCurrentlyReadingBooks(userId: string) {
    return await getBooks(userId, { status: 'reading' });
}

// Get completed books
export async function getCompletedBooks(userId: string) {
    return await getBooks(userId, { status: 'completed' });
}

// Search books by title or author
export async function searchBooks(userId: string, query: string) {
    return await getBooks(userId, { search: query });
}

// Get books by area (PARA method)
export async function getBooksByArea(userId: string, area: string) {
    return await getBooks(userId, { area });
}

// Get books with notes
export async function getBooksWithNotes(userId: string) {
    const books = await Book.find({
        createdBy: userId,
        archivedAt: { $exists: false },
        'notes.0': { $exists: true }
    }).lean();

    return {
        books,
        pagination: {
            page: 1,
            limit: books.length,
            total: books.length,
            pages: 1
        }
    };
}

// Get books with highlights
export async function getBooksWithHighlights(userId: string) {
    const books = await Book.find({
        createdBy: userId,
        archivedAt: { $exists: false },
        'notes.type': 'highlight'
    }).lean();

    return {
        books,
        pagination: {
            page: 1,
            limit: books.length,
            total: books.length,
            pages: 1
        }
    };
}

// Get reading statistics
export async function getReadingStatistics(userId: string) {
    const stats = await getBookStats(userId);
    const analytics = await getBookAnalytics(userId);

    return {
        ...stats,
        analytics
    };
}
