import { Person } from '../models/person.model';
import { PersonDocumentView } from '../models/person-document-view.model';
import { peopleConfigService } from './person-config.service';

// Dynamic person properties - fetched from configuration service
export const getDefaultPeopleProperties = async () => {
    return await peopleConfigService.getDefaultProperties();
};

// Dynamic person views - fetched from configuration service
export const getDefaultPeopleViews = async () => {
    return await peopleConfigService.getDefaultViews();
};

// Dynamic frozen configuration - fetched from configuration service
export const getPeopleFrozenConfig = async () => {
    return await peopleConfigService.getFrozenConfig();
};

// Backend configuration for people document views - now dynamic
export const getPeopleViewConfig = async () => {
    // Fetch dynamic configuration from the config service
    return await peopleConfigService.getModuleConfig();
};

// Get user's people views
export const getUserPeopleViews = async (userId: string) => {
    try {
        const views = await PersonDocumentView.find({
            createdBy: userId,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 });

        const config = await getPeopleViewConfig();

        // Combine user views with default views
        const defaultViews = config.defaultViews.map((view: any) => ({
            ...view,
            createdBy: userId,
            databaseId: 'people-main-db',
            frozenProperties: config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [],
            isSystemView: true
        }));

        return [...defaultViews, ...views];
    } catch (error) {
        console.error('Error fetching people views:', error);
        throw error;
    }
};

// Get specific people view
export const getPeopleView = async (viewId: string, userId: string) => {
    try {
        // Check if it's a default view
        const config = await getPeopleViewConfig();
        const defaultView = config.defaultViews.find((view: any) => view.id === viewId);

        if (defaultView) {
            return {
                ...defaultView,
                createdBy: userId,
                databaseId: 'people-main-db',
                frozenProperties: config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [],
                isSystemView: true
            };
        }

        // Look for user-created view
        const view = await PersonDocumentView.findOne({
            _id: viewId,
            createdBy: userId,
            isDeleted: { $ne: true }
        });

        if (!view) {
            throw new Error('People view not found');
        }

        return view;
    } catch (error) {
        console.error('Error fetching people view:', error);
        throw error;
    }
};

// Get default people view
export const getDefaultPeopleView = async (userId: string) => {
    try {
        const config = await getPeopleViewConfig();
        const defaultView = config.defaultViews.find((view: any) => view.isDefault);

        if (!defaultView) {
            throw new Error('No default people view found');
        }

        return {
            ...defaultView,
            createdBy: userId,
            databaseId: 'people-main-db',
            frozenProperties: config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [],
            isSystemView: true
        };
    } catch (error) {
        console.error('Error fetching default people view:', error);
        throw error;
    }
};

// Create new people view
export const createPeopleView = async (userId: string, databaseId: string, viewData: any) => {
    try {
        const config = await getPeopleViewConfig();

        // Extract frozen properties safely
        const frozenProperties = config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [];

        const newView = new PersonDocumentView({
            ...viewData,
            createdBy: userId,
            databaseId: databaseId || 'people-main-db',
            frozenProperties,
            isSystemView: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newView.save();
        return newView;
    } catch (error) {
        console.error('Error creating people view:', error);
        throw error;
    }
};

// Update people view
export const updatePeopleView = async (viewId: string, userId: string, updates: any) => {
    try {
        // Don't allow updating system views
        const view = await PersonDocumentView.findOne({
            _id: viewId,
            createdBy: userId,
            isSystemView: { $ne: true },
            isDeleted: { $ne: true }
        });

        if (!view) {
            return null;
        }

        Object.assign(view, updates, { updatedAt: new Date() });
        await view.save();

        return view;
    } catch (error) {
        console.error('Error updating people view:', error);
        throw error;
    }
};

// Delete people view
export const deletePeopleView = async (viewId: string, userId: string) => {
    try {
        // Don't allow deleting system views
        const view = await PersonDocumentView.findOne({
            _id: viewId,
            createdBy: userId,
            isSystemView: { $ne: true },
            isDeleted: { $ne: true }
        });

        if (!view) {
            return null;
        }

        // Soft delete
        view.isDeleted = true;
        view.deletedAt = new Date();
        await view.save();

        return view;
    } catch (error) {
        console.error('Error deleting people view:', error);
        throw error;
    }
};

// Add property to people view
export const addPeopleProperty = async (viewId: string, userId: string, property: any) => {
    try {
        // Check if it's a default view (like 'all-people') by checking if it's not a valid ObjectId
        const isDefaultView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (isDefaultView) {
            // For default views, create a new custom view with the additional property
            // Generate unique property ID
            const propertyId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

            // Create new custom view based on the default view structure
            const customViewData = {
                name: `Custom People View`,
                type: 'TABLE',
                isDefault: false,
                isSystemView: false,
                filters: [],
                sorts: [{ propertyId: 'lastName', direction: 'asc' }],
                visibleProperties: ['firstName', 'lastName', 'email', 'phone', 'company', 'relationship', propertyId],
                databaseId: 'people-main-db'
            };

            const newView = await createPeopleView(userId, 'people-main-db', customViewData);

            // Return the new view with property information
            return {
                ...newView.toObject(),
                message: `Created new custom view with property "${property.name}"`,
                customProperties: [{
                    id: propertyId,
                    name: property.name,
                    type: property.type || 'TEXT',
                    description: property.description || '',
                    required: property.required || false,
                    order: property.order || 6,
                    isVisible: true,
                    frozen: false,
                    selectOptions: property.selectOptions || undefined
                }]
            };
        } else {
            // For custom views, add property normally
            const currentView = await getPeopleView(viewId, userId);
            if (!currentView) {
                throw new Error('People view not found');
            }

            // Generate unique property ID
            const propertyId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

            // Add to visible properties if not already there
            const updatedVisibleProperties = currentView.visibleProperties
                ? [...currentView.visibleProperties, propertyId]
                : [propertyId];

            // Update the view with new property
            const view = await updatePeopleView(viewId, userId, {
                visibleProperties: updatedVisibleProperties,
                updatedAt: new Date()
            });

            return {
                ...view.toObject(),
                message: `Added property "${property.name}" to view`,
                customProperties: [{
                    id: propertyId,
                    name: property.name,
                    type: property.type || 'TEXT',
                    description: property.description || '',
                    required: property.required || false,
                    order: property.order || (currentView.visibleProperties?.length || 0),
                    isVisible: true,
                    frozen: false,
                    selectOptions: property.selectOptions || undefined
                }]
            };
        }
    } catch (error) {
        console.error('Error adding property to people view:', error);
        throw error;
    }
};

// Update people view properties
export const updatePeopleViewProperties = async (viewId: string, userId: string, properties: any[]) => {
    try {
        const config = await getPeopleViewConfig();

        // Validate property updates against backend rules
        const validatedProperties = properties.map(prop => {
            const isRequired = config?.requiredProperties?.includes(prop.propertyId) || false;
            const frozenProp = config?.frozenConfig?.frozenProperties?.find((fp: any) => fp.propertyId === prop.propertyId);

            if (isRequired || frozenProp) {
                // Enforce backend rules for required/frozen properties
                return {
                    ...prop,
                    visible: isRequired ? true : prop.visible, // Required properties must be visible
                    frozen: frozenProp ? !frozenProp.allowHide : prop.frozen, // Respect frozen state
                };
            }

            // Allow full customization for non-required properties
            return prop;
        });

        const view = await updatePeopleView(viewId, userId, {
            properties: validatedProperties,
            updatedAt: new Date()
        });

        return view;
    } catch (error) {
        console.error('Error updating people view properties:', error);
        throw error;
    }
};

// Update people view filters
export const updatePeopleViewFilters = async (viewId: string, userId: string, filters: any[]) => {
    try {
        const view = await updatePeopleView(viewId, userId, {
            filters,
            updatedAt: new Date()
        });

        return view;
    } catch (error) {
        console.error('Error updating people view filters:', error);
        throw error;
    }
};

// Update people view sorts
export const updatePeopleViewSorts = async (viewId: string, userId: string, sorts: any[]) => {
    try {
        const view = await updatePeopleView(viewId, userId, {
            sorts,
            updatedAt: new Date()
        });

        return view;
    } catch (error) {
        console.error('Error updating people view sorts:', error);
        throw error;
    }
};

// Duplicate people view
export const duplicatePeopleView = async (viewId: string, userId: string, newName?: string) => {
    try {
        const originalView = await getPeopleView(viewId, userId);

        if (!originalView) {
            throw new Error('Original view not found');
        }

        const duplicatedView = {
            ...originalView,
            name: newName || `${originalView.name} (Copy)`,
            isDefault: false,
            isSystemView: false
        };

        // Remove fields that shouldn't be copied
        delete duplicatedView._id;
        delete duplicatedView.id;
        delete duplicatedView.createdAt;
        delete duplicatedView.updatedAt;

        return await createPeopleView(userId, originalView.databaseId, duplicatedView);
    } catch (error) {
        console.error('Error duplicating people view:', error);
        throw error;
    }
};
