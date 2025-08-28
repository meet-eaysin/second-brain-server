import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// Project controllers
import {
  // Project CRUD
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  
  // Project analytics
  getActiveProjects,
  getCompletedProjects,
  getProjectsByStatus,
  getProjectsByCategory,
  getProjectsByPriority,
  getMyProjects,
  getProjectsImInvolvedIn,
  getProjectTemplates,
  searchProjects,
  
  // Project actions
  startProject,
  completeProject,
  pauseProject,
  archiveProject,
  duplicateProject,
  bulkUpdateProjects,
  bulkDeleteProjects,
  
  // Statistics
  getProjectStats
} from '../controllers/projects.controller';

// Validators
import {
  projectIdSchema,
  createProjectSchema,
  updateProjectSchema,
  getProjectsQuerySchema,
  duplicateProjectSchema,
  bulkUpdateProjectsSchema,
  bulkDeleteProjectsSchema,
  searchProjectsSchema,
  projectStatsQuerySchema,
  statusParamSchema,
  categoryParamSchema,
  priorityParamSchema
} from '../validators/projects.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== PROJECT CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createProjectSchema),
  createProject
);

router.get(
  '/',
  validateQuery(getProjectsQuerySchema),
  getProjects
);

router.get(
  '/stats',
  validateQuery(projectStatsQuerySchema),
  getProjectStats
);

router.get(
  '/active',
  validateQuery(getProjectsQuerySchema),
  getActiveProjects
);

router.get(
  '/completed',
  validateQuery(getProjectsQuerySchema),
  getCompletedProjects
);

router.get(
  '/my-projects',
  validateQuery(getProjectsQuerySchema),
  getMyProjects
);

router.get(
  '/involved-in',
  validateQuery(getProjectsQuerySchema),
  getProjectsImInvolvedIn
);

router.get(
  '/templates',
  validateQuery(getProjectsQuerySchema),
  getProjectTemplates
);

router.get(
  '/search',
  validateQuery(searchProjectsSchema),
  searchProjects
);

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getProjectsQuerySchema),
  getProjectsByStatus
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getProjectsQuerySchema),
  getProjectsByCategory
);

router.get(
  '/priority/:priority',
  validateParams(priorityParamSchema),
  validateQuery(getProjectsQuerySchema),
  getProjectsByPriority
);

router.get(
  '/:id',
  validateParams(projectIdSchema),
  getProjectById
);

router.put(
  '/:id',
  validateParams(projectIdSchema),
  validateBody(updateProjectSchema),
  updateProject
);

router.delete(
  '/:id',
  validateParams(projectIdSchema),
  deleteProject
);

// ===== PROJECT ACTIONS =====

router.post(
  '/:id/start',
  validateParams(projectIdSchema),
  startProject
);

router.post(
  '/:id/complete',
  validateParams(projectIdSchema),
  completeProject
);

router.post(
  '/:id/pause',
  validateParams(projectIdSchema),
  pauseProject
);

router.post(
  '/:id/archive',
  validateParams(projectIdSchema),
  archiveProject
);

router.post(
  '/:id/duplicate',
  validateParams(projectIdSchema),
  validateBody(duplicateProjectSchema),
  duplicateProject
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateProjectsSchema),
  bulkUpdateProjects
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteProjectsSchema),
  bulkDeleteProjects
);

export default router;
