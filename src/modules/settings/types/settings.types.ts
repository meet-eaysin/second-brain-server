import { z } from 'zod';

// Appearance Settings
export interface IAppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
}

// Notification Settings
export interface INotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  workspaceInvites: boolean;
  databaseShares: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// Display Settings
export interface IDisplaySettings {
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  sidebarWidth: number;
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  showGridLines: boolean;
  enableAnimations: boolean;
  autoHideSidebar: boolean;
  fullscreenMode: boolean;
  zoomLevel: number;
}

// Security Settings
export interface ISecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'app' | 'sms' | null;
  sessionTimeout: number;
  loginAlerts: boolean;
}

// Workspace Settings
export interface IWorkspaceSettings {
  defaultView: 'list' | 'board' | 'calendar' | 'timeline';
  autoSave: boolean;
  showCompleted: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

// Main Settings interface
export interface ISettings {
  userId: string;
  appearance: IAppearanceSettings;
  notifications: INotificationSettings;
  display: IDisplaySettings;
  security: ISecuritySettings;
  workspace: IWorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Default settings
export const defaultAppearanceSettings: IAppearanceSettings = {
  theme: 'system',
  fontSize: 'medium',
  compactMode: false,
  animationsEnabled: true,
  highContrast: false
};

export const defaultNotificationSettings: INotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  workspaceInvites: true,
  databaseShares: true,
  mentions: true,
  weeklyDigest: false,
  notificationFrequency: 'immediate'
};

export const defaultDisplaySettings: IDisplaySettings = {
  layoutDensity: 'comfortable',
  sidebarWidth: 280,
  contentWidth: 'full',
  showGridLines: false,
  enableAnimations: true,
  autoHideSidebar: false,
  fullscreenMode: false,
  zoomLevel: 100
};

export const defaultSecuritySettings: ISecuritySettings = {
  twoFactorEnabled: false,
  twoFactorMethod: null,
  sessionTimeout: 30, // days
  loginAlerts: true
};

export const defaultWorkspaceSettings: IWorkspaceSettings = {
  defaultView: 'list',
  autoSave: true,
  showCompleted: true,
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h'
};

// Zod schemas for validation
export const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  fontSize: z.enum(['small', 'medium', 'large']),
  compactMode: z.boolean(),
  animationsEnabled: z.boolean(),
  highContrast: z.boolean()
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  workspaceInvites: z.boolean(),
  databaseShares: z.boolean(),
  mentions: z.boolean(),
  weeklyDigest: z.boolean(),
  notificationFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly'])
});

export const displaySettingsSchema = z.object({
  layoutDensity: z.enum(['compact', 'comfortable', 'spacious']),
  sidebarWidth: z.number().min(200).max(400),
  contentWidth: z.enum(['narrow', 'medium', 'wide', 'full']),
  showGridLines: z.boolean(),
  enableAnimations: z.boolean(),
  autoHideSidebar: z.boolean(),
  fullscreenMode: z.boolean(),
  zoomLevel: z.number().min(75).max(150)
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  twoFactorMethod: z.enum(['app', 'sms']).nullable(),
  sessionTimeout: z.number().min(1).max(365),
  loginAlerts: z.boolean()
});

export const workspaceSettingsSchema = z.object({
  defaultView: z.enum(['list', 'board', 'calendar', 'timeline']),
  autoSave: z.boolean(),
  showCompleted: z.boolean(),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h'])
});

export const settingsSchema = z.object({
  appearance: appearanceSettingsSchema,
  notifications: notificationSettingsSchema,
  display: displaySettingsSchema,
  security: securitySettingsSchema,
  workspace: workspaceSettingsSchema
});

export const updateSettingsSchema = z.object({
  appearance: appearanceSettingsSchema.optional(),
  notifications: notificationSettingsSchema.optional(),
  display: displaySettingsSchema.optional(),
  security: securitySettingsSchema.optional(),
  workspace: workspaceSettingsSchema.optional()
});
