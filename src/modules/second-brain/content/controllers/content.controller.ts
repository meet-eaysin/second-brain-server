import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Content, Project, Goal, Person } from '../second-brain';

// Get all content with pipeline filtering
export const getContent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
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

    const [content, total] = await Promise.all([
        Content.find(filter)
            .populate('collaborators', 'firstName lastName')
            .populate('linkedProjects', 'title status')
            .populate('linkedGoals', 'title type')
            .sort({ status: 1, scheduledDate: 1, updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Content.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            content,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single content item
export const getContentItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const content = await Content.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('collaborators', 'firstName lastName email')
    .populate('linkedProjects', 'title status area')
    .populate('linkedGoals', 'title type status');

    if (!content) {
        throw createAppError('Content not found', 404);
    }

    res.status(200).json({
        success: true,
        data: content
    });
});

// Create content item
export const createContent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const content = await Content.create({
        ...req.body,
        createdBy: userId
    });

    const populatedContent = await Content.findById(content._id)
        .populate('collaborators', 'firstName lastName')
        .populate('linkedProjects', 'title status')
        .populate('linkedGoals', 'title type');

    res.status(201).json({
        success: true,
        data: populatedContent
    });
});

// Update content item
export const updateContent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const content = await Content.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    ).populate('collaborators', 'firstName lastName')
     .populate('linkedProjects', 'title status')
     .populate('linkedGoals', 'title type');

    if (!content) {
        throw createAppError('Content not found', 404);
    }

    // Handle status changes
    if (req.body.status === 'published' && !content.publishedAt) {
        content.publishedAt = new Date();
        await content.save();
    }

    res.status(200).json({
        success: true,
        data: content
    });
});

// Delete content item
export const deleteContent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
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
export const getPipelineOverview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

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
export const getContentAnalytics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

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
