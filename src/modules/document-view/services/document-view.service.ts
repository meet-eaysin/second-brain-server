import { DocumentView, IDocumentView } from '../models/document-view.model';
import { getModuleConfig } from '../config/module-config-registry';
import { 
    ModuleType, 
    GenericDocumentView, 
    GenericProperty, 
    GenericRecord,
    RecordQueryOptions,
} from '../types/document-view.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generic Document View Service
 * Provides centralized document-view functionality for all modules
 */
export class DocumentViewService {
    
    /**
     * Get module configuration
     */
    async getModuleConfig(moduleType: ModuleType) {
        return getModuleConfig(moduleType);
    }

    /**
     * Get or create document view for a module
     */
    async getOrCreateDocumentView(userId: string, moduleType: ModuleType, databaseId?: string): Promise<IDocumentView> {
        const config = getModuleConfig(moduleType);
        const dbId = databaseId || config.services.databaseId;

        let documentView: IDocumentView | null = await DocumentView.findOne({ userId, moduleType, databaseId: dbId });

        if (!documentView) {
            const newDoc = new DocumentView({
                userId,
                moduleType,
                databaseId: dbId,
                name: config.displayNamePlural,
                description: config.description,
                icon: config.icon,
                properties: config.data.defaultProperties,
                views: config.data.defaultViews,
                isPublic: false,
                isDefault: true,
                permissions: [{
                    userId,
                    permission: 'admin' as const
                }],
                requiredProperties: config.data.requiredProperties,
                frozenProperties: config.data.frozenProperties,
                createdBy: userId,
                lastEditedBy: userId
            });
            await newDoc.save();
            documentView = newDoc;
        }

        return documentView as IDocumentView;
    }

    /**
     * Get all views for a module
     */
    async getViews(userId: string, moduleType: ModuleType, databaseId?: string): Promise<GenericDocumentView[]> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        return documentView.views;
    }

    /**
     * Get a specific view
     */
    async getView(userId: string, moduleType: ModuleType, viewId: string, databaseId?: string): Promise<GenericDocumentView | null> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        return documentView.views.find(v => v.id === viewId) || null;
    }

    /**
     * Get default view for a module
     */
    async getDefaultView(userId: string, moduleType: ModuleType, databaseId?: string): Promise<GenericDocumentView | null> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        return documentView.views.find(v => v.isDefault) || documentView.views[0] || null;
    }

    /**
     * Create a new view
     */
    async createView(userId: string, moduleType: ModuleType, viewData: Partial<GenericDocumentView>, databaseId?: string): Promise<GenericDocumentView> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const newView: GenericDocumentView = {
            id: uuidv4(),
            name: viewData.name || 'New View',
            type: viewData.type || 'TABLE',
            description: viewData.description,
            isDefault: viewData.isDefault || false,
            isPublic: viewData.isPublic || false,
            filters: viewData.filters || [],
            sorts: viewData.sorts || [],
            groupBy: viewData.groupBy,
            visibleProperties: viewData.visibleProperties || [],
            customProperties: viewData.customProperties || [],
            config: viewData.config || {},
            permissions: viewData.permissions || [],
            createdBy: userId,
            lastEditedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await documentView.addView(newView);
        return newView;
    }

    /**
     * Update a view
     */
    async updateView(userId: string, moduleType: ModuleType, viewId: string, updates: Partial<GenericDocumentView>, databaseId?: string): Promise<GenericDocumentView | null> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const viewIndex = documentView.views.findIndex(v => v.id === viewId);
        if (viewIndex === -1) {
            return null;
        }

        const updatedView = {
            ...documentView.views[viewIndex],
            ...updates,
            lastEditedBy: userId,
            updatedAt: new Date()
        };

        await documentView.updateView(viewId, updatedView);
        return updatedView;
    }

    /**
     * Delete a view
     */
    async deleteView(userId: string, moduleType: ModuleType, viewId: string, databaseId?: string): Promise<boolean> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const view = documentView.views.find(v => v.id === viewId);
        if (!view) {
            return false;
        }

        // Prevent deletion of default views
        if (view.isDefault || view.config?.isSystemView) {
            throw new Error('Cannot delete default or system views');
        }

        await documentView.removeView(viewId);
        return true;
    }

    /**
     * Duplicate a view
     */
    async duplicateView(userId: string, moduleType: ModuleType, viewId: string, newName?: string, databaseId?: string): Promise<GenericDocumentView | null> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const originalView = documentView.views.find(v => v.id === viewId);
        if (!originalView) {
            return null;
        }

        const duplicatedView: GenericDocumentView = {
            ...originalView,
            id: uuidv4(),
            name: newName || `${originalView.name} (Copy)`,
            isDefault: false,
            createdBy: userId,
            lastEditedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await documentView.addView(duplicatedView);
        return duplicatedView;
    }

    /**
     * Get all properties for a module
     */
    async getProperties(userId: string, moduleType: ModuleType, databaseId?: string): Promise<GenericProperty[]> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        return documentView.properties;
    }

    /**
     * Add a property
     */
    async addProperty(userId: string, moduleType: ModuleType, property: Partial<GenericProperty>, databaseId?: string): Promise<GenericProperty> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const newProperty: GenericProperty = {
            id: property.id || uuidv4(),
            name: property.name || 'New Property',
            type: property.type || 'text',
            description: property.description,
            required: property.required || false,
            defaultValue: property.defaultValue,
            options: property.options,
            frozen: property.frozen || false,
            order: property.order || documentView.properties.length,
            visible: property.visible !== false,
            width: property.width || 150,
            moduleSpecific: property.moduleSpecific
        };

        await documentView.addProperty(newProperty);
        return newProperty;
    }

    /**
     * Update a property
     */
    async updateProperty(userId: string, moduleType: ModuleType, propertyId: string, updates: Partial<GenericProperty>, databaseId?: string): Promise<GenericProperty | null> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        const property = documentView.properties.find(p => p.id === propertyId);
        if (!property) {
            return null;
        }

        // Check if property is frozen
        if (documentView.frozenProperties.includes(propertyId) && updates.frozen === false) {
            throw new Error('Cannot unfreeze a system-frozen property');
        }

        await documentView.updateProperty(propertyId, updates);
        return { ...property, ...updates };
    }

    /**
     * Delete a property
     */
    async deleteProperty(userId: string, moduleType: ModuleType, propertyId: string, databaseId?: string): Promise<boolean> {
        const documentView = await this.getOrCreateDocumentView(userId, moduleType, databaseId);
        
        try {
            await documentView.removeProperty(propertyId);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get frozen configuration for a module
     */
    async getFrozenConfig(moduleType: ModuleType) {
        const config = getModuleConfig(moduleType);
        return config.frozenConfig || {
            viewType: moduleType,
            moduleType,
            description: `Frozen configuration for ${config.displayNamePlural}`,
            frozenProperties: config.data.frozenProperties.map(propertyId => ({
                propertyId,
                reason: 'System property',
                allowEdit: false,
                allowHide: false,
                allowDelete: false
            }))
        };
    }

    /**
     * Get records using the module's record service
     */
    async getRecords(userId: string, moduleType: ModuleType, options: RecordQueryOptions = {}): Promise<GenericRecord[]> {
        const config = getModuleConfig(moduleType);
        
        // Dynamically import the module's record service
        try {
            const recordService = await import(config.services.recordService);
            
            // Call the appropriate method based on the service structure
            if (recordService.getRecords) {
                return await recordService.getRecords(userId, options);
            } else if (recordService.default && recordService.default.getRecords) {
                return await recordService.default.getRecords(userId, options);
            } else {
                throw new Error(`Record service for ${moduleType} does not have a getRecords method`);
            }
        } catch (error) {
            console.error(`Error loading record service for ${moduleType}:`, error);
            throw new Error(`Failed to load record service for ${moduleType}`);
        }
    }

    /**
     * Create a record using the module's record service
     */
    async createRecord(userId: string, moduleType: ModuleType, recordData: Partial<GenericRecord>): Promise<GenericRecord> {
        const config = getModuleConfig(moduleType);
        
        try {
            const recordService = await import(config.services.recordService);
            
            if (recordService.createRecord) {
                return await recordService.createRecord(userId, recordData);
            } else if (recordService.default && recordService.default.createRecord) {
                return await recordService.default.createRecord(userId, recordData);
            } else {
                throw new Error(`Record service for ${moduleType} does not have a createRecord method`);
            }
        } catch (error) {
            console.error(`Error creating record for ${moduleType}:`, error);
            throw new Error(`Failed to create record for ${moduleType}`);
        }
    }

    /**
     * Update a record using the module's record service
     */
    async updateRecord(userId: string, moduleType: ModuleType, recordId: string, updates: Partial<GenericRecord>): Promise<GenericRecord> {
        const config = getModuleConfig(moduleType);
        
        try {
            const recordService = await import(config.services.recordService);
            
            if (recordService.updateRecord) {
                return await recordService.updateRecord(userId, recordId, updates);
            } else if (recordService.default && recordService.default.updateRecord) {
                return await recordService.default.updateRecord(userId, recordId, updates);
            } else {
                throw new Error(`Record service for ${moduleType} does not have an updateRecord method`);
            }
        } catch (error) {
            console.error(`Error updating record for ${moduleType}:`, error);
            throw new Error(`Failed to update record for ${moduleType}`);
        }
    }

    /**
     * Delete a record using the module's record service
     */
    async deleteRecord(userId: string, moduleType: ModuleType, recordId: string): Promise<boolean> {
        const config = getModuleConfig(moduleType);
        
        try {
            const recordService = await import(config.services.recordService);
            
            if (recordService.deleteRecord) {
                return await recordService.deleteRecord(userId, recordId);
            } else if (recordService.default && recordService.default.deleteRecord) {
                return await recordService.default.deleteRecord(userId, recordId);
            } else {
                throw new Error(`Record service for ${moduleType} does not have a deleteRecord method`);
            }
        } catch (error) {
            console.error(`Error deleting record for ${moduleType}:`, error);
            throw new Error(`Failed to delete record for ${moduleType}`);
        }
    }
}
