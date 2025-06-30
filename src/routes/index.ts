import express from 'express';
import organizationRoutes from '../modules/organizations/routes/organizations.routes';
import jobRoutes from '../modules/jobs/routes/jobs.routes';
import teamRoutes from '../modules/teams/routes/teams.routes';
import concernRoutes from '../modules/concerns/routes/concerns.routes';
import departmentRoutes from "../modules/departments/routes/departments.routes";
// import userRoutes from '../modules/users/routes';
// import concernRoutes from '../modules/concerns/routes';
// import departmentRoutes from '../modules/departments/routes';
// import contactRoutes from '../modules/contacts/routes';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API is running' });
});

// Module routes
router.use('/organizations', organizationRoutes);
router.use('/concerns', concernRoutes);
router.use('/departments', departmentRoutes);
router.use('/teams', teamRoutes);
router.use('/jobs', jobRoutes);
// router.use('/users', userRoutes);
// router.use('/contacts', contactRoutes);

export default router;