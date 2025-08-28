import { z } from 'zod';
import { EModuleCategory } from '../types/module.types';
import { EDatabaseType, EPropertyType, EViewType } from '@/modules/core/types';

export const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

export const moduleIdSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required')
});

export const workspaceModuleSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  moduleId: z.string().min(1, 'Module ID is required')
});

export const categoryQuerySchema = z.object({
  category: z.string().min(1, 'Category is required')
});

export const initializeCoreModulesSchema = z.object({
  createSampleData: z.boolean().optional().default(false)
});

export const initializeSpecificModulesSchema = z.object({
  modules: z.array(z.string()).min(1, 'At least one module is required'),
  createSampleData: z.boolean().optional().default(false)
});

export const validateModulesSchema = z.object({
  modules: z.array(z.string()).min(1, 'At least one module is required')
});

export const recommendationsQuerySchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  type: z.enum(['connection', 'organization', 'cleanup', 'productivity']).optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional()
});

export const trendsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  moduleType: z
    .enum([
      'dashboard',
      'tasks',
      'notes',
      'projects',
      'goals',
      'people',
      'finance',
      'habits',
      'journal',
      'mood_tracker',
      'resources',
      'para_projects',
      'para_areas',
      'para_resources',
      'para_archive'
    ])
    .optional()
});

export const moduleTypeSchema = z.object({
  moduleType: z.enum([
    'dashboard',
    'tasks',
    'notes',
    'projects',
    'goals',
    'people',
    'finance',
    'habits',
    'journal',
    'mood_tracker',
    'resources',
    'para_projects',
    'para_areas',
    'para_resources',
    'para_archive'
  ])
});

export const connectRecordsSchema = z.object({
  sourceRecordId: z.string().min(1, 'Source record ID is required'),
  targetRecordId: z.string().min(1, 'Target record ID is required'),
  relationProperty: z.string().min(1, 'Relation property is required')
});

export const disconnectRecordsSchema = z.object({
  sourceRecordId: z.string().min(1, 'Source record ID is required'),
  targetRecordId: z.string().min(1, 'Target record ID is required'),
  relationProperty: z.string().min(1, 'Relation property is required')
});

export const relatedRecordsQuerySchema = z.object({
  moduleTypes: z.string().optional(),
  relationTypes: z.string().optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  includeMetadata: z.enum(['true', 'false']).optional()
});

export const suggestRelationsQuerySchema = z.object({
  moduleTypes: z.string().optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  similarityThreshold: z
    .string()
    .regex(/^0\.\d+$|^1\.0$/, 'Similarity threshold must be between 0 and 1')
    .optional()
});

export const relationNetworkQuerySchema = z.object({
  depth: z
    .string()
    .regex(/^[1-3]$/, 'Depth must be 1, 2, or 3')
    .optional(),
  moduleTypes: z.string().optional()
});

export const relationTimelineQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
});

export const bulkConnectSchema = z.object({
  connections: z
    .array(
      z.object({
        sourceRecordId: z.string().min(1, 'Source record ID is required'),
        targetRecordId: z.string().min(1, 'Target record ID is required'),
        relationProperty: z.string().min(1, 'Relation property is required')
      })
    )
    .min(1, 'At least one connection is required')
});

export const recordIdSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required')
});

export const moduleCategorySchema = z.nativeEnum(EModuleCategory);

export const modulePropertySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(EPropertyType),
  config: z.record(z.unknown()),
  isSystem: z.boolean(),
  isFrozen: z.boolean(),
  isVisible: z.boolean(),
  order: z.number().min(0),
  description: z.string().optional()
});

export const moduleViewSettingsSchema = z.object({
  visibleProperties: z.array(z.string()).optional(),
  frozenProperties: z.array(z.string()).optional(),
  sorts: z
    .array(
      z.object({
        property: z.string(),
        direction: z.enum(['asc', 'desc'])
      })
    )
    .optional(),
  filters: z
    .array(
      z.object({
        property: z.string(),
        operator: z.string(),
        value: z.unknown()
      })
    )
    .optional(),
  groups: z
    .array(
      z.object({
        property: z.string(),
        direction: z.enum(['asc', 'desc']),
        showEmpty: z.boolean()
      })
    )
    .optional(),
  pageSize: z.number().min(1).max(100).optional(),
  cardSize: z.enum(['small', 'medium', 'large']).optional(),

  // Calendar view specific properties
  dateProperty: z.string().optional(),
  titleProperty: z.string().optional(),
  colorProperty: z.string().optional(),

  // Board view specific properties
  statusProperty: z.string().optional(),

  // Gallery view specific properties
  coverProperty: z.string().optional()
});

export const moduleViewSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(EViewType),
  description: z.string().max(500),
  isDefault: z.boolean(),
  order: z.number().min(0),
  settings: moduleViewSettingsSchema
});

export const moduleRelationSchema = z.object({
  sourceProperty: z.string(),
  targetModule: z.nativeEnum(EDatabaseType),
  targetProperty: z.string(),
  type: z.enum(['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many']),
  isRequired: z.boolean(),
  cascadeDelete: z.boolean()
});

export const moduleTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  defaultValues: z.record(z.unknown()),
  isDefault: z.boolean()
});

export const moduleConfigSchema = z.object({
  id: z.nativeEnum(EDatabaseType),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string(),
  color: z.string(),
  category: moduleCategorySchema,
  isCore: z.boolean(),
  dependencies: z.array(z.nativeEnum(EDatabaseType)),
  defaultProperties: z.array(modulePropertySchema),
  defaultViews: z.array(moduleViewSchema),
  defaultRelations: z.array(moduleRelationSchema),
  templates: z.array(moduleTemplateSchema)
});

export const moduleInitRequestSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  modules: z.array(z.nativeEnum(EDatabaseType)).min(1),
  createSampleData: z.boolean().default(false)
});
