import { ObjectId } from 'mongodb';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { ViewModel } from '@/modules/database/models/view.model';
import { RecordModel } from '@/modules/database/models/record.model';
import {
  IModuleInitRequest,
  IModuleInitResponse,
  IInitializedModule,
  ICreatedRelation,
  IModuleConfig
} from '@/modules/modules/types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { EViewType } from '@/modules/core/types/view.types';
import { createAppError } from '@/utils/error.utils';
import { crossModuleRelationsService } from './cross-module-relations.service';
import { moduleConfigService } from './module-config.service';

const initializeModules = async (request: IModuleInitRequest): Promise<IModuleInitResponse> => {
  const { workspaceId, userId, modules, createSampleData } = request;

  const initializedModules: IInitializedModule[] = [];
  const createdRelations: ICreatedRelation[] = [];
  const errors: string[] = [];

  try {
    for (const moduleId of modules) {
      try {
        const moduleConfig = moduleConfigService.getModuleConfig(moduleId);
        if (!moduleConfig) {
          errors.push(`Module configuration not found: ${moduleId}`);
          continue;
        }

        const existingDatabase = await DatabaseModel.findOne({
          workspaceId: new ObjectId(workspaceId),
          type: moduleId
        });

        if (existingDatabase) {
          errors.push(`Module already exists: ${moduleId}`);
          continue;
        }

        const initializedModule = await initializeSingleModule(workspaceId, userId, moduleConfig);

        initializedModules.push(initializedModule);

        if (createSampleData) {
          await createSampleDataForModule(initializedModule.databaseId, moduleConfig, userId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to initialize ${moduleId}: ${errorMessage}`);
      }
    }

    for (const initializedModule of initializedModules) {
      try {
        const moduleConfig = moduleConfigService.getModuleConfig(initializedModule.moduleId);
        if (!moduleConfig) continue;

        const moduleRelations = await createModuleRelations(
          initializedModule.databaseId,
          moduleConfig,
          initializedModules,
          userId
        );

        createdRelations.push(...moduleRelations);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(
          `Failed to create relations for ${initializedModule.moduleId}: ${errorMessage}`
        );
      }
    }

    try {
      await crossModuleRelationsService.initializeCrossModuleRelations(userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to initialize cross-module relations: ${errorMessage}`);
    }

    return {
      workspaceId,
      initializedModules,
      createdRelations,
      sampleDataCreated: createSampleData,
      errors
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw createAppError(`Module initialization failed: ${errorMessage}`, 500);
  }
};

const initializeSingleModule = async (
  workspaceId: string,
  userId: string,
  moduleConfig: IModuleConfig
): Promise<IInitializedModule> => {
  const now = new Date();

  const database = new DatabaseModel({
    _id: new ObjectId(),
    workspaceId: new ObjectId(workspaceId),
    name: moduleConfig.name,
    type: moduleConfig.id,
    description: moduleConfig.description,
    icon: {
      type: 'emoji',
      value: moduleConfig.icon
    },
    cover: {
      type: 'color',
      value: moduleConfig.color
    },
    isPublic: false,
    isTemplate: false,
    isArchived: false,
    properties: [],
    views: [],
    templates: [],
    recordCount: 0,
    allowComments: true,
    allowDuplicates: true,
    enableVersioning: false,
    enableAuditLog: true,
    enableAutoTagging: false,
    enableSmartSuggestions: false,
    createdAt: now,
    updatedAt: now,
    createdBy: new ObjectId(userId),
    updatedBy: new ObjectId(userId)
  });

  await database.save();

  const properties = await createModuleProperties(database.id.toString(), moduleConfig, userId);

  const views = await createModuleViews(database.id.toString(), moduleConfig, properties, userId);

  await DatabaseModel.findByIdAndUpdate(database._id, {
    $set: {
      properties: properties.map(p => p._id),
      views: views.map(v => v._id),
      defaultViewId: views.find(v => v.isDefault)?._id
    }
  });

  return {
    moduleId: moduleConfig.id,
    databaseId: database.id.toString(),
    name: moduleConfig.name,
    propertiesCreated: properties.length,
    viewsCreated: views.length,
    templatesCreated: moduleConfig.templates.length
  };
};

const createModuleProperties = async (
  databaseId: string,
  moduleConfig: IModuleConfig,
  userId: string
): Promise<Array<{ _id: ObjectId; name: string; type: EPropertyType; isDefault?: boolean }>> => {
  const now = new Date();
  const properties = [];

  for (const propConfig of moduleConfig.defaultProperties) {
    const property = new PropertyModel({
      _id: new ObjectId(),
      databaseId: new ObjectId(databaseId),
      name: propConfig.name,
      type: propConfig.type,
      config: propConfig.config,
      isSystem: propConfig.isSystem,
      isVisible: propConfig.isVisible,
      order: propConfig.order,
      description: propConfig.description,
      createdAt: now,
      updatedAt: now,
      createdBy: new ObjectId(userId),
      updatedBy: new ObjectId(userId)
    });

    await property.save();
    properties.push({
      _id: property._id as ObjectId,
      name: property.name,
      type: property.type,
      isDefault: propConfig.isSystem
    });
  }

  const systemProperties = [
    {
      name: 'Created Time',
      type: EPropertyType.CREATED_TIME,
      config: { includeTime: true },
      isSystem: true,
      order: 1000
    },
    {
      name: 'Last Edited Time',
      type: EPropertyType.LAST_EDITED_TIME,
      config: { includeTime: true },
      isSystem: true,
      order: 1001
    },
    {
      name: 'Created By',
      type: EPropertyType.CREATED_BY,
      config: {},
      isSystem: true,
      order: 1002
    },
    {
      name: 'Last Edited By',
      type: EPropertyType.LAST_EDITED_BY,
      config: {},
      isSystem: true,
      order: 1003
    }
  ];

  for (const sysProp of systemProperties) {
    const property = new PropertyModel({
      _id: new ObjectId(),
      databaseId: new ObjectId(databaseId),
      name: sysProp.name,
      type: sysProp.type,
      config: sysProp.config,
      isSystem: sysProp.isSystem,
      isVisible: false,
      order: sysProp.order,
      description: `System property: ${sysProp.name}`,
      createdAt: now,
      updatedAt: now,
      createdBy: new ObjectId(userId),
      updatedBy: new ObjectId(userId)
    });

    await property.save();
    properties.push({
      _id: property._id as ObjectId,
      name: property.name,
      type: property.type,
      isDefault: true
    });
  }

  return properties;
};

const createModuleViews = async (
  databaseId: string,
  moduleConfig: IModuleConfig,
  properties: Array<{ _id: ObjectId; name: string; type: EPropertyType }>,
  userId: string
): Promise<Array<{ _id: ObjectId; name: string; type: EViewType; isDefault: boolean }>> => {
  const now = new Date();
  const views = [];

  for (const viewConfig of moduleConfig.defaultViews) {
    const visiblePropertyIds =
      viewConfig.settings.visibleProperties
        ?.map(propName => properties.find(p => p.name === propName)?._id?.toString())
        .filter(Boolean) || [];

    const frozenPropertyIds =
      viewConfig.settings.frozenProperties
        ?.map(propName => properties.find(p => p.name === propName)?._id?.toString())
        .filter(Boolean) || [];

    const view = new ViewModel({
      _id: new ObjectId(),
      databaseId: new ObjectId(databaseId),
      name: viewConfig.name,
      type: viewConfig.type,
      description: viewConfig.description,
      isDefault: viewConfig.isDefault,
      isPublic: false,
      order: viewConfig.order,
      settings: {
        ...viewConfig.settings,
        visibleProperties: visiblePropertyIds,
        frozenProperties: frozenPropertyIds,
        sorts: viewConfig.settings.sorts?.map(sort => ({
          ...sort,
          property: properties.find(p => p.name === sort.property)?._id?.toString() || sort.property
        })),
        filters: viewConfig.settings.filters?.map(filter => ({
          ...filter,
          property:
            properties.find(p => p.name === filter.property)?._id?.toString() || filter.property
        })),
        groups: viewConfig.settings.groups?.map(group => ({
          ...group,
          property:
            properties.find(p => p.name === group.property)?._id?.toString() || group.property
        }))
      },
      createdAt: now,
      updatedAt: now,
      createdBy: new ObjectId(userId),
      updatedBy: new ObjectId(userId)
    });

    await view.save();
    views.push({
      _id: view._id as ObjectId,
      name: view.name,
      type: view.type,
      isDefault: view.isDefault
    });
  }

  return views;
};

const createModuleRelations = async (
  databaseId: string,
  moduleConfig: IModuleConfig,
  initializedModules: IInitializedModule[],
  userId: string
): Promise<ICreatedRelation[]> => {
  const createdRelations: ICreatedRelation[] = [];

  for (const relationConfig of moduleConfig.defaultRelations) {
    try {
      const targetModule = initializedModules.find(m => m.moduleId === relationConfig.targetModule);

      if (!targetModule) continue;

      const sourceProperty = await PropertyModel.findOne({
        databaseId: new ObjectId(databaseId),
        name: relationConfig.sourceProperty
      });

      if (!sourceProperty) continue;

      const targetProperty = await PropertyModel.findOne({
        databaseId: new ObjectId(targetModule.databaseId),
        name: relationConfig.targetProperty
      });

      if (!targetProperty) continue;

      await PropertyModel.findByIdAndUpdate(sourceProperty._id, {
        $set: {
          'config.relatedDatabase': targetModule.databaseId,
          'config.relatedProperty': (targetProperty._id as ObjectId).toString(),
          'config.relationType': relationConfig.type,
          'config.isRequired': relationConfig.isRequired,
          'config.cascadeDelete': relationConfig.cascadeDelete,
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId)
        }
      });

      createdRelations.push({
        sourceModule: moduleConfig.id,
        targetModule: relationConfig.targetModule,
        relationName: `${moduleConfig.name} -> ${targetModule.name}`,
        propertyId: (sourceProperty._id as ObjectId).toString()
      });
    } catch (error) {
      console.error(
        `Failed to create relation: ${relationConfig.sourceProperty} -> ${relationConfig.targetModule}`,
        error
      );
    }
  }

  return createdRelations;
};

const createSampleDataForModule = async (
  databaseId: string,
  moduleConfig: IModuleConfig,
  userId: string
): Promise<void> => {
  const sampleData = getSampleDataForModule(moduleConfig.id);

  if (!sampleData || sampleData.length === 0) return;

  const properties = await PropertyModel.find({
    databaseId: new ObjectId(databaseId)
  });

  const now = new Date();

  for (const sampleRecord of sampleData) {
    try {
      const recordProperties: Record<string, unknown> = {};

      for (const [propName, value] of Object.entries(sampleRecord)) {
        const property = properties.find(p => p.name === propName);
        if (property) {
          recordProperties[(property._id as ObjectId).toString()] = value;
        }
      }

      const record = new RecordModel({
        _id: new ObjectId(),
        databaseId: new ObjectId(databaseId),
        properties: recordProperties,
        content: [],
        isTemplate: false,
        isFavorite: false,
        isArchived: false,
        commentCount: 0,
        version: 1,
        autoTags: [],
        relationsCache: {},
        createdAt: now,
        updatedAt: now,
        createdBy: new ObjectId(userId),
        lastEditedBy: new ObjectId(userId),
        lastEditedAt: now
      });

      await record.save();
    } catch (error) {
      console.error(`Failed to create sample record for ${moduleConfig.id}:`, error);
    }
  }

  const recordCount = await RecordModel.countDocuments({
    databaseId: new ObjectId(databaseId)
  });

  await DatabaseModel.findByIdAndUpdate(databaseId, {
    $set: {
      recordCount,
      lastActivityAt: now
    }
  });
};

const getSampleDataForModule = (moduleId: EDatabaseType): Array<Record<string, unknown>> => {
  switch (moduleId) {
    case EDatabaseType.TASKS:
      return [
        {
          Name: 'Set up development environment',
          Status: 'completed',
          Priority: 'high',
          'Due Date': new Date(Date.now() - 86400000),
          'Estimated Hours': 4
        },
        {
          Name: 'Review project requirements',
          Status: 'in_progress',
          Priority: 'medium',
          'Due Date': new Date(Date.now() + 86400000),
          'Estimated Hours': 2
        },
        {
          Name: 'Plan sprint activities',
          Status: 'not_started',
          Priority: 'medium',
          'Due Date': new Date(Date.now() + 172800000),
          'Estimated Hours': 3
        }
      ];

    case EDatabaseType.NOTES:
      return [
        {
          Title: 'Project Ideas',
          Status: 'draft',
          Category: 'ideas',
          Tags: ['important', 'idea'],
          'Word Count': 250,
          'Reading Time': 2
        },
        {
          Title: 'Meeting Notes - Team Sync',
          Status: 'published',
          Category: 'work',
          Tags: ['meeting'],
          'Word Count': 180,
          'Reading Time': 1
        },
        {
          Title: 'Learning Resources',
          Status: 'draft',
          Category: 'reference',
          Tags: ['reference', 'todo'],
          'Word Count': 320,
          'Reading Time': 2
        }
      ];

    case EDatabaseType.PROJECTS:
      return [
        {
          Name: 'Second Brain System',
          Status: 'active',
          Priority: 'high',
          'Start Date': new Date(Date.now() - 604800000),
          'End Date': new Date(Date.now() + 2592000000),
          Progress: 75,
          Budget: 10000
        },
        {
          Name: 'Website Redesign',
          Status: 'planning',
          Priority: 'medium',
          'Start Date': new Date(Date.now() + 86400000),
          'End Date': new Date(Date.now() + 1814400000),
          Progress: 0,
          Budget: 5000
        }
      ];

    default:
      return [];
  }
};

export const moduleInitializationService = {
  getSampleDataForModule,
  createSampleDataForModule,
  createModuleRelations,
  createModuleViews,
  createModuleProperties,
  initializeSingleModule,
  initializeModules
};
