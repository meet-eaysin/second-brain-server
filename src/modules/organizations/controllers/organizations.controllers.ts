import { Request, Response } from 'express';
import { asyncHandler } from '../../../middlewares/errorHandler';
import * as organizationService from '../services/organization.services';
import { sendResponse } from '../../../utils/responseHandler';

/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private/Admin
 */
export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body);
  
  sendResponse(res, 201, organization, 'Organization created successfully');
});

/**
 * @desc    Get all organizations with pagination
 * @route   GET /api/organizations
 * @access  Private
 */
export const getOrganizations = asyncHandler(async (req: Request, res: Response) => {
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
  
  const { organizations, total, page: currentPage, limit: itemsPerPage } = 
    await organizationService.getOrganizations(filterQuery, page, limit);
  
  const totalPages = Math.ceil(total / limit);
  
  sendResponse(
    res, 
    200, 
    organizations, 
    'Organizations fetched successfully',
    {
      page: currentPage,
      limit: itemsPerPage,
      totalPages,
      totalResults: total
    }
  );
});

/**
 * @desc    Get organization by ID
 * @route   GET /api/organizations/:id
 * @access  Private
 */
export const getOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.getOrganizationById(req.params.id);
  
  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }
  
  sendResponse(res, 200, organization, 'Organization fetched successfully');
});

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id
 * @access  Private/Admin
 */
export const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.updateOrganization(req.params.id, req.body);
  
  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }
  
  sendResponse(res, 200, organization, 'Organization updated successfully');
});

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Private/Admin
 */
export const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.deleteOrganization(req.params.id);
  
  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }
  
  sendResponse(res, 200, null, 'Organization deleted successfully');
});

/**
 * @desc    Search organizations
 * @route   GET /api/organizations/search
 * @access  Private
 */
export const searchOrganizations = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.q as string;
  
  if (!keyword) {
    res.status(400);
    throw new Error('Search keyword is required');
  }
  
  const organizations = await organizationService.searchOrganizations(keyword);
  
  sendResponse(res, 200, organizations, 'Search results fetched successfully');
});