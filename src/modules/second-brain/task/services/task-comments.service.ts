import { Task } from '../models/task.model';
import { createNotFoundError, createValidationError, createForbiddenError } from '@/utils';
import { Types } from 'mongoose';

export interface TaskComment {
    _id?: string;
    content: string;
    author: string; // User ID
    createdAt: Date;
    updatedAt?: Date;
    isEdited?: boolean;
    mentions?: string[]; // User IDs mentioned in the comment
    attachments?: {
        type: 'file' | 'image' | 'link';
        url: string;
        name: string;
        size?: number;
    }[];
}

export interface CreateCommentRequest {
    content: string;
    mentions?: string[];
    attachments?: TaskComment['attachments'];
}

export interface UpdateCommentRequest {
    content?: string;
    mentions?: string[];
    attachments?: TaskComment['attachments'];
}

export const addComment = async (userId: string, taskId: string, commentData: CreateCommentRequest) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    if (!commentData.content || commentData.content.trim().length === 0) {
        throw createValidationError('Comment content is required');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comment: TaskComment = {
        _id: new Types.ObjectId().toString(),
        content: commentData.content.trim(),
        author: userId,
        createdAt: new Date(),
        mentions: commentData.mentions || [],
        attachments: commentData.attachments || []
    };

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $push: {
                'comments': comment
            }
        },
        { new: true }
    );

    return {
        task: updatedTask,
        comment
    };
};

export const getComments = async (userId: string, taskId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | '-createdAt';
} = {}) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const { page = 1, limit = 20, sortBy = '-createdAt' } = options;

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comments = task.comments || [];
    
    // Sort comments
    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'createdAt') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    const total = comments.length;
    const totalPages = Math.ceil(total / limit);

    return {
        comments: paginatedComments,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

export const updateComment = async (userId: string, taskId: string, commentId: string, updates: UpdateCommentRequest) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    if (!commentId) {
        throw createValidationError('Comment ID is required');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comments = task.comments || [];
    const commentIndex = comments.findIndex(comment => comment._id?.toString() === commentId);

    if (commentIndex === -1) {
        throw createNotFoundError('Comment not found');
    }

    const comment = comments[commentIndex];

    // Check if user is the author of the comment
    if (comment.author !== userId) {
        throw createForbiddenError('You can only edit your own comments');
    }

    // Update comment fields
    if (updates.content !== undefined) {
        if (!updates.content || updates.content.trim().length === 0) {
            throw createValidationError('Comment content cannot be empty');
        }
        comment.content = updates.content.trim();
        comment.isEdited = true;
        comment.updatedAt = new Date();
    }

    if (updates.mentions !== undefined) {
        comment.mentions = updates.mentions;
    }

    if (updates.attachments !== undefined) {
        comment.attachments = updates.attachments;
    }

    // Update the task with modified comment
    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: {
                [`comments.${commentIndex}`]: comment
            }
        },
        { new: true }
    );

    return {
        task: updatedTask,
        comment
    };
};

export const deleteComment = async (userId: string, taskId: string, commentId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    if (!commentId) {
        throw createValidationError('Comment ID is required');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comments = task.comments || [];
    const commentIndex = comments.findIndex(comment => comment._id?.toString() === commentId);

    if (commentIndex === -1) {
        throw createNotFoundError('Comment not found');
    }

    const comment = comments[commentIndex];

    // Check if user is the author of the comment or the task owner
    if (comment.author !== userId && task.createdBy.toString() !== userId) {
        throw createForbiddenError('You can only delete your own comments or comments on your tasks');
    }

    // Remove the comment
    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $pull: {
                comments: { _id: commentId }
            }
        },
        { new: true }
    );

    return {
        task: updatedTask,
        deletedComment: comment
    };
};

export const getCommentById = async (userId: string, taskId: string, commentId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    if (!commentId) {
        throw createValidationError('Comment ID is required');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comment = (task.comments || []).find(comment => comment._id?.toString() === commentId);

    if (!comment) {
        throw createNotFoundError('Comment not found');
    }

    return comment;
};

export const searchComments = async (userId: string, taskId: string, searchQuery: string, options: {
    page?: number;
    limit?: number;
} = {}) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    if (!searchQuery || searchQuery.trim().length === 0) {
        throw createValidationError('Search query is required');
    }

    const { page = 1, limit = 20 } = options;

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comments = task.comments || [];
    
    // Filter comments based on search query
    const searchRegex = new RegExp(searchQuery.trim(), 'i');
    const filteredComments = comments.filter(comment => 
        searchRegex.test(comment.content)
    );

    // Sort by relevance (most recent first)
    const sortedComments = filteredComments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    const total = filteredComments.length;
    const totalPages = Math.ceil(total / limit);

    return {
        comments: paginatedComments,
        searchQuery,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

export const getCommentStats = async (userId: string, taskId: string) => {
    if (!Types.ObjectId.isValid(taskId)) {
        throw createValidationError('Invalid task ID');
    }

    const task = await Task.findOne({
        _id: taskId,
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!task) {
        throw createNotFoundError('Task not found');
    }

    const comments = task.comments || [];
    
    const stats = {
        totalComments: comments.length,
        totalAuthors: new Set(comments.map(c => c.author)).size,
        latestComment: comments.length > 0 ? comments.reduce((latest, comment) => 
            new Date(comment.createdAt) > new Date(latest.createdAt) ? comment : latest
        ) : null,
        commentsWithAttachments: comments.filter(c => c.attachments && c.attachments.length > 0).length,
        commentsWithMentions: comments.filter(c => c.mentions && c.mentions.length > 0).length,
        editedComments: comments.filter(c => c.isEdited).length
    };

    return stats;
};
