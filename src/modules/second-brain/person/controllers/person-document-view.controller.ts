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
    insertPeopleProperty,
    duplicatePeopleProperty,
    freezePeopleProperty,
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

    sendSuccessResponse(res, 'People configuration retrieved successfully', config);
});

// Get default people properties
export const getDefaultPeoplePropertiesHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const properties = await getDefaultPeopleProperties();

    sendSuccessResponse(res, 'Default people properties retrieved successfully', properties);
});

// Get default people views
export const getDefaultPeopleViewsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const views = await getDefaultPeopleViews();

    sendSuccessResponse(res, 'Default people views retrieved successfully', views);
});

// Get people frozen configuration
export const getPeopleFrozenConfigHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const frozenConfig = await getPeopleFrozenConfig();

    sendSuccessResponse(res, 'People frozen configuration retrieved successfully', frozenConfig);
});

// Get all people views for user
export const getPeopleViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const views = await getUserPeopleViews(userId);

    sendSuccessResponse(res, 'People views retrieved successfully', views);
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

    sendSuccessResponse(res, 'Default people view retrieved successfully', defaultView);
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

    sendSuccessResponse(res, 'People view retrieved successfully', view);
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

    sendSuccessResponse(res, 'People view created successfully', newView, 201);
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

    sendSuccessResponse(res, 'People view updated successfully', updatedView);
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

    sendSuccessResponse(res, 'People view deleted successfully', null, 204);
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

    sendSuccessResponse(res, 'People view properties updated successfully', updatedView);
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
        sendSuccessResponse(res, 'View filters applied successfully', {
            id: viewId,
            filters: filters || [],
            message: 'Filters applied to fallback view (not persisted)'
        });
        return;
    }

    const updatedView = await updatePeopleViewFilters(viewId, userId, filters);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'People view filters updated successfully', updatedView);
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
        sendSuccessResponse(res, 'View sorts applied successfully', {
            id: viewId,
            sorts: sorts || [],
            message: 'Sorts applied to fallback view (not persisted)'
        });
        return;
    }

    const updatedView = await updatePeopleViewSorts(viewId, userId, sorts);

    if (!updatedView) {
        sendErrorResponse(res, 'People view not found or access denied', 404);
        return;
    }

    sendSuccessResponse(res, 'People view sorts updated successfully', updatedView);
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

    sendSuccessResponse(res, 'People view duplicated successfully', duplicatedView, 201);
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

    sendSuccessResponse(res, 'People retrieved successfully', {
        people: result.people,
        pagination: result.pagination,
        appliedFilters: filters,
        appliedSort: options.sort,
        viewId: viewId || null
    });
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

    sendSuccessResponse(res, 'Person created successfully', result, 201);
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

    sendSuccessResponse(res, 'Person retrieved successfully', result);
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

    sendSuccessResponse(res, 'Person updated successfully', result);
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

    sendSuccessResponse(res, 'Person deleted successfully', null, 204);
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
    sendSuccessResponse(res, 'Custom property updated successfully', updatedView);
});

// Delete custom property
export const deletePeopleCustomPropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await deletePeopleCustomProperty(viewId, userId, propertyId);
    sendSuccessResponse(res, 'Custom property deleted successfully', updatedView);
});

// Insert property
export const insertPeoplePropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const userId = req.user?.userId;
    const insertData = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await insertPeopleProperty(viewId, userId, propertyId, insertData);
    sendSuccessResponse(res, 'Property inserted successfully', updatedView);
});

// Duplicate property
export const duplicatePeoplePropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const updatedView = await duplicatePeopleProperty(viewId, userId, propertyId);
    sendSuccessResponse(res, 'Property duplicated successfully', updatedView);
});

// Freeze property
export const freezePeoplePropertyHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { viewId, propertyId } = req.params;
    const { frozen } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    try {
        const result = await freezePeopleProperty(viewId, userId, propertyId, frozen);
        sendSuccessResponse(res, 'Property freeze status updated successfully', result);
    } catch (error) {
        console.error('Error in freezePeoplePropertyHandler:', error);
        return sendErrorResponse(res, (error as any)?.message || 'Failed to update property freeze status', 500);
    }
});
