import { Request, Response } from 'express';
import * as jobService from '../services/jobs.services';
import {asyncHandler} from "../../../middlewares/errorHandler";
import {sendResponse} from "../../../utils/responseHandler";

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private/Admin
 */
export const createJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.createJob(req.body);

    sendResponse(res, 201, job, 'Job created successfully');
});

/**
 * @desc    Get all jobs with pagination
 * @route   GET /api/jobs
 * @access  Public/Private
 */
export const getJobs = asyncHandler(async (req: Request, res: Response) => {
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

    if (req.query.departmentId) {
        filterQuery.departmentId = req.query.departmentId;
    }

    if (req.query.teamId) {
        filterQuery.teamId = req.query.teamId;
    }

    if (req.query.employmentType) {
        filterQuery.employmentType = req.query.employmentType;
    }

    const { jobs, total, page: currentPage, limit: itemsPerPage } =
        await jobService.getJobs(filterQuery, page, limit);

    const totalPages = Math.ceil(total / limit);

    sendResponse(
        res,
        200,
        jobs,
        'Jobs fetched successfully',
        {
            page: currentPage,
            limit: itemsPerPage,
            totalPages,
            totalResults: total
        }
    );
});

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:id
 * @access  Public/Private
 */
export const getJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.getJobById(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    sendResponse(res, 200, job, 'Job fetched successfully');
});

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:id
 * @access  Private/Admin
 */
export const updateJob = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const job = await jobService.updateJob(req.params.id, req.body);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    sendResponse(res, 200, job, 'Job updated successfully');
});

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:id
 * @access  Private/Admin
 */
export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.deleteJob(req.params.id);

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    sendResponse(res, 200, null, 'Job deleted successfully');
});

/**
 * @desc    Search jobs
 * @route   GET /api/jobs/search
 * @access  Public/Private
 */
export const searchJobs = asyncHandler(async (req: Request, res: Response) => {
    const keyword = req.query.q as string;

    if (!keyword) {
        res.status(400);
        throw new Error('Search keyword is required');
    }

    const jobs = await jobService.searchJobs(keyword);

    sendResponse(res, 200, jobs, 'Search results fetched successfully');
});

/**
 * @desc    Get jobs by organization ID
 * @route   GET /api/organizations/:id/jobs
 * @access  Public/Private
 */
export const getOrganizationJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getJobsByOrganization(req.params.id);

    sendResponse(res, 200, jobs, 'Organization jobs fetched successfully');
});

/**
 * @desc    Get jobs by concern ID
 * @route   GET /api/concerns/:id/jobs
 * @access  Public/Private
 */
export const getConcernJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getJobsByConcern(req.params.id);

    sendResponse(res, 200, jobs, 'Concern jobs fetched successfully');
});

/**
 * @desc    Get jobs by department ID
 * @route   GET /api/departments/:id/jobs
 * @access  Public/Private
 */
export const getDepartmentJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getJobsByDepartment(req.params.id);

    sendResponse(res, 200, jobs, 'Department jobs fetched successfully');
});

/**
 * @desc    Get jobs by team ID
 * @route   GET /api/teams/:id/jobs
 * @access  Public/Private
 */
export const getTeamJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getJobsByTeam(req.params.id);

    sendResponse(res, 200, jobs, 'Team jobs fetched successfully');
});

/**
 * @desc    Get jobs by employment type
 * @route   GET /api/jobs/type/:type
 * @access  Public/Private
 */
export const getJobsByEmploymentType = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getJobsByEmploymentType(req.params.type);

    sendResponse(res, 200, jobs, 'Jobs by employment type fetched successfully');
});

/**
 * @desc    Get active jobs
 * @route   GET /api/jobs/active
 * @access  Public/Private
 */
export const getActiveJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobService.getActiveJobs();

    sendResponse(res, 200, jobs, 'Active jobs fetched successfully');
});