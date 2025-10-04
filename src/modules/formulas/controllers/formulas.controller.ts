import { Request, Response, NextFunction } from 'express';
import { formulaEngine } from '../services/formula-engine';
import {
  FormulaPropertyModel,
  FormulaCacheModel,
  FormulaPerformanceModel
} from '../models/formula.model';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

// Validate formula expression
export const validateFormula = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { expression, availableProperties, expectedReturnType, maxComplexity } = req.body;

    const validation = formulaEngine.validateFormula(
      expression,
      availableProperties || [],
      expectedReturnType,
      maxComplexity
    );

    sendSuccessResponse(res, 'Formula validation completed', validation);
  }
);

// Test formula with sample data
export const testFormula = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { expression, sampleData, availableProperties } = req.body;

    const result = await formulaEngine.testFormula(
      expression,
      sampleData || {},
      availableProperties || []
    );

    sendSuccessResponse(res, 'Formula test completed', result);
  }
);

// Execute formula
export const executeFormula = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { expression, context, config } = req.body;
    const userId = getUserId(req);

    // Add user info to context
    const enrichedContext = {
      ...context,
      currentUser: {
        id: userId,
        name: req.user?.username || '',
        email: req.user?.email || ''
      },
      currentDate: new Date()
    };

    const result = await formulaEngine.executeFormula(expression, enrichedContext, config);

    sendSuccessResponse(res, 'Formula executed successfully', result);
  }
);

// Get formula dependencies
export const getFormulaDependencies = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { expression } = req.body;

    const dependencies = formulaEngine.getFormulaDependencies(expression);
    const functions = formulaEngine.getFormulaFunctions(expression);
    const complexity = formulaEngine.calculateComplexity(expression);

    sendSuccessResponse(res, 'Formula analysis completed', {
      dependencies,
      functions,
      complexity
    });
  }
);

// Get available functions
export const getAvailableFunctions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category, search } = req.query;

    let functions;
    if (search) {
      functions = formulaEngine.searchFunctions(search as string);
    } else if (category) {
      functions = formulaEngine.getFunctionsByCategory(category as string);
    } else {
      functions = formulaEngine.getAvailableFunctions();
    }

    sendSuccessResponse(res, 'Available functions retrieved', functions);
  }
);

// Create formula property
export const createFormulaProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const formulaData = {
      ...req.body,
      createdBy: userId,
      updatedBy: userId
    };

    // Validate formula before creating
    const validation = formulaEngine.validateFormula(
      formulaData.expression,
      formulaData.availableProperties || [],
      formulaData.returnType
    );

    if (!validation.isValid) {
      return sendSuccessResponse(res, 'Formula validation failed', { validation }, 400);
    }

    // Extract dependencies and complexity
    formulaData.dependencies = validation.dependencies;
    formulaData.complexity = validation.complexity;

    const formula = new FormulaPropertyModel(formulaData);
    await formula.save();

    sendSuccessResponse(res, 'Formula property created successfully', formula, 201);
  }
);

// Update formula property
export const updateFormulaProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { formulaId } = req.params;
    const userId = getUserId(req);
    const updates = req.body;

    const formula = await FormulaPropertyModel.findById(formulaId);
    if (!formula) {
      return sendSuccessResponse(res, 'Formula not found', null, 404);
    }

    // Validate updated expression if provided
    if (updates.expression) {
      const validation = formulaEngine.validateFormula(
        updates.expression,
        updates.availableProperties || [],
        updates.returnType || formula.returnType
      );

      if (!validation.isValid) {
        return sendSuccessResponse(res, 'Formula validation failed', { validation }, 400);
      }

      updates.dependencies = validation.dependencies;
      updates.complexity = validation.complexity;
      updates.lastValidated = new Date();
    }

    updates.updatedBy = userId;
    updates.updatedAt = new Date();

    const updatedFormula = await FormulaPropertyModel.findByIdAndUpdate(formulaId, updates, {
      new: true
    });

    // Invalidate cache for this formula
    await FormulaCacheModel.deleteMany({
      propertyName: updatedFormula?.propertyName
    });

    sendSuccessResponse(res, 'Formula property updated successfully', updatedFormula);
  }
);

// Delete formula property
export const deleteFormulaProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { formulaId } = req.params;
    const userId = getUserId(req);

    const formula = await FormulaPropertyModel.findById(formulaId);
    if (!formula) {
      return sendSuccessResponse(res, 'Formula not found', null, 404);
    }

    // Soft delete
    await FormulaPropertyModel.findByIdAndUpdate(formulaId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Clean up cache entries
    await FormulaCacheModel.deleteMany({
      propertyName: formula.propertyName
    });

    sendSuccessResponse(res, 'Formula property deleted successfully');
  }
);

// Get formula properties for database
export const getDatabaseFormulas = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;

    const formulas = await FormulaPropertyModel.findByDatabase(databaseId);

    sendSuccessResponse(res, 'Database formulas retrieved successfully', formulas);
  }
);

// Get formula property by name
export const getFormulaProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyName } = req.params;

    const formula = await FormulaPropertyModel.findByProperty(databaseId, propertyName);

    if (!formula) {
      return sendSuccessResponse(res, 'Formula property not found', null, 404);
    }

    sendSuccessResponse(res, 'Formula property retrieved successfully', formula);
  }
);

// Optimize formula
export const optimizeFormula = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { expression } = req.body;

    const optimization = formulaEngine.optimizeFormula(expression);

    sendSuccessResponse(res, 'Formula optimization completed', optimization);
  }
);

// Get formula performance metrics
export const getFormulaPerformance = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { formulaId } = req.params;

    const performance = await FormulaPerformanceModel.getPerformanceStats(formulaId);

    if (!performance) {
      return sendSuccessResponse(res, 'No performance data found', null, 404);
    }

    sendSuccessResponse(res, 'Formula performance retrieved successfully', performance);
  }
);

// Get slow formulas
export const getSlowFormulas = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const slowFormulas = await FormulaPerformanceModel.getSlowFormulas(
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Slow formulas retrieved successfully', slowFormulas);
  }
);

// Get error-prone formulas
export const getErrorProneFormulas = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;

    const errorProneFormulas = await FormulaPerformanceModel.getErrorProneFormulas(
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccessResponse(res, 'Error-prone formulas retrieved successfully', errorProneFormulas);
  }
);

// Get cache statistics
export const getCacheStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const cacheStats = await FormulaCacheModel.getCacheStats();
    const engineStats = formulaEngine.getCacheStats();

    sendSuccessResponse(res, 'Cache statistics retrieved successfully', {
      database: cacheStats,
      engine: engineStats
    });
  }
);

// Clear formula cache
export const clearFormulaCache = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId, propertyName } = req.query;

    if (recordId && propertyName) {
      // Clear specific cache entry
      await FormulaCacheModel.deleteOne({ recordId, propertyName });
    } else if (recordId) {
      // Clear all cache entries for record
      await FormulaCacheModel.deleteMany({ recordId });
    } else {
      // Clear all cache
      await FormulaCacheModel.deleteMany({});
      formulaEngine.clearCache();
    }

    sendSuccessResponse(res, 'Formula cache cleared successfully');
  }
);

// Cleanup expired cache entries
export const cleanupExpiredCache = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const deletedCount = await FormulaCacheModel.cleanupExpired();

    sendSuccessResponse(res, 'Expired cache entries cleaned up', { deletedCount });
  }
);

// Recalculate formulas for record
export const recalculateFormulas = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recordId } = req.params;
    const { changedProperties } = req.body;

    const results = await formulaEngine.recalculateFormulas(recordId, changedProperties || []);

    sendSuccessResponse(res, 'Formulas recalculated successfully', { results });
  }
);

// Get formula suggestions
export const getFormulaSuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { context, intent, availableProperties } = req.body;

    // This would integrate with AI service for intelligent suggestions
    // For now, return basic suggestions based on context
    const suggestions = [
      {
        expression: 'SUM([Amount], [Tax])',
        description: 'Calculate total including tax',
        category: 'math',
        confidence: 0.9
      },
      {
        expression: 'IF([Status] == "Complete", "Done", "Pending")',
        description: 'Status-based conditional text',
        category: 'logical',
        confidence: 0.8
      },
      {
        expression: 'CONCAT([First Name], " ", [Last Name])',
        description: 'Combine first and last name',
        category: 'text',
        confidence: 0.85
      }
    ];

    sendSuccessResponse(res, 'Formula suggestions generated', suggestions);
  }
);

// Format formula result
export const formatFormulaResult = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { value, format } = req.body;

    const formattedValue = formulaEngine.formatFormulaResult(value, format);

    sendSuccessResponse(res, 'Formula result formatted', { formattedValue });
  }
);
