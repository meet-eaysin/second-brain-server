
// Core components
export { DocumentViewController } from './controllers/document-view.controller';
export { DocumentViewService } from './services/document-view.service';
export { DocumentViewRouter, createDocumentViewRouter } from './routes/document-view.routes';
export { ModuleConfigRegistry } from './config/module-config-registry';

// Models
export { DocumentView, type IDocumentView, type IDocumentViewModel } from './models/document-view.model';

// Types and interfaces
export type {
    ModuleConfig,
    DocumentViewConfig,
    GenericDocumentView,
    GenericProperty,
    GenericRecord,
    ModuleType,
    RecordQueryOptions,
    ApiResponse
} from './types/document-view.types';

// Configuration helpers
export { createModuleConfig, createProperty, createView } from './config/module-config.factory';
export { registerModuleConfig, getModuleConfig } from './config/module-config-registry';

// Validators
export {
    moduleTypeSchema,
    propertyTypeSchema,
    viewTypeSchema,
    createPropertySchema,
    updatePropertySchema,
    createViewSchema,
    updateViewSchema,
    createRecordSchema,
    updateRecordSchema,
    queryParamsSchema,
    moduleParamsSchema,
    recordParamsSchema,
    viewParamsSchema,
    propertyParamsSchema,
    bulkDeleteRecordsSchema,
    bulkUpdateRecordsSchema,
    exportSchema,
    importSchema
} from './validators';

// Module configurations
export { initializeModuleConfigurations } from './configs';
export { tasksModuleConfig } from './configs/tasks.config';
export { peopleModuleConfig } from './configs/people.config';
export { notesModuleConfig } from './configs/notes.config';
export { goalsModuleConfig } from './configs/goals.config';
export { booksModuleConfig } from './configs/books.config';
export { habitsModuleConfig } from './configs/habits.config';
export { projectsModuleConfig } from './configs/projects.config';
export { journalsModuleConfig } from './configs/journals.config';
export { moodsModuleConfig } from './configs/moods.config';
export { contentModuleConfig } from './configs/content.config';
export { financeModuleConfig } from './configs/finance.config';
export { databasesModuleConfig } from './configs/databases.config';
