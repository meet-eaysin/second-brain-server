import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import { requireWorkspaceAccess } from '@/middlewares/permission.middleware';
import {
  createActivityController,
  getActivitiesController,
  getActivityByIdController,
  getRecentActivityFeedController,
  getVersionHistoryController,
  getActivityAnalyticsController,
  getUserActivitySummaryController,
  recordTaskActivityController,
  recordDatabaseActivityController,
  getWorkspaceActivityOverviewController,
  generateAuditTrailController,
  getSecurityEventsController,
  getComplianceReportController,
  exportAuditDataController,
  getActivityHeatmapController
} from '../controllers/activity.controller';
import { CreateActivityRequestSchema, ActivityQueryOptionsSchema } from '../types/activity.types';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const activityIdSchema = z.object({
  id: z.string().min(1, 'Activity ID is required')
});

const entityParamsSchema = z.object({
  entityId: z.string().min(1, 'Entity ID is required'),
  entityType: z.string().min(1, 'Entity type is required')
});

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required')
});

const taskIdSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required')
});

const databaseIdSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required')
});

const taskActivitySchema = z.object({
  action: z.enum(['created', 'updated', 'completed', 'assigned', 'commented']),
  workspaceId: z.string().min(1),
  taskName: z.string().optional(),
  changes: z
    .array(
      z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown(),
        fieldType: z.string()
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const databaseActivitySchema = z.object({
  action: z.enum(['created', 'updated', 'deleted']),
  workspaceId: z.string().min(1),
  databaseName: z.string().optional(),
  changes: z
    .array(
      z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown(),
        fieldType: z.string()
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Core activity operations
router.post('/', validateBody(CreateActivityRequestSchema), createActivityController);

router.get('/', validateQuery(ActivityQueryOptionsSchema), getActivitiesController);

router.get('/feed', getRecentActivityFeedController);

router.get('/summary', getUserActivitySummaryController);

router.get('/analytics', getActivityAnalyticsController);

router.get('/:id', validateParams(activityIdSchema), getActivityByIdController);

// Version history
router.get(
  '/history/:entityType/:entityId',
  validateParams(entityParamsSchema),
  getVersionHistoryController
);

// Workspace activity overview
router.get(
  '/workspace/:workspaceId/overview',
  validateParams(workspaceIdSchema),
  requireWorkspaceAccess('member'),
  getWorkspaceActivityOverviewController
);

// Specialized activity recording
router.post(
  '/task/:taskId',
  validateParams(taskIdSchema),
  validateBody(taskActivitySchema),
  recordTaskActivityController
);

router.post(
  '/database/:databaseId',
  validateParams(databaseIdSchema),
  validateBody(databaseActivitySchema),
  recordDatabaseActivityController
);

// Audit Trail Routes
router.get(
  '/audit/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  requireWorkspaceAccess('admin'), // Audit access requires admin role
  validateQuery(
    z.object({
      entityId: z.string().optional(),
      entityType: z.string().optional(),
      userId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      includeSystemEvents: z.string().optional()
    })
  ),
  generateAuditTrailController
);

router.get(
  '/security/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  requireWorkspaceAccess('admin'), // Security events require admin role
  validateQuery(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      severity: z.string().optional(),
      limit: z.string().optional()
    })
  ),
  getSecurityEventsController
);

router.get(
  '/compliance/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  requireWorkspaceAccess('admin'), // Compliance reports require admin role
  validateQuery(
    z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).optional()
    })
  ),
  getComplianceReportController
);

router.get(
  '/export/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  requireWorkspaceAccess('admin'), // Export requires admin role
  validateQuery(
    z.object({
      format: z.enum(['json', 'csv']).optional(),
      type: z.enum(['audit', 'security', 'compliance']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    })
  ),
  exportAuditDataController
);

router.get(
  '/heatmap/:workspaceId',
  validateParams(z.object({ workspaceId: z.string().min(1) })),
  requireWorkspaceAccess('member'), // Heatmap accessible to members
  validateQuery(
    z.object({
      period: z.enum(['day', 'week', 'month']).optional()
    })
  ),
  getActivityHeatmapController
);

export default router;
