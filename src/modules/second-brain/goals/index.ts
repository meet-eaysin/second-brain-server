// Goals Module - Goal tracking and achievement system
// This module provides comprehensive goal management with OKR-style tracking

// Routes - Goal-specific operations
export { default as goalsRoutes } from './routes/goals.routes';

// Controllers - Goal business logic
export {
  // Goal CRUD operations
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  
  // Goal actions
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
} from './controllers/goals.controller';

// Services - Goal-specific services
export {
  GoalsService,
  goalsService
} from './services/goals.service';

// Types
export type * from './types/goals.types';

// Types - Specific exports for better IDE support
export type {
  IGoal,
  IGoalMilestone,
  IGoalKeyResult,
  IGoalStats,
  ICreateGoalRequest,
  IUpdateGoalRequest,
  IGoalQueryParams,
  IGoalProgressUpdate,
  EGoalStatus,
  EGoalCategory,
  EGoalPriority,
  EGoalTimeFrame
} from './types/goals.types';

// Validators
export {
  goalsValidators,
  goalIdSchema,
  createGoalSchema,
  updateGoalSchema,
  getGoalsQuerySchema,
  duplicateGoalSchema,
  bulkUpdateGoalsSchema,
  bulkDeleteGoalsSchema,
  updateProgressSchema,
  addMilestoneSchema,
  updateMilestoneSchema,
  addKeyResultSchema,
  updateKeyResultSchema,
  searchGoalsSchema,
  categoryParamSchema
} from './validators/goals.validators';
