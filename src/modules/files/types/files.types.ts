export interface TFileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  category?: string;
  isPublic?: boolean;
}

export interface TFileResponse {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TFileQueryParams {
  category?: string;
  search?: string;
  mimeType?: string;
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TFilesListResponse {
  files: TFileResponse[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}
