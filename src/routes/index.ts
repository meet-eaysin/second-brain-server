import express from 'express';
import { auth, users, database } from '../modules';
import swaggerRoute from './swagger.route';
import categoryRoutes from '../modules/database/routes/database-category.routes';
import templatesRoutes from '../modules/database/routes/database-templates.routes';

const router = express.Router();

router.use('/docs', swaggerRoute);

router.use('/auth', auth.authRoutes);
router.use('/users', users.usersRoutes);
router.use('/databases', database.databaseRoutes);
router.use('/categories', categoryRoutes);
router.use('/templates', templatesRoutes);

export default router;
