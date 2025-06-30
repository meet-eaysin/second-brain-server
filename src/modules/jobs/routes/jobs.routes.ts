import express from 'express';
import * as jobController from '../controllers/jobs.controllers';
import {apiLimiter} from "../../../config/rateLimiter";
import {authorize, protect} from "../../../middlewares/auth";
import {validateJobCreate, validateJobUpdate} from "../validators/jobs.validators";

const router = express.Router();

if (process.env.NODE_ENV === 'production') {
    router.use(apiLimiter);
}

router.get('/', protect, jobController.getJobs);
router.get('/search', protect, jobController.searchJobs);
router.get('/active', protect, jobController.getActiveJobs);
router.get('/type/:type', protect, jobController.getJobsByEmploymentType);
router.get('/:id', jobController.getJob);

router.get('/organizations/:id/jobs', protect, jobController.getOrganizationJobs);
router.get('/concerns/:id/jobs', protect, jobController.getConcernJobs);
router.get('/departments/:id/jobs', protect, jobController.getDepartmentJobs);
router.get('/teams/:id/jobs', protect, jobController.getTeamJobs);

router.use(protect);

router
    .route('/')
    .post(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin', 'team-admin'),
        // validateJobCreate,
        jobController.createJob
    );

router
    .route('/:id')
    .put(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin', 'team-admin'),
        // validateJobUpdate,
        jobController.updateJob
    )
    .delete(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin'),
        jobController.deleteJob
    );

export default router;