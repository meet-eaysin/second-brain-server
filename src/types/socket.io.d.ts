import { TUserId, TWorkspaceId } from '@/modules/core/types/common.types';

declare module 'socket.io' {
  interface Socket {
    userId: TUserId;
    workspaceId?: TWorkspaceId;
  }
}

export {};
