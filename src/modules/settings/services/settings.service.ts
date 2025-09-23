import { Settings } from '../models/settings.model';
import {
  ISettings,
  IAppearanceSettings,
  INotificationSettings,
  IDisplaySettings,
  ISecuritySettings,
  IWorkspaceSettings,
  defaultAppearanceSettings,
  defaultNotificationSettings,
  defaultDisplaySettings,
  defaultSecuritySettings,
  defaultWorkspaceSettings
} from '../types/settings.types';

// Get user settings
export async function getUserSettings(userId: string): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  return settings.toObject();
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  updates: Partial<ISettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);

  if (updates.appearance) {
    settings.appearance = { ...settings.appearance, ...updates.appearance };
  }
  if (updates.notifications) {
    settings.notifications = { ...settings.notifications, ...updates.notifications };
  }
  if (updates.display) {
    settings.display = { ...settings.display, ...updates.display };
  }
  if (updates.security) {
    settings.security = { ...settings.security, ...updates.security };
  }
  if (updates.workspace) {
    settings.workspace = { ...settings.workspace, ...updates.workspace };
  }

  await settings.save();
  return settings.toObject();
}

// Update appearance settings
export async function updateAppearanceSettings(
  userId: string,
  appearance: Partial<IAppearanceSettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  settings.appearance = { ...settings.appearance, ...appearance };
  await settings.save();
  return settings.toObject();
}

// Update notification settings
export async function updateNotificationSettings(
  userId: string,
  notifications: Partial<INotificationSettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  settings.notifications = { ...settings.notifications, ...notifications };
  await settings.save();
  return settings.toObject();
}

// Update display settings
export async function updateDisplaySettings(
  userId: string,
  display: Partial<IDisplaySettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  settings.display = { ...settings.display, ...display };
  await settings.save();
  return settings.toObject();
}

// Update security settings
export async function updateSecuritySettings(
  userId: string,
  security: Partial<ISecuritySettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  settings.security = { ...settings.security, ...security };
  await settings.save();
  return settings.toObject();
}

// Update workspace settings
export async function updateWorkspaceSettings(
  userId: string,
  workspace: Partial<IWorkspaceSettings>
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);
  settings.workspace = { ...settings.workspace, ...workspace };
  await settings.save();
  return settings.toObject();
}

// Reset settings to defaults
export async function resetSettings(
  userId: string,
  category?: 'appearance' | 'notifications' | 'display' | 'security' | 'workspace' | 'all'
): Promise<ISettings> {
  const settings = await Settings.findByUserIdOrCreate(userId);

  switch (category) {
    case 'appearance':
      settings.appearance = defaultAppearanceSettings;
      break;
    case 'notifications':
      settings.notifications = defaultNotificationSettings;
      break;
    case 'display':
      settings.display = defaultDisplaySettings;
      break;
    case 'security':
      settings.security = defaultSecuritySettings;
      break;
    case 'workspace':
      settings.workspace = defaultWorkspaceSettings;
      break;
    case 'all':
    default:
      settings.appearance = defaultAppearanceSettings;
      settings.notifications = defaultNotificationSettings;
      settings.display = defaultDisplaySettings;
      settings.security = defaultSecuritySettings;
      settings.workspace = defaultWorkspaceSettings;
      break;
  }

  await settings.save();
  return settings.toObject();
}

// Delete user settings (useful for account deletion)
export async function deleteUserSettings(userId: string): Promise<void> {
  await Settings.findOneAndDelete({ userId });
}

// Get appearance settings only
export async function getAppearanceSettings(userId: string): Promise<IAppearanceSettings> {
  const settings = await getUserSettings(userId);
  return settings.appearance;
}

// Get notification settings only
export async function getNotificationSettings(userId: string): Promise<INotificationSettings> {
  const settings = await getUserSettings(userId);
  return settings.notifications;
}

// Get display settings only
export async function getDisplaySettings(userId: string): Promise<IDisplaySettings> {
  const settings = await getUserSettings(userId);
  return settings.display;
}

// Get security settings only
export async function getSecuritySettings(userId: string): Promise<ISecuritySettings> {
  const settings = await getUserSettings(userId);
  return settings.security;
}

// Get workspace settings only
export async function getWorkspaceSettings(userId: string): Promise<IWorkspaceSettings> {
  const settings = await getUserSettings(userId);
  return settings.workspace;
}
