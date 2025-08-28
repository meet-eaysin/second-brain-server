import { generateId } from '@/utils/id-generator';
import { RecordModel } from '@/modules/database/models/record.model';
import {
  ITaskComment,
  ICreateCommentRequest,
  IUpdateCommentRequest
} from '../types/tasks.types';
import { createAppError } from '@/utils/error.utils';
import { UserModel } from '@/modules/users';
import {
  getObjectArrayProperty,
  getNumberProperty,
  getTaskCommentsProperty,
  getStringProperty
} from '@/modules/core/utils/type-guards';

export class CommentsService {
  // Add comment to task
  async addComment(
    taskId: string,
    data: ICreateCommentRequest,
    userId: string
  ): Promise<ITaskComment> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    // Get user info for comment
    const user = await UserModel.findById(userId).select('firstName lastName email avatar');
    if (!user) {
      throw createAppError('User not found', 404);
    }

    const commentId = generateId();
    const now = new Date();

    const comment: ITaskComment = {
      id: commentId,
      taskId,
      content: data.content,
      parentCommentId: data.parentCommentId,
      mentions: data.mentions || [],
      isResolved: false,
      createdAt: now,
      createdBy: userId,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdByAvatar: user.profilePicture,
      reactions: []
    };

    // Add comment to task
    const currentComments = getObjectArrayProperty(task.properties, 'comments');
    const updatedComments = [...currentComments, comment];
    task.properties.comments = updatedComments as any;

    // Update comment count
    const currentCount = getNumberProperty(task.properties, 'comment_count', 0);
    task.properties.comment_count = currentCount + 1;

    // Update last activity
    task.properties.last_activity = now;
    task.properties.last_activity_by = userId;

    task.markModified('properties');
    await task.save();

    // Send notifications to mentioned users
    if (data.mentions && data.mentions.length > 0) {
      await this.sendMentionNotifications(taskId, commentId, data.mentions, userId);
    }

    // Send notification for comment reply
    if (data.parentCommentId) {
      await this.sendReplyNotification(taskId, commentId, data.parentCommentId, userId);
    }

    return comment;
  }

  // Get comments for a task
  async getComments(
    taskId: string,
    _userId: string, // Reserved for future permission checks
    options: {
      includeResolved?: boolean;
      parentOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ comments: ITaskComment[]; total: number }> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    let comments = getTaskCommentsProperty(task.properties);

    // Filter resolved comments
    if (!options.includeResolved) {
      comments = comments.filter((comment) => !comment.isResolved);
    }

    // Filter to parent comments only
    if (options.parentOnly) {
      comments = comments.filter((comment) => !comment.parentCommentId);
    }

    // Sort by creation date (newest first)
    comments.sort((a, b) => {
      const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    const total = comments.length;

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      comments = comments.slice(offset, offset + options.limit);
    }

    // Build comment tree (nest replies under parent comments)
    const commentTree = this.buildCommentTree(comments.map(c => this.convertToTaskComment(c)));

    return {
      comments: commentTree,
      total
    };
  }

  // Get comment by ID
  async getCommentById(
    taskId: string,
    commentId: string,
    _userId: string // Reserved for future permission checks
  ): Promise<ITaskComment> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    const comments = getTaskCommentsProperty(task.properties);
    const comment = comments.find((c) => c.id === commentId);

    if (!comment) {
      throw createAppError('Comment not found', 404);
    }

    // Convert the database object to proper ITaskComment type
    return this.convertToTaskComment(comment);
  }

  // Update comment
  async updateComment(
    taskId: string,
    commentId: string,
    data: IUpdateCommentRequest,
    userId: string
  ): Promise<ITaskComment> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    const comments = getTaskCommentsProperty(task.properties);
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw createAppError('Comment not found', 404);
    }

    const comment = comments[commentIndex];

    // Check permissions
    if (comment.createdBy !== userId) {
      throw createAppError('You can only edit your own comments', 403);
    }

    // Update comment
    if (data.content) comment.content = data.content;
    if (data.isResolved !== undefined) comment.isResolved = data.isResolved;

    comment.updatedAt = new Date();
    comment.updatedBy = userId;

    // If resolving/unresolving, track who did it
    if (data.isResolved !== undefined) {
      if (data.isResolved) {
        comment.resolvedAt = new Date();
        comment.resolvedBy = userId;
      } else {
        delete comment.resolvedAt;
        delete comment.resolvedBy;
      }
    }

    task.markModified('properties');
    await task.save();

    return this.convertToTaskComment(comment);
  }

  // Delete comment
  async deleteComment(
    taskId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    const comments = getTaskCommentsProperty(task.properties);
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw createAppError('Comment not found', 404);
    }

    const comment = comments[commentIndex];

    // Check permissions
    if (comment.createdBy !== userId) {
      throw createAppError('You can only delete your own comments', 403);
    }

    // Remove comment and all its replies
    const commentsToRemove = this.getCommentAndReplies(comments.map(c => this.convertToTaskComment(c)), commentId);

    // Filter out the comments to remove
    const updatedComments = comments.filter((c) =>
      !commentsToRemove.includes(c.id)
    );
    task.properties.comments = updatedComments as any;

    // Update comment count
    const currentCount = getNumberProperty(task.properties, 'comment_count', 0);
    task.properties.comment_count = currentCount - commentsToRemove.length;

    task.markModified('properties');
    await task.save();
  }

  // Add reaction to comment
  async addReaction(
    taskId: string,
    commentId: string,
    emoji: string,
    userId: string
  ): Promise<ITaskComment> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    const comments = getTaskCommentsProperty(task.properties);
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw createAppError('Comment not found', 404);
    }

    const comment = comments[commentIndex];

    // Get user info
    const user = await UserModel.findById(userId).select('firstName lastName');
    if (!user) {
      throw createAppError('User not found', 404);
    }

    // Check if user already reacted with this emoji
    const reactions = Array.isArray(comment.reactions) ? comment.reactions : [];
    const existingReaction = reactions.find((r: any) =>
      r.emoji === emoji && r.userId === userId
    );

    if (existingReaction) {
      throw createAppError('You have already reacted with this emoji', 400);
    }

    // Add reaction
    const newReaction = {
      emoji,
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date()
    };

    const updatedReactions = [...reactions, newReaction];
    const updatedComment = { ...comment, reactions: updatedReactions };

    // Update the comments array
    const updatedComments = [...comments];
    updatedComments[commentIndex] = updatedComment;
    task.properties.comments = updatedComments as any;

    task.markModified('properties');
    await task.save();

    return this.convertToTaskComment(updatedComment);
  }

  // Remove reaction from comment
  async removeReaction(
    taskId: string,
    commentId: string,
    emoji: string,
    userId: string
  ): Promise<ITaskComment> {
    const task = await RecordModel.findById(taskId);
    if (!task) {
      throw createAppError('Task not found', 404);
    }

    const comments = getTaskCommentsProperty(task.properties);
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      throw createAppError('Comment not found', 404);
    }

    const comment = comments[commentIndex];

    // Remove reaction
    const reactions = Array.isArray(comment.reactions) ? comment.reactions : [];
    const updatedReactions = reactions.filter((r: any) =>
      !(r.emoji === emoji && r.userId === userId)
    );

    const updatedComment = { ...comment, reactions: updatedReactions };

    // Update the comments array
    const updatedComments = [...comments];
    updatedComments[commentIndex] = updatedComment;
    task.properties.comments = updatedComments as any;

    task.markModified('properties');
    await task.save();

    return this.convertToTaskComment(updatedComment);
  }

  // Build comment tree (nest replies under parent comments)
  private buildCommentTree(comments: ITaskComment[]): ITaskComment[] {
    const commentMap = new Map<string, ITaskComment>();
    const rootComments: ITaskComment[] = [];

    // First pass: create map and identify root comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parentCommentId) {
        rootComments.push(commentMap.get(comment.id)!);
      }
    });

    // Second pass: nest replies under parent comments
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentMap.get(comment.id)!);
        }
      }
    });

    return rootComments;
  }

  // Get comment and all its replies recursively
  private getCommentAndReplies(comments: ITaskComment[], commentId: string): string[] {
    const result = [commentId];

    // Find all replies to this comment
    const replies = comments.filter((c: ITaskComment) => c.parentCommentId === commentId);

    // Recursively get replies of replies
    replies.forEach(reply => {
      result.push(...this.getCommentAndReplies(comments, reply.id));
    });

    return result;
  }

  // Send notifications to mentioned users
  private async sendMentionNotifications(
    taskId: string,
    commentId: string,
    mentions: string[],
    mentionedBy: string
  ): Promise<void> {
    try {
      const { createMentionNotification } = await import('@/modules/system/services/notifications.service');

      // Get task details for context
      const task = await RecordModel.findById(taskId);
      if (!task) return;

      const taskName = getStringProperty(task.properties, 'name', 'Untitled Task');

      // Get database to find workspaceId
      const { DatabaseModel } = await import('@/modules/database/models/database.model');
      const database = await DatabaseModel.findById(task.databaseId);
      const workspaceId = database?.workspaceId || 'default';

      // Send notification to each mentioned user
      for (const mentionedUserId of mentions) {
        if (mentionedUserId === mentionedBy) continue; // Don't notify the person who mentioned

        await createMentionNotification({
          mentionedUserId,
          mentionedByUserId: mentionedBy,
          entityId: taskId,
          entityType: 'task',
          context: `comment on "${taskName}"`,
          workspaceId
        });
      }
    } catch (error) {
      console.error('Failed to send mention notifications:', error);
    }
  }

  // Send notification for comment reply
  private async sendReplyNotification(
    taskId: string,
    commentId: string,
    parentCommentId: string,
    repliedBy: string
  ): Promise<void> {
    try {
      const { createNotification } = await import('@/modules/system/services/notifications.service');
      const { ENotificationType, ENotificationPriority, ENotificationMethod } = await import('@/modules/system/types/notifications.types');

      // Get task details
      const task = await RecordModel.findById(taskId);
      if (!task) return;

      // Find the parent comment to get the original commenter
      const comments = getObjectArrayProperty(task.properties, 'comments');
      const parentComment = comments.find((c: any) => c.id === parentCommentId);
      if (!parentComment || parentComment.createdBy === repliedBy) return;

      const taskName = getStringProperty(task.properties, 'name', 'Untitled Task');

      // Get database to find workspaceId
      const { DatabaseModel } = await import('@/modules/database/models/database.model');
      const database = await DatabaseModel.findById(task.databaseId);
      const workspaceId = database?.workspaceId || 'default';

      await createNotification({
        type: ENotificationType.COMMENT,
        priority: ENotificationPriority.LOW,
        title: 'New reply to your comment',
        message: `Someone replied to your comment on "${taskName}"`,
        userId: String(parentComment.createdBy),
        workspaceId,
        entityId: taskId,
        entityType: 'task',
        metadata: {
          commentId,
          parentCommentId,
          repliedBy,
          taskName
        },
        methods: [ENotificationMethod.IN_APP]
      });
    } catch (error) {
      console.error('Failed to send reply notification:', error);
    }
  }

  // Convert database comment object to ITaskComment interface
  private convertToTaskComment(comment: Record<string, unknown> & {
    id: string;
    taskId: string;
    content: unknown[];
    isResolved: boolean;
    createdAt: Date | string;
    createdBy: string;
    createdByName: string;
  }): ITaskComment {
    return {
      id: comment.id,
      taskId: comment.taskId,
      content: comment.content as any, // Content is stored as mixed type, trust the structure
      parentCommentId: comment.parentCommentId as string | undefined,
      mentions: Array.isArray(comment.mentions) ? comment.mentions as string[] : [],
      isResolved: comment.isResolved,
      resolvedAt: comment.resolvedAt as Date | undefined,
      resolvedBy: comment.resolvedBy as string | undefined,
      createdAt: typeof comment.createdAt === 'string' ? new Date(comment.createdAt) : comment.createdAt,
      createdBy: comment.createdBy,
      createdByName: comment.createdByName,
      createdByAvatar: comment.createdByAvatar as string | undefined,
      updatedAt: comment.updatedAt as Date | undefined,
      updatedBy: comment.updatedBy as string | undefined,
      reactions: Array.isArray(comment.reactions) ? comment.reactions as any : [],
      replies: Array.isArray(comment.replies) ? comment.replies as any : undefined
    };
  }
}

export const commentsService = new CommentsService();
