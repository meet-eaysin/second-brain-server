import { z } from 'zod';

// View validation schemas
export const ViewTypeSchema = z.enum([
  'TABLE',
  'BOARD',
  'LIST',
  'CALENDAR',
  'GALLERY',
  'TIMELINE',
  'GANTT',
  'CHART'
]);
export const FilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'is_empty',
  'is_not_empty',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'before',
  'after',
  'on_or_before',
  'on_or_after',
  'is_today',
  'is_yesterday',
  'is_tomorrow',
  'is_this_week',
  'is_last_week',
  'is_next_week',
  'is_this_month',
  'is_last_month',
  'is_next_month',
  'is',
  'is_not',
  'is_any_of',
  'is_none_of',
  'is_checked',
  'is_unchecked',
  'contains_relation',
  'not_contains_relation'
]);

export const SortConfigSchema = z.object({
  propertyId: z.string(),
  direction: z.enum(['asc', 'desc'])
});

export const FilterConditionSchema = z.object({
  propertyId: z.string(),
  operator: FilterOperatorSchema,
  value: z.any().optional()
});

export const FilterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    operator: z.enum(['and', 'or']),
    conditions: z.array(z.union([FilterConditionSchema, FilterGroupSchema]))
  })
);

export const GroupConfigSchema = z.object({
  propertyId: z.string(),
  hideEmpty: z.boolean().default(false),
  sortGroups: z.enum(['asc', 'desc', 'manual']).optional()
});

export const ColumnConfigSchema = z.object({
  propertyId: z.string(),
  width: z.number().positive().optional(),
  isVisible: z.boolean().default(true),
  order: z.number().min(0),
  isFrozen: z.boolean().default(false)
});

export const CalendarConfigSchema = z.object({
  datePropertyId: z.string(),
  endDatePropertyId: z.string().optional(),
  showWeekends: z.boolean().default(true),
  defaultView: z.enum(['month', 'week', 'day']).default('month')
});

export const GalleryConfigSchema = z.object({
  coverPropertyId: z.string().optional(),
  cardSize: z.enum(['small', 'medium', 'large']).default('medium'),
  showProperties: z.array(z.string()).optional()
});

export const TimelineConfigSchema = z.object({
  startDatePropertyId: z.string(),
  endDatePropertyId: z.string().optional(),
  groupByPropertyId: z.string().optional(),
  showDependencies: z.boolean().default(false)
});

export const ViewConfigSchema = z.object({
  pageSize: z.number().positive().max(100).default(25),
  visibleProperties: z.array(z.string()).default([]),
  hiddenProperties: z.array(z.string()).default([]),
  frozenColumns: z.array(z.string()).default([]),
  columns: z.array(ColumnConfigSchema).optional(),
  group: GroupConfigSchema.optional(),
  calendar: CalendarConfigSchema.optional(),
  gallery: GalleryConfigSchema.optional(),
  timeline: TimelineConfigSchema.optional()
});

export const ViewSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string().min(1).max(100),
  type: ViewTypeSchema,
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  config: ViewConfigSchema,
  sorts: z.array(SortConfigSchema).default([]),
  filters: FilterGroupSchema.default({ operator: 'and', conditions: [] }),
  order: z.number().min(0),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional()
});
