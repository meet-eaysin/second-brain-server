import { EventEmitter } from 'events';
import { IEditorOperation } from './rich-editor.service';
import { generateId } from '@/utils/id-generator';
import { createNotFoundError } from '@/utils/response.utils';

export interface ICollaborationSession {
  id: string;
  recordId: string;
  participants: IParticipant[];
  operations: IEditorOperation[];
  version: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface IParticipant {
  userId: string;
  userName: string;
  cursor?: {
    blockId: string;
    position: number;
  };
  selection?: {
    blockId: string;
    start: number;
    end: number;
  };
  color: string;
  joinedAt: Date;
  lastSeen: Date;
  isActive: boolean;
}

export interface ICursorUpdate {
  userId: string;
  blockId: string;
  position: number;
  timestamp: number;
}

export interface ISelectionUpdate {
  userId: string;
  blockId: string;
  start: number;
  end: number;
  timestamp: number;
}

export interface IOperationalTransform {
  operation: IEditorOperation;
  transformedOperation: IEditorOperation;
  conflicts: IEditorOperation[];
}

export class CollaborationService extends EventEmitter {
  private sessions: Map<string, ICollaborationSession> = new Map();
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // Create or join collaboration session
  async joinSession(
    recordId: string,
    userId: string,
    userName: string
  ): Promise<ICollaborationSession> {
    let session = this.sessions.get(recordId);

    if (!session) {
      // Create new session
      session = {
        id: generateId(),
        recordId,
        participants: [],
        operations: [],
        version: 0,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.sessions.set(recordId, session);
    }

    // Check if user is already in session
    let participant = session.participants.find(p => p.userId === userId);

    if (!participant) {
      // Add new participant
      participant = {
        userId,
        userName,
        color: this.assignUserColor(session.participants),
        joinedAt: new Date(),
        lastSeen: new Date(),
        isActive: true
      };
      session.participants.push(participant);
    } else {
      // Reactivate existing participant
      participant.isActive = true;
      participant.lastSeen = new Date();
    }

    session.lastActivity = new Date();

    // Emit join event
    this.emit('user-joined', {
      sessionId: session.id,
      recordId,
      participant
    });

    return session;
  }

  // Leave collaboration session
  async leaveSession(recordId: string, userId: string): Promise<void> {
    const session = this.sessions.get(recordId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isActive = false;
      participant.lastSeen = new Date();
    }

    // Remove session if no active participants
    const activeParticipants = session.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      this.sessions.delete(recordId);
    }

    // Emit leave event
    this.emit('user-left', {
      sessionId: session.id,
      recordId,
      userId
    });
  }

  // Apply operation with operational transformation
  async applyOperation(
    recordId: string,
    operation: IEditorOperation
  ): Promise<IOperationalTransform> {
    const session = this.sessions.get(recordId);
    if (!session) {
      throw createNotFoundError('Collaboration session not found');
    }

    // Get operations that happened after this operation's base version
    const concurrentOps = session.operations.filter(
      op => op.timestamp > operation.timestamp && op.userId !== operation.userId
    );

    // Apply operational transformation
    const transformed = this.transformOperation(operation, concurrentOps);

    // Add to session operations
    session.operations.push(transformed.operation);
    session.version++;
    session.lastActivity = new Date();

    // Emit operation to other participants
    this.emit('operation-applied', {
      sessionId: session.id,
      recordId,
      operation: transformed.operation,
      userId: operation.userId
    });

    return transformed;
  }

  // Update cursor position
  async updateCursor(
    recordId: string,
    cursorUpdate: ICursorUpdate
  ): Promise<void> {
    const session = this.sessions.get(recordId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === cursorUpdate.userId);
    if (participant) {
      participant.cursor = {
        blockId: cursorUpdate.blockId,
        position: cursorUpdate.position
      };
      participant.lastSeen = new Date();
    }

    // Emit cursor update to other participants
    this.emit('cursor-updated', {
      sessionId: session.id,
      recordId,
      cursorUpdate
    });
  }

  // Update text selection
  async updateSelection(
    recordId: string,
    selectionUpdate: ISelectionUpdate
  ): Promise<void> {
    const session = this.sessions.get(recordId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === selectionUpdate.userId);
    if (participant) {
      participant.selection = {
        blockId: selectionUpdate.blockId,
        start: selectionUpdate.start,
        end: selectionUpdate.end
      };
      participant.lastSeen = new Date();
    }

    // Emit selection update to other participants
    this.emit('selection-updated', {
      sessionId: session.id,
      recordId,
      selectionUpdate
    });
  }

  // Get session participants
  getSessionParticipants(recordId: string): IParticipant[] {
    const session = this.sessions.get(recordId);
    return session ? session.participants.filter(p => p.isActive) : [];
  }

  // Get session operations
  getSessionOperations(recordId: string, fromVersion?: number): IEditorOperation[] {
    const session = this.sessions.get(recordId);
    if (!session) return [];

    if (fromVersion !== undefined) {
      return session.operations.slice(fromVersion);
    }

    return session.operations;
  }

  // Operational transformation for concurrent operations
  private transformOperation(
    operation: IEditorOperation,
    concurrentOps: IEditorOperation[]
  ): IOperationalTransform {
    let transformedOp = { ...operation };
    const conflicts: IEditorOperation[] = [];

    for (const concurrentOp of concurrentOps) {
      const result = this.transformTwoOperations(transformedOp, concurrentOp);
      transformedOp = result.transformed;
      
      if (result.hasConflict) {
        conflicts.push(concurrentOp);
      }
    }

    return {
      operation: transformedOp,
      transformedOperation: transformedOp,
      conflicts
    };
  }

  // Transform two operations
  private transformTwoOperations(
    op1: IEditorOperation,
    op2: IEditorOperation
  ): { transformed: IEditorOperation; hasConflict: boolean } {
    // Different block IDs - no transformation needed
    if (op1.blockId !== op2.blockId) {
      return { transformed: op1, hasConflict: false };
    }

    let transformed = { ...op1 };
    let hasConflict = false;

    // Transform based on operation types
    if (op1.type === 'insert' && op2.type === 'insert') {
      // Both insertions
      if (op2.position <= op1.position) {
        transformed.position += op2.content?.length || 0;
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      // Insert vs Delete
      if (op2.position <= op1.position) {
        transformed.position -= Math.min(op2.length || 0, op1.position - op2.position);
      }
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      // Delete vs Insert
      if (op2.position <= op1.position) {
        transformed.position += op2.content?.length || 0;
      }
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      // Both deletions
      if (op2.position < op1.position) {
        const overlap = Math.min(op2.length || 0, op1.position - op2.position);
        transformed.position -= overlap;
        if (overlap > 0) {
          hasConflict = true;
        }
      }
    } else if (op1.type === 'format' && op2.type === 'format') {
      // Both formatting - check for overlap
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);
      
      if (!(op1End <= op2.position || op2End <= op1.position)) {
        hasConflict = true;
      }
    }

    return { transformed, hasConflict };
  }

  // Assign color to user
  private assignUserColor(participants: IParticipant[]): string {
    const usedColors = participants.map(p => p.color);
    const availableColors = this.userColors.filter(color => !usedColors.includes(color));
    
    if (availableColors.length > 0) {
      return availableColors[0];
    }
    
    // If all colors are used, cycle through them
    return this.userColors[participants.length % this.userColors.length];
  }

  // Clean up inactive sessions
  cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [recordId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > inactiveThreshold) {
        // Mark all participants as inactive
        session.participants.forEach(p => p.isActive = false);
        this.sessions.delete(recordId);
        
        this.emit('session-closed', {
          sessionId: session.id,
          recordId,
          reason: 'inactivity'
        });
      }
    }
  }

  // Get session statistics
  getSessionStats(recordId: string): {
    participantCount: number;
    operationCount: number;
    version: number;
    lastActivity: Date;
  } | null {
    const session = this.sessions.get(recordId);
    if (!session) return null;

    return {
      participantCount: session.participants.filter(p => p.isActive).length,
      operationCount: session.operations.length,
      version: session.version,
      lastActivity: session.lastActivity
    };
  }

  // Resolve conflicts
  async resolveConflicts(
    recordId: string,
    conflicts: IEditorOperation[],
    resolution: 'accept' | 'reject' | 'merge'
  ): Promise<void> {
    const session = this.sessions.get(recordId);
    if (!session) return;

    switch (resolution) {
      case 'accept':
        // Accept all conflicting operations
        session.operations.push(...conflicts);
        break;
      case 'reject':
        // Reject conflicting operations (do nothing)
        break;
      case 'merge':
        // Attempt to merge operations
        const mergedOps = this.mergeConflictingOperations(conflicts);
        session.operations.push(...mergedOps);
        break;
    }

    session.version++;
    session.lastActivity = new Date();

    this.emit('conflicts-resolved', {
      sessionId: session.id,
      recordId,
      conflicts,
      resolution
    });
  }

  // Merge conflicting operations
  private mergeConflictingOperations(conflicts: IEditorOperation[]): IEditorOperation[] {
    // Simple merge strategy - combine text insertions, prioritize latest formatting
    const merged: IEditorOperation[] = [];
    
    // Group by operation type and position
    const insertions = conflicts.filter(op => op.type === 'insert');
    const deletions = conflicts.filter(op => op.type === 'delete');
    const formatting = conflicts.filter(op => op.type === 'format');

    // Merge insertions by combining content
    if (insertions.length > 0) {
      const combinedContent = insertions.map(op => op.content || '').join('');
      merged.push({
        ...insertions[0],
        content: combinedContent,
        timestamp: Math.max(...insertions.map(op => op.timestamp))
      });
    }

    // Keep latest deletion
    if (deletions.length > 0) {
      const latestDeletion = deletions.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      merged.push(latestDeletion);
    }

    // Keep latest formatting
    if (formatting.length > 0) {
      const latestFormatting = formatting.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      merged.push(latestFormatting);
    }

    return merged;
  }
}

export const collaborationService = new CollaborationService();

// Clean up inactive sessions every 5 minutes
setInterval(() => {
  collaborationService.cleanupInactiveSessions();
}, 5 * 60 * 1000);
