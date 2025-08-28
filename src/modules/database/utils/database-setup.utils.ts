import { EDatabaseType } from '@/modules/core/types/database.types';
import { EPropertyType, IProperty } from '@/modules/core/types/property.types';
import { EViewType, IView } from '@/modules/core/types/view.types';
import { PropertyModel } from '../models/property.model';
import { ViewModel } from '../models/view.model';
import {
  EStatus,
  EPriority,
  EFinanceType,
  EFinanceCategory,
  EFrequency,
  EContentType,
  EMoodScale
} from '@/modules/core/types/common.types';

export const createDefaultProperties = async (
  databaseId: string,
  type: EDatabaseType,
  userId: string
): Promise<any[]> => {
  const properties: Partial<IProperty>[] = [];

  properties.push(
    {
      name: 'Created Time',
      type: EPropertyType.CREATED_TIME,
      isSystem: true,
      isVisible: true,
      order: 1000,
      config: {}
    },
    {
      name: 'Last Edited Time',
      type: EPropertyType.LAST_EDITED_TIME,
      isSystem: true,
      isVisible: true,
      order: 1001,
      config: {}
    },
    {
      name: 'Created By',
      type: EPropertyType.CREATED_BY,
      isSystem: true,
      isVisible: false,
      order: 1002,
      config: {}
    },
    {
      name: 'Last Edited By',
      type: EPropertyType.LAST_EDITED_BY,
      isSystem: true,
      isVisible: false,
      order: 1003,
      config: {}
    }
  );

  switch (type) {
    case EDatabaseType.FINANCE:
      properties.unshift(
        {
          name: 'Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, includeTime: false }
        },
        {
          name: 'Amount',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true, format: 'currency', precision: 2 }
        },
        {
          name: 'Type',
          type: EPropertyType.FINANCE_TYPE,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: true }
        },
        {
          name: 'Category',
          type: EPropertyType.FINANCE_CATEGORY,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { required: true }
        },
        {
          name: 'Account',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 4,
          config: { required: false, maxLength: 100 }
        },
        {
          name: 'Note',
          type: EPropertyType.RICH_TEXT,
          isSystem: false,
          isVisible: true,
          order: 5,
          config: { required: false }
        }
      );
      break;

    case EDatabaseType.GOALS:
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Status',
          type: EPropertyType.STATUS,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true, defaultValue: EStatus.NOT_STARTED }
        },
        {
          name: 'Deadline',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false, includeTime: false }
        },
        {
          name: 'Related Tasks',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { relationDatabaseId: 'tasks', allowMultiple: true }
        },
        {
          name: 'Related Projects',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 4,
          config: { relationDatabaseId: 'projects', allowMultiple: true }
        }
      );
      break;

    case EDatabaseType.JOURNAL:
      properties.unshift(
        {
          name: 'Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, includeTime: false, unique: true }
        },
        {
          name: 'Entry',
          type: EPropertyType.RICH_TEXT,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true }
        },
        {
          name: 'Mood',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { relationDatabaseId: 'mood_tracker', allowMultiple: false }
        },
        {
          name: 'Tags',
          type: EPropertyType.MULTI_SELECT,
          isSystem: false,
          isVisible: true,
          order: 3,
          config: { options: [] }
        }
      );
      break;

    case EDatabaseType.MOOD_TRACKER:
      properties.unshift(
        {
          name: 'Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, includeTime: false, unique: true }
        },
        {
          name: 'Mood Scale',
          type: EPropertyType.MOOD_SCALE,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true }
        },
        {
          name: 'Notes',
          type: EPropertyType.RICH_TEXT,
          isSystem: false,
          isVisible: true,
          order: 2,
          config: { required: false }
        },
        {
          name: 'Related Journal',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { relationDatabaseId: 'journal', allowMultiple: false }
        }
      );
      break;

    case EDatabaseType.NOTES:
      properties.unshift(
        {
          name: 'Title',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Content',
          type: EPropertyType.RICH_TEXT,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: false }
        },
        {
          name: 'Tags',
          type: EPropertyType.MULTI_SELECT,
          isSystem: false,
          isVisible: true,
          order: 2,
          config: { options: [] }
        },
        {
          name: 'Linked Resources',
          type: EPropertyType.RELATION,
          isSystem: false,
          isVisible: true,
          order: 3,
          config: { relationDatabaseId: 'resources', allowMultiple: true }
        }
      );
      break;

    case EDatabaseType.TASKS:
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Status',
          type: EPropertyType.STATUS,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true, defaultValue: EStatus.NOT_STARTED }
        },
        {
          name: 'Due Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false, includeTime: true }
        },
        {
          name: 'Priority',
          type: EPropertyType.PRIORITY,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { required: false, defaultValue: EPriority.MEDIUM }
        },
        {
          name: 'Project',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 4,
          config: { relationDatabaseId: 'projects', allowMultiple: false }
        },
        {
          name: 'Assignee',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 5,
          config: { relationDatabaseId: 'users', allowMultiple: true }
        },
        {
          name: 'Start Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: false,
          order: 6,
          config: { includeTime: true }
        },
        {
          name: 'Estimated Hours',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: false,
          order: 7,
          config: { format: 'number', precision: 1 }
        },
        {
          name: 'Actual Hours',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: false,
          order: 8,
          config: { format: 'number', precision: 1 }
        },
        {
          name: 'Progress',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: true,
          order: 9,
          config: { format: 'percentage', precision: 0, defaultValue: 0 }
        },
        {
          name: 'Labels',
          type: EPropertyType.MULTI_SELECT,
          isSystem: true,
          isVisible: true,
          order: 10,
          config: {
            options: [
              { id: 'bug', value: 'bug', label: 'Bug', color: 'red' },
              { id: 'feature', value: 'feature', label: 'Feature', color: 'blue' },
              { id: 'improvement', value: 'improvement', label: 'Improvement', color: 'green' },
              { id: 'documentation', value: 'documentation', label: 'Documentation', color: 'purple' }
            ]
          }
        },
        {
          name: 'Description',
          type: EPropertyType.RICH_TEXT,
          isSystem: false,
          isVisible: true,
          order: 11,
          config: { maxLength: 2000 }
        }
      );
      break;

    case EDatabaseType.HABITS:
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Frequency',
          type: EPropertyType.FREQUENCY,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true, defaultValue: EFrequency.DAILY }
        },
        {
          name: 'Current Streak',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false, defaultValue: 0, format: 'number' }
        },
        {
          name: 'Best Streak',
          type: EPropertyType.NUMBER,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { required: false, defaultValue: 0, format: 'number' }
        },
        {
          name: 'Related Goals',
          type: EPropertyType.RELATION,
          isSystem: false,
          isVisible: true,
          order: 4,
          config: { relationDatabaseId: 'goals', allowMultiple: true }
        }
      );
      break;

    case EDatabaseType.PEOPLE:
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 100 }
        },
        {
          name: 'Role',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: false, maxLength: 100 }
        },
        {
          name: 'Email',
          type: EPropertyType.EMAIL,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false }
        },
        {
          name: 'Phone',
          type: EPropertyType.PHONE,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { required: false }
        },
        {
          name: 'Related Projects',
          type: EPropertyType.RELATION,
          isSystem: false,
          isVisible: true,
          order: 4,
          config: { relationDatabaseId: 'projects', allowMultiple: true }
        },
        {
          name: 'Related Tasks',
          type: EPropertyType.RELATION,
          isSystem: false,
          isVisible: true,
          order: 5,
          config: { relationDatabaseId: 'tasks', allowMultiple: true }
        }
      );
      break;

    case EDatabaseType.RESOURCES:
      properties.unshift(
        {
          name: 'Title',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Type',
          type: EPropertyType.CONTENT_TYPE,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true }
        },
        {
          name: 'URL',
          type: EPropertyType.URL,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false }
        },
        {
          name: 'Description',
          type: EPropertyType.RICH_TEXT,
          isSystem: false,
          isVisible: true,
          order: 3,
          config: { required: false }
        },
        {
          name: 'Tags',
          type: EPropertyType.MULTI_SELECT,
          isSystem: false,
          isVisible: true,
          order: 4,
          config: { options: [] }
        }
      );
      break;

    case EDatabaseType.PROJECTS:
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Status',
          type: EPropertyType.STATUS,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true, defaultValue: EStatus.NOT_STARTED }
        },
        {
          name: 'Deadline',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: false, includeTime: false }
        },
        {
          name: 'Related Tasks',
          type: EPropertyType.RELATION,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { relationDatabaseId: 'tasks', allowMultiple: true }
        },
        {
          name: 'Related Goals',
          type: EPropertyType.RELATION,
          isSystem: false,
          isVisible: true,
          order: 4,
          config: { relationDatabaseId: 'goals', allowMultiple: true }
        }
      );
      break;

    case EDatabaseType.CONTENT:
      properties.unshift(
        {
          name: 'Title',
          type: EPropertyType.TEXT,
          isSystem: true,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        },
        {
          name: 'Type',
          type: EPropertyType.CONTENT_TYPE,
          isSystem: true,
          isVisible: true,
          order: 1,
          config: { required: true }
        },
        {
          name: 'Status',
          type: EPropertyType.STATUS,
          isSystem: true,
          isVisible: true,
          order: 2,
          config: { required: true, defaultValue: EStatus.NOT_STARTED }
        },
        {
          name: 'Publish Date',
          type: EPropertyType.DATE,
          isSystem: true,
          isVisible: true,
          order: 3,
          config: { required: false, includeTime: true }
        },
        {
          name: 'Tags',
          type: EPropertyType.MULTI_SELECT,
          isSystem: false,
          isVisible: true,
          order: 4,
          config: { options: [] }
        }
      );
      break;

    default:
      // For custom databases or other types, just add basic properties
      properties.unshift(
        {
          name: 'Name',
          type: EPropertyType.TEXT,
          isSystem: false,
          isVisible: true,
          order: 0,
          config: { required: true, maxLength: 200 }
        }
      );
      break;
  }

  // Create the properties in the database
  const createdProperties: any[] = [];
  for (const propData of properties) {
    const property = new PropertyModel({
      ...propData,
      databaseId,
      createdBy: userId,
      updatedBy: userId
    });
    await property.save();
    createdProperties.push(property);
  }

  return createdProperties;
};

// Create default views for each database type
export const createDefaultViews = async (
  databaseId: string,
  type: EDatabaseType,
  userId: string
): Promise<any[]> => {
  const views: Partial<IView>[] = [];

  // Default table view for all databases
  views.push({
    name: 'All',
    type: EViewType.TABLE,
    isDefault: true,
    isPublic: false,
    config: {
      pageSize: 25,
      columns: [] // Will be populated with all visible properties
    },
    sorts: [],
    filters: { operator: 'and', conditions: [] },
    order: 0,
    description: 'Default table view showing all records'
  });

  // Type-specific additional views
  switch (type) {
    case EDatabaseType.TASKS:
      views.push(
        {
          name: 'Board',
          type: EViewType.BOARD,
          isDefault: false,
          isPublic: false,
          config: {
            pageSize: 50,
            group: { propertyId: 'status' }
          },
          sorts: [{ propertyId: 'priority', direction: 'desc' }],
          filters: { operator: 'and', conditions: [] },
          order: 1,
          description: 'Kanban board grouped by status'
        },
        {
          name: 'Calendar',
          type: EViewType.CALENDAR,
          isDefault: false,
          isPublic: false,
          config: {
            calendar: {
              datePropertyId: 'due_date',
              showWeekends: true,
              defaultView: 'month'
            }
          },
          sorts: [],
          filters: { operator: 'and', conditions: [] },
          order: 2,
          description: 'Calendar view showing tasks by due date'
        }
      );
      break;

    case EDatabaseType.PROJECTS:
      views.push(
        {
          name: 'Timeline',
          type: EViewType.TIMELINE,
          isDefault: false,
          isPublic: false,
          config: {
            timeline: {
              startDatePropertyId: 'created_time',
              endDatePropertyId: 'deadline'
            }
          },
          sorts: [{ propertyId: 'deadline', direction: 'asc' }],
          filters: { operator: 'and', conditions: [] },
          order: 1,
          description: 'Timeline view showing project schedules'
        }
      );
      break;

    case EDatabaseType.RESOURCES:
      views.push(
        {
          name: 'Gallery',
          type: EViewType.GALLERY,
          isDefault: false,
          isPublic: false,
          config: {
            gallery: {
              cardSize: 'medium',
              showProperties: ['type', 'tags']
            }
          },
          sorts: [{ propertyId: 'created_time', direction: 'desc' }],
          filters: { operator: 'and', conditions: [] },
          order: 1,
          description: 'Gallery view showing resources as cards'
        }
      );
      break;

    case EDatabaseType.JOURNAL:
    case EDatabaseType.MOOD_TRACKER:
      views.push(
        {
          name: 'Calendar',
          type: EViewType.CALENDAR,
          isDefault: false,
          isPublic: false,
          config: {
            calendar: {
              datePropertyId: 'date',
              showWeekends: true,
              defaultView: 'month'
            }
          },
          sorts: [],
          filters: { operator: 'and', conditions: [] },
          order: 1,
          description: 'Calendar view showing entries by date'
        }
      );
      break;
  }

  // Create the views in the database
  const createdViews: any[] = [];
  for (const viewData of views) {
    const view = new ViewModel({
      ...viewData,
      databaseId,
      createdBy: userId,
      updatedBy: userId
    });
    await view.save();
    createdViews.push(view);
  }

  return createdViews;
};
