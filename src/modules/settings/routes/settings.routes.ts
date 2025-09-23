import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateQuery } from '../../../middlewares/validation';
import {
  getSettings,
  updateSettings,
  updateAppearance,
  updateNotifications,
  updateDisplay,
  updateSecurity,
  updateWorkspace,
  getAppearance,
  getNotifications,
  getDisplay,
  getSecurity,
  getWorkspace,
  resetUserSettings,
  deleteSettings
} from '../controllers/settings.controller';
import {
  updateSettingsValidationSchema,
  updateAppearanceSettingsSchema,
  updateNotificationSettingsSchema,
  updateDisplaySettingsSchema,
  updateSecuritySettingsSchema,
  updateWorkspaceSettingsSchema,
  resetSettingsSchema
} from '../validators/settings.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all settings
router.get('/', getSettings);

// Update all settings
router.put('/', validateBody(updateSettingsValidationSchema), updateSettings);

// Update specific settings categories
router.put('/appearance', validateBody(updateAppearanceSettingsSchema), updateAppearance);
router.put('/notifications', validateBody(updateNotificationSettingsSchema), updateNotifications);
router.put('/display', validateBody(updateDisplaySettingsSchema), updateDisplay);
router.put('/security', validateBody(updateSecuritySettingsSchema), updateSecurity);
router.put('/workspace', validateBody(updateWorkspaceSettingsSchema), updateWorkspace);

// Get specific settings categories
router.get('/appearance', getAppearance);
router.get('/notifications', getNotifications);
router.get('/display', getDisplay);
router.get('/security', getSecurity);
router.get('/workspace', getWorkspace);

// Reset settings
router.post('/reset', validateBody(resetSettingsSchema), resetUserSettings);

// Delete settings (for account deletion)
router.delete('/', deleteSettings);

export default router;
