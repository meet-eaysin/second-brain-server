import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import {
  createRowTemplateFromRecord,
  createDatabaseTemplateFromDatabase,
  createWorkspaceTemplateFromWorkspace,
  generateTemplateFromPrompt,
  analyzeDatabaseForTemplates,
  validateTemplateData,
  previewTemplate,
  getTemplateCreationAnalytics
} from '../controllers/template-builder.controller';
import {
  RecordIdSchema,
  DatabaseIdSchema,
  WorkspaceIdSchema,
  CreateRowTemplateSchema,
  CreateDatabaseTemplateSchema,
  CreateWorkspaceTemplateSchema,
  GenerateFromPromptSchema,
  ValidateTemplateSchema,
  PreviewTemplateSchema
} from '../validators/template.validators';

const router = Router();

router.use(authenticateToken);

router.post(
  '/template-builder/from-record/:recordId',
  validateParams(RecordIdSchema),
  validateBody(CreateRowTemplateSchema),
  createRowTemplateFromRecord
);

router.post(
  '/template-builder/from-database/:databaseId',
  validateParams(DatabaseIdSchema),
  validateBody(CreateDatabaseTemplateSchema),
  createDatabaseTemplateFromDatabase
);

router.post(
  '/template-builder/from-workspace/:workspaceId',
  validateParams(WorkspaceIdSchema),
  validateBody(CreateWorkspaceTemplateSchema),
  createWorkspaceTemplateFromWorkspace
);

// AI-powered template generation
router.post(
  '/template-builder/generate-from-prompt',
  validateBody(GenerateFromPromptSchema),
  generateTemplateFromPrompt
);

// Template analysis and validation
router.get(
  '/template-builder/analyze-database/:databaseId',
  validateParams(DatabaseIdSchema),
  analyzeDatabaseForTemplates
);

router.post(
  '/template-builder/validate',
  validateBody(ValidateTemplateSchema),
  validateTemplateData
);

router.post('/template-builder/preview', validateBody(PreviewTemplateSchema), previewTemplate);

// router.get(
//   '/template-builder/suggestions',
//   validateQuery(builderSuggestionsQuerySchema),
//   getTemplateBuilderSuggestions
// );
//
// router.get(
//   '/template-builder/wizard-steps/:templateType',
//   validateParams(templateTypeSchema),
//   getTemplateWizardSteps
// );

router.get('/template-builder/analytics', getTemplateCreationAnalytics);

export default router;
