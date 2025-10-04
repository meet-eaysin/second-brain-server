import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import {
  resolveWorkspaceContext,
  ensureDefaultWorkspace
} from '@/modules/workspace/middleware/workspace.middleware';

// Project controllers
import { projectsController } from '../controllers/projects.controller';

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
router.use(resolveWorkspaceContext({ allowFromBody: true }));
router.use(ensureDefaultWorkspace);

// ===== PROJECT CRUD OPERATIONS =====

router.post('/', validateBody(createProjectSchema), projectsController.createProject);

router.get('/', validateQuery(getProjectsQuerySchema), projectsController.getProjects);

router.get('/stats', validateQuery(projectStatsQuerySchema), projectsController.getProjectStats);

router.get('/active', validateQuery(getProjectsQuerySchema), projectsController.getActiveProjects);

router.get(
  '/completed',
  validateQuery(getProjectsQuerySchema),
  projectsController.getCompletedProjects
);

router.get('/my-projects', validateQuery(getProjectsQuerySchema), projectsController.getMyProjects);

router.get(
  '/involved-in',
  validateQuery(getProjectsQuerySchema),
  projectsController.getProjectsImInvolvedIn
);

router.get(
  '/templates',
  validateQuery(getProjectsQuerySchema),
  projectsController.getProjectTemplates
);

router.get('/search', validateQuery(searchProjectsSchema), projectsController.searchProjects);

router.get(
  '/status/:status',
  validateParams(statusParamSchema),
  validateQuery(getProjectsQuerySchema),
  projectsController.getProjectsByStatus
);

router.get(
  '/category/:category',
  validateParams(categoryParamSchema),
  validateQuery(getProjectsQuerySchema),
  projectsController.getProjectsByCategory
);

router.get(
  '/priority/:priority',
  validateParams(priorityParamSchema),
  validateQuery(getProjectsQuerySchema),
  projectsController.getProjectsByPriority
);

router.get('/:id', validateParams(projectIdSchema), projectsController.getProjectById);

router.put(
  '/:id',
  validateParams(projectIdSchema),
  validateBody(updateProjectSchema),
  projectsController.updateProject
);

router.delete('/:id', validateParams(projectIdSchema), projectsController.deleteProject);

// ===== PROJECT ACTIONS =====

router.post('/:id/start', validateParams(projectIdSchema), projectsController.startProject);

router.post('/:id/complete', validateParams(projectIdSchema), projectsController.completeProject);

router.post('/:id/pause', validateParams(projectIdSchema), projectsController.pauseProject);

router.post('/:id/archive', validateParams(projectIdSchema), projectsController.archiveProject);

router.post(
  '/:id/duplicate',
  validateParams(projectIdSchema),
  validateBody(duplicateProjectSchema),
  projectsController.duplicateProject
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdateProjectsSchema),
  projectsController.bulkUpdateProjects
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeleteProjectsSchema),
  projectsController.bulkDeleteProjects
);

export default router;
