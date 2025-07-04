import express from 'express';
import authRoutes from "../modules/auth/routes/auth.routes";
import usersRoutes from "../modules/users/routes/users.routes";
import swaggerRoute from "./swagger.route";

const router = express.Router();

router.use('/docs', swaggerRoute)
// Module routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);


export default router;