import { Request, Response } from 'express';
import { catchAsync, createAppError, sendSuccessResponse } from '../../../../utils';
import { TJwtPayload } from '../../../users/types/user.types';
import * as contentService from '../services/content.service';
import { Content } from '../models/content.model';
import type { UpdateStatusRequest } from '../types';

interface AuthenticatedRequest extends Request {
    user?: TJwtPayload & { userId: string };
}

// Get all content with pipeline filtering
export const getContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const {
        type,
        status,
        platform,
        area,
        tags,
        search,
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
    if (status) filter.status = status;
    if (platform) filter.platform = { $in: Array.isArray(platform) ? platform : [platform] };
    if (area) filter.area = area;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    if (search) {
        filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const filters = {
        type: type as string,
        status: status as string,
        platform: platform as string | string[],
        area: area as string,
        tags: tags as string | string[],
        search: search as string
    };

    const options = {
        page: Number(page),
        limit: Number(limit),
        populate: ['collaborators', 'linkedProjects', 'linkedGoals']
    };

    const result = await contentService.getContent(userId, filters, options);
    sendSuccessResponse(res, 'Content retrieved successfully', result);
});

// Get single content item
export const getContentItem = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const content = await contentService.getContentItem(userId, id);
    sendSuccessResponse(res, 'Content item retrieved successfully', content);
});

// Create content item
export const createContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const content = await contentService.createContent(userId, req.body);
    sendSuccessResponse(res, 'Content created successfully', content, 201);
});

// Update content item
export const updateContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const content = await contentService.updateContent(userId, id, req.body);
    sendSuccessResponse(res, 'Content updated successfully', content);
});

// Delete content item
export const deleteContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const content = await Content.findOneAndDelete({
        _id: id,
        createdBy: userId
    });

    if (!content) {
        throw createAppError('Content not found', 404);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// Get content pipeline overview
export const getPipelineOverview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    const content = await Content.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    const pipeline = {
        idea: content.filter(c => c.status === 'idea').length,
        draft: content.filter(c => c.status === 'draft').length,
        inReview: content.filter(c => c.status === 'in-review').length,
        scheduled: content.filter(c => c.status === 'scheduled').length,
        published: content.filter(c => c.status === 'published').length,
        total: content.length
    };

    const upcomingScheduled = content.filter(c =>
        c.status === 'scheduled' &&
        c.scheduledDate &&
        new Date(c.scheduledDate) > new Date()
    ).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

    res.status(200).json({
        success: true,
        data: {
            pipeline,
            upcomingScheduled: upcomingScheduled.slice(0, 5)
        }
    });
});

// Get content analytics
export const getContentAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    const content = await Content.find({
        createdBy: userId,
        status: 'published',
        archivedAt: { $exists: false }
    });

    const analytics = {
        totalPublished: content.length,
        totalViews: content.reduce((sum, c) => sum + (c.metrics?.views || 0), 0),
        totalLikes: content.reduce((sum, c) => sum + (c.metrics?.likes || 0), 0),
        totalShares: content.reduce((sum, c) => sum + (c.metrics?.shares || 0), 0),
        totalRevenue: content.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0),
        byType: content.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byPlatform: content.reduce((acc, c) => {
            c.platform?.forEach(p => {
                acc[p] = (acc[p] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>),
        topPerforming: content
            .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
            .slice(0, 5)
            .map(c => ({
                id: c._id,
                title: c.title,
                type: c.type,
                views: c.metrics?.views || 0,
                engagement: c.metrics?.engagement || 0
            }))
    };

    res.status(200).json({
        success: true,
        data: analytics
    });
});

// Content stats
export const getContentStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const result = await contentService.getContentStats(userId);
    res.status(200).json({ success: true, data: result });
});

// Import/Export
export const importContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const items = (req.body && (req.body.content || req.body.items || req.body)) as any[];
    const result = await contentService.importContent(userId, Array.isArray(items) ? items : []);
    res.status(200).json({ success: true, data: result });
});

export const exportContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const result = await contentService.exportContent(userId);
    res.status(200).json({ success: true, data: result });
});

// Bulk operations
export const bulkUpdateContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const result = await contentService.bulkUpdateContent(userId, req.body);
    res.status(200).json({ success: true, data: result });
});

export const bulkDeleteContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);
    const { contentIds } = req.body as { contentIds: string[] };
    const result = await contentService.bulkDeleteContent(userId, contentIds || []);
    res.status(200).json({ success: true, data: result });
});

// Status & favorite & archive & duplicate
export const updateStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw createAppError('User not authenticated', 401);

    const { id } = req.params;
    const { status } = req.body as UpdateStatusRequest;

    const result = await contentService.updateStatus(userId, id, status);
    sendSuccessResponse(res, 'Content status updated successfully', result);
});

export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.toggleFavorite(userId, id);
    res.status(200).json({ success: true, data: result });
});

export const archiveContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.archiveContent(userId, id);
    res.status(200).json({ success: true, data: result });
});

export const duplicateContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.duplicateContent(userId, id);
    res.status(201).json({ success: true, data: result });
});


// Tags
export const addTags = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const { tags } = req.body as { tags: string[] };
    const result = await contentService.addTags(userId, id, tags || []);
    res.status(200).json({ success: true, data: result });
});

export const removeTags = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const { tags } = req.body as { tags: string[] };
    const result = await contentService.removeTags(userId, id, tags || []);
    res.status(200).json({ success: true, data: result });
});

// Notes
export const addNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.addNote(userId, id, req.body);
    res.status(201).json({ success: true, data: result });
});

export const getNotes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.getNotes(userId, id);
    res.status(200).json({ success: true, data: result });
});

export const updateNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { contentId, noteId } = req.params; const result = await contentService.updateNote(userId, contentId, noteId, req.body);
    res.status(200).json({ success: true, data: result });
});

export const deleteNote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { contentId, noteId } = req.params; const result = await contentService.deleteNote(userId, contentId, noteId);
    res.status(200).json({ success: true, data: result });
});

// Sharing
export const shareContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.shareContent(userId, id, req.body);
    res.status(200).json({ success: true, data: result });
});

export const getShareInfo = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.getShareInfo(userId, id);
    res.status(200).json({ success: true, data: result });
});

export const unshareContent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { id } = req.params; const result = await contentService.unshareContent(userId, id);
    res.status(200).json({ success: true, data: result });
});

// Collections
export const createCollection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const result = await contentService.createCollection(userId, req.body);
    res.status(201).json({ success: true, data: result });
});

export const getCollections = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const result = await contentService.getCollections(userId);
    res.status(200).json({ success: true, data: result });
});

export const updateCollection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { collectionId } = req.params; const result = await contentService.updateCollection(userId, collectionId, req.body);
    res.status(200).json({ success: true, data: result });
});

export const deleteCollection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { collectionId } = req.params; const result = await contentService.deleteCollection(userId, collectionId);
    res.status(200).json({ success: true, data: result });
});

export const addToCollection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { collectionId } = req.params; const { itemId } = req.body as { itemId: string };
    const result = await contentService.addToCollection(userId, collectionId, itemId);
    res.status(200).json({ success: true, data: result });
});

export const removeFromCollection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId; if (!userId) throw createAppError('User not authenticated', 401);
    const { collectionId, itemId } = req.params; const result = await contentService.removeFromCollection(userId, collectionId, itemId);
    res.status(200).json({ success: true, data: result });
});
