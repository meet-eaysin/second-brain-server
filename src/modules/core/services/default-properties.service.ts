import { DatabaseModel } from '@/modules/database/models/database.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { ViewModel } from '@/modules/database/models/view.model';
import { EViewType } from '@/modules/core/types/view.types';
import { createDefaultPropertiesForDatabase } from '@/modules/core/config/default-properties.config';
import { createAppError } from '@/utils';
import { generateId } from '@/utils/id-generator';
import { EDatabaseType } from '@/modules/database';
import { NOTES_MODULE, TASKS_MODULE } from '@/modules/modules';

export const initializeDefaultsForDatabase = async (
  databaseId: string,
  databaseType: EDatabaseType,
  userId: string
): Promise<{
  properties: any[];
  views: any[];
}> => {
  try {
    const defaultProperties = createDefaultPropertiesForDatabase(databaseId, databaseType, userId);

    const savedProperties = await PropertyModel.insertMany(defaultProperties);

    const defaultViews = createDefaultViews(databaseId, databaseType, userId, savedProperties);
    const savedViews = await ViewModel.insertMany(defaultViews);

    await DatabaseModel.findByIdAndUpdate(databaseId, {
      $set: {
        properties: savedProperties.map(p => p._id),
        views: savedViews.map(v => v._id),
        defaultViewId: savedViews[0]?._id
      }
    });

    return {
      properties: savedProperties,
      views: savedViews
    };
  } catch (error: any) {
    throw createAppError(`Failed to initialize default properties: ${error.message}`, 500);
  }
};

const createDefaultViews = (
  databaseId: string,
  databaseType: EDatabaseType,
  userId: string,
  properties: any[]
): any[] => {
  const now = new Date();
  const views: any[] = [];

  switch (databaseType) {
    case EDatabaseType.TASKS:
      views.push(TASKS_MODULE.defaultViews);
      break;

    case EDatabaseType.NOTES:
      views.push(NOTES_MODULE.defaultViews);
      break;

    default:
      views.push({
        id: generateId(),
        databaseId,
        name: 'Table View',
        type: EViewType.TABLE,
        description: 'Default table view',
        isDefault: true,
        isPublic: false,
        order: 0,
        config: {
          visibleProperties: properties.map(p => p.id),
          frozenColumns: [],
          pageSize: 25
        },
        sorts: [],
        filters: {
          operator: 'and',
          conditions: []
        },
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId
      });
  }

  return views;
};

export const getSystemPropertiesForType = (databaseType: EDatabaseType): string[] => {
  const defaultProps = createDefaultPropertiesForDatabase('temp', databaseType, 'temp');
  return defaultProps.filter(prop => prop.isSystem).map(prop => prop.name);
};

export const isSystemProperty = (propertyName: string, databaseType: EDatabaseType): boolean => {
  const systemProps = getSystemPropertiesForType(databaseType);
  return systemProps.includes(propertyName);
};

export const getFrozenPropertiesForType = (databaseType: EDatabaseType): string[] => {
  const defaultProps = createDefaultPropertiesForDatabase('temp', databaseType, 'temp');
  return defaultProps
    .filter(prop => prop.isSystem && (prop as any).isFrozen)
    .map(prop => prop.name);
};

export const defaultPropertiesService = {
  initializeDefaultsForDatabase,
  getSystemPropertiesForType,
  isSystemProperty,
  getFrozenPropertiesForType
};
