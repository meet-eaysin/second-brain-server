import express from 'express';
import authRoutes from "../modules/auth/routes/auth.routes";
import postRoutes from "../modules/linkedin/routes/linkedin.routes";

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API is running' });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/api/posts', postRoutes);

export default router;