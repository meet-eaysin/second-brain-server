import { Request, Response } from 'express';
import { DocumentViewService } from '../services/document-view.service';
import { ModuleType } from '../types/document-view.types';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../utils';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

/**
 * Generic Document View Controller
 * Handles all document-view operations for any module type
 */
export class DocumentViewController {
    private documentViewService: DocumentViewService;

    constructor() {
        this.documentViewService = new DocumentViewService();
    }

    /**
     * Get module configuration
     */
    getConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const { moduleType } = req.params;
        
        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const config = await this.documentViewService.getModuleConfig(moduleType as ModuleType);
        sendSuccessResponse(res, 'Module configuration retrieved successfully', config);
    });

    /**
     * Get frozen configuration
     */
    getFrozenConfig = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const { moduleType } = req.params;
        
        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const frozenConfig = await this.documentViewService.getFrozenConfig(moduleType as ModuleType);
        sendSuccessResponse(res, 'Frozen configuration retrieved successfully', frozenConfig);
    });

    /**
     * Get all views for a module
     */
    getViews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const views = await this.documentViewService.getViews(
            userId, 
            moduleType as ModuleType, 
            databaseId as string
        );
        
        sendSuccessResponse(res, 'Views retrieved successfully', views);
    });

    /**
     * Get a specific view
     */
    getView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, viewId } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const view = await this.documentViewService.getView(
            userId, 
            moduleType as ModuleType, 
            viewId,
            databaseId as string
        );

        if (!view) {
            return sendErrorResponse(res, 'View not found', 404);
        }

        sendSuccessResponse(res, 'View retrieved successfully', view);
    });

    /**
     * Get default view for a module
     */
    getDefaultView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const view = await this.documentViewService.getDefaultView(
            userId, 
            moduleType as ModuleType,
            databaseId as string
        );

        if (!view) {
            return sendErrorResponse(res, 'No default view found', 404);
        }

        sendSuccessResponse(res, 'Default view retrieved successfully', view);
    });

    /**
     * Create a new view
     */
    createView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const newView = await this.documentViewService.createView(
            userId,
            moduleType as ModuleType,
            req.body,
            databaseId as string
        );

        sendSuccessResponse(res, 'View created successfully', newView, 201);
    });

    /**
     * Update a view
     */
    updateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, viewId } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const updatedView = await this.documentViewService.updateView(
            userId,
            moduleType as ModuleType,
            viewId,
            req.body,
            databaseId as string
        );

        if (!updatedView) {
            return sendErrorResponse(res, 'View not found or access denied', 404);
        }

        sendSuccessResponse(res, 'View updated successfully', updatedView);
    });

    /**
     * Delete a view
     */
    deleteView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, viewId } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const deleted = await this.documentViewService.deleteView(
                userId,
                moduleType as ModuleType,
                viewId,
                databaseId as string
            );

            if (!deleted) {
                return sendErrorResponse(res, 'View not found or access denied', 404);
            }

            sendSuccessResponse(res, 'View deleted successfully', null);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 400);
        }
    });

    /**
     * Duplicate a view
     */
    duplicateView = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, viewId } = req.params;
        const { name } = req.body;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const duplicatedView = await this.documentViewService.duplicateView(
            userId,
            moduleType as ModuleType,
            viewId,
            name,
            databaseId as string
        );

        if (!duplicatedView) {
            return sendErrorResponse(res, 'View not found or access denied', 404);
        }

        sendSuccessResponse(res, 'View duplicated successfully', duplicatedView, 201);
    });

    /**
     * Get all properties for a module
     */
    getProperties = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const properties = await this.documentViewService.getProperties(
            userId,
            moduleType as ModuleType,
            databaseId as string
        );

        sendSuccessResponse(res, 'Properties retrieved successfully', properties);
    });

    /**
     * Add a property
     */
    addProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const newProperty = await this.documentViewService.addProperty(
            userId,
            moduleType as ModuleType,
            req.body,
            databaseId as string
        );

        sendSuccessResponse(res, 'Property added successfully', newProperty, 201);
    });

    /**
     * Update a property
     */
    updateProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, propertyId } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const updatedProperty = await this.documentViewService.updateProperty(
                userId,
                moduleType as ModuleType,
                propertyId,
                req.body,
                databaseId as string
            );

            if (!updatedProperty) {
                return sendErrorResponse(res, 'Property not found', 404);
            }

            sendSuccessResponse(res, 'Property updated successfully', updatedProperty);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 400);
        }
    });

    /**
     * Delete a property
     */
    deleteProperty = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, propertyId } = req.params;
        const { databaseId } = req.query;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        const deleted = await this.documentViewService.deleteProperty(
            userId,
            moduleType as ModuleType,
            propertyId,
            databaseId as string
        );

        if (!deleted) {
            return sendErrorResponse(res, 'Property not found or cannot be deleted', 404);
        }

        sendSuccessResponse(res, 'Property deleted successfully', null);
    });

    /**
     * Get records for a module
     */
    getRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const records = await this.documentViewService.getRecords(
                userId,
                moduleType as ModuleType,
                req.query as any
            );

            sendSuccessResponse(res, 'Records retrieved successfully', records);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 500);
        }
    });

    /**
     * Create a record
     */
    createRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType } = req.params;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const record = await this.documentViewService.createRecord(
                userId,
                moduleType as ModuleType,
                req.body
            );

            sendSuccessResponse(res, 'Record created successfully', record, 201);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 500);
        }
    });

    /**
     * Update a record
     */
    updateRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, recordId } = req.params;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const record = await this.documentViewService.updateRecord(
                userId,
                moduleType as ModuleType,
                recordId,
                req.body
            );

            sendSuccessResponse(res, 'Record updated successfully', record);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 500);
        }
    });

    /**
     * Delete a record
     */
    deleteRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { moduleType, recordId } = req.params;

        if (!userId) {
            return sendErrorResponse(res, 'User not authenticated', 401);
        }

        if (!this.isValidModuleType(moduleType)) {
            return sendErrorResponse(res, 'Invalid module type', 400);
        }

        try {
            const deleted = await this.documentViewService.deleteRecord(
                userId,
                moduleType as ModuleType,
                recordId
            );

            if (!deleted) {
                return sendErrorResponse(res, 'Record not found or access denied', 404);
            }

            sendSuccessResponse(res, 'Record deleted successfully', null);
        } catch (error: any) {
            return sendErrorResponse(res, error.message, 500);
        }
    });

    /**
     * Helper method to validate module type
     */
    private isValidModuleType(moduleType: string): boolean {
        const validModuleTypes = [
            'tasks', 'people', 'notes', 'goals', 'books',
            'habits', 'projects', 'journals', 'moods',
            'finance', 'content', 'databases'
        ];
        return validModuleTypes.includes(moduleType);
    }
}
