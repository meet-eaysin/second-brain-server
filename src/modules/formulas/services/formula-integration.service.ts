import { ObjectId } from 'mongodb';
import { formulaEngineService } from './formula-engine.service';
import { FormulaPropertyModel, FormulaCacheModel, FormulaPerformanceModel } from '../models/formula.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { PropertyModel } from '@/modules/database/models/property.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { IFormulaContext, IFormulaPropertyConfig } from '../types/formula.types';
import { EPropertyType } from '@/modules/core/types/property.types';
import { createAppError } from '@/utils';

export class FormulaIntegrationService {
  // Calculate formula property value for a record
  async calculateFormulaProperty(
    recordId: string,
    propertyName: string,
    databaseId: string,
    userId: string
  ): Promise<any> {
    // Get formula configuration
    const formula = await FormulaPropertyModel.findByProperty(databaseId, propertyName);
    if (!formula) {
      throw createAppError(`Formula property '${propertyName}' not found`, 404);
    }

    // Get record data
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createAppError('Record not found', 404);
    }

    // Get database properties for context
    const properties = await PropertyModel.find({ databaseId });
    const propertyMap = new Map(properties.map(p => [p.name, p]));

    // Build formula context
    const context: IFormulaContext = {
      recordId,
      databaseId,
      properties: record.properties || {},
      currentUser: {
        id: userId,
        name: '', // Would be populated from user service
        email: ''
      },
      currentDate: new Date()
    };

    // Add related records if needed
    if (formula.dependencies.some(dep => this.isRelationProperty(dep, propertyMap))) {
      context.relatedRecords = await this.getRelatedRecords(record, formula.dependencies, propertyMap);
    }

    try {
      // Execute formula
      const result = await formulaEngineService.executeFormula(
        formula.expression,
        context,
        {
          cacheEnabled: formula.cacheEnabled,
          cacheTTL: formula.cacheTTL,
          errorHandling: formula.errorHandling,
          defaultValue: formula.defaultValue,
          precision: formula.precision,
          format: formula.format
        }
      );

      // Record performance metrics
      await FormulaPerformanceModel.recordExecution(
        formula.id.toString(),
        result.executionTime,
        true
      );

      return result.value;

    } catch (error) {
      // Record error in performance metrics
      await FormulaPerformanceModel.recordExecution(
        formula.id.toString(),
        0,
        false
      );

      throw error;
    }
  }

  // Recalculate all formula properties for a record
  async recalculateRecordFormulas(
    recordId: string,
    changedProperties: string[] = [],
    userId: string
  ): Promise<Record<string, any>> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createAppError('Record not found', 404);
    }

    // Get all formula properties for this database
    const formulas = await FormulaPropertyModel.findByDatabase(record.databaseId.toString());

    // Filter formulas that depend on changed properties
    const affectedFormulas = formulas.filter(formula =>
      changedProperties.length === 0 ||
      formula.dependencies.some(dep => changedProperties.includes(dep))
    );

    const results: Record<string, any> = {};

    for (const formula of affectedFormulas) {
      try {
        const value = await this.calculateFormulaProperty(
          recordId,
          formula.propertyName,
          record.databaseId.toString(),
          userId
        );

        results[formula.propertyName] = value;

        // Update record with calculated value
        await RecordModel.findByIdAndUpdate(recordId, {
          [`properties.${formula.propertyName}`]: value,
          lastEditedAt: new Date(),
          lastEditedBy: new ObjectId(userId)
        });

      } catch (error) {
        console.error(`Error calculating formula ${formula.propertyName}:`, error);
        results[formula.propertyName] = formula.defaultValue || null;
      }
    }

    return results;
  }

  // Setup formula property in database
  async setupFormulaProperty(
    databaseId: string,
    propertyName: string,
    expression: string,
    returnType: EPropertyType,
    config: Partial<IFormulaPropertyConfig> = {},
    userId: string
  ): Promise<any> {
    // Validate formula
    const database = await DatabaseModel.findById(databaseId);
    if (!database) {
      throw createAppError('Database not found', 404);
    }

    // Get available properties for validation
    const properties = await PropertyModel.find({ databaseId });
    const availableProperties = properties.map(p => ({
      name: p.name,
      type: p.type
    }));

    // Validate formula expression
    const validation = formulaEngineService.validateFormula(
      expression,
      availableProperties,
      returnType
    );

    if (!validation.isValid) {
      throw createAppError(`Formula validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 400);
    }

    // Create formula property configuration
    const formulaConfig = new FormulaPropertyModel({
      databaseId: new ObjectId(databaseId),
      propertyName,
      expression,
      returnType,
      dependencies: validation.dependencies,
      complexity: validation.estimatedComplexity,
      ...config,
      createdBy: new ObjectId(userId),
      updatedBy: new ObjectId(userId)
    });

    await formulaConfig.save();

    // Create or update the property in the database
    const existingProperty = await PropertyModel.findOne({ databaseId, name: propertyName });

    if (existingProperty) {
      // Update existing property to be a formula
      await PropertyModel.findByIdAndUpdate(existingProperty._id, {
        type: EPropertyType.FORMULA,
        config: {
          expression,
          returnType,
          dependencies: validation.dependencies,
          ...config
        },
        updatedBy: new ObjectId(userId),
        updatedAt: new Date()
      });
    } else {
      // Create new formula property
      const property = new PropertyModel({
        databaseId: new ObjectId(databaseId),
        name: propertyName,
        type: EPropertyType.FORMULA,
        config: {
          expression,
          returnType,
          dependencies: validation.dependencies,
          ...config
        },
        order: properties.length,
        createdBy: new ObjectId(userId),
        updatedBy: new ObjectId(userId)
      });

      await property.save();
    }

    // Recalculate formula for all existing records
    await this.recalculateFormulaForAllRecords(databaseId, propertyName, userId);

    return formulaConfig;
  }

  // Remove formula property
  async removeFormulaProperty(
    databaseId: string,
    propertyName: string,
    userId: string
  ): Promise<void> {
    // Remove formula configuration
    await FormulaPropertyModel.findOneAndUpdate(
      { databaseId, propertyName },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: new ObjectId(userId)
      }
    );

    // Remove property from database
    await PropertyModel.findOneAndUpdate(
      { databaseId, name: propertyName },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: new ObjectId(userId)
      }
    );

    // Clear cache entries
    await FormulaCacheModel.deleteMany({ propertyName });

    // Remove property values from all records
    await RecordModel.updateMany(
      { databaseId },
      { $unset: { [`properties.${propertyName}`]: 1 } }
    );
  }

  // Recalculate formula for all records in database
  async recalculateFormulaForAllRecords(
    databaseId: string,
    propertyName: string,
    userId: string
  ): Promise<number> {
    const records = await RecordModel.find({ databaseId });
    let updatedCount = 0;

    for (const record of records) {
      try {
        const value = await this.calculateFormulaProperty(
          record.id.toString(),
          propertyName,
          databaseId,
          userId
        );

        await RecordModel.findByIdAndUpdate(record._id, {
          [`properties.${propertyName}`]: value,
          lastEditedAt: new Date(),
          lastEditedBy: new ObjectId(userId)
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error recalculating formula for record ${record._id}:`, error);
      }
    }

    return updatedCount;
  }

  // Get formula property suggestions for database
  async getFormulaSuggestions(
    databaseId: string,
    context?: string
  ): Promise<any[]> {
    const properties = await PropertyModel.find({ databaseId });
    const database = await DatabaseModel.findById(databaseId);

    // Basic suggestions based on property types
    const suggestions = [];

    // Numeric calculations
    const numericProps = properties.filter(p =>
      [EPropertyType.NUMBER, EPropertyType.CURRENCY, EPropertyType.PERCENT].includes(p.type)
    );

    if (numericProps.length >= 2) {
      suggestions.push({
        name: 'Total',
        expression: `SUM(${numericProps.slice(0, 2).map(p => `[${p.name}]`).join(', ')})`,
        description: 'Sum of numeric properties',
        category: 'math',
        confidence: 0.8
      });

      suggestions.push({
        name: 'Average',
        expression: `AVERAGE(${numericProps.slice(0, 2).map(p => `[${p.name}]`).join(', ')})`,
        description: 'Average of numeric properties',
        category: 'math',
        confidence: 0.7
      });
    }

    // Text concatenation
    const textProps = properties.filter(p =>
      [EPropertyType.TEXT, EPropertyType.RICH_TEXT].includes(p.type)
    );

    if (textProps.length >= 2) {
      suggestions.push({
        name: 'Full Name',
        expression: `CONCAT(${textProps.slice(0, 2).map(p => `[${p.name}]`).join(', " ", ')})`,
        description: 'Concatenate text properties',
        category: 'text',
        confidence: 0.6
      });
    }

    // Status-based conditions
    const statusProps = properties.filter(p =>
      [EPropertyType.SELECT, EPropertyType.STATUS].includes(p.type)
    );

    if (statusProps.length > 0) {
      const statusProp = statusProps[0];
      suggestions.push({
        name: 'Status Indicator',
        expression: `IF([${statusProp.name}] == "Complete", "✅", "⏳")`,
        description: 'Visual status indicator',
        category: 'logical',
        confidence: 0.7
      });
    }

    // Date calculations
    const dateProps = properties.filter(p =>
      [EPropertyType.DATE, EPropertyType.CREATED_TIME].includes(p.type)
    );

    if (dateProps.length > 0) {
      const dateProp = dateProps[0];
      suggestions.push({
        name: 'Days Since',
        expression: `(TODAY() - [${dateProp.name}]) / 86400000`,
        description: 'Days since date',
        category: 'date',
        confidence: 0.6
      });
    }

    return suggestions;
  }

  // Private helper methods
  private isRelationProperty(propertyName: string, propertyMap: Map<string, any>): boolean {
    const property = propertyMap.get(propertyName);
    return property && [EPropertyType.RELATION, EPropertyType.ROLLUP, EPropertyType.LOOKUP].includes(property.type);
  }

  private async getRelatedRecords(
    record: any,
    dependencies: string[],
    propertyMap: Map<string, any>
  ): Promise<Record<string, any[]>> {
    const relatedRecords: Record<string, any[]> = {};

    for (const dep of dependencies) {
      if (this.isRelationProperty(dep, propertyMap)) {
        const property = propertyMap.get(dep);
        if (property && property.config?.targetDatabase) {
          // Get related records based on relation configuration
          const relationIds = record.properties[dep];
          if (relationIds && Array.isArray(relationIds)) {
            const related = await RecordModel.find({
              _id: { $in: relationIds.map(id => new ObjectId(id)) }
            });
            relatedRecords[dep] = related.map(r => r.properties);
          }
        }
      }
    }

    return relatedRecords;
  }

  // Bulk operations
  async bulkRecalculateFormulas(
    databaseId: string,
    propertyNames: string[] = [],
    userId: string
  ): Promise<{ updated: number; errors: number }> {
    const records = await RecordModel.find({ databaseId });
    let updated = 0;
    let errors = 0;

    for (const record of records) {
      try {
        await this.recalculateRecordFormulas(
          record.id.toString(),
          propertyNames,
          userId
        );
        updated++;
      } catch (error) {
        console.error(`Error recalculating formulas for record ${record._id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  }

  // Formula dependency analysis
  async analyzeFormulaDependencies(databaseId: string): Promise<any> {
    const formulas = await FormulaPropertyModel.findByDatabase(databaseId);
    const dependencyGraph: Record<string, string[]> = {};
    const circularDependencies: string[][] = [];

    // Build dependency graph
    formulas.forEach(formula => {
      dependencyGraph[formula.propertyName] = formula.dependencies;
    });

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, path: string[]): boolean => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        circularDependencies.push(path.slice(cycleStart));
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = dependencyGraph[node] || [];
      for (const dep of dependencies) {
        if (dependencyGraph[dep] && hasCycle(dep, [...path, dep])) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check each formula for cycles
    Object.keys(dependencyGraph).forEach(formula => {
      if (!visited.has(formula)) {
        hasCycle(formula, [formula]);
      }
    });

    return {
      dependencyGraph,
      circularDependencies,
      formulaCount: formulas.length,
      totalDependencies: Object.values(dependencyGraph).flat().length
    };
  }
}

export const formulaIntegrationService = new FormulaIntegrationService();
