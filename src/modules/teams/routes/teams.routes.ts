import express from 'express';
import {authorize, protect} from "../../../middlewares/auth";
import {apiLimiter} from "../../../config/rateLimiter";
import * as teamController from "../controlelrs/teams.controllers"

const router = express.Router();

// Apply rate limiting to all team routes in production
if (process.env.NODE_ENV === 'production') {
    router.use(apiLimiter);
}

router
    .route('/')
    .post(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin', 'team-admin'),
        // validateTeamCreate,
        teamController.createTeam
    )
    .get(protect, teamController.getTeams);

router.get('/search', protect, teamController.searchTeams);

router
    .route('/:id')
    .get(protect, teamController.getTeam)
    .put(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin', 'team-admin'),
        // validateTeamUpdate,
        teamController.updateTeam
    )
    .delete(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin'),
        teamController.deleteTeam
    );

// Get teams by organization
router.get('/organizations/:id/teams', protect, teamController.getOrganizationTeams);

// Get teams by concern
router.get('/concerns/:id/teams', protect, teamController.getConcernTeams);

// Get teams by department
router.get('/departments/:id/teams', protect, teamController.getDepartmentTeams);

export default router;