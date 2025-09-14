import { EPropertyType, IProperty, IPropertyConfig } from '../types/property.types';
import { EDatabaseType } from '../types/database.types';
import { generateId } from '@/utils/id-generator';

// Default system properties for each database type
export interface IDefaultProperty {
  name: string;
  type: EPropertyType;
  config: IPropertyConfig;
  isSystem: boolean;
  isFrozen: boolean;
  isVisible: boolean;
  order: number;
  description?: string;
}

// Status options for all modules
const DEFAULT_STATUS_OPTIONS = [
  { id: 'not_started', value: 'not_started', label: 'Not Started', color: 'gray' },
  { id: 'in_progress', value: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
  { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' }
];

// Priority options for all modules
const DEFAULT_PRIORITY_OPTIONS = [
  { id: 'low', value: 'low', label: 'Low', color: 'green' },
  { id: 'medium', value: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'high', value: 'high', label: 'High', color: 'orange' },
  { id: 'urgent', value: 'urgent', label: 'Urgent', color: 'red' }
];

// Default properties for TASKS database
export const TASKS_DEFAULT_PROPERTIES: IDefaultProperty[] = [
  {
    name: 'Name',
    type: EPropertyType.TEXT,
    config: {
      required: true,
      maxLength: 200
    },
    isSystem: true,
    isFrozen: true,
    isVisible: true,
    order: 0,
    description: 'Task name or title'
  },
  {
    name: 'Status',
    type: EPropertyType.STATUS,
    config: {
      options: DEFAULT_STATUS_OPTIONS,
      defaultValue: 'not_started'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 1,
    description: 'Current status of the task'
  },
  {
    name: 'Priority',
    type: EPropertyType.PRIORITY,
    config: {
      options: DEFAULT_PRIORITY_OPTIONS,
      defaultValue: 'medium'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 2,
    description: 'Task priority level'
  },
  {
    name: 'Assignee',
    type: EPropertyType.RELATION,
    config: {
      allowMultiple: true,
      relationDatabaseId: 'users' // Special case for user relations
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 3,
    description: 'Person(s) assigned to this task'
  },
  {
    name: 'Due Date',
    type: EPropertyType.DATE,
    config: {
      includeTime: true
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 4,
    description: 'When the task is due'
  },
  {
    name: 'Start Date',
    type: EPropertyType.DATE,
    config: {
      includeTime: true
    },
    isSystem: true,
    isFrozen: false,
    isVisible: false,
    order: 5,
    description: 'When to start working on the task'
  },
  {
    name: 'Estimated Hours',
    type: EPropertyType.NUMBER,
    config: {
      format: 'number',
      precision: 1
    },
    isSystem: true,
    isFrozen: false,
    isVisible: false,
    order: 6,
    description: 'Estimated time to complete (hours)'
  },
  {
    name: 'Actual Hours',
    type: EPropertyType.NUMBER,
    config: {
      format: 'number',
      precision: 1
    },
    isSystem: true,
    isFrozen: false,
    isVisible: false,
    order: 7,
    description: 'Actual time spent (hours)'
  },
  {
    name: 'Progress',
    type: EPropertyType.NUMBER,
    config: {
      format: 'percentage',
      precision: 0,
      defaultValue: 0
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 8,
    description: 'Task completion percentage'
  },
  {
    name: 'Labels',
    type: EPropertyType.MULTI_SELECT,
    config: {
      options: [
        { id: 'bug', value: 'bug', label: 'Bug', color: 'red' },
        { id: 'feature', value: 'feature', label: 'Feature', color: 'blue' },
        { id: 'improvement', value: 'improvement', label: 'Improvement', color: 'green' },
        { id: 'documentation', value: 'documentation', label: 'Documentation', color: 'purple' }
      ]
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 9,
    description: 'Task categories and tags'
  },
  {
    name: 'Created Time',
    type: EPropertyType.CREATED_TIME,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: false,
    order: 10,
    description: 'When the task was created'
  },
  {
    name: 'Created By',
    type: EPropertyType.CREATED_BY,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: false,
    order: 11,
    description: 'Who created the task'
  },
  {
    name: 'Last Edited Time',
    type: EPropertyType.LAST_EDITED_TIME,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: false,
    order: 12,
    description: 'When the task was last modified'
  },
  {
    name: 'Last Edited By',
    type: EPropertyType.LAST_EDITED_BY,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: false,
    order: 13,
    description: 'Who last modified the task'
  }
];

// Default properties for NOTES database
export const NOTES_DEFAULT_PROPERTIES: IDefaultProperty[] = [
  {
    name: 'Title',
    type: EPropertyType.TEXT,
    config: {
      required: true,
      maxLength: 200
    },
    isSystem: true,
    isFrozen: true,
    isVisible: true,
    order: 0,
    description: 'Note title'
  },
  {
    name: 'Status',
    type: EPropertyType.STATUS,
    config: {
      options: [
        { id: 'draft', value: 'draft', label: 'Draft', color: 'gray' },
        { id: 'in_review', value: 'in_review', label: 'In Review', color: 'yellow' },
        { id: 'published', value: 'published', label: 'Published', color: 'green' },
        { id: 'archived', value: 'archived', label: 'Archived', color: 'red' }
      ],
      defaultValue: 'draft'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 1,
    description: 'Note publication status'
  },
  {
    name: 'Category',
    type: EPropertyType.SELECT,
    config: {
      options: [
        { id: 'personal', value: 'personal', label: 'Personal', color: 'blue' },
        { id: 'work', value: 'work', label: 'Work', color: 'orange' },
        { id: 'research', value: 'research', label: 'Research', color: 'purple' },
        { id: 'meeting', value: 'meeting', label: 'Meeting', color: 'green' },
        { id: 'idea', value: 'idea', label: 'Idea', color: 'yellow' }
      ]
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 2,
    description: 'Note category'
  },
  {
    name: 'Tags',
    type: EPropertyType.MULTI_SELECT,
    config: {
      options: [
        { id: 'important', value: 'important', label: 'Important', color: 'red' },
        { id: 'todo', value: 'todo', label: 'To Do', color: 'blue' },
        { id: 'reference', value: 'reference', label: 'Reference', color: 'green' }
      ]
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 3,
    description: 'Note tags'
  },
  {
    name: 'Created Time',
    type: EPropertyType.CREATED_TIME,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: true,
    order: 4,
    description: 'When the note was created'
  },
  {
    name: 'Last Edited Time',
    type: EPropertyType.LAST_EDITED_TIME,
    config: {},
    isSystem: true,
    isFrozen: true,
    isVisible: true,
    order: 5,
    description: 'When the note was last modified'
  }
];

// Default properties for PROJECTS database
export const PROJECTS_DEFAULT_PROPERTIES: IDefaultProperty[] = [
  {
    name: 'Name',
    type: EPropertyType.TEXT,
    config: {
      required: true,
      maxLength: 200
    },
    isSystem: true,
    isFrozen: true,
    isVisible: true,
    order: 0,
    description: 'Project name'
  },
  {
    name: 'Status',
    type: EPropertyType.STATUS,
    config: {
      options: [
        { id: 'planning', value: 'planning', label: 'Planning', color: 'gray' },
        { id: 'active', value: 'active', label: 'Active', color: 'blue' },
        { id: 'on_hold', value: 'on_hold', label: 'On Hold', color: 'yellow' },
        { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
        { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' }
      ],
      defaultValue: 'planning'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 1,
    description: 'Project status'
  },
  {
    name: 'Priority',
    type: EPropertyType.PRIORITY,
    config: {
      options: DEFAULT_PRIORITY_OPTIONS,
      defaultValue: 'medium'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 2,
    description: 'Project priority'
  },
  {
    name: 'Owner',
    type: EPropertyType.RELATION,
    config: {
      allowMultiple: false,
      relationDatabaseId: 'users'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 3,
    description: 'Project owner'
  },
  {
    name: 'Team',
    type: EPropertyType.RELATION,
    config: {
      allowMultiple: true,
      relationDatabaseId: 'users'
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 4,
    description: 'Project team members'
  },
  {
    name: 'Start Date',
    type: EPropertyType.DATE,
    config: {
      includeTime: false
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 5,
    description: 'Project start date'
  },
  {
    name: 'End Date',
    type: EPropertyType.DATE,
    config: {
      includeTime: false
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 6,
    description: 'Project end date'
  },
  {
    name: 'Progress',
    type: EPropertyType.NUMBER,
    config: {
      format: 'percentage',
      precision: 0,
      defaultValue: 0
    },
    isSystem: true,
    isFrozen: false,
    isVisible: true,
    order: 7,
    description: 'Project completion percentage'
  }
];

// Function to get default properties for a database type
export function getDefaultProperties(databaseType: EDatabaseType): IDefaultProperty[] {
  switch (databaseType) {
    case EDatabaseType.TASKS:
      return TASKS_DEFAULT_PROPERTIES;
    case EDatabaseType.NOTES:
      return NOTES_DEFAULT_PROPERTIES;
    case EDatabaseType.PROJECTS:
      return PROJECTS_DEFAULT_PROPERTIES;
    case EDatabaseType.PEOPLE:
      return []; // TODO: Implement people default properties
    case EDatabaseType.CUSTOM:
      return []; // Custom databases start with no default properties
    default:
      return [];
  }
}

// Function to create property instances from default properties
export function createDefaultPropertiesForDatabase(
  databaseId: string,
  databaseType: EDatabaseType,
  userId: string
): IProperty[] {
  const defaultProps = getDefaultProperties(databaseType);
  const now = new Date();

  return defaultProps.map(defaultProp => ({
    id: generateId(),
    databaseId,
    name: defaultProp.name,
    type: defaultProp.type,
    config: defaultProp.config,
    isSystem: defaultProp.isSystem,
    isVisible: defaultProp.isVisible,
    order: defaultProp.order,
    description: defaultProp.description,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId
  }));
}
