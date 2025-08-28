import { RecordModel } from '@/modules/database/models/record.model';
import { notesService } from './notes.service';
import {
  INoteBlockComment,
  INoteCollaborator,
  ECollaboratorRole
} from '../types/notes.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class NoteCollaborationService {

  async addComment(noteId: string, data: {
    blockId?: string;
    content: string;
    parentCommentId?: string;
  }, userId: string): Promise<INoteBlockComment> {
    try {
      const note = await RecordModel.findOne({
        _id: noteId,
        isDeleted: { $ne: true }
      }).exec();

      if (!note) {
        throw createNotFoundError('Note', noteId);
      }

      // Check if comments are allowed
      if (!note.properties['Allow Comments']) {
        throw createForbiddenError('Comments are not allowed on this note');
      }

      // Check permission to comment
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        noteId,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to comment on this note');
      }

      const comment: INoteBlockComment = {
        id: generateId(),
        blockId: data.blockId,
        content: data.content,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentCommentId: data.parentCommentId,
        replies: [],
        reactions: [],
        isResolved: false
      };

      // Add comment to note
      const updatePath = data.blockId
        ? 'content.$[block].comments'
        : 'comments';

      const updateQuery = data.blockId
        ? {
            $push: { [updatePath]: comment },
            lastEditedAt: new Date(),
            lastEditedBy: userId
          }
        : {
            $push: { comments: comment },
            lastEditedAt: new Date(),
            lastEditedBy: userId
          };

      const arrayFilters = data.blockId
        ? [{ 'block.id': data.blockId }]
        : undefined;

      await RecordModel.findByIdAndUpdate(
        noteId,
        updateQuery,
        { arrayFilters }
      );

      // Send notification to note owner and other collaborators
      await this.sendCommentNotification(noteId, comment, userId);

      return comment;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to add comment: ${error.message}`, 500);
    }
  }

  async getComments(noteId: string, blockId?: string, userId?: string): Promise<INoteBlockComment[]> {
    try {
      const note = await RecordModel.findOne({
        _id: noteId,
        isDeleted: { $ne: true }
      }).exec();

      if (!note) {
        throw createNotFoundError('Note', noteId);
      }

      // Check permission to read comments
      if (userId) {
        const hasPermission = await permissionService.hasPermission(
          EShareScope.RECORD,
          noteId,
          userId,
          EPermissionLevel.READ
        );

        if (!hasPermission) {
          throw createForbiddenError('Insufficient permissions to view comments');
        }
      }

      if (blockId) {
        // Get comments for specific block
        const block = note.content?.find((b: any) => b.id === blockId);
        return (block as any)?.comments || [];
      } else {
        // Get all note-level comments
        return (note as any).comments || [];
      }
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get comments: ${error.message}`, 500);
    }
  }

  async updateComment(noteId: string, commentId: string, data: {
    content?: string;
  }, userId: string): Promise<INoteBlockComment> {
    try {
      const note = await RecordModel.findOne({
        _id: noteId,
        isDeleted: { $ne: true }
      }).exec();

      if (!note) {
        throw createNotFoundError('Note', noteId);
      }

      // Find the comment and check ownership
      let comment: INoteBlockComment | undefined;
      let updatePath = '';

      // Check note-level comments
      const noteComments = (note as any).comments || [];
      comment = noteComments.find((c: INoteBlockComment) => c.id === commentId);
      if (comment) {
        updatePath = 'comments.$.content';
      }

      // Check block-level comments if not found
      if (!comment && note.content) {
        for (let i = 0; i < note.content.length; i++) {
          const block = note.content[i] as any;
          if (block.comments) {
            const blockComment = block.comments.find((c: INoteBlockComment) => c.id === commentId);
            if (blockComment) {
              comment = blockComment;
              updatePath = `content.${i}.comments.$.content`;
              break;
            }
          }
        }
      }

      if (!comment) {
        throw createNotFoundError('Comment', commentId);
      }

      // Check if user owns the comment
      if (comment.authorId !== userId) {
        throw createForbiddenError('You can only edit your own comments');
      }

      // Update comment
      await RecordModel.findOneAndUpdate(
        { _id: noteId, [`${updatePath.replace('.$.content', '.id')}`]: commentId },
        {
          $set: {
            [updatePath]: data.content,
            [`${updatePath.replace('.content', '.updatedAt')}`]: new Date()
          }
        }
      );

      return {
        ...comment,
        content: data.content || comment.content,
        updatedAt: new Date()
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update comment: ${error.message}`, 500);
    }
  }

  async deleteComment(noteId: string, commentId: string, userId: string): Promise<void> {
    try {
      const note = await RecordModel.findOne({
        _id: noteId,
        isDeleted: { $ne: true }
      }).exec();

      if (!note) {
        throw createNotFoundError('Note', noteId);
      }

      // Find and remove the comment
      let found = false;

      // Check note-level comments
      const noteComments = (note as any).comments || [];
      const noteCommentIndex = noteComments.findIndex((c: INoteBlockComment) => c.id === commentId);
      if (noteCommentIndex !== -1) {
        const comment = noteComments[noteCommentIndex];
        if (comment.authorId !== userId) {
          throw createForbiddenError('You can only delete your own comments');
        }

        await RecordModel.findByIdAndUpdate(noteId, {
          $pull: { comments: { id: commentId } }
        });
        found = true;
      }

      // Check block-level comments if not found
      if (!found && note.content) {
        for (let i = 0; i < note.content.length; i++) {
          const block = note.content[i] as any;
          if (block.comments) {
            const commentIndex = block.comments.findIndex((c: INoteBlockComment) => c.id === commentId);
            if (commentIndex !== -1) {
              const comment = block.comments[commentIndex];
              if (comment.authorId !== userId) {
                throw createForbiddenError('You can only delete your own comments');
              }

              await RecordModel.findByIdAndUpdate(noteId, {
                $pull: { [`content.${i}.comments`]: { id: commentId } }
              });
              found = true;
              break;
            }
          }
        }
      }

      if (!found) {
        throw createNotFoundError('Comment', commentId);
      }
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete comment: ${error.message}`, 500);
    }
  }

  async addReaction(noteId: string, commentId: string, data: {
    emoji: string;
  }, userId: string): Promise<void> {
    try {
      const note = await RecordModel.findOne({
        _id: noteId,
        isDeleted: { $ne: true }
      }).exec();

      if (!note) {
        throw createNotFoundError('Note', noteId);
      }

      // Check permission to react
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        noteId,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to react to comments');
      }

      const reaction = {
        emoji: data.emoji,
        userId,
        createdAt: new Date()
      };

      // Add reaction to comment (try both note-level and block-level)
      await RecordModel.findOneAndUpdate(
        {
          _id: noteId,
          $or: [
            { 'comments.id': commentId },
            { 'content.comments.id': commentId }
          ]
        },
        {
          $push: {
            'comments.$[comment].reactions': reaction,
            'content.$[].comments.$[comment].reactions': reaction
          }
        },
        {
          arrayFilters: [{ 'comment.id': commentId }]
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to add reaction: ${error.message}`, 500);
    }
  }

  async removeReaction(noteId: string, commentId: string, data: {
    emoji: string;
  }, userId: string): Promise<void> {
    try {
      await RecordModel.findOneAndUpdate(
        {
          _id: noteId,
          $or: [
            { 'comments.id': commentId },
            { 'content.comments.id': commentId }
          ]
        },
        {
          $pull: {
            'comments.$[comment].reactions': { emoji: data.emoji, userId },
            'content.$[].comments.$[comment].reactions': { emoji: data.emoji, userId }
          }
        },
        {
          arrayFilters: [{ 'comment.id': commentId }]
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to remove reaction: ${error.message}`, 500);
    }
  }

  async resolveComment(noteId: string, commentId: string, userId: string): Promise<void> {
    try {
      await RecordModel.findOneAndUpdate(
        {
          _id: noteId,
          $or: [
            { 'comments.id': commentId },
            { 'content.comments.id': commentId }
          ]
        },
        {
          $set: {
            'comments.$[comment].isResolved': true,
            'comments.$[comment].resolvedAt': new Date(),
            'comments.$[comment].resolvedBy': userId,
            'content.$[].comments.$[comment].isResolved': true,
            'content.$[].comments.$[comment].resolvedAt': new Date(),
            'content.$[].comments.$[comment].resolvedBy': userId
          }
        },
        {
          arrayFilters: [{ 'comment.id': commentId }]
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to resolve comment: ${error.message}`, 500);
    }
  }

  async unresolveComment(noteId: string, commentId: string, userId: string): Promise<void> {
    try {
      await RecordModel.findOneAndUpdate(
        {
          _id: noteId,
          $or: [
            { 'comments.id': commentId },
            { 'content.comments.id': commentId }
          ]
        },
        {
          $set: {
            'comments.$[comment].isResolved': false,
            'content.$[].comments.$[comment].isResolved': false
          },
          $unset: {
            'comments.$[comment].resolvedAt': '',
            'comments.$[comment].resolvedBy': '',
            'content.$[].comments.$[comment].resolvedAt': '',
            'content.$[].comments.$[comment].resolvedBy': ''
          }
        },
        {
          arrayFilters: [{ 'comment.id': commentId }]
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to unresolve comment: ${error.message}`, 500);
    }
  }

  async shareNote(noteId: string, data: {
    userIds: string[];
    role: ECollaboratorRole;
    message?: string;
  }, userId: string): Promise<void> {
    try {
      const note = await notesService.getNoteById(noteId, userId);

      // Check if user can share this note
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        noteId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to share this note');
      }

      // Add users to core list
      const currentSharedWith = note.sharedWith || [];
      const newSharedWith = [...new Set([...currentSharedWith, ...data.userIds])];

      await RecordModel.findByIdAndUpdate(noteId, {
        'properties.Shared With': newSharedWith,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      });

      // Send sharing notifications
      await this.sendSharingNotifications(noteId, data.userIds, data.message, userId);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to share note: ${error.message}`, 500);
    }
  }

  async unshareNote(noteId: string, data: {
    userIds: string[];
  }, userId: string): Promise<void> {
    try {
      const note = await notesService.getNoteById(noteId, userId);

      // Check if user can unshare this note
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        noteId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to unshare this note');
      }

      // Remove users from core list
      const currentSharedWith = note.sharedWith || [];
      const newSharedWith = currentSharedWith.filter(id => !data.userIds.includes(id));

      await RecordModel.findByIdAndUpdate(noteId, {
        'properties.Shared With': newSharedWith,
        lastEditedAt: new Date(),
        lastEditedBy: userId
      });
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to unshare note: ${error.message}`, 500);
    }
  }

  // Helper methods
  private async sendCommentNotification(noteId: string, comment: INoteBlockComment, userId: string): Promise<void> {
    try {
      const { createNotification } = await import('@/modules/system/services/notifications.service');
      const { ENotificationType, ENotificationPriority } = await import('@/modules/system/types/notifications.types');

      const note = await notesService.getNoteById(noteId, userId);

      // Notify note owner if different from commenter
      if (note.createdBy !== userId) {
        await createNotification({
          type: ENotificationType.COMMENT,
          title: 'New comment on your note',
          message: `${comment.content.substring(0, 100)}...`,
          userId: note.createdBy,
          workspaceId: 'default', // You might want to get this from the note or user context
          priority: ENotificationPriority.MEDIUM,
          metadata: {
            noteId,
            commentId: comment.id,
            noteTitle: note.title
          }
        });
      }

      // Notify other collaborators
      const collaborators = note.sharedWith || [];
      for (const collaboratorId of collaborators) {
        if (collaboratorId !== userId) {
          await createNotification({
            type: ENotificationType.COMMENT,
            title: 'New comment on core note',
            message: `${comment.content.substring(0, 100)}...`,
            userId: collaboratorId,
            workspaceId: 'default',
            priority: ENotificationPriority.LOW,
            metadata: {
              noteId,
              commentId: comment.id,
              noteTitle: note.title
            }
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the comment creation
      console.error('Failed to send comment notification:', error);
    }
  }

  private async sendSharingNotifications(noteId: string, userIds: string[], message: string | undefined, userId: string): Promise<void> {
    try {
      const { createNotification } = await import('@/modules/system/services/notifications.service');
      const { ENotificationType, ENotificationPriority } = await import('@/modules/system/types/notifications.types');

      const note = await notesService.getNoteById(noteId, userId);

      for (const targetUserId of userIds) {
        await createNotification({
          type: ENotificationType.COLLABORATION,
          title: 'Note core with you',
          message: message || `"${note.title}" has been shared with you`,
          userId: targetUserId,
          workspaceId: 'default',
          priority: ENotificationPriority.MEDIUM,
          metadata: {
            noteId,
            noteTitle: note.title,
            sharedBy: userId
          }
        });
      }
    } catch (error) {
      // Log error but don't fail the sharing
      console.error('Failed to send sharing notifications:', error);
    }
  }
}

export const noteCollaborationService = new NoteCollaborationService();
export default noteCollaborationService;
