import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { z } from 'zod';
import {
  validateFormula,
  testFormula,
  executeFormula,
  getFormulaDependencies,
  getAvailableFunctions,
  createFormulaProperty,
  updateFormulaProperty,
  deleteFormulaProperty,
  getDatabaseFormulas,
  getFormulaProperty,
  optimizeFormula,
  getFormulaPerformance,
  getSlowFormulas,
  getErrorProneFormulas,
  getCacheStats,
  clearFormulaCache,
  cleanupExpiredCache,
  recalculateFormulas,
  getFormulaSuggestions,
  formatFormulaResult
} from '../controllers/formulas.controller';

const router = Router();

// Validation schemas
const formulaExpressionSchema = z.object({
  expression: z.string().min(1).max(5000),
  availableProperties: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional(),
  expectedReturnType: z.string().optional(),
  maxComplexity: z.number().positive().optional()
});

const testFormulaSchema = z.object({
  expression: z.string().min(1).max(5000),
  sampleData: z.record(z.any()).optional(),
  availableProperties: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional()
});

const executeFormulaSchema = z.object({
  expression: z.string().min(1).max(5000),
  context: z.object({
    recordId: z.string(),
    databaseId: z.string(),
    properties: z.record(z.any()),
    relatedRecords: z.record(z.array(z.any())).optional(),
    variables: z.record(z.any()).optional()
  }),
  config: z.object({
    cacheEnabled: z.boolean().optional(),
    cacheTTL: z.number().positive().optional(),
    errorHandling: z.enum(['throw', 'return_null', 'return_default']).optional(),
    defaultValue: z.any().optional(),
    precision: z.number().min(0).max(10).optional(),
    format: z.string().optional()
  }).optional()
});

const createFormulaPropertySchema = z.object({
  databaseId: z.string().min(1),
  propertyName: z.string().min(1).max(100),
  expression: z.string().min(1).max(5000),
  returnType: z.string(),
  isAsync: z.boolean().optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTTL: z.number().positive().optional(),
  recalculateOnDependencyChange: z.boolean().optional(),
  errorHandling: z.enum(['throw', 'return_null', 'return_default']).optional(),
  defaultValue: z.any().optional(),
  precision: z.number().min(0).max(10).optional(),
  format: z.string().optional()
});

const updateFormulaPropertySchema = z.object({
  expression: z.string().min(1).max(5000).optional(),
  returnType: z.string().optional(),
  isAsync: z.boolean().optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTTL: z.number().positive().optional(),
  recalculateOnDependencyChange: z.boolean().optional(),
  errorHandling: z.enum(['throw', 'return_null', 'return_default']).optional(),
  defaultValue: z.any().optional(),
  precision: z.number().min(0).max(10).optional(),
  format: z.string().optional(),
  isActive: z.boolean().optional()
});

const recalculateFormulasSchema = z.object({
  changedProperties: z.array(z.string()).optional()
});

const formulaSuggestionsSchema = z.object({
  context: z.string().optional(),
  intent: z.string().optional(),
  availableProperties: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional()
});

const formatResultSchema = z.object({
  value: z.any(),
  format: z.string().optional()
});

// Public routes (no authentication required)
router.get('/formulas/functions', getAvailableFunctions);

// All other routes require authentication
router.use(authenticateToken);

// Formula validation and testing
router.post(
  '/formulas/validate',
  validateBody(formulaExpressionSchema),
  validateFormula
);

router.post(
  '/formulas/test',
  validateBody(testFormulaSchema),
  testFormula
);

router.post(
  '/formulas/execute',
  validateBody(executeFormulaSchema),
  executeFormula
);

router.post(
  '/formulas/analyze',
  validateBody(z.object({ expression: z.string().min(1).max(5000) })),
  getFormulaDependencies
);

router.post(
  '/formulas/optimize',
  validateBody(z.object({ expression: z.string().min(1).max(5000) })),
  optimizeFormula
);

// Formula property management
router.post(
  '/formulas/properties',
  validateBody(createFormulaPropertySchema),
  createFormulaProperty
);

router.put(
  '/formulas/properties/:formulaId',
  validateParams(z.object({ formulaId: z.string().min(1) })),
  validateBody(updateFormulaPropertySchema),
  updateFormulaProperty
);

router.delete(
  '/formulas/properties/:formulaId',
  validateParams(z.object({ formulaId: z.string().min(1) })),
  deleteFormulaProperty
);

router.get(
  '/formulas/databases/:databaseId',
  validateParams(z.object({ databaseId: z.string().min(1) })),
  getDatabaseFormulas
);

router.get(
  '/formulas/databases/:databaseId/properties/:propertyName',
  validateParams(z.object({ 
    databaseId: z.string().min(1),
    propertyName: z.string().min(1)
  })),
  getFormulaProperty
);

// Formula performance and monitoring
router.get(
  '/formulas/performance/:formulaId',
  validateParams(z.object({ formulaId: z.string().min(1) })),
  getFormulaPerformance
);

router.get(
  '/formulas/performance/slow',
  validateQuery(z.object({ limit: z.string().regex(/^\d+$/).optional() })),
  getSlowFormulas
);

router.get(
  '/formulas/performance/errors',
  validateQuery(z.object({ limit: z.string().regex(/^\d+$/).optional() })),
  getErrorProneFormulas
);

// Cache management
router.get('/formulas/cache/stats', getCacheStats);

router.delete(
  '/formulas/cache',
  validateQuery(z.object({
    recordId: z.string().optional(),
    propertyName: z.string().optional()
  })),
  clearFormulaCache
);

router.post('/formulas/cache/cleanup', cleanupExpiredCache);

// Formula recalculation
router.post(
  '/formulas/recalculate/:recordId',
  validateParams(z.object({ recordId: z.string().min(1) })),
  validateBody(recalculateFormulasSchema),
  recalculateFormulas
);

// AI-powered features
router.post(
  '/formulas/suggestions',
  validateBody(formulaSuggestionsSchema),
  getFormulaSuggestions
);

// Utility functions
router.post(
  '/formulas/format',
  validateBody(formatResultSchema),
  formatFormulaResult
);

// Function search and discovery
router.get(
  '/formulas/functions/search',
  validateQuery(z.object({
    category: z.string().optional(),
    search: z.string().optional()
  })),
  getAvailableFunctions
);

export default router;
