import express from 'express';
import { auth, users, database } from '../modules';
import swaggerRoute from './swagger.route';

const router = express.Router();

router.use('/docs', swaggerRoute);

router.use('/auth', auth.authRoutes);
router.use('/users', users.usersRoutes);
router.use('/databases', database.databaseRoutes);

export default router;
