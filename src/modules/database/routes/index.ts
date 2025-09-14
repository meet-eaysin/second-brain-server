import { Router } from 'express';
import databaseRoutes from './database.routes';
import viewsRoutes from './views.routes';
import propertiesRoutes from './properties.routes';
import recordsRoutes from './records.routes';
import blocksRoutes from './blocks.routes';
import relationRoutes from './relation.routes';
import richEditorRoutes from '@/modules/editor/routes/rich-editor.routes';
import habitsRoutes from '../../second-brain/habits/routes/habits.routes';
import journalRoutes from '../../second-brain/journal/routes/journal.routes';
import crossModuleRelationsRoutes from '@/modules/modules/routes/cross-module-relations.routes';
import relationAnalyticsRoutes from '@/modules/modules/routes/relation-analytics.routes';

import formulasRoutes from '@/modules/formulas/routes/formulas.routes';

const router = Router();

router.use('/', databaseRoutes);
router.use('/', viewsRoutes);
router.use('/', propertiesRoutes);
router.use('/', recordsRoutes);
router.use('/', blocksRoutes);
router.use('/', relationRoutes);
router.use('/editor', richEditorRoutes);
router.use('/', habitsRoutes);
router.use('/', journalRoutes);
router.use('/', crossModuleRelationsRoutes);
router.use('/', relationAnalyticsRoutes);
router.use('/', formulasRoutes);

export default router;
