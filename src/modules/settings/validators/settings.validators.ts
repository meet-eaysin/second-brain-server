import { z } from 'zod';
import {
  appearanceSettingsSchema,
  notificationSettingsSchema,
  displaySettingsSchema,
  securitySettingsSchema,
  workspaceSettingsSchema,
  updateSettingsSchema
} from '../types/settings.types';

// Get settings validation
export const getSettingsSchema = z.object({
  userId: z.string().optional() // Will be set from auth middleware
});

// Update settings validation
export const updateSettingsValidationSchema = updateSettingsSchema;

// Update specific settings category
export const updateAppearanceSettingsSchema = z.object({
  theme: appearanceSettingsSchema.shape.theme.optional(),
  fontSize: appearanceSettingsSchema.shape.fontSize.optional(),
  compactMode: appearanceSettingsSchema.shape.compactMode.optional(),
  animationsEnabled: appearanceSettingsSchema.shape.animationsEnabled.optional(),
  highContrast: appearanceSettingsSchema.shape.highContrast.optional()
});

export const updateNotificationSettingsSchema = z.object({
  emailNotifications: notificationSettingsSchema.shape.emailNotifications.optional(),
  pushNotifications: notificationSettingsSchema.shape.pushNotifications.optional(),
  workspaceInvites: notificationSettingsSchema.shape.workspaceInvites.optional(),
  databaseShares: notificationSettingsSchema.shape.databaseShares.optional(),
  mentions: notificationSettingsSchema.shape.mentions.optional(),
  weeklyDigest: notificationSettingsSchema.shape.weeklyDigest.optional(),
  notificationFrequency: notificationSettingsSchema.shape.notificationFrequency.optional()
});

export const updateDisplaySettingsSchema = z.object({
  layoutDensity: displaySettingsSchema.shape.layoutDensity.optional(),
  sidebarWidth: displaySettingsSchema.shape.sidebarWidth.optional(),
  contentWidth: displaySettingsSchema.shape.contentWidth.optional(),
  showGridLines: displaySettingsSchema.shape.showGridLines.optional(),
  enableAnimations: displaySettingsSchema.shape.enableAnimations.optional(),
  autoHideSidebar: displaySettingsSchema.shape.autoHideSidebar.optional(),
  fullscreenMode: displaySettingsSchema.shape.fullscreenMode.optional(),
  zoomLevel: displaySettingsSchema.shape.zoomLevel.optional()
});

export const updateSecuritySettingsSchema = z.object({
  twoFactorEnabled: securitySettingsSchema.shape.twoFactorEnabled.optional(),
  twoFactorMethod: securitySettingsSchema.shape.twoFactorMethod.optional(),
  sessionTimeout: securitySettingsSchema.shape.sessionTimeout.optional(),
  loginAlerts: securitySettingsSchema.shape.loginAlerts.optional()
});

export const updateWorkspaceSettingsSchema = z.object({
  defaultView: workspaceSettingsSchema.shape.defaultView.optional(),
  autoSave: workspaceSettingsSchema.shape.autoSave.optional(),
  showCompleted: workspaceSettingsSchema.shape.showCompleted.optional(),
  timezone: workspaceSettingsSchema.shape.timezone.optional(),
  dateFormat: workspaceSettingsSchema.shape.dateFormat.optional(),
  timeFormat: workspaceSettingsSchema.shape.timeFormat.optional()
});

// Reset settings validation
export const resetSettingsSchema = z.object({
  category: z
    .enum(['appearance', 'notifications', 'display', 'security', 'workspace', 'all'])
    .optional()
});
