import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { DocumentViewController } from '../controllers/document-view.controller';

/**
 * Centralized Document View Routes
 * Handles all document-view operations for any module type through a single router
 */
export class DocumentViewRouter {
    private router: Router;
    private controller: DocumentViewController;

    constructor() {
        this.router = Router();
        this.controller = new DocumentViewController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Module Configuration Routes
        this.router.get(
            '/:moduleType/config',
            authenticateToken,
            this.controller.getConfig
        );

        this.router.get(
            '/:moduleType/frozen-config',
            authenticateToken,
            this.controller.getFrozenConfig
        );

        // View Management Routes
        this.router.get(
            '/:moduleType/views',
            authenticateToken,
            this.controller.getViews
        );

        this.router.post(
            '/:moduleType/views',
            authenticateToken,
            this.controller.createView
        );

        this.router.get(
            '/:moduleType/views/default',
            authenticateToken,
            this.controller.getDefaultView
        );

        this.router.get(
            '/:moduleType/views/:viewId',
            authenticateToken,
            this.controller.getView
        );

        this.router.put(
            '/:moduleType/views/:viewId',
            authenticateToken,
            this.controller.updateView
        );

        this.router.patch(
            '/:moduleType/views/:viewId',
            authenticateToken,
            this.controller.updateView
        );

        this.router.delete(
            '/:moduleType/views/:viewId',
            authenticateToken,
            this.controller.deleteView
        );

        this.router.post(
            '/:moduleType/views/:viewId/duplicate',
            authenticateToken,
            this.controller.duplicateView
        );

        // Property Management Routes
        this.router.get(
            '/:moduleType/properties',
            authenticateToken,
            this.controller.getProperties
        );

        this.router.post(
            '/:moduleType/properties',
            authenticateToken,
            this.controller.addProperty
        );

        this.router.put(
            '/:moduleType/properties/:propertyId',
            authenticateToken,
            this.controller.updateProperty
        );

        this.router.patch(
            '/:moduleType/properties/:propertyId',
            authenticateToken,
            this.controller.updateProperty
        );

        this.router.delete(
            '/:moduleType/properties/:propertyId',
            authenticateToken,
            this.controller.deleteProperty
        );

        // Record Management Routes
        this.router.get(
            '/:moduleType/records',
            authenticateToken,
            this.controller.getRecords
        );

        this.router.post(
            '/:moduleType/records',
            authenticateToken,
            this.controller.createRecord
        );

        this.router.get(
            '/:moduleType/records/:recordId',
            authenticateToken,
            this.controller.getRecords // Will be filtered by recordId in query
        );

        this.router.put(
            '/:moduleType/records/:recordId',
            authenticateToken,
            this.controller.updateRecord
        );

        this.router.patch(
            '/:moduleType/records/:recordId',
            authenticateToken,
            this.controller.updateRecord
        );

        this.router.delete(
            '/:moduleType/records/:recordId',
            authenticateToken,
            this.controller.deleteRecord
        );

        // Database-specific routes (for backward compatibility)
        this.router.get(
            '/:moduleType/databases/:databaseId/views',
            authenticateToken,
            this.controller.getViews
        );

        this.router.post(
            '/:moduleType/databases/:databaseId/views',
            authenticateToken,
            this.controller.createView
        );

        this.router.get(
            '/:moduleType/databases/:databaseId/views/:viewId',
            authenticateToken,
            this.controller.getView
        );

        this.router.put(
            '/:moduleType/databases/:databaseId/views/:viewId',
            authenticateToken,
            this.controller.updateView
        );

        this.router.delete(
            '/:moduleType/databases/:databaseId/views/:viewId',
            authenticateToken,
            this.controller.deleteView
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}

// Export a factory function to create the router
export function createDocumentViewRouter(): Router {
    const documentViewRouter = new DocumentViewRouter();
    return documentViewRouter.getRouter();
}
