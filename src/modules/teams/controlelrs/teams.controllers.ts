import { Request, Response } from 'express';
import * as teamService from '../services/teams.services';
import {asyncHandler} from "../../../middlewares/errorHandler";
import {sendResponse} from "../../../utils/responseHandler";

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private/Admin
 */
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.createTeam(req.body);

    sendResponse(res, 201, team, 'Team created successfully');
});

/**
 * @desc    Get all teams with pagination
 * @route   GET /api/teams
 * @access  Private
 */
export const getTeams = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Build filter query
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

    const { teams, total, page: currentPage, limit: itemsPerPage } =
        await teamService.getTeams(filterQuery, page, limit);

    const totalPages = Math.ceil(total / limit);

    sendResponse(
        res,
        200,
        teams,
        'Teams fetched successfully',
        {
            page: currentPage,
            limit: itemsPerPage,
            totalPages,
            totalResults: total
        }
    );
});

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.getTeamById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    sendResponse(res, 200, team, 'Team fetched successfully');
});

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private/Admin
 */
export const updateTeam = asyncHandler(async (req: Request<{id: string}>, res: Response) => {
    const team = await teamService.updateTeam(req.params.id, req.body);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    sendResponse(res, 200, team, 'Team updated successfully');
});

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private/Admin
 */
export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.deleteTeam(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    sendResponse(res, 200, null, 'Team deleted successfully');
});

/**
 * @desc    Search teams
 * @route   GET /api/teams/search
 * @access  Private
 */
export const searchTeams = asyncHandler(async (req: Request, res: Response) => {
    const keyword = req.query.q as string;

    if (!keyword) {
        res.status(400);
        throw new Error('Search keyword is required');
    }

    const teams = await teamService.searchTeams(keyword);

    sendResponse(res, 200, teams, 'Search results fetched successfully');
});

/**
 * @desc    Get teams by organization ID
 * @route   GET /api/organizations/:id/teams
 * @access  Private
 */
export const getOrganizationTeams = asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamService.getTeamsByOrganization(req.params.id);

    sendResponse(res, 200, teams, 'Organization teams fetched successfully');
});

/**
 * @desc    Get teams by concern ID
 * @route   GET /api/concerns/:id/teams
 * @access  Private
 */
export const getConcernTeams = asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamService.getTeamsByConcern(req.params.id);

    sendResponse(res, 200, teams, 'Concern teams fetched successfully');
});

/**
 * @desc    Get teams by department ID
 * @route   GET /api/departments/:id/teams
 * @access  Private
 */
export const getDepartmentTeams = asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamService.getTeamsByDepartment(req.params.id);

    sendResponse(res, 200, teams, 'Department teams fetched successfully');
});