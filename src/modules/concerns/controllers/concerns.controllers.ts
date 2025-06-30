import { Request, Response } from 'express';
import * as concernService from '../services/concerns.services';
import {sendResponse} from "../../../utils/responseHandler";
import {asyncHandler} from "../../../middlewares/errorHandler";

/**
 * @desc    Create a new concern
 * @route   POST /api/concerns
 * @access  Private/Admin
 */
export const createConcern = asyncHandler(async (req: Request, res: Response) => {
    console.log("controller calling")
    const concern = await concernService.createConcern(req.body);

    sendResponse(res, 201, concern, 'Concern created successfully');
});

/**
 * @desc    Get all concerns with pagination
 * @route   GET /api/concerns
 * @access  Private
 */
export const getConcerns = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Build filter query
    const filterQuery: any = {};

    if (req.query.isActive) {
        filterQuery.isActive = req.query.isActive === 'true';
    }

    if (req.query.industry) {
        filterQuery.industry = req.query.industry;
    }

    if (req.query.organizationId) {
        filterQuery.organizationId = req.query.organizationId;
    }

    const { concerns, total, page: currentPage, limit: itemsPerPage } =
        await concernService.getConcerns(filterQuery, page, limit);

    const totalPages = Math.ceil(total / limit);

    sendResponse(
        res,
        200,
        concerns,
        'Concerns fetched successfully',
        {
            page: currentPage,
            limit: itemsPerPage,
            totalPages,
            totalResults: total
        }
    );
});

/**
 * @desc    Get concern by ID
 * @route   GET /api/concerns/:id
 * @access  Private
 */
export const getConcern = asyncHandler(async (req: Request, res: Response) => {
    const concern = await concernService.getConcernById(req.params.id);

    if (!concern) {
        res.status(404);
        throw new Error('Concern not found');
    }

    sendResponse(res, 200, concern, 'Concern fetched successfully');
});

/**
 * @desc    Update concern
 * @route   PUT /api/concerns/:id
 * @access  Private/Admin
 */
export const updateConcern = asyncHandler(async (req: Request<{id: string}>, res: Response) => {
    const concern = await concernService.updateConcern(req.params.id, req.body);

    if (!concern) {
        res.status(404);
        throw new Error('Concern not found');
    }

    sendResponse(res, 200, concern, 'Concern updated successfully');
});

/**
 * @desc    Delete concern
 * @route   DELETE /api/concerns/:id
 * @access  Private/Admin
 */
export const deleteConcern = asyncHandler(async (req: Request, res: Response) => {
    const concern = await concernService.deleteConcern(req.params.id);

    if (!concern) {
        res.status(404);
        throw new Error('Concern not found');
    }

    sendResponse(res, 200, null, 'Concern deleted successfully');
});

/**
 * @desc    Search concerns
 * @route   GET /api/concerns/search
 * @access  Private
 */
export const searchConcerns = asyncHandler(async (req: Request, res: Response) => {
    const keyword = req.query.q as string;

    if (!keyword) {
        res.status(400);
        throw new Error('Search keyword is required');
    }

    const concerns = await concernService.searchConcerns(keyword);

    sendResponse(res, 200, concerns, 'Search results fetched successfully');
});

/**
 * @desc    Get concerns by organization ID
 * @route   GET /api/organizations/:id/concerns
 * @access  Private
 */
export const getOrganizationConcerns = asyncHandler(async (req: Request, res: Response) => {
    const concerns = await concernService.getConcernsByOrganization(req.params.id);

    sendResponse(res, 200, concerns, 'Organization concerns fetched successfully');
});