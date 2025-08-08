import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';

// Import services
import {
    getPeopleViewConfig,
    getUserPeopleViews,
    getPeopleView,
    getDefaultPeopleView,
    createPeopleView,
    updatePeopleView,
    deletePeopleView,
    updatePeopleViewProperties,
    updatePeopleViewFilters,
    updatePeopleViewSorts,
    duplicatePeopleView,
    addPeopleProperty,
    updatePeopleCustomProperty,
    deletePeopleCustomProperty,
    getDefaultPeopleProperties,
    getDefaultPeopleViews,
    getPeopleFrozenConfig
} from '../services/person-document-view.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get people document-view configuration
export const getPeopleConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const config = await getPeopleViewConfig();

    sendSuccessResponse(res, config, 'People configuration retrieved successfully');
});

// Get default people properties
export const getDefaultPeoplePropertiesHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultPeopleProperties();

    sendSuccessResponse(res, properties, 'Default people properties retrieved successfully');
});

// Get default people views
export const getDefaultPeopleViewsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const views = await getDefaultPeopleViews();

    sendSuccessResponse(res, views, 'Default people views retrieved successfully');
});

// Get people frozen configuration
export const getPeopleFrozenConfigHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const frozenConfig = await getPeopleFrozenConfig();

    sendSuccessResponse(res, frozenConfig, 'People frozen configuration retrieved successfully');
});

// Get all people views for user
export const getPeopleViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const views = await getUserPeopleViews(userId);

    sendSuccessResponse(res, views, 'People views retrieved successfully');
});

// Get default people view
export const getDefaultPeopleViewHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const defaultView = await getDefaultPeopleView(userId);

    if (!defaultView) {
        sendErrorResponse(res, 'Default people view not found', 404);
        return;
    }

    sendSuccessResponse(res, defaultView, 'Default people view retrieved successfully');
});

// Get specific people view by ID
export const getPeopleViewById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const view = await getPeopleView(viewId, userId);

    if (!view) {
        sendErrorResponse(res, 'People view not found', 404);
        return;
    }

    sendSuccessResponse(res, view, 'People view retrieved successfully');
});

// Create new people view
export const createPeopleViewHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { databaseId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const viewData = {
        ...req.body,
        databaseId: databaseId || 'people-main-db'
    };

    const newView = await createPeopleView(userId, viewData.databaseId, viewData);

    sendSuccessResponse(res, newView, 'People view created successfully', 201);
});

// Update people view
export const updatePeopleViewHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await updatePeopleView(viewId, userId, req.body);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'People view updated successfully');
});

// Delete people view
export const deletePeopleViewHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const deletedView = await deletePeopleView(viewId, userId);

    if (!deletedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, null, 'People view deleted successfully', 204);
});

// Add property to people view
export const addPeoplePropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { property } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const updatedView = await addPeopleProperty(viewId, userId, property);

    sendSuccessResponse(res, updatedView, 'Property added to people view successfully', 201);
});

// Update people view properties
export const updatePeopleViewPropertiesHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { properties } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (!Array.isArray(properties)) {
        sendErrorResponse(res, 'Properties must be an array', 400);
        return;
    }

    const updatedView = await updatePeopleViewProperties(viewId, userId, properties);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'People view properties updated successfully');
});

// Update people view filters
export const updatePeopleViewFiltersHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { filters } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (!Array.isArray(filters)) {
        sendErrorResponse(res, 'Filters must be an array', 400);
        return;
    }

    // Handle fallback view IDs that are not real MongoDB ObjectIds
    if (viewId === 'all-people' || viewId === 'default' || !viewId.match(/^[0-9a-fA-F]{24}$/)) {
        // For fallback views, we can't update filters directly
        // Instead, return the filters as applied (not persisted)
        sendSuccessResponse(res, {
            id: viewId,
            filters: filters || [],
            message: 'Filters applied to fallback view (not persisted)'
        }, 'View filters applied successfully');
        return;
    }

    const updatedView = await updatePeopleViewFilters(viewId, userId, filters);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'People view filters updated successfully');
});

// Update people view sorts
export const updatePeopleViewSortsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { sorts } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    if (!Array.isArray(sorts)) {
        sendErrorResponse(res, 'Sorts must be an array', 400);
        return;
    }

    // Handle fallback view IDs that are not real MongoDB ObjectIds
    if (viewId === 'all-people' || viewId === 'default' || !viewId.match(/^[0-9a-fA-F]{24}$/)) {
        // For fallback views, we can't update sorts directly
        // Instead, return the sorts as applied (not persisted)
        sendSuccessResponse(res, {
            id: viewId,
            sorts: sorts || [],
            message: 'Sorts applied to fallback view (not persisted)'
        }, 'View sorts applied successfully');
        return;
    }

    const updatedView = await updatePeopleViewSorts(viewId, userId, sorts);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, updatedView, 'People view sorts updated successfully');
});

// Duplicate people view
export const duplicatePeopleViewHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { viewId } = req.params;
    const { name } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const duplicatedView = await duplicatePeopleView(viewId, userId, name);

    sendSuccessResponse(res, duplicatedView, 'People view duplicated successfully', 201);
});

// Record operations following view API pattern
export const getPeopleRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Parse query parameters for filters, sorts, and pagination
    const {
        // Filter parameters
        relationship,
        tags,
        company,
        search,
        needsContact,
        status,

        // Sort parameters
        sortBy,
        sortOrder,
        sorts,

        // Pagination parameters
        page = 1,
        limit = 20,

        // View-specific parameters
        viewId,
        ...otherFilters
    } = req.query;

    // Build filters object
    const filters: any = {};

    if (relationship) filters.relationship = Array.isArray(relationship) ? relationship : [relationship];
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (company) filters.company = company as string;
    if (search) filters.search = search as string;
    if (needsContact === 'true') filters.contactOverdue = true;
    if (status) filters.status = Array.isArray(status) ? status : [status];

    // Add any other filters
    Object.keys(otherFilters).forEach(key => {
        if (otherFilters[key] !== undefined && otherFilters[key] !== null && otherFilters[key] !== '') {
            filters[key] = otherFilters[key];
        }
    });

    // Build sort options
    let sortOptions: any = {};

    if (sorts) {
        // Parse sorts from JSON string if provided
        try {
            const parsedSorts = typeof sorts === 'string' ? JSON.parse(sorts as string) : sorts;
            if (Array.isArray(parsedSorts) && parsedSorts.length > 0) {
                // Convert array of sort objects to MongoDB sort format
                const sortObj: any = {};
                parsedSorts.forEach((sort: any) => {
                    if (sort.propertyId && sort.direction) {
                        sortObj[sort.propertyId] = sort.direction === 'desc' ? -1 : 1;
                    }
                });
                if (Object.keys(sortObj).length > 0) {
                    sortOptions.sort = sortObj;
                }
            }
        } catch (error) {
            console.warn('Failed to parse sorts parameter:', error);
        }
    } else if (sortBy) {
        // Fallback to simple sortBy/sortOrder
        const direction = sortOrder === 'desc' ? -1 : 1;
        sortOptions.sort = { [sortBy as string]: direction };
    }

    // Default sort if none provided
    if (!sortOptions.sort) {
        sortOptions.sort = search ? { score: -1 } : { lastName: 1, firstName: 1 };
    }

    // Build pagination options
    const options = {
        page: Number(page),
        limit: Number(limit),
        ...sortOptions,
        populate: ['projects', 'tasks', 'notes']
    };

    // If viewId is provided, apply view-specific filters and sorts
    if (viewId) {
        try {
            const view = await getPeopleView(viewId as string, userId);
            if (view) {
                // Apply view filters (merge with query filters)
                if (view.filters && view.filters.length > 0) {
                    view.filters.forEach((filter: any) => {
                        if (filter.propertyId && filter.value !== undefined) {
                            // Only apply view filter if not overridden by query parameter
                            if (!filters.hasOwnProperty(filter.propertyId)) {
                                filters[filter.propertyId] = filter.value;
                            }
                        }
                    });
                }

                // Apply view sorts (if no sorts provided in query)
                if (!sorts && !sortBy && view.sorts && view.sorts.length > 0) {
                    const viewSortObj: any = {};
                    view.sorts
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .forEach((sort: any) => {
                            if (sort.propertyId && sort.direction) {
                                viewSortObj[sort.propertyId] = sort.direction === 'desc' ? -1 : 1;
                            }
                        });
                    if (Object.keys(viewSortObj).length > 0) {
                        options.sort = viewSortObj;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to apply view configuration:', error);
        }
    }

    // Delegate to existing person service
    const { getPeople } = await import('../services/person.service');
    const result = await getPeople(userId, filters, options);

    sendSuccessResponse(res, {
        people: result.people,
        pagination: result.pagination,
        appliedFilters: filters,
        appliedSort: options.sort,
        viewId: viewId || null
    }, 'People retrieved successfully');
});

export const createPeopleRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing person service
    const { createPerson } = await import('../services/person.service');
    const result = await createPerson(userId, req.body);

    sendSuccessResponse(res, result, 'Person created successfully', 201);
});

export const getPeopleRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing person service
    const { getPersonById } = await import('../services/person.service');
    const result = await getPersonById(userId, recordId);

    sendSuccessResponse(res, result, 'Person retrieved successfully');
});

export const updatePeopleRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing person service
    const { updatePerson } = await import('../services/person.service');
    const result = await updatePerson(userId, recordId, req.body);

    sendSuccessResponse(res, result, 'Person updated successfully');
});

export const deletePeopleRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { recordId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Delegate to existing person service
    const { deletePerson } = await import('../services/person.service');
    await deletePerson(userId, recordId);

    sendSuccessResponse(res, null, 'Person deleted successfully', 204);
});

// Update custom property
export const updatePeopleCustomPropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await updatePeopleCustomProperty(viewId, userId, propertyId, updates);
    sendSuccessResponse(res, updatedView, 'Custom property updated successfully');
});

// Delete custom property
export const deletePeopleCustomPropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await deletePeopleCustomProperty(viewId, userId, propertyId);
    sendSuccessResponse(res, updatedView, 'Custom property deleted successfully');
});
