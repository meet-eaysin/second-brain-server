import express from 'express';
import authRoutes from "../modules/auth/routes/auth.routes";
import usersRoutes from "../modules/users/routes/users.routes";
import swaggerRoute from "./swagger.route";
import databaseRoutes from "../modules/database/routes/database.routes";

const router = express.Router();

router.use('/docs', swaggerRoute)

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/databases', databaseRoutes);

export default router;