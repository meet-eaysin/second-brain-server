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

// Import the operation type
import { IEditorOperation } from './editor.types';
