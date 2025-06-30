// src/routes/concerns.routes.ts
import express from 'express';
import * as concernController from '../controllers/concerns.controllers';
import {apiLimiter} from "../../../config/rateLimiter";
import {authorize, protect} from "../../../middlewares/auth";
import {validateConcernCreate, validateConcernUpdate} from "../validators/concerns.validators";

const router = express.Router();

// Apply rate limiting to all concern routes in production
if (process.env.NODE_ENV === 'production') {
    router.use(apiLimiter);
}

router
    .route('/')
    .post(
        // protect,
        // authorize('super-admin', 'org-admin', 'concern-admin'),
        // validateConcernCreate,
        concernController.createConcern
    )
    .get(protect, concernController.getConcerns);

router.get('/search', protect, concernController.searchConcerns);

router
    .route('/:id')
    .get(protect, concernController.getConcern)
    .put(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin'),
        // validateConcernUpdate,
        concernController.updateConcern
    )
    .delete(
        protect,
        authorize('super-admin', 'org-admin'),
        concernController.deleteConcern
    );

// Get concerns by organization
router.get('/organizations/:id/concerns', protect, concernController.getOrganizationConcerns);

export default router;