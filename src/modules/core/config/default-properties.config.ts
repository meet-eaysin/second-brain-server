import { IProperty } from '@/modules/core/types/property.types';
import { EDatabaseType } from '@/modules/database';
import { generateId } from '@/utils/id-generator';
import { IModuleProperty, NOTES_MODULE, PEOPLE_MODULE, TASKS_MODULE } from '@/modules/modules';

export function getDefaultProperties(databaseType: EDatabaseType): IModuleProperty[] {
  switch (databaseType) {
    case EDatabaseType.TASKS:
      return [...TASKS_MODULE.defaultProperties];
    case EDatabaseType.NOTES:
      return [...NOTES_MODULE.defaultProperties];
    case EDatabaseType.PEOPLE:
      return [...PEOPLE_MODULE.defaultProperties];
    case EDatabaseType.CUSTOM:
      return [];
    default:
      return [];
  }
}

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
