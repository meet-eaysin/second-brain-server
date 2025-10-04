export interface ISocketUser {
  userId: string;
  userName: string;
  socketId: string;
}

export interface IEditorEvent {
  type: 'operation' | 'cursor' | 'selection' | 'join' | 'leave';
  recordId: string;
  userId: string;
  data: any;
  timestamp: number;
}
