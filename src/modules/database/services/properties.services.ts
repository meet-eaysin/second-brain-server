import { ObjectId } from 'mongodb';
import { DatabaseModel } from '../models/database.model';
import { PropertyModel } from '../models/property.model';
import {
  IProperty,
  EPropertyType,
  IUpdatePropertyRequest
} from '@/modules/core/types/property.types';
import { IReorderPropertiesRequest } from '../types/properties.types';
import { RecordModel } from '@/modules/database/models/record.model';
import { viewsService } from './views.services';

interface ICreatePropertyRequest {
  name: string;
  type: EPropertyType;
  description?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  isFrozen?: boolean;
  order?: number;
  config?: any;
}
import { createAppError, createNotFoundError, createConflictError } from '@/utils/error.utils';

export class PropertiesService {
  async createProperty(
    databaseId: string,
    data: ICreatePropertyRequest,
    userId: string
  ): Promise<IProperty> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const existingProperty = await PropertyModel.findOne({
      databaseId,
      name: { $regex: new RegExp(`^${data.name}$`, 'i') }
    });

    if (existingProperty) throw createConflictError('Property with this name already exists');

    const maxOrder = await PropertyModel.findOne({ databaseId })
      .sort({ order: -1 })
      .select('order');

    const nextOrder = data.order ?? (maxOrder?.order ?? -1) + 1;

    const propertyData = {
      databaseId,
      name: data.name,
      type: data.type,
      description: data.description,
      isVisible: true,
      isSystem: false,
      order: nextOrder,
      config: data.config || {},
      createdBy: userId,
      updatedBy: userId
    };

    const property = new PropertyModel(propertyData);

    this.validatePropertyConfig(property.toObject() as IProperty);

    await property.save();

    await DatabaseModel.findByIdAndUpdate(databaseId, {
      $push: { properties: property._id },
      $set: { updatedBy: new ObjectId(userId) }
    });

    return property.toJSON() as IProperty;
  }

  async getProperties(
    databaseId: string,
    userId: string,
    includeHidden: boolean = false,
    viewId?: string
  ): Promise<IProperty[]> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const query: any = { databaseId };
    if (!includeHidden) query.isVisible = true;

    let properties = await PropertyModel.find(query).sort({ order: 1 });

    // Filter properties based on view settings if viewId is provided
    if (viewId) {
      try {
        const view = await viewsService.getViewById(databaseId, viewId, userId);

        if (view.settings.visibleProperties && view.settings.visibleProperties.length > 0) {
          // Filter to only visible properties
          properties = properties.filter(prop =>
            view.settings.visibleProperties!.includes((prop as any)._id.toString())
          );
        } else if (view.settings.hiddenProperties && view.settings.hiddenProperties.length > 0) {
          // Filter out hidden properties
          properties = properties.filter(
            prop => !view.settings.hiddenProperties!.includes((prop as any)._id.toString())
          );
        }
      } catch (error) {
        // If view not found or access denied, return all properties
        console.warn('Could not apply view filter:', error);
      }
    }

    return properties.map(prop => prop.toJSON() as IProperty);
  }

  async getPropertyById(
    databaseId: string,
    propertyId: string,
    _userId: string
  ): Promise<IProperty> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const property = await PropertyModel.findOne({
      databaseId,
      _id: propertyId
    });

    if (!property) throw createNotFoundError('Property', propertyId);

    return property.toObject() as IProperty;
  }

  async updateProperty(
    databaseId: string,
    propertyId: string,
    data: IUpdatePropertyRequest,
    userId: string
  ): Promise<IProperty> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const property = await PropertyModel.findOne({
      databaseId,
      _id: propertyId
    });

    if (!property) throw createNotFoundError('Property', propertyId);

    if (property.isSystem) throw createAppError('Cannot modify system properties', 400);

    if (data.name && data.name !== property.name) {
      const existingProperty = await PropertyModel.findOne({
        databaseId,
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        _id: { $ne: propertyId }
      });

      if (existingProperty) {
        throw createConflictError('Property with this name already exists');
      }
    }

    const updateData: any = {
      updatedBy: userId
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.config !== undefined) {
      updateData.config = { ...property.config, ...data.config };
    }

    if (data.config) {
      const updatedProperty = { ...property.toObject(), ...updateData };
      this.validatePropertyConfig(updatedProperty as IProperty);
    }

    await PropertyModel.findByIdAndUpdate(propertyId, updateData);

    const updatedProperty = await PropertyModel.findById(propertyId);
    return updatedProperty!.toJSON() as IProperty;
  }

  async reorderProperties(
    databaseId: string,
    data: IReorderPropertiesRequest,
    userId: string
  ): Promise<IProperty[]> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const propertyIds = data.propertyOrders.map(po => po.propertyId);
    const existingProperties = await PropertyModel.find({
      databaseId,
      _id: { $in: propertyIds }
    });

    if (existingProperties.length !== propertyIds.length)
      throw createNotFoundError('One or more properties not found');

    const updatePromises = data.propertyOrders.map(({ propertyId, order }) =>
      PropertyModel.findByIdAndUpdate(propertyId, {
        order,
        updatedBy: userId
      })
    );

    await Promise.all(updatePromises);

    return this.getProperties(databaseId, userId, true);
  }

  async deleteProperty(databaseId: string, propertyId: string, userId: string): Promise<void> {
    const database = await DatabaseModel.findById(databaseId);

    if (!database) throw createNotFoundError('Database');

    const property = await PropertyModel.findOne({
      databaseId,
      _id: propertyId
    });

    if (!property) throw createNotFoundError('Property', propertyId);
    if (database.createdBy.toString() !== userId)
      throw createAppError('Permission denied to delete this property', 403);
    if (property.isSystem) throw createAppError('Cannot delete system properties', 400);

    await PropertyModel.findByIdAndDelete(propertyId);

    await DatabaseModel.findByIdAndUpdate(databaseId, {
      $pull: { properties: new ObjectId(propertyId) },
      $set: { updatedBy: new ObjectId(userId) }
    });
  }

  async duplicateProperty(
    databaseId: string,
    propertyId: string,
    userId: string,
    newName?: string
  ): Promise<IProperty> {
    const originalProperty = await this.getPropertyById(databaseId, propertyId, userId);

    const duplicateName = newName || `${originalProperty.name} (Copy)`;

    const existingProperty = await PropertyModel.findOne({
      databaseId,
      name: { $regex: new RegExp(`^${duplicateName}$`, 'i') }
    });

    if (existingProperty) {
      throw createConflictError('Property with this name already exists');
    }

    // Create duplicate property data
    const duplicateData: ICreatePropertyRequest = {
      name: duplicateName,
      type: originalProperty.type,
      description: originalProperty.description,
      config: { ...originalProperty.config }
    };

    return this.createProperty(databaseId, duplicateData, userId);
  }

  // Change property type
  async changePropertyType(
    databaseId: string,
    propertyId: string,
    newType: EPropertyType,
    newConfig: any,
    userId: string
  ): Promise<IProperty> {
    const property = await PropertyModel.findOne({
      databaseId,
      _id: propertyId
    });

    if (!property) throw createNotFoundError('Property', propertyId);

    if (property.isSystem) throw createAppError('Cannot change type of system properties', 400);

    property.type = newType;
    property.config = newConfig || {};
    property.updatedBy = userId;

    this.validatePropertyConfig(property.toObject() as IProperty);

    await property.save();

    return property.toJSON() as IProperty;
  }

  async insertPropertyAt(
    databaseId: string,
    data: ICreatePropertyRequest,
    insertAfterPropertyId: string | null,
    userId: string
  ): Promise<IProperty> {
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createNotFoundError('Database');
    }

    let insertOrder = 0;

    if (insertAfterPropertyId) {
      const afterProperty = await PropertyModel.findOne({
        databaseId,
        _id: insertAfterPropertyId
      });

      if (!afterProperty) {
        throw createNotFoundError('Reference property not found');
      }

      insertOrder = afterProperty.order + 1;

      await PropertyModel.updateMany(
        { databaseId, order: { $gte: insertOrder } },
        { $inc: { order: 1 } }
      );
    } else {
      await PropertyModel.updateMany({ databaseId }, { $inc: { order: 1 } });
    }

    const propertyData = {
      databaseId,
      name: data.name,
      type: data.type,
      description: data.description,
      isVisible: true,
      isSystem: false,
      order: insertOrder,
      config: data.config || {},
      createdBy: userId,
      updatedBy: userId
    };

    const property = new PropertyModel(propertyData);
    this.validatePropertyConfig(property.toObject() as IProperty);
    await property.save();

    await DatabaseModel.findByIdAndUpdate(databaseId, {
      $push: { properties: property._id },
      $set: { updatedBy: new ObjectId(userId) }
    });

    return property.toJSON() as IProperty;
  }

  async togglePropertyVisibility(
    databaseId: string,
    propertyId: string,
    userId: string
  ): Promise<IProperty> {
    const property = await PropertyModel.findOne({
      databaseId,
      _id: propertyId
    });

    if (!property) {
      throw createNotFoundError('Property', propertyId);
    }

    property.isVisible = !property.isVisible;
    property.updatedBy = userId;
    await property.save();

    return property.toObject() as IProperty;
  }

  async getPropertyCalculations(
    databaseId: string,
    propertyId: string,
    userId: string
  ): Promise<any> {
    const property = await this.getPropertyById(databaseId, propertyId, userId);

    const calculations: any = {
      propertyId,
      propertyName: property.name,
      propertyType: property.type
    };

    // Get all records for this database
    const records = await RecordModel.find({ databaseId });
    const values = records
      .map(record => record.properties?.[property.name])
      .filter(value => value !== null && value !== undefined);

    // Basic counts
    calculations.countAll = records.length;
    calculations.countValues = values.length;
    calculations.countEmpty = records.length - values.length;
    calculations.countNotEmpty = values.length;
    calculations.countUnique = new Set(values).size;

    // Percentage calculations
    calculations.percentEmpty =
      records.length > 0 ? (calculations.countEmpty / records.length) * 100 : 0;
    calculations.percentNotEmpty =
      records.length > 0 ? (calculations.countValues / records.length) * 100 : 0;

    // Type-specific calculations
    if (property.type === EPropertyType.NUMBER) {
      const numericValues = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (numericValues.length > 0) {
        calculations.sum = numericValues.reduce((a, b) => a + b, 0);
        calculations.average = calculations.sum / numericValues.length;
        calculations.min = Math.min(...numericValues);
        calculations.max = Math.max(...numericValues);
        calculations.median = this.calculateMedian(numericValues);
      }
    }

    if (property.type === EPropertyType.DATE) {
      const dateValues = values.filter(
        (v): v is Date | string =>
          v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)))
      );
      if (dateValues.length > 0) {
        const dates = dateValues.map(v => new Date(v));
        calculations.earliest = new Date(Math.min(...dates.map(d => d.getTime())));
        calculations.latest = new Date(Math.max(...dates.map(d => d.getTime())));
      }
    }

    if (property.type === EPropertyType.SELECT || property.type === EPropertyType.MULTI_SELECT) {
      const valueCounts: Record<string, number> = {};
      values.forEach(value => {
        const vals = Array.isArray(value) ? value : [value];
        vals.forEach(v => {
          // Convert complex types to strings for use as object keys
          const key =
            typeof v === 'string'
              ? v
              : typeof v === 'number'
                ? v.toString()
                : typeof v === 'boolean'
                  ? v.toString()
                  : v && typeof v === 'object' && 'value' in v
                    ? String(v.value)
                    : String(v);
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        });
      });
      calculations.valueCounts = valueCounts;
      calculations.mostCommon = Object.entries(valueCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0];
    }

    return calculations;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private validatePropertyConfig(property: IProperty): void {
    const { type, config } = property;

    switch (type) {
      case EPropertyType.SELECT:
      case EPropertyType.MULTI_SELECT:
      case EPropertyType.STATUS:
      case EPropertyType.PRIORITY:
        if (!config.options || !Array.isArray(config.options) || config.options.length === 0) {
          throw createAppError('Select properties must have at least one option', 400);
        }
        break;

      case EPropertyType.RELATION:
        if (!config.relationDatabaseId) {
          throw createAppError('Relation properties must specify a target database', 400);
        }
        this.validateRelationDatabase(config.relationDatabaseId);
        break;

      case EPropertyType.FORMULA:
        if (!config.formula) {
          throw createAppError('Formula properties must have a formula', 400);
        }
        break;

      case EPropertyType.ROLLUP:
        if (!config.relationPropertyId || !config.rollupPropertyId || !config.rollupFunction) {
          throw createAppError(
            'Rollup properties must specify relation property, rollup property, and rollup function',
            400
          );
        }
        this.validateRollupConfiguration(config);
        break;

      default:
        break;
    }
  }

  private async validateRelationDatabase(databaseId: string): Promise<void> {
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createAppError('Target database not found', 400);
    }
  }

  private async validateRollupConfiguration(config: any): Promise<void> {
    const relationProperty = await PropertyModel.findById(config.relationPropertyId);
    if (!relationProperty) {
      throw createAppError('Relation property not found', 400);
    }
    if (relationProperty.type !== EPropertyType.RELATION) {
      throw createAppError('Relation property must be of type RELATION', 400);
    }

    // Check if rollup property exists
    const rollupProperty = await PropertyModel.findById(config.rollupPropertyId);
    if (!rollupProperty) {
      throw createAppError('Rollup property not found', 400);
    }

    // Validate rollup function is compatible with property type
    this.validateRollupFunction(config.rollupFunction, rollupProperty.type);
  }

  // Validate rollup function compatibility
  private validateRollupFunction(rollupFunction: string, propertyType: EPropertyType): void {
    const numericFunctions = ['sum', 'average', 'median', 'min', 'max', 'range'];
    const dateFunctions = ['earliest', 'latest', 'date_range', 'min', 'max'];
    const checkboxFunctions = ['checked', 'unchecked', 'percent_checked'];

    if (numericFunctions.includes(rollupFunction) && propertyType !== EPropertyType.NUMBER) {
      throw createAppError(
        `Rollup function '${rollupFunction}' can only be used with number properties`,
        400
      );
    }

    if (dateFunctions.includes(rollupFunction) && propertyType !== EPropertyType.DATE) {
      throw createAppError(
        `Rollup function '${rollupFunction}' can only be used with date properties`,
        400
      );
    }

    if (checkboxFunctions.includes(rollupFunction) && propertyType !== EPropertyType.CHECKBOX) {
      throw createAppError(
        `Rollup function '${rollupFunction}' can only be used with checkbox properties`,
        400
      );
    }
  }
}

export const propertiesService = new PropertiesService();
