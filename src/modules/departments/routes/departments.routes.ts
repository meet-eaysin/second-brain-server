import express from 'express';
import * as departmentController from '../controllers/departments.controllers';
import {apiLimiter} from "../../../config/rateLimiter";
import {authorize, protect} from "../../../middlewares/auth";
import {validateDepartmentCreate, validateDepartmentUpdate} from "../validators/departments.validators";

const router = express.Router();

if (process.env.NODE_ENV === 'production') {
    router.use(apiLimiter);
}

router
    .route('/')
    .post(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin'),
        // validateDepartmentCreate,
        departmentController.createDepartment
    )
    .get(protect, departmentController.getDepartments);

router.get('/search', protect, departmentController.searchDepartments);

router
    .route('/:id')
    .get(protect, departmentController.getDepartment)
    .put(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin', 'dept-admin'),
        // validateDepartmentUpdate,
        departmentController.updateDepartment
    )
    .delete(
        protect,
        authorize('super-admin', 'org-admin', 'concern-admin'),
        departmentController.deleteDepartment
    );

router.get('/organizations/:id/departments', protect, departmentController.getOrganizationDepartments);

// Get departments by concern
router.get('/concerns/:id/departments', protect, departmentController.getConcernDepartments);

export default router;