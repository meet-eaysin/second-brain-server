import { Router } from 'express';
import permissionRoutes from './permission.routes';

const router = Router();

// Mount permission routes
router.use('/permissions', permissionRoutes);

export default router;
