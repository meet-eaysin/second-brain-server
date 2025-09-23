import { Request, Response } from 'express';
import {
  getUserSettings,
  updateUserSettings,
  updateAppearanceSettings,
  updateNotificationSettings,
  updateDisplaySettings,
  updateSecuritySettings,
  updateWorkspaceSettings,
  resetSettings,
  deleteUserSettings,
  getAppearanceSettings,
  getNotificationSettings,
  getDisplaySettings,
  getSecuritySettings,
  getWorkspaceSettings
} from '../services/settings.service';
import { sendSuccessResponse } from '../../../utils/response.utils';

// Get user settings
export async function getSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const settings = await getUserSettings(userId);
  sendSuccessResponse(res, 'Settings retrieved successfully', settings);
}

// Update user settings
export async function updateSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const updates = req.body;
  const settings = await updateUserSettings(userId, updates);
  sendSuccessResponse(res, 'Settings updated successfully', settings);
}

// Update appearance settings
export async function updateAppearance(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const appearance = req.body;
  const settings = await updateAppearanceSettings(userId, appearance);
  sendSuccessResponse(res, 'Appearance settings updated successfully', settings);
}

// Update notification settings
export async function updateNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const notifications = req.body;
  const settings = await updateNotificationSettings(userId, notifications);
  sendSuccessResponse(res, 'Notification settings updated successfully', settings);
}

// Update display settings
export async function updateDisplay(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const display = req.body;
  const settings = await updateDisplaySettings(userId, display);
  sendSuccessResponse(res, 'Display settings updated successfully', settings);
}

// Update security settings
export async function updateSecurity(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const security = req.body;
  const settings = await updateSecuritySettings(userId, security);
  sendSuccessResponse(res, 'Security settings updated successfully', settings);
}

// Update workspace settings
export async function updateWorkspace(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const workspace = req.body;
  const settings = await updateWorkspaceSettings(userId, workspace);
  sendSuccessResponse(res, 'Workspace settings updated successfully', settings);
}

// Get appearance settings only
export async function getAppearance(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const appearance = await getAppearanceSettings(userId);
  sendSuccessResponse(res, 'Appearance settings retrieved successfully', appearance);
}

// Get notification settings only
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const notifications = await getNotificationSettings(userId);
  sendSuccessResponse(res, 'Notification settings retrieved successfully', notifications);
}

// Get display settings only
export async function getDisplay(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const display = await getDisplaySettings(userId);
  sendSuccessResponse(res, 'Display settings retrieved successfully', display);
}

// Get security settings only
export async function getSecurity(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const security = await getSecuritySettings(userId);
  sendSuccessResponse(res, 'Security settings retrieved successfully', security);
}

// Get workspace settings only
export async function getWorkspace(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const workspace = await getWorkspaceSettings(userId);
  sendSuccessResponse(res, 'Workspace settings retrieved successfully', workspace);
}

// Reset settings
export async function resetUserSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { category } = req.body;
  const settings = await resetSettings(userId, category);
  sendSuccessResponse(res, 'Settings reset successfully', settings);
}

// Delete user settings
export async function deleteSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  await deleteUserSettings(userId);
  sendSuccessResponse(res, 'Settings deleted successfully', null);
}
