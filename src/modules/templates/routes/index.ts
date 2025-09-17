import { Router } from 'express';
import templateRoutes from './templates.routes';
import templateBuilderRoutes from './template-builder.routes';

const router = Router();

router.use('/', templateRoutes);
router.use('/', templateBuilderRoutes);

export default router;
