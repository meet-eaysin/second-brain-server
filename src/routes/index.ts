import express from 'express';
import { auth, users, database } from '../modules';
import { workspaceRoutes } from '../modules/workspace';
import { filesRoutes } from '../modules/files';
import swaggerRoute from './swagger.route';
import categoryRoutes from '../modules/database/routes/database-category.routes';
import templatesRoutes from '../modules/database/routes/database-templates.routes';
import searchRoutes from '../modules/search/routes/search.routes';
import analyticsRoutes from '../modules/analytics/routes/analytics.routes';
import tagsRoutes from '../modules/tags/routes/tags.routes';
import notificationsRoutes from '../modules/notifications/routes/notifications.routes';
import taskDocumentViewRoutes from '../modules/second-brain/task/routes/task-document-view.routes';
import taskRoutes from '../modules/second-brain/task/routes/task.routes';
import dashboardRoutes from '../modules/second-brain/dashboard/routes/dashboard.routes';
import databaseDocumentViewRoutes from '../modules/database/routes/database-document-view.routes';

const router = express.Router();

router.use('/docs', swaggerRoute);

router.use('/auth', auth.authRoutes);
router.use('/users', users.usersRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/databases', database.databaseRoutes);
router.use('/categories', categoryRoutes);
router.use('/templates', templatesRoutes);
router.use('/files', filesRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/tags', tagsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/second-brain/tasks', taskRoutes);
router.use('/second-brain', dashboardRoutes);
router.use('/document-views/tasks', taskDocumentViewRoutes);
router.use('/document-views/databases', databaseDocumentViewRoutes);

export default router;