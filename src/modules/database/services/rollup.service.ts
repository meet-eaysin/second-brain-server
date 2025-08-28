import { ObjectId } from 'mongodb';
import { PropertyModel } from '../models/property.model';
import { RecordModel } from '../models/record.model';
import { RelationModel, RelationConnectionModel } from '../models/relation.model';
import { EPropertyType } from '@/modules/core/types/property.types';
import { createAppError } from '@/utils';
import { createNotFoundError } from '@/utils/response.utils';

export enum ERollupFunction {
  COUNT = 'count',
  COUNT_VALUES = 'count_values',
  COUNT_UNIQUE = 'count_unique',
  COUNT_EMPTY = 'count_empty',
  COUNT_NOT_EMPTY = 'count_not_empty',
  PERCENT_EMPTY = 'percent_empty',
  PERCENT_NOT_EMPTY = 'percent_not_empty',
  SUM = 'sum',
  AVERAGE = 'average',
  MEDIAN = 'median',
  MIN = 'min',
  MAX = 'max',
  RANGE = 'range',
  EARLIEST = 'earliest',
  LATEST = 'latest',
  DATE_RANGE = 'date_range',
  CHECKED = 'checked',
  UNCHECKED = 'unchecked',
  PERCENT_CHECKED = 'percent_checked',
  SHOW_ORIGINAL = 'show_original'
}

export interface IRollupConfig {
  relationPropertyId: string;
  rollupPropertyId: string;
  rollupFunction: ERollupFunction;

  // Filters for rollup calculation
  filters?: Array<{
    property: string;
    condition: string;
    value: any;
  }>;

  // Date formatting for date rollups
  dateFormat?: string;

  // Number formatting
  numberFormat?: {
    precision?: number;
    currency?: string;
    percentage?: boolean;
  };
}

export class RollupService {
  // Calculate rollup value for a record
  async calculateRollupValue(
    recordId: string,
    rollupConfig: IRollupConfig
  ): Promise<any> {
    // Get the relation property
    const relationProperty = await PropertyModel.findById(rollupConfig.relationPropertyId);
    if (!relationProperty || relationProperty.type !== EPropertyType.RELATION) {
      throw createAppError('Relation property not found or invalid type', 400);
    }

    // Get the rollup property
    const rollupProperty = await PropertyModel.findById(rollupConfig.rollupPropertyId);
    if (!rollupProperty) {
      throw createNotFoundError('Rollup property not found');
    }

    // Get related records
    const relatedRecords = await this.getRelatedRecordsForRollup(
      recordId,
      rollupConfig.relationPropertyId
    );

    if (relatedRecords.length === 0) {
      return this.getEmptyRollupValue(rollupConfig.rollupFunction);
    }

    // Apply filters if specified
    const filteredRecords = rollupConfig.filters
      ? this.applyFilters(relatedRecords, rollupConfig.filters)
      : relatedRecords;

    // Extract values from the rollup property
    const values = this.extractPropertyValues(filteredRecords, rollupProperty.name);

    // Calculate rollup based on function
    return this.calculateRollupFunction(
      rollupConfig.rollupFunction,
      values,
      rollupProperty.type,
      rollupConfig
    );
  }

  // Get related records for rollup calculation
  private async getRelatedRecordsForRollup(
    recordId: string,
    relationPropertyId: string
  ): Promise<any[]> {
    // Get relations for this property
    const relations = await RelationModel.findByProperty(relationPropertyId);
    if (relations.length === 0) {
      return [];
    }

    const relation = relations[0];

    // Determine direction (source or target)
    const isSource = relation.sourcePropertyId === relationPropertyId;

    // Get connections
    const connections = await RelationConnectionModel.getRelatedRecords(
      relation.id.toString(),
      recordId,
      isSource ? 'source' : 'target'
    );

    // Get related record IDs
    const relatedRecordIds = connections.map(conn =>
      isSource ? conn.targetRecordId : conn.sourceRecordId
    );

    if (relatedRecordIds.length === 0) {
      return [];
    }

    // Fetch related records with properties
    const relatedRecords = await RecordModel.find({
      _id: { $in: relatedRecordIds },
      isDeleted: { $ne: true }
    }).exec();

    return relatedRecords;
  }

  // Apply filters to records
  private applyFilters(
    records: any[],
    filters: Array<{ property: string; condition: string; value: any }>
  ): any[] {
    return records.filter(record => {
      return filters.every(filter => {
        const propertyValue = record.properties?.[filter.property];
        return this.evaluateFilterCondition(propertyValue, filter.condition, filter.value);
      });
    });
  }

  // Evaluate filter condition
  private evaluateFilterCondition(value: any, condition: string, filterValue: any): boolean {
    switch (condition) {
      case 'equals':
        return value === filterValue;
      case 'not_equals':
        return value !== filterValue;
      case 'contains':
        return typeof value === 'string' && value.includes(filterValue);
      case 'not_contains':
        return typeof value === 'string' && !value.includes(filterValue);
      case 'starts_with':
        return typeof value === 'string' && value.startsWith(filterValue);
      case 'ends_with':
        return typeof value === 'string' && value.endsWith(filterValue);
      case 'greater_than':
        return typeof value === 'number' && value > filterValue;
      case 'greater_than_or_equal':
        return typeof value === 'number' && value >= filterValue;
      case 'less_than':
        return typeof value === 'number' && value < filterValue;
      case 'less_than_or_equal':
        return typeof value === 'number' && value <= filterValue;
      case 'is_empty':
        return value === null || value === undefined || value === '';
      case 'is_not_empty':
        return value !== null && value !== undefined && value !== '';
      case 'checkbox_is':
        return Boolean(value) === Boolean(filterValue);
      default:
        return true;
    }
  }

  // Extract property values from records
  private extractPropertyValues(records: any[], propertyName: string): any[] {
    return records
      .map(record => record.properties?.[propertyName])
      .filter(value => value !== null && value !== undefined);
  }

  // Calculate rollup function
  private calculateRollupFunction(
    func: ERollupFunction,
    values: any[],
    propertyType: EPropertyType,
    config: IRollupConfig
  ): any {
    switch (func) {
      case ERollupFunction.COUNT:
        return values.length;

      case ERollupFunction.COUNT_VALUES:
        return values.filter(v => v !== null && v !== undefined && v !== '').length;

      case ERollupFunction.COUNT_UNIQUE:
        return new Set(values).size;

      case ERollupFunction.COUNT_EMPTY:
        return values.filter(v => v === null || v === undefined || v === '').length;

      case ERollupFunction.COUNT_NOT_EMPTY:
        return values.filter(v => v !== null && v !== undefined && v !== '').length;

      case ERollupFunction.PERCENT_EMPTY:
        const emptyCount = values.filter(v => v === null || v === undefined || v === '').length;
        return values.length > 0 ? (emptyCount / values.length) * 100 : 0;

      case ERollupFunction.PERCENT_NOT_EMPTY:
        const notEmptyCount = values.filter(v => v !== null && v !== undefined && v !== '').length;
        return values.length > 0 ? (notEmptyCount / values.length) * 100 : 0;

      case ERollupFunction.SUM:
        if (propertyType !== EPropertyType.NUMBER) return null;
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);

      case ERollupFunction.AVERAGE:
        if (propertyType !== EPropertyType.NUMBER) return null;
        const numericValues = values.filter(v => typeof v === 'number');
        return numericValues.length > 0
          ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
          : null;

      case ERollupFunction.MEDIAN:
        if (propertyType !== EPropertyType.NUMBER) return null;
        const sortedNumbers = values.filter(v => typeof v === 'number').sort((a, b) => a - b);
        if (sortedNumbers.length === 0) return null;
        const mid = Math.floor(sortedNumbers.length / 2);
        return sortedNumbers.length % 2 === 0
          ? (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2
          : sortedNumbers[mid];

      case ERollupFunction.MIN:
        if (propertyType === EPropertyType.NUMBER) {
          const numericValues = values.filter(v => typeof v === 'number');
          return numericValues.length > 0 ? Math.min(...numericValues) : null;
        } else if (propertyType === EPropertyType.DATE) {
          const dateValues = values.filter(v => v instanceof Date || !isNaN(Date.parse(v)));
          return dateValues.length > 0 ? new Date(Math.min(...dateValues.map(d => new Date(d).getTime()))) : null;
        }
        return null;

      case ERollupFunction.MAX:
        if (propertyType === EPropertyType.NUMBER) {
          const numericValues = values.filter(v => typeof v === 'number');
          return numericValues.length > 0 ? Math.max(...numericValues) : null;
        } else if (propertyType === EPropertyType.DATE) {
          const dateValues = values.filter(v => v instanceof Date || !isNaN(Date.parse(v)));
          return dateValues.length > 0 ? new Date(Math.max(...dateValues.map(d => new Date(d).getTime()))) : null;
        }
        return null;

      case ERollupFunction.RANGE:
        if (propertyType !== EPropertyType.NUMBER) return null;
        const numericVals = values.filter(v => typeof v === 'number');
        if (numericVals.length === 0) return null;
        return Math.max(...numericVals) - Math.min(...numericVals);

      case ERollupFunction.EARLIEST:
        if (propertyType !== EPropertyType.DATE) return null;
        const earliestDates = values.filter(v => v instanceof Date || !isNaN(Date.parse(v)));
        return earliestDates.length > 0
          ? new Date(Math.min(...earliestDates.map(d => new Date(d).getTime())))
          : null;

      case ERollupFunction.LATEST:
        if (propertyType !== EPropertyType.DATE) return null;
        const latestDates = values.filter(v => v instanceof Date || !isNaN(Date.parse(v)));
        return latestDates.length > 0
          ? new Date(Math.max(...latestDates.map(d => new Date(d).getTime())))
          : null;

      case ERollupFunction.DATE_RANGE:
        if (propertyType !== EPropertyType.DATE) return null;
        const dateVals = values.filter(v => v instanceof Date || !isNaN(Date.parse(v)));
        if (dateVals.length === 0) return null;
        const dates = dateVals.map(d => new Date(d));
        const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
        const latest = new Date(Math.max(...dates.map(d => d.getTime())));
        return { earliest, latest, days: Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) };

      case ERollupFunction.CHECKED:
        if (propertyType !== EPropertyType.CHECKBOX) return null;
        return values.filter(v => Boolean(v)).length;

      case ERollupFunction.UNCHECKED:
        if (propertyType !== EPropertyType.CHECKBOX) return null;
        return values.filter(v => !v).length;

      case ERollupFunction.PERCENT_CHECKED:
        if (propertyType !== EPropertyType.CHECKBOX) return null;
        const checkedCount = values.filter(v => Boolean(v)).length;
        return values.length > 0 ? (checkedCount / values.length) * 100 : 0;

      case ERollupFunction.SHOW_ORIGINAL:
        return values.length > 0 ? values[0] : null;

      default:
        return null;
    }
  }

  // Get empty rollup value based on function
  private getEmptyRollupValue(func: ERollupFunction): any {
    switch (func) {
      case ERollupFunction.COUNT:
      case ERollupFunction.COUNT_VALUES:
      case ERollupFunction.COUNT_UNIQUE:
      case ERollupFunction.COUNT_EMPTY:
      case ERollupFunction.COUNT_NOT_EMPTY:
      case ERollupFunction.CHECKED:
      case ERollupFunction.UNCHECKED:
        return 0;

      case ERollupFunction.PERCENT_EMPTY:
      case ERollupFunction.PERCENT_NOT_EMPTY:
      case ERollupFunction.PERCENT_CHECKED:
        return 0;

      case ERollupFunction.SUM:
        return 0;

      default:
        return null;
    }
  }

  // Update rollup values for all records that depend on a changed record
  async updateDependentRollups(recordId: string): Promise<void> {
    // Find all rollup properties that might depend on this record
    const rollupProperties = await PropertyModel.find({
      type: EPropertyType.ROLLUP,
      isDeleted: { $ne: true }
    });

    for (const rollupProperty of rollupProperties) {
      if (rollupProperty.config.rollupPropertyId && rollupProperty.config.relationPropertyId) {
        // Find records that have this rollup property and might be affected
        const affectedRecords = await this.findRecordsAffectedByChange(
          recordId,
          rollupProperty.config.relationPropertyId
        );

        // Update rollup values for affected records
        for (const affectedRecord of affectedRecords) {
          const rollupValue = await this.calculateRollupValue(
            affectedRecord._id.toString(),
            rollupProperty.config as IRollupConfig
          );

          // Update the record with new rollup value
          await RecordModel.findByIdAndUpdate(
            affectedRecord._id,
            {
              $set: {
                [`properties.${rollupProperty.name}`]: rollupValue,
                lastEditedAt: new Date()
              }
            }
          );
        }
      }
    }
  }

  // Find records affected by a change
  private async findRecordsAffectedByChange(
    changedRecordId: string,
    relationPropertyId: string
  ): Promise<any[]> {
    // Get relations for this property
    const relations = await RelationModel.findByProperty(relationPropertyId);
    if (relations.length === 0) {
      return [];
    }

    const relation = relations[0];

    // Find connections where the changed record is the target
    const connections = await RelationConnectionModel.find({
      relationId: relation.id.toString(),
      targetRecordId: changedRecordId,
      isActive: true
    });

    // Get source records (these are the ones with rollup properties that need updating)
    const sourceRecordIds = connections.map(conn => conn.sourceRecordId);

    if (sourceRecordIds.length === 0) {
      return [];
    }

    return RecordModel.find({
      _id: { $in: sourceRecordIds },
      isDeleted: { $ne: true }
    }).exec();
  }

  // Recalculate all rollup values for a database
  async recalculateAllRollups(databaseId: string): Promise<void> {
    // Get all rollup properties in the database
    const rollupProperties = await PropertyModel.find({
      databaseId,
      type: EPropertyType.ROLLUP,
      isDeleted: { $ne: true }
    });

    // Get all records in the database
    const records = await RecordModel.find({
      databaseId,
      isDeleted: { $ne: true }
    });

    // Update each record's rollup values
    for (const record of records) {
      const updates: Record<string, any> = {};

      for (const rollupProperty of rollupProperties) {
        if (rollupProperty.config.rollupPropertyId) {
          const rollupValue = await this.calculateRollupValue(
            record.id.toString(),
            rollupProperty.config as IRollupConfig
          );
          updates[`properties.${rollupProperty.name}`] = rollupValue;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.lastEditedAt = new Date();
        await RecordModel.findByIdAndUpdate(record._id, { $set: updates });
      }
    }
  }
}

export const rollupService = new RollupService();
