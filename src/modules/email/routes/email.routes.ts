import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../../middlewares/auth';
import { validateBody } from '../../../middlewares/validation';
import {
  sendTestEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} from '../controllers/email.controller';
import {
  sendTestEmailSchema,
  sendPasswordResetEmailSchema,
  sendWelcomeEmailSchema
} from '../validators/email.validators';

const router = Router();

// Admin-only routes
router.post(
  '/test',
  authenticateToken,
  requireAdmin,
  validateBody(sendTestEmailSchema),
  sendTestEmail
);

// Internal service routes (used by other modules)
router.post(
  '/password-reset',
  validateBody(sendPasswordResetEmailSchema),
  sendPasswordResetEmail
);

router.post(
  '/welcome',
  validateBody(sendWelcomeEmailSchema),
  sendWelcomeEmail
);

export default router;
