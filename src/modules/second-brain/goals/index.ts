// Goals Module - Goal tracking and achievement system
// This module provides comprehensive goal management with OKR-style tracking

// Routes - Goal-specific operations
export { default as goalsRoutes } from './routes/goals.routes';

// Controllers are used by routes and not exported directly

// Services - Goal-specific services
export { goalsService } from './services/goals.service';

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
  GoalMilestoneSchema,
  GoalKeyResultSchema,
  GoalSchema,
  CreateGoalRequestSchema,
  UpdateGoalRequestSchema,
  GoalProgressUpdateSchema
} from './validators/goals.validators';
