import { Router } from 'express';
import templateRoutes from './templates.routes';

const router = Router();

router.use('/', templateRoutes);

export default router;
