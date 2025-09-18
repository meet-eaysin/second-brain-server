import { EDatabaseType } from '@/modules/core/types/database.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { EViewType } from '@/modules/core/types/view.types';

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

export enum EModuleCategory {
  PRODUCTIVITY = 'productivity',
  KNOWLEDGE = 'knowledge',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  HEALTH = 'health',
  PARA = 'para',
  SYSTEM = 'system'
}

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

export interface IModuleView {
  readonly name: string;
  readonly type: EViewType;
  readonly description: string;
  readonly isDefault: boolean;
  readonly order: number;
  readonly settings: IModuleViewSettings;
}

export interface IModuleViewSettings {
  readonly visibleProperties?: readonly string[];
  readonly frozenColumns?: readonly string[];
  readonly sorts?: readonly IModuleSort[];
  readonly filters?: readonly IModuleFilter[];
  readonly groups?: readonly IModuleGroup[];
  readonly pageSize?: number;
  readonly cardSize?: 'small' | 'medium' | 'large';

  readonly dateProperty?: string;
  readonly titleProperty?: string;
  readonly colorProperty?: string;

  readonly statusProperty?: string;

  readonly coverProperty?: string;
}

export interface IModuleSort {
  readonly property: string;
  readonly direction: 'asc' | 'desc';
}

export interface IModuleFilter {
  readonly property: string;
  readonly operator: string;
  readonly value: unknown;
}

export interface IModuleGroup {
  readonly property: string;
  readonly direction: 'asc' | 'desc';
  readonly showEmpty: boolean;
}

export interface IModuleRelation {
  readonly sourceProperty: string;
  readonly targetModule: EDatabaseType;
  readonly targetProperty: string;
  readonly type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  readonly isRequired: boolean;
  readonly cascadeDelete: boolean;
}

export interface IModuleTemplate {
  readonly name: string;
  readonly description: string;
  readonly defaultValues: Record<string, unknown>;
  readonly isDefault: boolean;
}

export interface IModuleInitRequest {
  readonly workspaceId: string;
  readonly userId: string;
  readonly modules: readonly EDatabaseType[];
  readonly createSampleData: boolean;
}

export interface IModuleInitResponse {
  readonly workspaceId: string;
  readonly initializedModules: readonly IInitializedModule[];
  readonly createdRelations: readonly ICreatedRelation[];
  readonly sampleDataCreated: boolean;
  readonly errors: readonly string[];
}

export interface IInitializedModule {
  readonly moduleId: EDatabaseType;
  readonly databaseId: string;
  readonly name: string;
  readonly propertiesCreated: number;
  readonly viewsCreated: number;
  readonly templatesCreated: number;
}

export interface ICreatedRelation {
  readonly sourceModule: EDatabaseType;
  readonly targetModule: EDatabaseType;
  readonly relationName: string;
  readonly propertyId: string;
}

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
