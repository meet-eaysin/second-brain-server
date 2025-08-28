import { DatabaseModel } from '@/modules/database/models/database.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { ViewModel } from '@/modules/database/models/view.model';
import { EViewType } from '../types/view.types';
import { createDefaultPropertiesForDatabase } from '../config/default-properties.config';
import { createAppError } from '@/utils';
import { generateId } from '@/utils/id-generator';
import { EDatabaseType } from '../types';

export class DefaultPropertiesService {
  /**
   * Initialize default properties and views for a new database
   */
  async initializeDefaultsForDatabase(
    databaseId: string,
    databaseType: EDatabaseType,
    userId: string
  ): Promise<{
    properties: any[];
    views: any[];
  }> {
    try {
      // Create default properties
      const defaultProperties = createDefaultPropertiesForDatabase(
        databaseId,
        databaseType,
        userId
      );

      // Save properties to database
      const savedProperties = await PropertyModel.insertMany(defaultProperties);

      // Create default views
      const defaultViews = this.createDefaultViews(
        databaseId,
        databaseType,
        userId,
        savedProperties
      );
      const savedViews = await ViewModel.insertMany(defaultViews);

      // Update database with property and view references
      await DatabaseModel.findByIdAndUpdate(databaseId, {
        $set: {
          properties: savedProperties.map(p => p._id),
          views: savedViews.map(v => v._id),
          defaultViewId: savedViews[0]?._id // First view is default
        }
      });

      return {
        properties: savedProperties,
        views: savedViews
      };
    } catch (error: any) {
      throw createAppError(`Failed to initialize default properties: ${error.message}`, 500);
    }
  }

  /**
   * Create default views for a database type
   */
  private createDefaultViews(
    databaseId: string,
    databaseType: EDatabaseType,
    userId: string,
    properties: any[]
  ): any[] {
    const now = new Date();
    const views: any[] = [];

    switch (databaseType) {
      case EDatabaseType.TASKS:
        views.push(
          // Table view - All tasks
          {
            id: generateId(),
            databaseId,
            name: 'All Tasks',
            type: EViewType.TABLE,
            description: 'Complete list of all tasks',
            isDefault: true,
            isPublic: false,
            order: 0,
            settings: {
              visibleProperties: properties.filter(p => p.isVisible).map(p => p.id),
              frozenColumns: [properties.find(p => p.name === 'Name')?.id],
              pageSize: 50,
              sorts: [
                {
                  property: properties.find(p => p.name === 'Priority')?.id,
                  direction: 'descending'
                },
                {
                  property: properties.find(p => p.name === 'Due Date')?.id,
                  direction: 'ascending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          },
          // Board view - By Status
          {
            id: generateId(),
            databaseId,
            name: 'Task Board',
            type: EViewType.BOARD,
            description: 'Kanban board grouped by status',
            isDefault: false,
            isPublic: false,
            order: 1,
            settings: {
              groupBy: {
                property: properties.find(p => p.name === 'Status')?.id,
                direction: 'ascending'
              },
              visibleProperties: [
                properties.find(p => p.name === 'Name')?.id,
                properties.find(p => p.name === 'Priority')?.id,
                properties.find(p => p.name === 'Assignee')?.id,
                properties.find(p => p.name === 'Due Date')?.id
              ].filter(Boolean),
              boardGroupProperty: properties.find(p => p.name === 'Status')?.id,
              sorts: [
                {
                  property: properties.find(p => p.name === 'Priority')?.id,
                  direction: 'descending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          },
          // Calendar view - By Due Date
          {
            id: generateId(),
            databaseId,
            name: 'Task Calendar',
            type: EViewType.CALENDAR,
            description: 'Calendar view of tasks by due date',
            isDefault: false,
            isPublic: false,
            order: 2,
            settings: {
              calendarDateProperty: properties.find(p => p.name === 'Due Date')?.id,
              calendarViewType: 'month',
              visibleProperties: [
                properties.find(p => p.name === 'Name')?.id,
                properties.find(p => p.name === 'Status')?.id,
                properties.find(p => p.name === 'Priority')?.id
              ].filter(Boolean),
              filters: [
                {
                  property: properties.find(p => p.name === 'Due Date')?.id,
                  condition: 'is_not_empty'
                }
              ]
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          }
        );
        break;

      case EDatabaseType.NOTES:
        views.push(
          // Table view - All notes
          {
            id: generateId(),
            databaseId,
            name: 'All Notes',
            type: EViewType.TABLE,
            description: 'Complete list of all notes',
            isDefault: true,
            isPublic: false,
            order: 0,
            settings: {
              visibleProperties: properties.filter(p => p.isVisible).map(p => p.id),
              frozenColumns: [properties.find(p => p.name === 'Title')?.id],
              pageSize: 25,
              sorts: [
                {
                  property: properties.find(p => p.name === 'Last Edited Time')?.id,
                  direction: 'descending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          },
          // Gallery view - By Category
          {
            id: generateId(),
            databaseId,
            name: 'Notes Gallery',
            type: EViewType.GALLERY,
            description: 'Gallery view of notes',
            isDefault: false,
            isPublic: false,
            order: 1,
            settings: {
              galleryCardSize: 'medium',
              visibleProperties: [
                properties.find(p => p.name === 'Title')?.id,
                properties.find(p => p.name === 'Category')?.id,
                properties.find(p => p.name === 'Tags')?.id
              ].filter(Boolean),
              sorts: [
                {
                  property: properties.find(p => p.name === 'Created Time')?.id,
                  direction: 'descending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          }
        );
        break;

      case EDatabaseType.PROJECTS:
        views.push(
          // Table view - All projects
          {
            id: generateId(),
            databaseId,
            name: 'All Projects',
            type: EViewType.TABLE,
            description: 'Complete list of all projects',
            isDefault: true,
            isPublic: false,
            order: 0,
            settings: {
              visibleProperties: properties.filter(p => p.isVisible).map(p => p.id),
              frozenColumns: [properties.find(p => p.name === 'Name')?.id],
              pageSize: 25,
              sorts: [
                {
                  property: properties.find(p => p.name === 'Priority')?.id,
                  direction: 'descending'
                },
                {
                  property: properties.find(p => p.name === 'Start Date')?.id,
                  direction: 'ascending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          },
          // Timeline view - Project timeline
          {
            id: generateId(),
            databaseId,
            name: 'Project Timeline',
            type: EViewType.TIMELINE,
            description: 'Timeline view of projects',
            isDefault: false,
            isPublic: false,
            order: 1,
            settings: {
              timelineStartProperty: properties.find(p => p.name === 'Start Date')?.id,
              timelineEndProperty: properties.find(p => p.name === 'End Date')?.id,
              visibleProperties: [
                properties.find(p => p.name === 'Name')?.id,
                properties.find(p => p.name === 'Status')?.id,
                properties.find(p => p.name === 'Owner')?.id,
                properties.find(p => p.name === 'Progress')?.id
              ].filter(Boolean),
              sorts: [
                {
                  property: properties.find(p => p.name === 'Start Date')?.id,
                  direction: 'ascending'
                }
              ],
              filters: []
            },
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId
          }
        );
        break;

      default:
        // Default table view for custom databases
        views.push({
          id: generateId(),
          databaseId,
          name: 'Table View',
          type: EViewType.TABLE,
          description: 'Default table view',
          isDefault: true,
          isPublic: false,
          order: 0,
          settings: {
            visibleProperties: properties.map(p => p.id),
            pageSize: 25,
            sorts: [],
            filters: []
          },
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId
        });
    }

    return views;
  }

  /**
   * Get system properties for a database type (without creating them)
   */
  getSystemPropertiesForType(databaseType: EDatabaseType): string[] {
    const defaultProps = createDefaultPropertiesForDatabase('temp', databaseType, 'temp');
    return defaultProps.filter(prop => prop.isSystem).map(prop => prop.name);
  }

  /**
   * Check if a property is a system property
   */
  isSystemProperty(propertyName: string, databaseType: EDatabaseType): boolean {
    const systemProps = this.getSystemPropertiesForType(databaseType);
    return systemProps.includes(propertyName);
  }

  /**
   * Get frozen properties for a database type
   */
  getFrozenPropertiesForType(databaseType: EDatabaseType): string[] {
    const defaultProps = createDefaultPropertiesForDatabase('temp', databaseType, 'temp');
    return defaultProps
      .filter(prop => prop.isSystem && (prop as any).isFrozen)
      .map(prop => prop.name);
  }
}

export const defaultPropertiesService = new DefaultPropertiesService();
