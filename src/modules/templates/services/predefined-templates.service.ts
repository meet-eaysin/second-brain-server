import { TemplateModel } from '../models/template.model';
import { ETemplateType, ETemplateCategory, ETemplateAccess } from '../types/template.types';
import { EDatabaseType } from '@/modules/database';
import { EViewType } from '@/modules/core/types/view.types';
import { EPropertyType } from '@/modules/core/types/property.types';

// Initialize all predefined templates
const initializePredefinedTemplates = async (): Promise<void> => {
  const existingTemplates = await TemplateModel.findOfficial();
  if (existingTemplates.length > 0) {
    return;
  }

  // Create row templates
  await createRowTemplates();

  // Create database templates
  await createDatabaseTemplates();

  // Create workspace templates
  await createWorkspaceTemplates();
};

// Create row templates
const createRowTemplates = async (): Promise<void> => {
  const rowTemplates = [
    // Task templates
    {
      name: 'Quick Task',
      description: 'Simple task with title and due date',
      category: ETemplateCategory.PRODUCTIVITY,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['task', 'quick', 'simple'],
      icon: '✅',
      color: '#3B82F6',
      moduleType: EDatabaseType.TASKS,
      defaultValues: {
        Status: 'not_started',
        Priority: 'medium',
        'Due Date': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      isOfficial: true,
      isFeatured: true
    },
    {
      name: 'Project Task',
      description: 'Detailed task with project assignment and time tracking',
      category: ETemplateCategory.PROJECT_MANAGEMENT,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['task', 'project', 'detailed'],
      icon: '📋',
      color: '#10B981',
      moduleType: EDatabaseType.TASKS,
      defaultValues: {
        Status: 'not_started',
        Priority: 'medium',
        Category: 'work',
        'Estimated Time': 60,
        'Due Date': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      isOfficial: true
    },

    // Goal templates
    {
      name: 'SMART Goal',
      description: 'Specific, Measurable, Achievable, Relevant, Time-bound goal',
      category: ETemplateCategory.PERSONAL,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['goal', 'smart', 'achievement'],
      icon: '🎯',
      color: '#EF4444',
      moduleType: EDatabaseType.GOALS,
      defaultValues: {
        Status: 'not_started',
        Priority: 'high',
        Timeframe: 'quarterly',
        Progress: 0,
        'Target Date': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      isOfficial: true,
      isFeatured: true
    },

    // Habit templates
    {
      name: 'Daily Habit',
      description: 'Simple daily habit tracker',
      category: ETemplateCategory.HEALTH,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['habit', 'daily', 'health'],
      icon: '🔄',
      color: '#8B5CF6',
      moduleType: EDatabaseType.HABITS,
      defaultValues: {
        Frequency: 'daily',
        Category: 'health',
        Status: 'active',
        'Current Streak': 0,
        'Best Streak': 0,
        'Start Date': new Date().toISOString().split('T')[0]
      },
      isOfficial: true,
      isFeatured: true
    },

    // Journal templates
    {
      name: 'Daily Reflection',
      description: 'Daily journal entry with gratitude and reflection',
      category: ETemplateCategory.PERSONAL,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['journal', 'reflection', 'gratitude'],
      icon: '📔',
      color: '#F59E0B',
      moduleType: EDatabaseType.JOURNAL,
      defaultValues: {
        Date: new Date().toISOString().split('T')[0],
        Mood: 'good',
        'Energy Level': 7,
        Gratitude: 'I am grateful for...',
        Highlights: "Today's best moments...",
        'Tomorrow Goals': 'Tomorrow I will...'
      },
      isOfficial: true,
      isFeatured: true
    },

    // Note templates
    {
      name: 'Meeting Notes',
      description: 'Structured meeting notes template',
      category: ETemplateCategory.BUSINESS,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['notes', 'meeting', 'business'],
      icon: '📝',
      color: '#6366F1',
      moduleType: EDatabaseType.NOTES,
      defaultValues: {
        Category: 'meeting',
        Tags: ['meeting'],
        Date: new Date().toISOString().split('T')[0]
      },
      isOfficial: true
    },

    // Project templates
    {
      name: 'Software Project',
      description: 'Software development project template',
      category: ETemplateCategory.PROJECT_MANAGEMENT,
      type: ETemplateType.ROW,
      access: ETemplateAccess.PUBLIC,
      tags: ['project', 'software', 'development'],
      icon: '💻',
      color: '#059669',
      moduleType: EDatabaseType.PARA_PROJECTS,
      defaultValues: {
        Status: 'planning',
        Priority: 'high',
        Category: 'software',
        Budget: 10000,
        'Start Date': new Date().toISOString().split('T')[0],
        'End Date': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      isOfficial: true
    }
  ];

  for (const template of rowTemplates) {
    await createTemplate(template);
  }
};

// Create database templates
const createDatabaseTemplates = async (): Promise<void> => {
  const databaseTemplates = [
    {
      name: 'Personal Task Manager',
      description: 'Complete personal task management system',
      category: ETemplateCategory.PRODUCTIVITY,
      type: ETemplateType.DATABASE,
      access: ETemplateAccess.PUBLIC,
      tags: ['tasks', 'productivity', 'personal'],
      icon: '✅',
      color: '#3B82F6',
      moduleType: EDatabaseType.TASKS,
      properties: [
        {
          name: 'Title',
          type: EPropertyType.TEXT,
          description: 'Task title',
          config: { required: true, maxLength: 200 },
          isRequired: true,
          isVisible: true,
          order: 0
        },
        {
          name: 'Status',
          type: EPropertyType.STATUS,
          description: 'Task status',
          config: {
            options: [
              { id: 'not_started', value: 'not_started', label: 'Not Started', color: 'gray' },
              { id: 'in_progress', value: 'in_progress', label: 'In Progress', color: 'yellow' },
              { id: 'completed', value: 'completed', label: 'Completed', color: 'green' },
              { id: 'cancelled', value: 'cancelled', label: 'Cancelled', color: 'red' }
            ],
            defaultValue: 'not_started'
          },
          isRequired: true,
          isVisible: true,
          order: 1
        },
        {
          name: 'Priority',
          type: EPropertyType.PRIORITY,
          description: 'Task priority',
          config: {
            options: [
              { id: 'low', value: 'low', label: 'Low', color: 'gray' },
              { id: 'medium', value: 'medium', label: 'Medium', color: 'yellow' },
              { id: 'high', value: 'high', label: 'High', color: 'orange' },
              { id: 'urgent', value: 'urgent', label: 'Urgent', color: 'red' }
            ],
            defaultValue: 'medium'
          },
          isRequired: false,
          isVisible: true,
          order: 2
        },
        {
          name: 'Due Date',
          type: EPropertyType.DATE,
          description: 'Task due date',
          config: { includeTime: false },
          isRequired: false,
          isVisible: true,
          order: 3
        },
        {
          name: 'Category',
          type: EPropertyType.SELECT,
          description: 'Task category',
          config: {
            options: [
              { id: 'work', value: 'work', label: 'Work', color: 'blue' },
              { id: 'personal', value: 'personal', label: 'Personal', color: 'green' },
              { id: 'health', value: 'health', label: 'Health', color: 'red' },
              { id: 'learning', value: 'learning', label: 'Learning', color: 'purple' }
            ]
          },
          isRequired: false,
          isVisible: true,
          order: 4
        }
      ],
      views: [
        {
          name: 'All Tasks',
          type: EViewType.TABLE,
          description: 'All tasks in table view',
          isDefault: true,
          order: 0,
          settings: {
            visibleProperties: ['Title', 'Status', 'Priority', 'Due Date', 'Category'],
            frozenProperties: ['Title'],
            sorts: [{ property: 'Due Date', direction: 'asc' }]
          }
        },
        {
          name: 'By Status',
          type: EViewType.BOARD,
          description: 'Tasks grouped by status',
          isDefault: false,
          order: 1,
          settings: {
            groups: [{ property: 'Status', direction: 'asc', showEmpty: true }],
            visibleProperties: ['Title', 'Priority', 'Due Date']
          }
        }
      ],
      relations: [],
      rowTemplates: [],
      sampleData: [
        {
          Title: 'Review project proposal',
          Status: 'not_started',
          Priority: 'high',
          'Due Date': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Category: 'work'
        },
        {
          Title: 'Schedule dentist appointment',
          Status: 'not_started',
          Priority: 'medium',
          'Due Date': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Category: 'health'
        }
      ],
      settings: {
        allowComments: true,
        allowDuplicates: false,
        enableVersioning: false,
        enableAuditLog: true,
        enableAutoTagging: false,
        enableSmartSuggestions: true,
        isPublic: false
      },
      isOfficial: true,
      isFeatured: true
    }
  ];

  for (const template of databaseTemplates) {
    await createTemplate(template);
  }
};

// Create workspace templates
const createWorkspaceTemplates = async (): Promise<void> => {
  const workspaceTemplates = [
    {
      name: 'Personal Productivity Hub',
      description:
        'Complete personal productivity workspace with tasks, goals, habits, and journal',
      category: ETemplateCategory.PRODUCTIVITY,
      type: ETemplateType.WORKSPACE,
      access: ETemplateAccess.PUBLIC,
      tags: ['productivity', 'personal', 'complete'],
      icon: '🚀',
      color: '#3B82F6',
      modules: [
        EDatabaseType.TASKS,
        EDatabaseType.GOALS,
        EDatabaseType.HABITS,
        EDatabaseType.JOURNAL,
        EDatabaseType.NOTES
      ],
      databases: [], // Would reference database templates
      crossModuleRelations: [
        {
          sourceModule: EDatabaseType.TASKS,
          targetModule: EDatabaseType.GOALS,
          sourceProperty: 'Related Goals',
          targetProperty: 'Title',
          type: 'many_to_many',
          isRequired: false,
          cascadeDelete: false
        },
        {
          sourceModule: EDatabaseType.HABITS,
          targetModule: EDatabaseType.GOALS,
          sourceProperty: 'Related Goals',
          targetProperty: 'Title',
          type: 'many_to_many',
          isRequired: false,
          cascadeDelete: false
        }
      ],
      workspaceSettings: {
        name: 'My Productivity Hub',
        description: 'Personal workspace for managing tasks, goals, habits, and reflections',
        icon: '🚀',
        color: '#3B82F6',
        isPublic: false,
        allowInvites: false,
        defaultPermissions: 'read',
        features: ['tasks', 'goals', 'habits', 'journal', 'analytics']
      },
      onboardingFlow: [
        {
          id: 'welcome',
          title: 'Welcome to Your Productivity Hub',
          description: "Let's set up your personal productivity system",
          type: 'welcome',
          order: 0,
          isRequired: true
        },
        {
          id: 'create_first_goal',
          title: 'Create Your First Goal',
          description: 'Start by setting a meaningful goal',
          type: 'setup',
          order: 1,
          isRequired: true,
          actions: [
            {
              type: 'create_record',
              target: 'goals',
              data: { template: 'smart_goal' }
            }
          ]
        },
        {
          id: 'create_first_habit',
          title: 'Add a Supporting Habit',
          description: 'Create a habit that supports your goal',
          type: 'setup',
          order: 2,
          isRequired: true,
          actions: [
            {
              type: 'create_record',
              target: 'habits',
              data: { template: 'daily_habit' }
            }
          ]
        },
        {
          id: 'first_journal_entry',
          title: 'Write Your First Journal Entry',
          description: 'Reflect on your goals and intentions',
          type: 'tutorial',
          order: 3,
          isRequired: false,
          actions: [
            {
              type: 'create_record',
              target: 'journal',
              data: { template: 'daily_reflection' }
            }
          ]
        }
      ],
      isOfficial: true,
      isFeatured: true
    },
    {
      name: 'Team Project Workspace',
      description: 'Collaborative workspace for team project management',
      category: ETemplateCategory.PROJECT_MANAGEMENT,
      type: ETemplateType.WORKSPACE,
      access: ETemplateAccess.PUBLIC,
      tags: ['team', 'project', 'collaboration'],
      icon: '👥',
      color: '#10B981',
      modules: [
        EDatabaseType.PARA_PROJECTS,
        EDatabaseType.TASKS,
        EDatabaseType.PEOPLE,
        EDatabaseType.NOTES,
        EDatabaseType.PARA_RESOURCES
      ],
      databases: [],
      crossModuleRelations: [
        {
          sourceModule: EDatabaseType.TASKS,
          targetModule: EDatabaseType.PARA_PROJECTS,
          sourceProperty: 'Project',
          targetProperty: 'Name',
          type: 'many_to_one',
          isRequired: false,
          cascadeDelete: false
        },
        {
          sourceModule: EDatabaseType.PARA_PROJECTS,
          targetModule: EDatabaseType.PEOPLE,
          sourceProperty: 'Team',
          targetProperty: 'Name',
          type: 'many_to_many',
          isRequired: false,
          cascadeDelete: false
        }
      ],
      workspaceSettings: {
        name: 'Team Project Hub',
        description: 'Collaborative workspace for managing team projects',
        icon: '👥',
        color: '#10B981',
        isPublic: false,
        allowInvites: true,
        defaultPermissions: 'edit',
        features: ['projects', 'tasks', 'team', 'collaboration']
      },
      isOfficial: true,
      isFeatured: true
    }
  ];

  for (const template of workspaceTemplates) {
    await createTemplate(template);
  }
};

const createTemplate = async (templateData: any): Promise<void> => {
  const template = new TemplateModel({
    ...templateData,
    createdBy: new TemplateModel().id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await template.save();
};

const getPredefinedTemplatesByCategory = async (category: ETemplateCategory): Promise<any[]> => {
  return TemplateModel.find({
    category,
    isOfficial: true,
    isDeleted: { $ne: true }
  }).sort({ isFeatured: -1, usageCount: -1 });
};

const getFeaturedPredefinedTemplates = async (): Promise<any[]> => {
  return TemplateModel.find({
    isOfficial: true,
    isFeatured: true,
    isDeleted: { $ne: true }
  }).sort({ usageCount: -1 });
};

export const predefinedTemplatesService = {
  initializePredefinedTemplates,
  getPredefinedTemplatesByCategory,
  getFeaturedPredefinedTemplates
};
