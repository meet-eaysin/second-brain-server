import { Person } from '../models/person.model';
import { PersonDocumentView } from '../models/person-document-view.model';
import { peopleConfigService } from './person-config.service';

// Database storage for custom properties using PersonDocumentView model
const storeCustomPropertyForView = async (viewId: string, userId: string, property: any) => {
    try {
        // For system views, we'll store custom properties in a special document
        // Use a query-based approach instead of custom _id

        // Check if we already have a custom properties document for this view/user
        let customPropsDoc = await PersonDocumentView.findOne({
            name: `Custom Properties for ${viewId}`,
            createdBy: userId,
            type: 'CUSTOM_PROPERTIES'
        });

        if (!customPropsDoc) {
            // Create a new custom properties document with auto-generated _id
            customPropsDoc = new PersonDocumentView({
                name: `Custom Properties for ${viewId}`,
                type: 'CUSTOM_PROPERTIES',
                isDefault: false,
                isSystemView: false,
                filters: [],
                sorts: [],
                visibleProperties: [],
                customProperties: [],
                createdBy: userId,
                databaseId: 'people-main-db',
                // Add metadata to identify this as a custom properties container
                config: {
                    isCustomPropertiesContainer: true,
                    targetViewId: viewId
                }
            });
        }

        // Add the new property
        if (!customPropsDoc.customProperties) {
            customPropsDoc.customProperties = [];
        }
        customPropsDoc.customProperties.push(property);

        await customPropsDoc.save();

        console.log('🔍 Stored custom property in database:', {
            documentId: customPropsDoc._id,
            targetViewId: viewId,
            property,
            totalPropertiesForView: customPropsDoc.customProperties.length
        });

    } catch (error) {
        console.error('Error storing custom property:', error);
        throw error;
    }
};

const getCustomPropertiesForView = async (viewId: string, userId: string) => {
    try {
        const customPropsDoc = await PersonDocumentView.findOne({
            name: `Custom Properties for ${viewId}`,
            createdBy: userId,
            type: 'CUSTOM_PROPERTIES'
        });

        const properties = customPropsDoc?.customProperties || [];

        console.log('🔍 Retrieved custom properties from database:', {
            documentId: customPropsDoc?._id,
            targetViewId: viewId,
            propertiesCount: properties.length,
            properties
        });

        return properties;
    } catch (error) {
        console.error('Error retrieving custom properties:', error);
        return [];
    }
};

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
        console.log('🔍 getUserPeopleViews called for userId:', userId);

        const views = await PersonDocumentView.find({
            createdBy: userId,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 });

        console.log('🔍 Found user views:', views.length);

        const config = await getPeopleViewConfig();
        console.log('🔍 Got config:', {
            hasConfig: !!config,
            hasDefaultViews: !!config?.defaultViews,
            defaultViewsCount: config?.defaultViews?.length || 0
        });

        // Ensure defaultViews exists
        if (!config || !config.defaultViews || !Array.isArray(config.defaultViews)) {
            console.warn('⚠️ No default views found in config, returning user views only');
            return views;
        }

        // Combine user views with default views, including custom properties
        const defaultViews = await Promise.all(config.defaultViews.map(async (view: any) => {
            const customProperties = await getCustomPropertiesForView(view.id, userId);
            const enhancedVisibleProperties = customProperties.length > 0
                ? [...(view.visibleProperties || []), ...customProperties.map((cp: any) => cp.id)]
                : view.visibleProperties;

            return {
                ...view,
                createdBy: userId,
                databaseId: 'people-main-db',
                frozenProperties: config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [],
                isSystemView: true,
                customProperties: customProperties.length > 0 ? customProperties : undefined,
                visibleProperties: enhancedVisibleProperties
            };
        }));

        console.log('🔍 Processed default views:', defaultViews.length);
        const result = [...defaultViews, ...views];
        console.log('🔍 Returning total views:', result.length);

        return result;
    } catch (error) {
        console.error('❌ Error fetching people views:', error);
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
            const customProperties = await getCustomPropertiesForView(viewId, userId);
            const enhancedVisibleProperties = customProperties.length > 0
                ? [...(defaultView.visibleProperties || []), ...customProperties.map((cp: any) => cp.id)]
                : defaultView.visibleProperties;

            return {
                ...defaultView,
                createdBy: userId,
                databaseId: 'people-main-db',
                frozenProperties: config?.frozenConfig?.frozenProperties?.map((fp: any) => fp.propertyId) || [],
                isSystemView: true,
                customProperties: customProperties.length > 0 ? customProperties : undefined,
                visibleProperties: enhancedVisibleProperties
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
            // For default views, we'll store custom properties separately and return an enhanced view
            // This avoids creating new views and keeps the original view intact

            // Generate unique property ID
            const propertyId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

            // Get the default view structure
            const defaultViews = await getDefaultPeopleViews();
            const targetView = defaultViews.find(v => v.id === viewId) || defaultViews[0];

            // Transform selectOptions from frontend format to backend format
            let transformedSelectOptions = undefined;
            if (property.selectOptions && Array.isArray(property.selectOptions) && property.selectOptions.length > 0) {
                transformedSelectOptions = property.selectOptions.map((option: any) => ({
                    value: option.name || option.value || option.id || `option_${Date.now()}`,
                    label: option.name || option.label || option.value || 'Option',
                    color: option.color || '#6b7280'
                }));
            } else if (['SELECT', 'MULTI_SELECT'].includes(property.type)) {
                // Create default options for SELECT/MULTI_SELECT properties if none provided
                transformedSelectOptions = [
                    { value: 'option1', label: 'Option 1', color: '#3b82f6' },
                    { value: 'option2', label: 'Option 2', color: '#10b981' },
                    { value: 'option3', label: 'Option 3', color: '#f59e0b' }
                ];
            }

            // Store the custom property in the database for this user and view
            await storeCustomPropertyForView(viewId, userId, {
                id: propertyId,
                name: property.name,
                type: property.type || 'TEXT',
                description: property.description || '',
                required: property.required || false,
                order: property.order || 6,
                isVisible: true,
                frozen: false,
                selectOptions: transformedSelectOptions
            });

            // Return the enhanced view with the new property
            const existingCustomProps = await getCustomPropertiesForView(viewId, userId);

            return {
                ...targetView,
                id: viewId, // Keep the original view ID
                customProperties: existingCustomProps,
                visibleProperties: [...(targetView.visibleProperties || []), propertyId]
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

            if (!view) {
                throw new Error('Failed to update people view');
            }

            // Transform selectOptions for custom views too
            let transformedSelectOptions = undefined;
            if (property.selectOptions && Array.isArray(property.selectOptions) && property.selectOptions.length > 0) {
                transformedSelectOptions = property.selectOptions.map((option: any) => ({
                    value: option.name || option.value || option.id || `option_${Date.now()}`,
                    label: option.name || option.label || option.value || 'Option',
                    color: option.color || '#6b7280'
                }));
            } else if (['SELECT', 'MULTI_SELECT'].includes(property.type)) {
                // Create default options for SELECT/MULTI_SELECT properties if none provided
                transformedSelectOptions = [
                    { value: 'option1', label: 'Option 1', color: '#3b82f6' },
                    { value: 'option2', label: 'Option 2', color: '#10b981' },
                    { value: 'option3', label: 'Option 3', color: '#f59e0b' }
                ];
            }

            return {
                ...view.toObject(),
                customProperties: [{
                    id: propertyId,
                    name: property.name,
                    type: property.type || 'TEXT',
                    description: property.description || '',
                    required: property.required || false,
                    order: property.order || (currentView.visibleProperties?.length || 0),
                    isVisible: true,
                    frozen: false,
                    selectOptions: transformedSelectOptions
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

// Update custom property
export const updatePeopleCustomProperty = async (viewId: string, userId: string, propertyId: string, updates: any) => {
    try {
        const isDefaultView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (isDefaultView) {
            // For system views, update the custom properties document
            const customPropsDoc = await PersonDocumentView.findOne({
                name: `Custom Properties for ${viewId}`,
                createdBy: userId,
                type: 'CUSTOM_PROPERTIES'
            });

            if (!customPropsDoc) {
                throw new Error('Custom properties document not found');
            }

            // Find and update the specific property
            const propertyIndex = customPropsDoc.customProperties?.findIndex((p: any) => p.id === propertyId);
            if (propertyIndex === -1 || propertyIndex === undefined) {
                throw new Error('Custom property not found');
            }

            // Ensure customProperties array exists
            if (!customPropsDoc.customProperties) {
                throw new Error('Custom properties array is undefined');
            }

            // Update the property
            Object.assign(customPropsDoc.customProperties[propertyIndex], updates);
            await customPropsDoc.save();

            console.log('🔍 Updated custom property:', {
                propertyId,
                updates,
                updatedProperty: customPropsDoc.customProperties[propertyIndex]
            });

            // Return the updated view with custom properties
            const defaultViews = await getDefaultPeopleViews();
            const targetView = defaultViews.find(v => v.id === viewId) || defaultViews[0];
            const customProperties = await getCustomPropertiesForView(viewId, userId);

            return {
                ...targetView,
                id: viewId,
                customProperties,
                visibleProperties: [...(targetView.visibleProperties || []), ...customProperties.map((cp: any) => cp.id)],
                message: `Property "${updates.name || 'property'}" updated successfully`
            };
        } else {
            // For custom views, update normally
            throw new Error('Custom view property updates not implemented yet');
        }
    } catch (error) {
        console.error('Error updating custom property:', error);
        throw error;
    }
};

// Delete custom property
export const deletePeopleCustomProperty = async (viewId: string, userId: string, propertyId: string) => {
    try {
        const isDefaultView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (isDefaultView) {
            // For system views, remove from custom properties document
            const customPropsDoc = await PersonDocumentView.findOne({
                name: `Custom Properties for ${viewId}`,
                createdBy: userId,
                type: 'CUSTOM_PROPERTIES'
            });

            if (!customPropsDoc) {
                throw new Error('Custom properties document not found');
            }

            // Remove the property
            customPropsDoc.customProperties = customPropsDoc.customProperties?.filter((p: any) => p.id !== propertyId) || [];
            await customPropsDoc.save();

            console.log('🔍 Deleted custom property:', {
                propertyId,
                remainingProperties: customPropsDoc.customProperties.length
            });

            // Return the updated view
            const defaultViews = await getDefaultPeopleViews();
            const targetView = defaultViews.find(v => v.id === viewId) || defaultViews[0];
            const customProperties = await getCustomPropertiesForView(viewId, userId);

            return {
                ...targetView,
                id: viewId,
                customProperties,
                visibleProperties: [...(targetView.visibleProperties || []), ...customProperties.map((cp: any) => cp.id)],
                message: `Property deleted successfully`
            };
        } else {
            // For custom views, delete normally
            throw new Error('Custom view property deletion not implemented yet');
        }
    } catch (error) {
        console.error('Error deleting custom property:', error);
        throw error;
    }
};

// Insert property (left or right)
export const insertPeopleProperty = async (viewId: string, userId: string, propertyId: string, insertData: any) => {
    try {
        const isDefaultView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (isDefaultView) {
            // Generate unique property ID for the new property
            const newPropertyId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

            // Get current custom properties
            const customProperties = await getCustomPropertiesForView(viewId, userId);

            // Find the target property to determine insertion position
            const targetIndex = customProperties.findIndex((cp: any) => cp.id === propertyId);
            const insertIndex = insertData.position === 'left' ? targetIndex : targetIndex + 1;

            // Create new property
            const newProperty = {
                id: newPropertyId,
                name: insertData.name || 'New Property',
                type: insertData.type || 'TEXT',
                description: '',
                required: false,
                order: insertIndex,
                isVisible: true,
                frozen: false
            };

            // Store the new property
            await storeCustomPropertyForView(viewId, userId, newProperty);

            console.log('🔍 Inserted custom property:', {
                newPropertyId,
                position: insertData.position,
                insertIndex
            });

            // Return the updated view
            const defaultViews = await getDefaultPeopleViews();
            const targetView = defaultViews.find(v => v.id === viewId) || defaultViews[0];
            const updatedCustomProperties = await getCustomPropertiesForView(viewId, userId);

            return {
                ...targetView,
                id: viewId,
                customProperties: updatedCustomProperties,
                visibleProperties: [...(targetView.visibleProperties || []), ...updatedCustomProperties.map((cp: any) => cp.id)],
                message: `Property "${newProperty.name}" inserted successfully`
            };
        } else {
            throw new Error('Custom view property insertion not implemented yet');
        }
    } catch (error) {
        console.error('Error inserting custom property:', error);
        throw error;
    }
};

// Duplicate property
export const duplicatePeopleProperty = async (viewId: string, userId: string, propertyId: string) => {
    try {
        const isDefaultView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (isDefaultView) {
            // Get the property to duplicate
            const customProperties = await getCustomPropertiesForView(viewId, userId);
            const sourceProperty = customProperties.find((cp: any) => cp.id === propertyId);

            if (!sourceProperty) {
                throw new Error('Property to duplicate not found');
            }

            // Generate unique property ID for the duplicate
            const duplicatePropertyId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

            // Create duplicate property
            const duplicateProperty = {
                ...sourceProperty,
                id: duplicatePropertyId,
                name: `${sourceProperty.name} Copy`,
                order: (sourceProperty.order || 0) + 1
            };

            // Store the duplicate property
            await storeCustomPropertyForView(viewId, userId, duplicateProperty);

            console.log('🔍 Duplicated custom property:', {
                sourcePropertyId: propertyId,
                duplicatePropertyId,
                duplicateName: duplicateProperty.name
            });

            // Return the updated view
            const defaultViews = await getDefaultPeopleViews();
            const targetView = defaultViews.find(v => v.id === viewId) || defaultViews[0];
            const updatedCustomProperties = await getCustomPropertiesForView(viewId, userId);

            return {
                ...targetView,
                id: viewId,
                customProperties: updatedCustomProperties,
                visibleProperties: [...(targetView.visibleProperties || []), ...updatedCustomProperties.map((cp: any) => cp.id)],
                message: `Property "${duplicateProperty.name}" created successfully`
            };
        } else {
            throw new Error('Custom view property duplication not implemented yet');
        }
    } catch (error) {
        console.error('Error duplicating custom property:', error);
        throw error;
    }
};

// Freeze/unfreeze people property
export const freezePeopleProperty = async (viewId: string, userId: string, propertyId: string, frozen: boolean) => {
    try {
        console.log('🔍 Freezing people property:', { viewId, userId, propertyId, frozen });

        // Check if this is a system view (like "all-people")
        const isSystemView = !viewId.match(/^[0-9a-fA-F]{24}$/);

        if (!isSystemView) {
            // For custom views, get the current view
            const currentView = await getPeopleView(viewId, userId);
            if (!currentView) {
                throw new Error('View not found');
            }
        }

        // Update the custom property's frozen status
        const customProperties = await getCustomPropertiesForView(viewId, userId);
        const propertyToUpdate = customProperties.find((cp: any) => cp.id === propertyId);

        if (propertyToUpdate) {
            // Update the custom property in the database (this works for both system and custom views)
            await updatePeopleCustomProperty(viewId, userId, propertyId, { frozen });

            console.log('✅ Custom property frozen status updated:', { propertyId, frozen });
        } else {
            // Check if it's a default property (these can't be frozen/unfrozen by users)
            const defaultProperties = await getDefaultPeopleProperties();
            const isDefaultProperty = defaultProperties.some((dp: any) => dp.id === propertyId);

            if (isDefaultProperty) {
                throw new Error('Cannot modify freeze status of default properties');
            } else {
                throw new Error('Property not found');
            }
        }

        // Return success response without trying to update the view itself
        const updatedCustomProperties = await getCustomPropertiesForView(viewId, userId);

        return {
            propertyId,
            frozen,
            customProperties: updatedCustomProperties,
            message: `Property ${frozen ? 'frozen' : 'unfrozen'} successfully`
        };

    } catch (error) {
        console.error('Error freezing people property:', error);
        throw error;
    }
};
