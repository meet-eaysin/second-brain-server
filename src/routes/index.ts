import express from 'express';
import { auth, users, database } from '../modules';
import { workspaceRoutes } from '../modules/workspace';
import { filesRoutes } from '../modules/files';
import { searchRoutes } from '../modules/search';
import { analyticsRoutes } from '../modules/analytics';
import { tagsRoutes } from '../modules/tags';
import { notificationsRoutes } from '../modules/notifications';
import { emailRoutes } from '../modules/email';
import swaggerRoute from './swagger.route';
import categoryRoutes from '../modules/database/routes/database-category.routes';
import templatesRoutes from '../modules/database/routes/database-templates.routes';
import taskRoutes from '../modules/second-brain/task/routes/task.routes';
import noteRoutes from '../modules/second-brain/note/routes/note.routes';
import projectRoutes from '../modules/second-brain/project/routes/project.routes';
import personRoutes from '../modules/second-brain/person/routes/person.routes';
import goalRoutes from '../modules/second-brain/goal/routes/goal.routes';
import bookRoutes from '../modules/second-brain/books/routes/book.routes';
import habitRoutes from '../modules/second-brain/habits/routes/habit.routes';
import journalRoutes from '../modules/second-brain/journal/routes/journal.routes';
import moodRoutes from '../modules/second-brain/mood/routes/mood.routes';
import contentRoutes from '../modules/second-brain/content/routes/content.routes';
import financeRoutes from '../modules/second-brain/finance/routes/finance.routes';
import dashboardRoutes from '../modules/second-brain/dashboard/routes/dashboard.routes';

// Centralized Document View Router
import { createDocumentViewRouter } from '../modules/document-view/routes/document-view.routes';
import { initializeModuleConfigurations } from '../modules/document-view/configs';

// Initialize module configurations
initializeModuleConfigurations();

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
router.use('/email', emailRoutes);
// Second Brain Module Routes
router.use('/second-brain/tasks', taskRoutes);
router.use('/second-brain/people', personRoutes);
router.use('/second-brain/notes', noteRoutes);
router.use('/second-brain/goals', goalRoutes);
router.use('/second-brain/books', bookRoutes);
router.use('/second-brain/habits', habitRoutes);
router.use('/second-brain/projects', projectRoutes);
router.use('/second-brain/journals', journalRoutes);
router.use('/second-brain/moods', moodRoutes);
router.use('/second-brain/content', contentRoutes);
router.use('/second-brain/finance', financeRoutes);
router.use('/second-brain', dashboardRoutes);
// Centralized Document View Routes
router.use('/document-views', createDocumentViewRouter());

export default router;