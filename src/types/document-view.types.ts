// Document View Types for Server

export type PropertyType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'DATE'
  | 'CHECKBOX'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'RELATION'
  | 'FORMULA'
  | 'ROLLUP'
  | 'CREATED_TIME'
  | 'CREATED_BY'
  | 'LAST_EDITED_TIME'
  | 'LAST_EDITED_BY';

export type ViewType = 'TABLE' | 'KANBAN' | 'TIMELINE' | 'CALENDAR' | 'GALLERY' | 'LIST';

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface RelationConfig {
  relatedDocumentId: string;
  relationType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
}

export interface FormulaConfig {
  expression: string;
  returnType: 'TEXT' | 'NUMBER' | 'DATE' | 'CHECKBOX';
}

export interface DocumentProperty {
  id: string;
  name: string;
  type: PropertyType;
  description?: string;
  required: boolean;
  isVisible: boolean;
  order: number;
  selectOptions?: SelectOption[];
  relationConfig?: RelationConfig;
  formulaConfig?: FormulaConfig;
}

export interface ViewFilter {
  propertyId: string;
  operator: string;
  value: unknown;
}

export interface ViewSort {
  propertyId: string;
  direction: 'asc' | 'desc';
}

export interface DocumentView {
  id: string;
  name: string;
  type: ViewType;
  isDefault: boolean;
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy?: string;
  visibleProperties: string[];
  config?: {
    kanbanGroupBy?: string;
    [key: string]: any;
  };
  customProperties?: DocumentProperty[];
}

export interface DocumentRecord {
  id: string;
  documentViewId: string;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  workspaceId?: string;
  ownerId: string;
  isPublic: boolean;
  isFavorite?: boolean;
  categoryId?: string;
  tags?: string[];
  properties: DocumentProperty[];
  views: DocumentView[];
  permissions: DocumentPermission[];
  frozen?: boolean;
  frozenAt?: string;
  frozenBy?: string;
  frozenReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PermissionLevel = 'read' | 'write' | 'admin';

export interface DocumentPermission {
  userId: string;
  permission: PermissionLevel;
  grantedAt: string;
}

// Request/Response types
export interface CreateDocumentRequest {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  workspaceId?: string;
  isPublic?: boolean;
}

export interface UpdateDocumentRequest {
  name?: string;
  description?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
}

export interface CreatePropertyRequest {
  name: string;
  type: PropertyType;
  description?: string;
  required?: boolean;
  selectOptions?: Omit<SelectOption, 'id'>[];
  relationConfig?: RelationConfig;
  order?: number;
}

export interface UpdatePropertyRequest {
  name?: string;
  description?: string;
  required?: boolean;
  selectOptions?: SelectOption[];
}

export interface CreateViewRequest {
  name: string;
  type: ViewType;
  isDefault?: boolean;
  filters?: ViewFilter[];
  sorts?: ViewSort[];
  visibleProperties?: string[];
  config?: Record<string, any>;
}

export interface UpdateViewRequest {
  name?: string;
  filters?: ViewFilter[];
  sorts?: ViewSort[];
  visibleProperties?: string[];
  config?: Record<string, any>;
}

export interface CreateRecordRequest {
  properties: Record<string, unknown>;
}

export interface UpdateRecordRequest {
  properties: Record<string, unknown>;
}

export interface ShareDocumentRequest {
  userId: string;
  permission: PermissionLevel;
}

// Query parameters
export interface DocumentQueryParams {
  workspaceId?: string;
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
  excludeOwnerId?: string;
  isPublic?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RecordQueryParams {
  viewId?: string;
  page?: number;
  limit?: number;
  search?: string;
  searchProperties?: string;
  groupBy?: string;
  filters?: string; // JSON string
  sorts?: string; // JSON string
}

// Response types
export interface PaginatedDocumentResponse {
  documents: Document[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedRecordsResponse {
  records: DocumentRecord[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  groupedData?: Record<string, DocumentRecord[]>;
}
