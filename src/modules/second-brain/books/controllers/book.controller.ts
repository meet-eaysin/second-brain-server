import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

// Get all books with filtering
export const getBooks = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { 
        status, 
        genre, 
        area, 
        tags,
        rating,
        search,
        page = 1, 
        limit = 50 
    } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Build filter query
    const filter: any = { 
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (status) filter.status = status;
    if (genre) filter.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (rating) filter.rating = { $gte: Number(rating) };

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortQuery: any = {};
    if (search) {
        sortQuery.score = { $meta: 'textScore' };
    } else {
        sortQuery.status = 1; // Reading first, then want-to-read, then completed
        sortQuery.updatedAt = -1;
    }

    const [books, total] = await Promise.all([
        Book.find(filter)
            .populate('linkedProjects', 'title status')
            .populate('linkedGoals', 'title type status')
            .sort(sortQuery)
            .skip(skip)
            .limit(Number(limit)),
        Book.countDocuments(filter)
    ]);

    const result = {
        books,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    };

    sendSuccessResponse(res, result, 'Books retrieved successfully');
});

// Get single book with full details
export const getBook = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const book = await Book.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('linkedProjects', 'title status area')
    .populate('linkedGoals', 'title type status progressPercentage');

    if (!book) {
        sendErrorResponse(res, 'Book not found', 404);
        return;
    }

    // Calculate reading statistics
    const readingStats = {
        progressPercentage: book.readingProgress || 0,
        pagesRead: book.currentPage || 0,
        totalPages: book.pages || 0,
        daysReading: book.startDate && book.status === 'reading'
            ? Math.ceil((new Date().getTime() - new Date(book.startDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        estimatedDaysToFinish: book.pages && book.currentPage && book.startDate && book.status === 'reading'
            ? Math.ceil(((book.pages - book.currentPage) / (book.currentPage / Math.max(1, Math.ceil((new Date().getTime() - new Date(book.startDate).getTime()) / (1000 * 60 * 60 * 24))))))
            : null
    };

    const result = {
        book,
        readingStats
    };

    sendSuccessResponse(res, result, 'Book retrieved successfully');
});

// Create book
export const createBook = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const bookData = {
        ...req.body,
        createdBy: userId
    };

    // Set start date if status is reading
    if (bookData.status === 'reading' && !bookData.startDate) {
        bookData.startDate = new Date();
    }

    const book = await Book.create(bookData);

    // Link to projects and goals if specified
    if (book.linkedProjects && book.linkedProjects.length > 0) {
        await Project.updateMany(
            { _id: { $in: book.linkedProjects } },
            { $push: { books: book._id } }
        );
    }

    if (book.linkedGoals && book.linkedGoals.length > 0) {
        await Goal.updateMany(
            { _id: { $in: book.linkedGoals } },
            { $push: { books: book._id } }
        );
    }

    const populatedBook = await Book.findById(book._id)
        .populate('linkedProjects', 'title status')
        .populate('linkedGoals', 'title type');

    res.status(201).json({
        success: true,
        data: populatedBook
    });
});

// Update book with progress tracking
export const updateBook = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const oldBook = await Book.findOne({ _id: id, createdBy: userId });
    if (!oldBook) {
        throw createAppError('Book not found', 404);
    }

    const book = await Book.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('linkedProjects', 'title status')
     .populate('linkedGoals', 'title type');

    if (!book) {
        throw createAppError('Book not found', 404);
    }

    // Handle status changes
    if (req.body.status) {
        if (req.body.status === 'reading' && oldBook.status !== 'reading' && !book.startDate) {
            book.startDate = new Date();
        } else if (req.body.status === 'completed' && oldBook.status !== 'completed') {
            book.endDate = new Date();
            if (book.pages) {
                book.currentPage = book.pages;
            }
        }
        await book.save();
    }

    res.status(200).json({
        success: true,
        data: book
    });
});

// Delete book
export const deleteBook = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const book = await Book.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!book) {
        throw createAppError('Book not found', 404);
    }

    // Remove book references from projects and goals
    if (book.linkedProjects && book.linkedProjects.length > 0) {
        await Project.updateMany(
            { _id: { $in: book.linkedProjects } },
            { $pull: { books: book._id } }
        );
    }

    if (book.linkedGoals && book.linkedGoals.length > 0) {
        await Goal.updateMany(
            { _id: { $in: book.linkedGoals } },
            { $pull: { books: book._id } }
        );
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Add note/highlight to book
export const addNote = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { page, chapter, content, type = 'note' } = req.body;

    const book = await Book.findOne({ _id: id, createdBy: userId });
    if (!book) {
        throw createAppError('Book not found', 404);
    }

    const noteData = {
        page: page || undefined,
        chapter: chapter || undefined,
        content,
        type,
        createdAt: new Date()
    };

    book.notes.push(noteData);
    await book.save();

    res.status(200).json({
        success: true,
        data: book
    });
});

// Update reading progress
export const updateProgress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { currentPage } = req.body;

    const book = await Book.findOne({ _id: id, createdBy: userId });
    if (!book) {
        throw createAppError('Book not found', 404);
    }

    book.currentPage = currentPage;

    // Auto-complete if reached the end
    if (book.pages && currentPage >= book.pages && book.status !== 'completed') {
        book.status = 'completed';
        book.endDate = new Date();
    }

    await book.save();

    res.status(200).json({
        success: true,
        data: book
    });
});

// Get reading statistics
export const getReadingStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const books = await Book.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    const currentYear = new Date().getFullYear();
    const thisYearBooks = books.filter(book => 
        book.endDate && new Date(book.endDate).getFullYear() === currentYear
    );

    const stats = {
        totalBooks: books.length,
        booksRead: books.filter(b => b.status === 'completed').length,
        currentlyReading: books.filter(b => b.status === 'reading').length,
        wantToRead: books.filter(b => b.status === 'want-to-read').length,
        thisYearRead: thisYearBooks.length,
        averageRating: books.filter(b => b.rating).length > 0 
            ? Math.round(books.filter(b => b.rating).reduce((sum, book) => sum + (book.rating || 0), 0) / books.filter(b => b.rating).length * 10) / 10
            : null,
        totalPages: books.filter(b => b.status === 'completed' && b.pages).reduce((sum, book) => sum + (book.pages || 0), 0),
        byGenre: books.reduce((acc, book) => {
            book.genre?.forEach(g => {
                acc[g] = (acc[g] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>),
        byStatus: books.reduce((acc, book) => {
            acc[book.status] = (acc[book.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };

    res.status(200).json({
        success: true,
        data: stats
    });
});

// Get currently reading books
export const getCurrentlyReading = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const books = await Book.find({
        createdBy: userId,
        status: 'reading',
        archivedAt: { $exists: false }
    }).populate('linkedProjects', 'title status')
     .populate('linkedGoals', 'title type');

    res.status(200).json({
        success: true,
        data: books
    });
});

// Get book recommendations (based on genres and ratings)
export const getRecommendations = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    // Get user's favorite genres (from highly rated books)
    const ratedBooks = await Book.find({
        createdBy: userId,
        rating: { $gte: 4 },
        archivedAt: { $exists: false }
    });

    const favoriteGenres = ratedBooks.reduce((acc, book) => {
        book.genre?.forEach(g => {
            acc[g] = (acc[g] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const topGenres = Object.entries(favoriteGenres)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

    // Simple recommendation logic (in a real app, this would be more sophisticated)
    const recommendations = {
        basedOnGenres: topGenres,
        suggestedActions: [
            'Continue reading your current books',
            'Add books from your favorite genres to your want-to-read list',
            'Set a reading goal for this month',
            'Take notes on key insights from your recent reads'
        ]
    };

    res.status(200).json({
        success: true,
        data: recommendations
    });
});

// Search books (external API integration would go here)
export const searchBooks = catchAsync(async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query) {
        throw createAppError('Search query is required', 400);
    }

    // This would integrate with Google Books API or similar
    // For now, return a placeholder response
    const searchResults = {
        query,
        results: [],
        message: 'External book search API integration would be implemented here'
    };

    res.status(200).json({
        success: true,
        data: searchResults
    });
});
