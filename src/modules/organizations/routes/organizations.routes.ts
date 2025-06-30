import express from 'express';
import * as organizationController from '../controllers/organizations.controllers';
import { protect, authorize } from '../../../middlewares/auth';
import { validateOrganizationCreate, validateOrganizationUpdate } from '../validators/organization.validators';
import { apiLimiter } from '../../../config/rateLimiter';

const router = express.Router();

// Apply rate limiting to all organization routes in production
if (process.env.NODE_ENV === 'production') {
  router.use(apiLimiter);
}

router
  .route('/')
  .post(
    protect,
    authorize('super-admin', 'org-admin'),
    // validateOrganizationCreate,
    organizationController.createOrganization
  )
  .get(protect, organizationController.getOrganizations);

router.get('/search', protect, organizationController.searchOrganizations);

router
  .route('/:id')
  .get(protect, organizationController.getOrganization)
  .put(
    protect,
    authorize('super-admin', 'org-admin'),
    // validateOrganizationUpdate(),
    organizationController.updateOrganization
  )
  .delete(
    protect,
    authorize('super-admin'),
    organizationController.deleteOrganization
  );

export default router;