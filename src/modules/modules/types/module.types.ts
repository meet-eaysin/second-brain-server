import { EDatabaseType } from '@/modules/core/types/database.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { EViewType } from '@/modules/core/types/view.types';

// Module configuration interface
export interface IModuleConfig {
  readonly id: EDatabaseType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly category: EModuleCategory;
  readonly isCore: boolean;
  readonly dependencies: readonly EDatabaseType[];
  readonly defaultProperties: readonly IModuleProperty[];
  readonly defaultViews: readonly IModuleView[];
  readonly defaultRelations: readonly IModuleRelation[];
  readonly templates: readonly IModuleTemplate[];
}

// Module categories for organization
export enum EModuleCategory {
  PRODUCTIVITY = 'productivity',
  KNOWLEDGE = 'knowledge',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  HEALTH = 'health',
  PARA = 'para',
  SYSTEM = 'system'
}

// Module property configuration
export interface IModuleProperty {
  readonly name: string;
  readonly type: EPropertyType;
  readonly config: Record<string, unknown>;
  readonly isSystem: boolean;
  readonly isFrozen: boolean;
  readonly isVisible: boolean;
  readonly order: number;
  readonly description?: string;
}

// Module view configuration
export interface IModuleView {
  readonly name: string;
  readonly type: EViewType;
  readonly description: string;
  readonly isDefault: boolean;
  readonly order: number;
  readonly settings: IModuleViewSettings;
}

// Module view settings
export interface IModuleViewSettings {
  readonly visibleProperties?: readonly string[];
  readonly frozenProperties?: readonly string[];
  readonly sorts?: readonly IModuleSort[];
  readonly filters?: readonly IModuleFilter[];
  readonly groups?: readonly IModuleGroup[];
  readonly pageSize?: number;
  readonly cardSize?: 'small' | 'medium' | 'large';

  // Calendar view specific properties
  readonly dateProperty?: string;
  readonly titleProperty?: string;
  readonly colorProperty?: string;

  // Board view specific properties
  readonly statusProperty?: string;

  // Gallery view specific properties
  readonly coverProperty?: string;
}

// Module sort configuration
export interface IModuleSort {
  readonly property: string;
  readonly direction: 'asc' | 'desc';
}

// Module filter configuration
export interface IModuleFilter {
  readonly property: string;
  readonly operator: string;
  readonly value: unknown;
}

// Module group configuration
export interface IModuleGroup {
  readonly property: string;
  readonly direction: 'asc' | 'desc';
  readonly showEmpty: boolean;
}

// Module relation configuration
export interface IModuleRelation {
  readonly sourceProperty: string;
  readonly targetModule: EDatabaseType;
  readonly targetProperty: string;
  readonly type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  readonly isRequired: boolean;
  readonly cascadeDelete: boolean;
}

// Module template configuration
export interface IModuleTemplate {
  readonly name: string;
  readonly description: string;
  readonly defaultValues: Record<string, unknown>;
  readonly isDefault: boolean;
}

// Module initialization request
export interface IModuleInitRequest {
  readonly workspaceId: string;
  readonly userId: string;
  readonly modules: readonly EDatabaseType[];
  readonly createSampleData: boolean;
}

// Module initialization response
export interface IModuleInitResponse {
  readonly workspaceId: string;
  readonly initializedModules: readonly IInitializedModule[];
  readonly createdRelations: readonly ICreatedRelation[];
  readonly sampleDataCreated: boolean;
  readonly errors: readonly string[];
}

// Initialized module info
export interface IInitializedModule {
  readonly moduleId: EDatabaseType;
  readonly databaseId: string;
  readonly name: string;
  readonly propertiesCreated: number;
  readonly viewsCreated: number;
  readonly templatesCreated: number;
}

// Created relation info
export interface ICreatedRelation {
  readonly sourceModule: EDatabaseType;
  readonly targetModule: EDatabaseType;
  readonly relationName: string;
  readonly propertyId: string;
}

// Module status
export interface IModuleStatus {
  readonly moduleId: EDatabaseType;
  readonly isInitialized: boolean;
  readonly databaseId?: string;
  readonly recordCount: number;
  readonly lastActivity?: Date;
  readonly health: 'healthy' | 'warning' | 'error';
  readonly issues: readonly string[];
}

export interface IWorkspaceModules {
  readonly workspaceId: string;
  readonly modules: readonly IModuleStatus[];
  readonly totalRecords: number;
  readonly activeModules: number;
  readonly lastActivity?: Date;
}
