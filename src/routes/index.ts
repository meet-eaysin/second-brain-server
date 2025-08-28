import express from 'express';
import { auth, users } from '../modules';
import { emailRoutes } from '../modules/email';
import databaseRoutes from '@/modules/database/routes';
import { dashboardRoutes, modulesRoutes, systemRoutes, tasksRoutes, notesRoutes, goalsRoutes, financeRoutes, peopleRoutes, projectsRoutes, resourcesRoutes, paraRoutes, moodRoutes, contentRoutes } from '../modules/second-brain';
import calendarRoutes from '@/modules/calendar/routes/calendar.routes';
import searchRoutes from '@/modules/search/routes/search.routes';
import workspaceRoutes from '@/modules/workspace/routes/workspace.routes';
import permissionRoutes from '../modules/permissions/routes';
import templateRoutes from '@/modules/templates/routes';
import swaggerRoute from './swagger.route';

const router = express.Router();

router.use('/docs', swaggerRoute);
router.use('/auth', auth.authRoutes);
router.use('/users', users.usersRoutes);

router.use('/email', emailRoutes);

// Workspace management
router.use('/workspaces', workspaceRoutes);

// Permission management
router.use('/', permissionRoutes);

router.use('/modules', modulesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);
router.use('/tasks', tasksRoutes);
router.use('/notes', notesRoutes);
router.use('/goals', goalsRoutes);
router.use('/finance', financeRoutes);
router.use('/people', peopleRoutes);
router.use('/projects', projectsRoutes);
router.use('/resources', resourcesRoutes);
router.use('/para', paraRoutes);
router.use('/mood', moodRoutes);
router.use('/content', contentRoutes);
router.use('/calendar', calendarRoutes);
router.use('/search', searchRoutes);
router.use('/templates', templateRoutes);
router.use('/databases', databaseRoutes);

export default router;
