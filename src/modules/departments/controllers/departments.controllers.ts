import { Request, Response } from 'express';
import * as departmentService from '../services/departments.services';
import {asyncHandler} from "../../../middlewares/errorHandler";
import {sendResponse} from "../../../utils/responseHandler";

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private/Admin
 */
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.createDepartment(req.body);

    sendResponse(res, 201, department, 'Department created successfully');
});

/**
 * @desc    Get all departments with pagination
 * @route   GET /api/departments
 * @access  Private
 */
export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filterQuery: any = {};

    if (req.query.isActive) {
        filterQuery.isActive = req.query.isActive === 'true';
    }

    if (req.query.organizationId) {
        filterQuery.organizationId = req.query.organizationId;
    }

    if (req.query.concernId) {
        filterQuery.concernId = req.query.concernId;
    }

    const { departments, total, page: currentPage, limit: itemsPerPage } =
        await departmentService.getDepartments(filterQuery, page, limit);

    const totalPages = Math.ceil(total / limit);

    sendResponse(
        res,
        200,
        departments,
        'Departments fetched successfully',
        {
            page: currentPage,
            limit: itemsPerPage,
            totalPages,
            totalResults: total
        }
    );
});

/**
 * @desc    Get department by ID
 * @route   GET /api/departments/:id
 * @access  Private
 */
export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.getDepartmentById(req.params.id);

    if (!department) {
        res.status(404);
        throw new Error('Department not found');
    }

    sendResponse(res, 200, department, 'Department fetched successfully');
});

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private/Admin
 */
export const updateDepartment = asyncHandler(async (req: Request<{id: string}>, res: Response) => {
    const department = await departmentService.updateDepartment(req.params.id, req.body);

    if (!department) {
        res.status(404);
        throw new Error('Department not found');
    }

    sendResponse(res, 200, department, 'Department updated successfully');
});

/**
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private/Admin
 */
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.deleteDepartment(req.params.id);

    if (!department) {
        res.status(404);
        throw new Error('Department not found');
    }

    sendResponse(res, 200, null, 'Department deleted successfully');
});

/**
 * @desc    Search departments
 * @route   GET /api/departments/search
 * @access  Private
 */
export const searchDepartments = asyncHandler(async (req: Request, res: Response) => {
    const keyword = req.query.q as string;

    if (!keyword) {
        res.status(400);
        throw new Error('Search keyword is required');
    }

    const departments = await departmentService.searchDepartments(keyword);

    sendResponse(res, 200, departments, 'Search results fetched successfully');
});

/**
 * @desc    Get departments by organization ID
 * @route   GET /api/organizations/:id/departments
 * @access  Private
 */
export const getOrganizationDepartments = asyncHandler(async (req: Request, res: Response) => {
    const departments = await departmentService.getDepartmentsByOrganization(req.params.id);

    sendResponse(res, 200, departments, 'Organization departments fetched successfully');
});

/**
 * @desc    Get departments by concern ID
 * @route   GET /api/concerns/:id/departments
 * @access  Private
 */
export const getConcernDepartments = asyncHandler(async (req: Request, res: Response) => {
    const departments = await departmentService.getDepartmentsByConcern(req.params.id);

    sendResponse(res, 200, departments, 'Concern departments fetched successfully');
});