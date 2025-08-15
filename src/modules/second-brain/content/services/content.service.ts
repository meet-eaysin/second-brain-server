import { Content } from '../models/content.model';
import { createAppError, createNotFoundError, createValidationError } from '../../../../utils';
import { Types } from 'mongoose';

export interface CreateContentRequest {
    title: string;
    description?: string;
    type: 'blog' | 'video' | 'podcast' | 'social' | 'newsletter' | 'course' | 'other';
    // Pipeline status aligns to model
    status?: 'idea' | 'draft' | 'in-review' | 'scheduled' | 'published' | 'archived';
    // Content body
    content?: string;
    notes?: string;
    outline?: string[];
    keywords?: string[];
    // Publishing details
    platform?: string[];
    publishDate?: Date;
    scheduledDate?: Date;
    url?: string;
    // SEO & marketing
    seoTitle?: string;
    metaDescription?: string;
    thumbnail?: string;
    // Performance metrics
    metrics?: {
        views?: number; likes?: number; shares?: number; comments?: number; engagement?: number; revenue?: number;
    };
    // PARA
    area?: 'projects' | 'areas' | 'resources' | 'archive';
    tags?: string[];
    // Relationships
    linkedProjects?: string[];
    linkedGoals?: string[];
    // Favorite
    isFavorite?: boolean;
    // Dates
    publishedAt?: Date;
    archivedAt?: Date;
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {}

export interface ContentFilters {
    type?: string | string[];
    area?: string | string[];
    status?: string | string[];
    tags?: string | string[];
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface ContentOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

// Get content with filtering and pagination
export async function getContent(userId: string, filters: ContentFilters = {}, options: ContentOptions = {}) {
    const {
        type,
        area,
        status,
        tags,
        search,
        dateFrom,
        dateTo
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

    if (type) {
        filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (area) {
        filter.area = Array.isArray(area) ? { $in: area } : area;
    }

    if (status) {
        filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (tags) {
        filter.tags = Array.isArray(tags) ? { $in: tags } : { $in: [tags] };
    }


    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
        Content.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .lean(),
        Content.countDocuments(filter)
    ]);

    return {
        content,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

// Get single content item by ID
export async function getContentItem(userId: string, contentId: string) {
    if (!Types.ObjectId.isValid(contentId)) {
        throw createValidationError('Invalid content ID');
    }

    const content = await Content.findOne({
        _id: contentId,
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (!content) {
        throw createNotFoundError('Content not found');
    }

    return content;
}

// Create new content
export async function createContent(userId: string, contentData: CreateContentRequest) {
    const content = new Content({
        ...contentData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await content.save();
    return content.toObject();
}

// Update content
export async function updateContent(userId: string, contentId: string, updates: UpdateContentRequest) {
    if (!Types.ObjectId.isValid(contentId)) {
        throw createValidationError('Invalid content ID');
    }

    const content = await Content.findOneAndUpdate(
        {
            _id: contentId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            ...updates,
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).lean();

    if (!content) {
        throw createNotFoundError('Content not found');
    }

    return content;
}

// Delete content
export async function deleteContent(userId: string, contentId: string) {
    if (!Types.ObjectId.isValid(contentId)) {
        throw createValidationError('Invalid content ID');
    }

    const content = await Content.findOneAndUpdate(
        {
            _id: contentId,
            createdBy: userId,
            archivedAt: { $exists: false }
        },
        {
            archivedAt: new Date(),
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!content) {
        throw createNotFoundError('Content not found');
    }

    return { message: 'Content deleted successfully' };
}

// Get content statistics
export async function getContentStats(userId: string) {
    const stats = await Content.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: null,
                totalContent: { $sum: 1 },
                publishedContent: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                },
                draftContent: {
                    $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                },
                averageRating: { $avg: '$rating' }
            }
        }
    ]);

    const typeBreakdown = await Content.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const categoryBreakdown = await Content.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return {
        overview: stats[0] || {
            totalContent: 0,
            publishedContent: 0,
            draftContent: 0,
            averageRating: 0
        },
        typeBreakdown,
        categoryBreakdown
    };
}

// Get content analytics
export async function getContentAnalytics(userId: string) {
    const contentTrends = await Content.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                contentAdded: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
        contentTrends,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    };
}

// Update status
export async function updateStatus(
    userId: string,
    contentId: string,
    status: 'idea' | 'draft' | 'in-review' | 'scheduled' | 'published' | 'archived'
) {
    return await updateContent(userId, contentId, { status });
}

// Toggle favorite status
export async function toggleFavorite(userId: string, contentId: string) {
    const content = await getContentItem(userId, contentId);
    return await updateContent(userId, contentId, { isFavorite: !Boolean((content as any).isFavorite) });
}

// Archive content
export async function archiveContent(userId: string, contentId: string) {
    return await updateContent(userId, contentId, { archivedAt: new Date() });
}

// Duplicate content
export async function duplicateContent(userId: string, contentId: string) {
    const originalContent = await getContentItem(userId, contentId);
    const { _id, createdAt, updatedAt, publishedAt, archivedAt, ...contentData } = originalContent as any;

    const createData: CreateContentRequest = {
        title: `${contentData.title} (Copy)`,
        description: contentData.description,
        type: contentData.type,
        status: 'draft',
        content: contentData.content,
        notes: contentData.notes,
        outline: contentData.outline,
        keywords: contentData.keywords,
        platform: contentData.platform,
        url: contentData.url,
        seoTitle: contentData.seoTitle,
        metaDescription: contentData.metaDescription,
        thumbnail: contentData.thumbnail,
        metrics: contentData.metrics,
        area: contentData.area,
        tags: contentData.tags,
        linkedProjects: (contentData.linkedProjects || []).map((id: any) => id?.toString ? id.toString() : String(id)),
        linkedGoals: (contentData.linkedGoals || []).map((id: any) => id?.toString ? id.toString() : String(id)),
        isFavorite: false
    };

    return await createContent(userId, createData);
}

// Tag operations
export async function addTags(userId: string, contentId: string, tags: string[]) {
    const content = await getContentItem(userId, contentId);
    const existingTags = content.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];
    
    return await updateContent(userId, contentId, { tags: newTags });
}

export async function removeTags(userId: string, contentId: string, tags: string[]) {
    const content = await getContentItem(userId, contentId);
    const existingTags = content.tags || [];
    const filteredTags = existingTags.filter(tag => !tags.includes(tag));
    
    return await updateContent(userId, contentId, { tags: filteredTags });
}

// Bulk operations
export async function bulkUpdateContent(userId: string, updates: { contentIds: string[], updates: any }) {
    const { contentIds, updates: updateData } = updates;
    
    const result = await Content.updateMany(
        {
            _id: { $in: contentIds },
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

export async function bulkDeleteContent(userId: string, contentIds: string[]) {
    const result = await Content.updateMany(
        {
            _id: { $in: contentIds },
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
export async function importContent(userId: string, contentData: any[]) {
    const content = contentData.map(item => ({
        ...item,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const result = await Content.insertMany(content);
    return { importedCount: result.length };
}

export async function exportContent(userId: string) {
    const content = await Content.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    return content;
}

// Note operations (placeholder - would need separate ContentNote model)
export async function addNote(userId: string, contentId: string, noteData: any) {
    // For now, just update the content's notes field
    return await updateContent(userId, contentId, { 
        notes: noteData.note 
    });
}

export async function getNotes(userId: string, contentId: string) {
    const content = await getContentItem(userId, contentId);
    return content.notes ? [{ id: 'main', note: content.notes }] : [];
}

export async function updateNote(userId: string, contentId: string, _noteId: string, updates: any) {
    return await updateContent(userId, contentId, {
        notes: updates.note
    });
}

export async function deleteNote(userId: string, contentId: string, _noteId: string) {
    return await updateContent(userId, contentId, {
        notes: undefined
    });
}

// Sharing operations (placeholder)
export async function shareContent(userId: string, contentId: string, shareData: any) {
    // TODO: Implement with separate ContentShare model
    throw createAppError('Sharing functionality not yet implemented', 501);
}

export async function getShareInfo(userId: string, contentId: string) {
    // TODO: Implement with separate ContentShare model
    return { isShared: false, shareUrl: null };
}

export async function unshareContent(userId: string, contentId: string) {
    // TODO: Implement with separate ContentShare model
    throw createAppError('Sharing functionality not yet implemented', 501);
}

// Collection operations (placeholder)
export async function createCollection(userId: string, collectionData: any) {
    // TODO: Implement with separate ContentCollection model
    throw createAppError('Collection functionality not yet implemented', 501);
}

export async function getCollections(userId: string) {
    // TODO: Implement with separate ContentCollection model
    return [];
}

export async function updateCollection(userId: string, collectionId: string, updates: any) {
    // TODO: Implement with separate ContentCollection model
    throw createAppError('Collection functionality not yet implemented', 501);
}

export async function deleteCollection(userId: string, collectionId: string) {
    // TODO: Implement with separate ContentCollection model
    throw createAppError('Collection functionality not yet implemented', 501);
}

export async function addToCollection(userId: string, collectionId: string, itemId: string) {
    // TODO: Implement with separate ContentCollection model
    throw createAppError('Collection functionality not yet implemented', 501);
}

export async function removeFromCollection(userId: string, collectionId: string, itemId: string) {
    // TODO: Implement with separate ContentCollection model
    throw createAppError('Collection functionality not yet implemented', 501);
}
