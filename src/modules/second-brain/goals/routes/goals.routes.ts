import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Goal controllers
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  completeGoal,
  archiveGoal,
  getActiveGoals,
  getCompletedGoals,
  getOverdueGoals,
  getGoalsByCategory,
  searchGoals,
  getGoalStats,
  duplicateGoal,
  bulkUpdateGoals,
  bulkDeleteGoals
} from '../controllers/goals.controller';

// Validators
import {
  goalIdSchema,
  createGoalSchema,
  updateGoalSchema,
  getGoalsQuerySchema,
  duplicateGoalSchema,
  bulkUpdateGoalsSchema,
  bulkDeleteGoalsSchema,
  searchGoalsSchema,
  categoryParamSchema
} from '../validators/goals.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== GOALS CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createGoalSchema),
  createGoal
);

router.get(
  '/',
  validateQuery(getGoalsQuerySchema),
  getGoals
);

router.get(
  '/stats',
  getGoalStats
);

router.get(
  '/active',
  validateQuery(getGoalsQuerySchema),
  getActiveGoals
);

router.get(
  '/completed',
  validateQuery(getGoalsQuerySchema),
  getCompletedGoals
);

router.get(
  '/overdue',
  validateQuery(getGoalsQuerySchema),
  getOverdueGoals
);

router.get(
  '/search',
  validateQuery(searchGoalsSchema),
  searchGoals
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getGoalsQuerySchema),
  getGoalsByCategory
);

router.get(
  '/:id',
  validateParams(goalIdSchema),
  getGoalById
);

router.put(
  '/:id',
  validateParams(goalIdSchema),
  validateBody(updateGoalSchema),
  updateGoal
);

router.delete(
  '/:id',
  validateParams(goalIdSchema),
  deleteGoal
);

// ===== GOAL ACTIONS =====

router.post(
  '/:id/complete',
  validateParams(goalIdSchema),
  completeGoal
);

router.post(
  '/:id/archive',
  validateParams(goalIdSchema),
  archiveGoal
);

router.post(
  '/:id/duplicate',
  validateParams(goalIdSchema),
  validateBody(duplicateGoalSchema),
  duplicateGoal
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateGoalsSchema),
  bulkUpdateGoals
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteGoalsSchema),
  bulkDeleteGoals
);

export default router;
