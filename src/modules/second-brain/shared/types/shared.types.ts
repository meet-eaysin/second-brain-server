export interface IModuleService<T = unknown> {
  getById(userId: string, id: string): Promise<T>;
  exists(id: string): Promise<boolean>;
  bulkExists(ids: string[]): Promise<Record<string, boolean>>;
  getByIds(userId: string, ids: string[]): Promise<T[]>;
}

export interface IRelationshipField {
  field: string;
  targetModule: string;
  isArray?: boolean;
  reverseField?: string;
}

export interface IModuleConfig {
  name: string;
  modelName: string;
  relationships: IRelationshipField[];
}

export interface IIntegrityCheckConfig {
  model: string;
  field: string;
  targetModel: string;
  name: string;
  isArray?: boolean;
}

export interface IIntegrityCheckResult {
  model: string;
  field: string;
  orphanedCount: number;
  orphanedIds: string[];
}

export interface IIntegrityReport {
  totalChecks: number;
  issuesFound: number;
  results: IIntegrityCheckResult[];
  summary: {
    orphanedReferences: number;
    modelsAffected: string[];
  };
}

export interface ICleanupResult {
  cleaned: number;
  errors: string[];
}

export interface IRelationshipOperation {
  action: 'add' | 'remove';
  sourceModule: string;
  sourceId: string;
  targetModule: string;
  targetId: string;
  relationshipField: string;
  reverseField?: string;
}
