import { IModuleConfig, EModuleCategory } from '@/modules/modules/types/module.types';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { EViewType } from '@/modules/core/types/view.types';

export const DASHBOARD_MODULE: IModuleConfig = {
  id: EDatabaseType.DASHBOARD,
  name: 'Dashboard',
  description: 'Central for second brain overview and quick access',
  icon: '📊',
  color: '#3B82F6',
  category: EModuleCategory.SYSTEM,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Widget Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 100 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Name of the dashboard widget'
    },
    {
      name: 'Widget Type',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'stats', value: 'stats', label: 'Statistics', color: 'blue' },
          { id: 'chart', value: 'chart', label: 'Chart', color: 'green' },
          { id: 'list', value: 'list', label: 'List', color: 'purple' },
          { id: 'calendar', value: 'calendar', label: 'Calendar', color: 'orange' }
        ],
        defaultValue: 'stats'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Type of dashboard widget'
    },
    {
      name: 'Position',
      type: EPropertyType.NUMBER,
      config: { min: 0, defaultValue: 0 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Widget position on dashboard'
    },
    {
      name: 'Is Active',
      type: EPropertyType.CHECKBOX,
      config: { defaultValue: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Whether the widget is active'
    }
  ],
  defaultViews: [
    {
      name: 'All Widgets',
      type: EViewType.TABLE,
      description: 'All dashboard widgets',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Widget Name', 'Widget Type', 'Position', 'Is Active'],
        hiddenProperties: [],
        frozenColumns: ['Widget Name'],
        sorts: [{ property: 'Position', direction: 'asc' }],
        pageSize: 25
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Quick Stats Widget',
      description: 'Basic statistics widget',
      defaultValues: {
        'Widget Type': 'stats',
        'Is Active': true
      },
      isDefault: true
    }
  ]
} as const;

export const TASKS_MODULE: IModuleConfig = {
  id: EDatabaseType.TASKS,
  name: 'Tasks',
  description: 'Task management with priorities, due dates, and project linking',
  icon: '✅',
  color: '#10B981',
  category: EModuleCategory.PRODUCTIVITY,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
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
        options: [
          { id: 'not_started', value: 'not_started', label: 'Not Started', color: 'gray' },
          { id: 'in_progress', value: 'in_progress', label: 'In Progress', color: 'blue' },
          { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
          { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' }
        ],
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
        options: [
          { id: 'low', value: 'low', label: 'Low', color: 'gray' },
          { id: 'medium', value: 'medium', label: 'Medium', color: 'yellow' },
          { id: 'high', value: 'high', label: 'High', color: 'orange' },
          { id: 'urgent', value: 'urgent', label: 'Urgent', color: 'red' }
        ],
        defaultValue: 'medium'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Task priority level'
    },
    {
      name: 'Due Date',
      type: EPropertyType.DATE,
      config: { includeTime: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'When the task is due'
    },
    {
      name: 'Assignee',
      type: EPropertyType.RELATION,
      config: {
        relationDatabaseId: EDatabaseType.PEOPLE,
        allowMultiple: true
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'People assigned to this task'
    },
    {
      name: 'Project',
      type: EPropertyType.RELATION,
      config: {
        relationDatabaseId: EDatabaseType.PARA_PROJECTS,
        allowMultiple: false
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Project this task belongs to'
    },
    {
      name: 'Tags',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'urgent', value: 'urgent', label: 'Urgent', color: 'red' },
          { id: 'meeting', value: 'meeting', label: 'Meeting', color: 'blue' },
          { id: 'research', value: 'research', label: 'Research', color: 'purple' },
          { id: 'review', value: 'review', label: 'Review', color: 'orange' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Task tags for categorization'
    },
    {
      name: 'Estimated Hours',
      type: EPropertyType.NUMBER,
      config: { min: 0, precision: 1, defaultValue: 1 },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 7,
      description: 'Estimated time to complete in hours'
    }
  ],
  defaultViews: [
    {
      name: 'All Tasks',
      type: EViewType.TABLE,
      description: 'Complete list of all tasks',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Name', 'Status', 'Priority', 'Due Date', 'Assignee', 'Project'],
        hiddenProperties: [],
        frozenColumns: ['Name'],
        sorts: [
          { property: 'Priority', direction: 'desc' },
          { property: 'Due Date', direction: 'asc' }
        ],
        pageSize: 50
      }
    },
    {
      name: 'My Tasks',
      type: EViewType.TABLE,
      description: 'Tasks assigned to me',
      isDefault: false,
      order: 1,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Status', 'Priority', 'Due Date', 'Project'],
        sorts: [{ property: 'Due Date', direction: 'asc' }],
        filters: [{ property: 'Assignee', operator: 'contains_relation', value: '@me' }],
        pageSize: 25
      }
    },
    {
      name: 'Task Board',
      type: EViewType.BOARD,
      description: 'Kanban board view of tasks',
      isDefault: false,
      order: 2,
      settings: {
        groups: [{ property: 'Status', direction: 'asc', showEmpty: true }],
        visibleProperties: ['Name', 'Priority', 'Due Date', 'Assignee'],
        cardSize: 'medium'
      }
    },
    {
      name: 'Calendar',
      type: EViewType.CALENDAR,
      description: 'Calendar view of tasks by due date',
      isDefault: false,
      order: 3,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Status', 'Priority', 'Assignee']
      }
    }
  ],
  defaultRelations: [
    {
      sourceProperty: 'Project',
      targetModule: EDatabaseType.PARA_PROJECTS,
      targetProperty: 'Name',
      type: 'many_to_one',
      isRequired: false,
      cascadeDelete: false
    },
    {
      sourceProperty: 'Assignee',
      targetModule: EDatabaseType.PEOPLE,
      targetProperty: 'Name',
      type: 'many_to_many',
      isRequired: false,
      cascadeDelete: false
    }
  ],
  templates: [
    {
      name: 'Quick Task',
      description: 'Simple task template',
      defaultValues: {
        Status: 'not_started',
        Priority: 'medium',
        'Estimated Hours': 1
      },
      isDefault: true
    },
    {
      name: 'Meeting Task',
      description: 'Task for meetings',
      defaultValues: {
        Status: 'not_started',
        Priority: 'medium',
        Tags: ['meeting'],
        'Estimated Hours': 1
      },
      isDefault: false
    }
  ]
} as const;

export const NOTES_MODULE: IModuleConfig = {
  id: EDatabaseType.NOTES,
  name: 'Notes',
  description: 'Knowledge management with rich-text content and linking',
  icon: '📝',
  color: '#8B5CF6',
  category: EModuleCategory.KNOWLEDGE,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Title',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
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
          { id: 'work', value: 'work', label: 'Work', color: 'green' },
          { id: 'research', value: 'research', label: 'Research', color: 'purple' },
          { id: 'ideas', value: 'ideas', label: 'Ideas', color: 'yellow' },
          { id: 'reference', value: 'reference', label: 'Reference', color: 'gray' }
        ],
        defaultValue: 'personal'
      },
      isSystem: false,
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
          { id: 'todo', value: 'todo', label: 'To Do', color: 'orange' },
          { id: 'idea', value: 'idea', label: 'Idea', color: 'yellow' },
          { id: 'reference', value: 'reference', label: 'Reference', color: 'blue' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Note tags for organization'
    },
    {
      name: 'Word Count',
      type: EPropertyType.NUMBER,
      config: { min: 0, defaultValue: 0, readOnly: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Number of words in the note'
    },
    {
      name: 'Reading Time',
      type: EPropertyType.NUMBER,
      config: { min: 0, defaultValue: 0, readOnly: true, suffix: 'min' },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Estimated reading time in minutes'
    },
    {
      name: 'Last Viewed',
      type: EPropertyType.LAST_EDITED_TIME,
      config: { includeTime: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'When the note was last viewed'
    }
  ],
  defaultViews: [
    {
      name: 'All Notes',
      type: EViewType.TABLE,
      description: 'Complete list of all notes',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Title', 'Status', 'Category', 'Tags', 'Word Count', 'Last Viewed'],
        hiddenProperties: [],
        frozenColumns: ['Title'],
        sorts: [{ property: 'Last Viewed', direction: 'desc' }],
        pageSize: 25
      }
    },
    {
      name: 'Published Notes',
      type: EViewType.GALLERY,
      description: 'Gallery view of published notes',
      isDefault: false,
      order: 1,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Title', 'Category', 'Tags', 'Reading Time'],
        filters: [{ property: 'Status', operator: 'is', value: 'published' }],
        sorts: [{ property: 'Last Viewed', direction: 'desc' }],
        cardSize: 'medium'
      }
    },
    {
      name: 'Draft Notes',
      type: EViewType.LIST,
      description: 'List of draft notes',
      isDefault: false,
      order: 2,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Title', 'Category', 'Word Count'],
        filters: [{ property: 'Status', operator: 'is', value: 'draft' }],
        sorts: [{ property: 'Last Viewed', direction: 'desc' }]
      }
    }
  ],
  defaultRelations: [
    {
      sourceProperty: 'Project',
      targetModule: EDatabaseType.PARA_PROJECTS,
      targetProperty: 'Name',
      type: 'many_to_one',
      isRequired: false,
      cascadeDelete: false
    },
    {
      sourceProperty: 'Assignee',
      targetModule: EDatabaseType.PEOPLE,
      targetProperty: 'Name',
      type: 'many_to_one',
      isRequired: false,
      cascadeDelete: false
    },
    {
      sourceProperty: 'Related Goals',
      targetModule: EDatabaseType.GOALS,
      targetProperty: 'Title',
      type: 'many_to_many',
      isRequired: false,
      cascadeDelete: false
    }
  ],
  templates: [
    {
      name: 'Quick Note',
      description: 'Simple note template',
      defaultValues: {
        Status: 'draft',
        Category: 'personal'
      },
      isDefault: true
    },
    {
      name: 'Meeting Notes',
      description: 'Template for meeting notes',
      defaultValues: {
        Status: 'draft',
        Category: 'work',
        Tags: ['meeting']
      },
      isDefault: false
    }
  ]
} as const;

export const GOALS_MODULE: IModuleConfig = {
  id: EDatabaseType.GOALS,
  name: 'Goals',
  description: 'Goal setting and progress tracking with deadlines and milestones',
  icon: '🎯',
  color: '#EF4444',
  category: EModuleCategory.PERSONAL,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Goal name or title'
    },
    {
      name: 'Status',
      type: EPropertyType.STATUS,
      config: {
        options: [
          { id: 'not_started', value: 'not_started', label: 'Not Started', color: 'gray' },
          { id: 'in_progress', value: 'in_progress', label: 'In Progress', color: 'blue' },
          { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
          { id: 'paused', value: 'paused', label: 'Paused', color: 'yellow' },
          { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' }
        ],
        defaultValue: 'not_started'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Current goal status'
    },
    {
      name: 'Priority',
      type: EPropertyType.PRIORITY,
      config: {
        options: [
          { id: 'low', value: 'low', label: 'Low', color: 'gray' },
          { id: 'medium', value: 'medium', label: 'Medium', color: 'yellow' },
          { id: 'high', value: 'high', label: 'High', color: 'orange' },
          { id: 'critical', value: 'critical', label: 'Critical', color: 'red' }
        ],
        defaultValue: 'medium'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Goal priority level'
    },
    {
      name: 'Target Date',
      type: EPropertyType.DATE,
      config: { includeTime: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Target completion date'
    },
    {
      name: 'Progress',
      type: EPropertyType.NUMBER,
      config: { min: 0, max: 100, format: 'percentage', defaultValue: 0 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Goal completion percentage'
    },
    {
      name: 'Category',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'personal', value: 'personal', label: 'Personal', color: 'blue' },
          { id: 'career', value: 'career', label: 'Career', color: 'green' },
          { id: 'health', value: 'health', label: 'Health', color: 'red' },
          { id: 'financial', value: 'financial', label: 'Financial', color: 'yellow' },
          { id: 'learning', value: 'learning', label: 'Learning', color: 'purple' },
          { id: 'relationships', value: 'relationships', label: 'Relationships', color: 'pink' }
        ],
        defaultValue: 'personal'
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Goal category'
    },
    {
      name: 'Related Tasks',
      type: EPropertyType.RELATION,
      config: {
        relationDatabaseId: EDatabaseType.TASKS,
        allowMultiple: true
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Tasks related to this goal'
    }
  ],
  defaultViews: [
    {
      name: 'All Goals',
      type: EViewType.TABLE,
      description: 'Complete list of all goals',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Name', 'Status', 'Priority', 'Target Date', 'Progress', 'Category'],
        hiddenProperties: [],
        frozenColumns: ['Name'],
        sorts: [
          { property: 'Priority', direction: 'desc' },
          { property: 'Target Date', direction: 'asc' }
        ],
        pageSize: 25
      }
    },
    {
      name: 'Active Goals',
      type: EViewType.BOARD,
      description: 'Kanban board of active goals',
      isDefault: false,
      order: 1,
      settings: {
        groups: [{ property: 'Status', direction: 'asc', showEmpty: true }],
        visibleProperties: ['Name', 'Priority', 'Target Date', 'Progress'],
        filters: [
          { property: 'Status', operator: 'is_not', value: 'completed' },
          { property: 'Status', operator: 'is_not', value: 'cancelled' }
        ],
        cardSize: 'medium'
      }
    }
  ],
  defaultRelations: [
    {
      sourceProperty: 'Related Tasks',
      targetModule: EDatabaseType.TASKS,
      targetProperty: 'Name',
      type: 'one_to_many',
      isRequired: false,
      cascadeDelete: false
    }
  ],
  templates: [
    {
      name: 'Personal Goal',
      description: 'Template for personal goals',
      defaultValues: {
        Status: 'not_started',
        Priority: 'medium',
        Category: 'personal',
        Progress: 0
      },
      isDefault: true
    }
  ]
} as const;

export const PEOPLE_MODULE: IModuleConfig = {
  id: EDatabaseType.PEOPLE,
  name: 'People',
  description: 'Contact management and relationship tracking',
  icon: '👥',
  color: '#EC4899',
  category: EModuleCategory.PERSONAL,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 100 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Person name'
    },
    {
      name: 'Email',
      type: EPropertyType.EMAIL,
      config: { required: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Email address'
    },
    {
      name: 'Phone',
      type: EPropertyType.PHONE,
      config: { required: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Phone number'
    },
    {
      name: 'Role',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'colleague', value: 'colleague', label: 'Colleague', color: 'blue' },
          { id: 'friend', value: 'friend', label: 'Friend', color: 'green' },
          { id: 'family', value: 'family', label: 'Family', color: 'red' },
          { id: 'client', value: 'client', label: 'Client', color: 'purple' },
          { id: 'mentor', value: 'mentor', label: 'Mentor', color: 'orange' },
          { id: 'other', value: 'other', label: 'Other', color: 'gray' }
        ],
        defaultValue: 'colleague'
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Relationship type'
    },
    {
      name: 'Company',
      type: EPropertyType.TEXT,
      config: { maxLength: 100 },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Company or organization'
    },
    {
      name: 'Tags',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'important', value: 'important', label: 'Important', color: 'red' },
          { id: 'frequent', value: 'frequent', label: 'Frequent Contact', color: 'blue' },
          { id: 'professional', value: 'professional', label: 'Professional', color: 'green' },
          { id: 'personal', value: 'personal', label: 'Personal', color: 'purple' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Contact tags'
    },
    {
      name: 'Last Contact',
      type: EPropertyType.DATE,
      config: { includeTime: true },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Last contact date'
    }
  ],
  defaultViews: [
    {
      name: 'All People',
      type: EViewType.TABLE,
      description: 'Complete list of all contacts',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Name', 'Email', 'Phone', 'Role', 'Company', 'Last Contact'],
        hiddenProperties: [],
        frozenColumns: ['Name'],
        sorts: [{ property: 'Name', direction: 'asc' }],
        pageSize: 50
      }
    },
    {
      name: 'People Gallery',
      type: EViewType.GALLERY,
      description: 'Gallery view of contacts',
      isDefault: false,
      order: 1,
      settings: {
        visibleProperties: ['Name', 'Role', 'Company', 'Tags'],
        hiddenProperties: [],
        sorts: [{ property: 'Last Contact', direction: 'desc' }],
        cardSize: 'medium'
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Professional Contact',
      description: 'Template for professional contacts',
      defaultValues: {
        Role: 'colleague'
      },
      isDefault: true
    }
  ]
} as const;

export const FINANCE_MODULE: IModuleConfig = {
  id: EDatabaseType.FINANCE,
  name: 'Finance',
  description: 'Personal finance tracking with income, expenses, and budgeting',
  icon: '💰',
  color: '#059669',
  category: EModuleCategory.FINANCE,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Description',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Transaction description'
    },
    {
      name: 'Amount',
      type: EPropertyType.NUMBER,
      config: { required: true, format: 'currency', currency: 'USD', precision: 2 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Transaction amount'
    },
    {
      name: 'Type',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'income', value: 'income', label: 'Income', color: 'green' },
          { id: 'expense', value: 'expense', label: 'Expense', color: 'red' },
          { id: 'transfer', value: 'transfer', label: 'Transfer', color: 'blue' },
          { id: 'investment', value: 'investment', label: 'Investment', color: 'purple' }
        ],
        defaultValue: 'expense'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Transaction type'
    },
    {
      name: 'Category',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'food', value: 'food', label: 'Food & Dining', color: 'orange' },
          { id: 'transportation', value: 'transportation', label: 'Transportation', color: 'blue' },
          { id: 'housing', value: 'housing', label: 'Housing', color: 'green' },
          { id: 'utilities', value: 'utilities', label: 'Utilities', color: 'yellow' },
          { id: 'healthcare', value: 'healthcare', label: 'Healthcare', color: 'red' },
          { id: 'entertainment', value: 'entertainment', label: 'Entertainment', color: 'purple' },
          { id: 'shopping', value: 'shopping', label: 'Shopping', color: 'pink' },
          { id: 'education', value: 'education', label: 'Education', color: 'indigo' },
          { id: 'salary', value: 'salary', label: 'Salary', color: 'green' },
          { id: 'freelance', value: 'freelance', label: 'Freelance', color: 'blue' },
          { id: 'other', value: 'other', label: 'Other', color: 'gray' }
        ],
        defaultValue: 'other'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Transaction category'
    },
    {
      name: 'Date',
      type: EPropertyType.DATE,
      config: { includeTime: false, defaultValue: 'today' },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Transaction date'
    },
    {
      name: 'Account',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'checking', value: 'checking', label: 'Checking Account', color: 'blue' },
          { id: 'savings', value: 'savings', label: 'Savings Account', color: 'green' },
          { id: 'credit_card', value: 'credit_card', label: 'Credit Card', color: 'red' },
          { id: 'cash', value: 'cash', label: 'Cash', color: 'yellow' },
          { id: 'investment', value: 'investment', label: 'Investment Account', color: 'purple' }
        ],
        defaultValue: 'checking'
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Account used for transaction'
    }
  ],
  defaultViews: [
    {
      name: 'All Transactions',
      type: EViewType.TABLE,
      description: 'Complete list of all transactions',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Description', 'Amount', 'Type', 'Category', 'Date', 'Account'],
        hiddenProperties: [],
        frozenColumns: ['Description'],
        sorts: [{ property: 'Date', direction: 'desc' }],
        pageSize: 50
      }
    },
    {
      name: 'Expenses',
      type: EViewType.TABLE,
      description: 'All expense transactions',
      isDefault: false,
      order: 1,
      settings: {
        visibleProperties: ['Description', 'Amount', 'Category', 'Date', 'Account'],
        hiddenProperties: [],
        filters: [{ property: 'Type', operator: 'equals', value: 'expense' }],
        sorts: [{ property: 'Date', direction: 'desc' }],
        pageSize: 25
      }
    },
    {
      name: 'Income',
      type: EViewType.TABLE,
      description: 'All income transactions',
      isDefault: false,
      order: 2,
      settings: {
        visibleProperties: ['Description', 'Amount', 'Category', 'Date', 'Account'],
        hiddenProperties: [],
        filters: [{ property: 'Type', operator: 'equals', value: 'income' }],
        sorts: [{ property: 'Date', direction: 'desc' }],
        pageSize: 25
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Expense',
      description: 'Basic expense template',
      defaultValues: {
        Type: 'expense',
        Account: 'checking'
      },
      isDefault: true
    },
    {
      name: 'Income',
      description: 'Basic income template',
      defaultValues: {
        Type: 'income',
        Category: 'salary',
        Account: 'checking'
      },
      isDefault: false
    }
  ]
} as const;

export const HABITS_MODULE: IModuleConfig = {
  id: EDatabaseType.HABITS,
  name: 'Habits',
  description: 'Habit tracking and streak management for personal development',
  icon: '🔄',
  color: '#8B5CF6',
  category: EModuleCategory.HEALTH,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 100 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Habit name'
    },
    {
      name: 'Description',
      type: EPropertyType.TEXT,
      config: { maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Habit description'
    },
    {
      name: 'Category',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'health', value: 'health', label: 'Health', color: 'green' },
          { id: 'productivity', value: 'productivity', label: 'Productivity', color: 'blue' },
          { id: 'learning', value: 'learning', label: 'Learning', color: 'purple' },
          { id: 'social', value: 'social', label: 'Social', color: 'pink' },
          { id: 'mindfulness', value: 'mindfulness', label: 'Mindfulness', color: 'orange' },
          { id: 'finance', value: 'finance', label: 'Finance', color: 'yellow' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Habit category'
    },
    {
      name: 'Frequency',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'daily', value: 'daily', label: 'Daily', color: 'green' },
          { id: 'weekly', value: 'weekly', label: 'Weekly', color: 'blue' },
          { id: 'monthly', value: 'monthly', label: 'Monthly', color: 'purple' },
          { id: 'custom', value: 'custom', label: 'Custom', color: 'gray' }
        ],
        defaultValue: 'daily'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'How often to perform the habit'
    },
    {
      name: 'Target',
      type: EPropertyType.NUMBER,
      config: { min: 1, defaultValue: 1 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Target count per frequency period'
    },
    {
      name: 'Current Streak',
      type: EPropertyType.NUMBER,
      config: { min: 0, defaultValue: 0 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Current consecutive streak'
    },
    {
      name: 'Best Streak',
      type: EPropertyType.NUMBER,
      config: { min: 0, defaultValue: 0 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Best streak achieved'
    },
    {
      name: 'Start Date',
      type: EPropertyType.DATE,
      config: { includeTime: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 7,
      description: 'When the habit was started'
    },
    {
      name: 'Status',
      type: EPropertyType.STATUS,
      config: {
        options: [
          { id: 'active', value: 'active', label: 'Active', color: 'green' },
          { id: 'paused', value: 'paused', label: 'Paused', color: 'yellow' },
          { id: 'completed', value: 'completed', label: 'Completed', color: 'blue' },
          { id: 'abandoned', value: 'abandoned', label: 'Abandoned', color: 'red' }
        ],
        defaultValue: 'active'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 8,
      description: 'Current habit status'
    },
    {
      name: 'Tags',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'morning', value: 'morning', label: 'Morning', color: 'orange' },
          { id: 'evening', value: 'evening', label: 'Evening', color: 'purple' },
          { id: 'workout', value: 'workout', label: 'Workout', color: 'red' },
          { id: 'meditation', value: 'meditation', label: 'Meditation', color: 'blue' },
          { id: 'reading', value: 'reading', label: 'Reading', color: 'green' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 9,
      description: 'Habit tags'
    }
  ],
  defaultViews: [
    {
      name: 'All Habits',
      type: EViewType.TABLE,
      description: 'Complete list of all habits',
      isDefault: true,
      order: 0,
      settings: {
        visibleProperties: ['Name', 'Category', 'Frequency', 'Current Streak', 'Status'],
        hiddenProperties: [],
        frozenColumns: ['Name'],
        sorts: [{ property: 'Current Streak', direction: 'desc' }],
        pageSize: 25
      }
    },
    {
      name: 'Active Habits',
      type: EViewType.BOARD,
      description: 'Kanban board of active habits by category',
      isDefault: false,
      order: 1,
      settings: {
        groups: [{ property: 'Category', direction: 'asc', showEmpty: true }],
        visibleProperties: ['Name', 'Frequency', 'Current Streak', 'Target'],
        filters: [{ property: 'Status', operator: 'is', value: 'active' }],
        cardSize: 'small'
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Daily Habit',
      description: 'Simple daily habit template',
      defaultValues: {
        Frequency: 'daily',
        Target: 1,
        Status: 'active'
      },
      isDefault: true
    }
  ]
} as const;

export const JOURNAL_MODULE: IModuleConfig = {
  id: EDatabaseType.JOURNAL,
  name: 'Journal',
  description: 'Daily journaling and reflection with mood tracking',
  icon: '📔',
  color: '#F59E0B',
  category: EModuleCategory.PERSONAL,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Date',
      type: EPropertyType.DATE,
      config: { includeTime: false, required: true },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Journal entry date'
    },
    {
      name: 'Title',
      type: EPropertyType.TEXT,
      config: { maxLength: 200 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Entry title'
    },
    {
      name: 'Mood',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'amazing', value: 'amazing', label: '😄 Amazing', color: 'green' },
          { id: 'good', value: 'good', label: '😊 Good', color: 'blue' },
          { id: 'okay', value: 'okay', label: '😐 Okay', color: 'yellow' },
          { id: 'bad', value: 'bad', label: '😞 Bad', color: 'orange' },
          { id: 'terrible', value: 'terrible', label: '😢 Terrible', color: 'red' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Overall mood for the day'
    },
    {
      name: 'Energy Level',
      type: EPropertyType.NUMBER,
      config: { min: 1, max: 10, defaultValue: 5 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Energy level (1-10)'
    },
    {
      name: 'Gratitude',
      type: EPropertyType.TEXT,
      config: { maxLength: 1000 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'What are you grateful for?'
    },
    {
      name: 'Highlights',
      type: EPropertyType.TEXT,
      config: { maxLength: 1000 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Best parts of the day'
    },
    {
      name: 'Challenges',
      type: EPropertyType.TEXT,
      config: { maxLength: 1000 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Challenges faced today'
    },
    {
      name: 'Lessons Learned',
      type: EPropertyType.TEXT,
      config: { maxLength: 1000 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 7,
      description: 'What did you learn?'
    },
    {
      name: 'Tomorrow Goals',
      type: EPropertyType.TEXT,
      config: { maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 8,
      description: 'Goals for tomorrow'
    },
    {
      name: 'Tags',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'work', value: 'work', label: 'Work', color: 'blue' },
          { id: 'personal', value: 'personal', label: 'Personal', color: 'green' },
          { id: 'family', value: 'family', label: 'Family', color: 'pink' },
          { id: 'health', value: 'health', label: 'Health', color: 'red' },
          { id: 'travel', value: 'travel', label: 'Travel', color: 'purple' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 9,
      description: 'Entry tags'
    }
  ],
  defaultViews: [
    {
      name: 'All Entries',
      type: EViewType.TABLE,
      description: 'Complete journal entries',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Date', 'Title', 'Mood', 'Energy Level', 'Tags'],
        frozenColumns: ['Date'],
        sorts: [{ property: 'Date', direction: 'desc' }],
        pageSize: 30
      }
    },
    {
      name: 'Calendar View',
      type: EViewType.CALENDAR,
      description: 'Calendar view of journal entries',
      isDefault: false,
      order: 1,
      settings: {
        dateProperty: 'Date',
        titleProperty: 'Title',
        colorProperty: 'Mood'
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Daily Entry',
      description: 'Standard daily journal template',
      defaultValues: {
        Date: new Date().toISOString().split('T')[0],
        'Energy Level': 5
      },
      isDefault: true
    }
  ]
} as const;

export const MOOD_TRACKER_MODULE: IModuleConfig = {
  id: EDatabaseType.MOOD_TRACKER,
  name: 'Mood Tracker',
  description: 'Track daily moods and emotional patterns',
  icon: '😊',
  color: '#EC4899',
  category: EModuleCategory.HEALTH,
  isCore: true,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Date',
      type: EPropertyType.DATE,
      config: { includeTime: true, required: true },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'When the mood was recorded'
    },
    {
      name: 'Mood',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'ecstatic', value: 'ecstatic', label: '🤩 Ecstatic', color: 'green' },
          { id: 'happy', value: 'happy', label: '😄 Happy', color: 'blue' },
          { id: 'content', value: 'content', label: '😊 Content', color: 'teal' },
          { id: 'neutral', value: 'neutral', label: '😐 Neutral', color: 'gray' },
          { id: 'anxious', value: 'anxious', label: '😰 Anxious', color: 'yellow' },
          { id: 'sad', value: 'sad', label: '😢 Sad', color: 'orange' },
          { id: 'angry', value: 'angry', label: '😠 Angry', color: 'red' },
          { id: 'depressed', value: 'depressed', label: '😞 Depressed', color: 'purple' }
        ],
        required: true
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Current mood'
    },
    {
      name: 'Intensity',
      type: EPropertyType.NUMBER,
      config: { min: 1, max: 10, defaultValue: 5, required: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Mood intensity (1-10)'
    },
    {
      name: 'Triggers',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'work_stress', value: 'work_stress', label: 'Work Stress', color: 'red' },
          { id: 'family', value: 'family', label: 'Family', color: 'pink' },
          { id: 'health', value: 'health', label: 'Health', color: 'orange' },
          { id: 'weather', value: 'weather', label: 'Weather', color: 'blue' },
          { id: 'sleep', value: 'sleep', label: 'Sleep', color: 'purple' },
          { id: 'exercise', value: 'exercise', label: 'Exercise', color: 'green' },
          { id: 'social', value: 'social', label: 'Social', color: 'teal' },
          { id: 'finances', value: 'finances', label: 'Finances', color: 'yellow' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'What influenced this mood?'
    },
    {
      name: 'Notes',
      type: EPropertyType.TEXT,
      config: { maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Additional notes about mood'
    },
    {
      name: 'Activities',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'meditation', value: 'meditation', label: 'Meditation', color: 'purple' },
          { id: 'exercise', value: 'exercise', label: 'Exercise', color: 'green' },
          { id: 'socializing', value: 'socializing', label: 'Socializing', color: 'pink' },
          { id: 'work', value: 'work', label: 'Work', color: 'blue' },
          { id: 'hobbies', value: 'hobbies', label: 'Hobbies', color: 'orange' },
          { id: 'rest', value: 'rest', label: 'Rest', color: 'gray' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Activities during this mood'
    }
  ],
  defaultViews: [
    {
      name: 'All Moods',
      type: EViewType.TABLE,
      description: 'Complete mood tracking history',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Date', 'Mood', 'Intensity', 'Triggers', 'Notes'],
        frozenColumns: ['Date'],
        sorts: [{ property: 'Date', direction: 'desc' }],
        pageSize: 50
      }
    },
    {
      name: 'Mood Calendar',
      type: EViewType.CALENDAR,
      description: 'Calendar view of mood entries',
      isDefault: false,
      order: 1,
      settings: {
        dateProperty: 'Date',
        titleProperty: 'Mood',
        colorProperty: 'Mood'
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Quick Mood',
      description: 'Quick mood entry template',
      defaultValues: {
        Date: new Date().toISOString(),
        Intensity: 5
      },
      isDefault: true
    }
  ]
} as const;

export const PARA_PROJECTS_MODULE: IModuleConfig = {
  id: EDatabaseType.PARA_PROJECTS,
  name: 'PARA Projects',
  description: 'PARA method projects - things with deadlines and outcomes',
  icon: '🎯',
  color: '#EF4444',
  category: EModuleCategory.PARA,
  isCore: false,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Project name'
    },
    {
      name: 'Outcome',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Desired outcome or result'
    },
    {
      name: 'Deadline',
      type: EPropertyType.DATE,
      config: { includeTime: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Project deadline'
    },
    {
      name: 'Status',
      type: EPropertyType.STATUS,
      config: {
        options: [
          { id: 'active', value: 'active', label: 'Active', color: 'green' },
          { id: 'on_hold', value: 'on_hold', label: 'On Hold', color: 'yellow' },
          { id: 'completed', value: 'completed', label: 'Completed', color: 'blue' },
          { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' },
          { id: 'someday', value: 'someday', label: 'Someday/Maybe', color: 'gray' }
        ],
        defaultValue: 'active'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Project status'
    },
    {
      name: 'Area',
      type: EPropertyType.RELATION,
      config: { relationDatabaseId: EDatabaseType.PARA_AREAS, allowMultiple: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Related area of responsibility'
    },
    {
      name: 'Priority',
      type: EPropertyType.PRIORITY,
      config: {
        options: [
          { id: 'low', value: 'low', label: 'Low', color: 'gray' },
          { id: 'medium', value: 'medium', label: 'Medium', color: 'yellow' },
          { id: 'high', value: 'high', label: 'High', color: 'orange' },
          { id: 'urgent', value: 'urgent', label: 'Urgent', color: 'red' }
        ],
        defaultValue: 'medium'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Project priority'
    },
    {
      name: 'Progress',
      type: EPropertyType.NUMBER,
      config: { min: 0, max: 100, format: 'percentage', defaultValue: 0 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 6,
      description: 'Completion percentage'
    }
  ],
  defaultViews: [
    {
      name: 'All Projects',
      type: EViewType.TABLE,
      description: 'All projects',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Deadline', 'Status', 'Priority', 'Progress'],
        frozenColumns: ['Name'],
        filters: [],
        sorts: [{ property: 'Deadline', direction: 'asc' }],
        pageSize: 25
      }
    }
  ],
  defaultRelations: [
    {
      sourceProperty: 'Area',
      targetModule: EDatabaseType.PARA_AREAS,
      targetProperty: 'Name',
      type: 'many_to_one',
      isRequired: false,
      cascadeDelete: false
    }
  ],
  templates: [
    {
      name: 'Standard Project',
      description: 'Standard PARA project template',
      defaultValues: {
        Status: 'active',
        Priority: 'medium',
        Progress: 0
      },
      isDefault: true
    }
  ]
} as const;

export const PARA_AREAS_MODULE: IModuleConfig = {
  id: EDatabaseType.PARA_AREAS,
  name: 'PARA Areas',
  description: 'PARA method areas - ongoing responsibilities to maintain',
  icon: '🏠',
  color: '#10B981',
  category: EModuleCategory.PARA,
  isCore: false,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 100 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Area name'
    },
    {
      name: 'Description',
      type: EPropertyType.TEXT,
      config: { maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Area description'
    },
    {
      name: 'Standard',
      type: EPropertyType.TEXT,
      config: { maxLength: 500 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Standard to maintain in this area'
    },
    {
      name: 'Status',
      type: EPropertyType.STATUS,
      config: {
        options: [
          { id: 'active', value: 'active', label: 'Active', color: 'green' },
          { id: 'on_hold', value: 'on_hold', label: 'On Hold', color: 'yellow' },
          { id: 'archived', value: 'archived', label: 'Archived', color: 'gray' }
        ],
        defaultValue: 'active'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Area status'
    },
    {
      name: 'Review Frequency',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'daily', value: 'daily', label: 'Daily', color: 'red' },
          { id: 'weekly', value: 'weekly', label: 'Weekly', color: 'orange' },
          { id: 'monthly', value: 'monthly', label: 'Monthly', color: 'yellow' },
          { id: 'quarterly', value: 'quarterly', label: 'Quarterly', color: 'green' },
          { id: 'yearly', value: 'yearly', label: 'Yearly', color: 'blue' }
        ],
        defaultValue: 'monthly'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'How often to review this area'
    },
    {
      name: 'Last Review',
      type: EPropertyType.DATE,
      config: { includeTime: false },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Last review date'
    }
  ],
  defaultViews: [
    {
      name: 'All Areas',
      type: EViewType.TABLE,
      description: 'All areas of responsibility',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Status', 'Review Frequency', 'Last Review'],
        frozenColumns: ['Name'],
        sorts: [{ property: 'Name', direction: 'asc' }],
        pageSize: 25
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Life Area',
      description: 'Personal life area template',
      defaultValues: {
        Status: 'active',
        'Review Frequency': 'monthly'
      },
      isDefault: true
    }
  ]
} as const;

export const PARA_RESOURCES_MODULE: IModuleConfig = {
  id: EDatabaseType.PARA_RESOURCES,
  name: 'PARA Resources',
  description: 'PARA method resources - topics of ongoing interest',
  icon: '📖',
  color: '#8B5CF6',
  category: EModuleCategory.PARA,
  isCore: false,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Resource name'
    },
    {
      name: 'Topic',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'technology', value: 'technology', label: 'Technology', color: 'blue' },
          { id: 'business', value: 'business', label: 'Business', color: 'green' },
          { id: 'health', value: 'health', label: 'Health', color: 'red' },
          { id: 'finance', value: 'finance', label: 'Finance', color: 'yellow' },
          { id: 'education', value: 'education', label: 'Education', color: 'purple' },
          { id: 'hobbies', value: 'hobbies', label: 'Hobbies', color: 'pink' },
          { id: 'travel', value: 'travel', label: 'Travel', color: 'teal' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Resource topic'
    },
    {
      name: 'Type',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'article', value: 'article', label: 'Article', color: 'blue' },
          { id: 'book', value: 'book', label: 'Book', color: 'green' },
          { id: 'video', value: 'video', label: 'Video', color: 'red' },
          { id: 'course', value: 'course', label: 'Course', color: 'purple' },
          { id: 'tool', value: 'tool', label: 'Tool', color: 'orange' },
          { id: 'template', value: 'template', label: 'Template', color: 'teal' }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'Type of resource'
    },
    {
      name: 'URL',
      type: EPropertyType.URL,
      config: {},
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Resource URL'
    },
    {
      name: 'Status',
      type: EPropertyType.STATUS,
      config: {
        options: [
          { id: 'to_review', value: 'to_review', label: 'To Review', color: 'gray' },
          { id: 'reviewing', value: 'reviewing', label: 'Reviewing', color: 'yellow' },
          { id: 'useful', value: 'useful', label: 'Useful', color: 'green' },
          { id: 'archived', value: 'archived', label: 'Archived', color: 'blue' }
        ],
        defaultValue: 'to_review'
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Resource status'
    },
    {
      name: 'Tags',
      type: EPropertyType.MULTI_SELECT,
      config: {
        options: [
          { id: 'reference', value: 'reference', label: 'Reference', color: 'blue' },
          { id: 'tutorial', value: 'tutorial', label: 'Tutorial', color: 'green' },
          { id: 'inspiration', value: 'inspiration', label: 'Inspiration', color: 'purple' },
          { id: 'research', value: 'research', label: 'Research', color: 'orange' }
        ]
      },
      isSystem: false,
      isFrozen: false,
      isVisible: true,
      order: 5,
      description: 'Resource tags'
    }
  ],
  defaultViews: [
    {
      name: 'All Resources',
      type: EViewType.TABLE,
      description: 'All PARA resources',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Topic', 'Type', 'Status', 'Tags'],
        frozenColumns: ['Name'],
        sorts: [{ property: 'Name', direction: 'asc' }],
        pageSize: 25
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Article Resource',
      description: 'Article resource template',
      defaultValues: {
        Type: 'article',
        Status: 'to_review'
      },
      isDefault: true
    }
  ]
} as const;

export const PARA_ARCHIVE_MODULE: IModuleConfig = {
  id: EDatabaseType.PARA_ARCHIVE,
  name: 'PARA Archive',
  description: 'PARA method archive - inactive items from other categories',
  icon: '📦',
  color: '#6B7280',
  category: EModuleCategory.PARA,
  isCore: false,
  dependencies: [],
  defaultProperties: [
    {
      name: 'Name',
      type: EPropertyType.TEXT,
      config: { required: true, maxLength: 200 },
      isSystem: true,
      isFrozen: true,
      isVisible: true,
      order: 0,
      description: 'Archived item name'
    },
    {
      name: 'Original Category',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'project', value: 'project', label: 'Project', color: 'red' },
          { id: 'area', value: 'area', label: 'Area', color: 'green' },
          { id: 'resource', value: 'resource', label: 'Resource', color: 'purple' }
        ],
        required: true
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 1,
      description: 'Original PARA category'
    },
    {
      name: 'Archived Date',
      type: EPropertyType.DATE,
      config: { includeTime: true, required: true },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 2,
      description: 'When item was archived'
    },
    {
      name: 'Archive Reason',
      type: EPropertyType.SELECT,
      config: {
        options: [
          { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
          { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' },
          {
            id: 'no_longer_relevant',
            value: 'no_longer_relevant',
            label: 'No Longer Relevant',
            color: 'gray'
          },
          {
            id: 'moved_to_someday',
            value: 'moved_to_someday',
            label: 'Moved to Someday',
            color: 'yellow'
          }
        ]
      },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 3,
      description: 'Why item was archived'
    },
    {
      name: 'Notes',
      type: EPropertyType.TEXT,
      config: { maxLength: 1000 },
      isSystem: true,
      isFrozen: false,
      isVisible: true,
      order: 4,
      description: 'Archive notes'
    }
  ],
  defaultViews: [
    {
      name: 'All Archived',
      type: EViewType.TABLE,
      description: 'All archived items',
      isDefault: true,
      order: 0,
      settings: {
        hiddenProperties: [],
        visibleProperties: ['Name', 'Original Category', 'Archived Date', 'Archive Reason'],
        frozenColumns: ['Name'],
        sorts: [{ property: 'Archived Date', direction: 'desc' }],
        pageSize: 50
      }
    }
  ],
  defaultRelations: [],
  templates: [
    {
      name: 'Archived Item',
      description: 'Standard archive template',
      defaultValues: {
        'Archived Date': new Date().toISOString()
      },
      isDefault: true
    }
  ]
} as const;
