import { Schema, model, Document, Model } from 'mongoose';
import {
  ISettings,
  defaultAppearanceSettings,
  defaultNotificationSettings,
  defaultDisplaySettings,
  defaultSecuritySettings,
  defaultWorkspaceSettings
} from '../types/settings.types';

// Interface for the model with static methods
interface ISettingsModel extends Model<ISettings & Document> {
  findByUserId(userId: string): Promise<(ISettings & Document) | null>;
  findByUserIdOrCreate(userId: string): Promise<ISettings & Document>;
}

// Settings sub-schemas
const AppearanceSettingsSchema = new Schema(
  {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: defaultAppearanceSettings.theme
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: defaultAppearanceSettings.fontSize
    },
    compactMode: { type: Boolean, default: defaultAppearanceSettings.compactMode },
    animationsEnabled: { type: Boolean, default: defaultAppearanceSettings.animationsEnabled },
    highContrast: { type: Boolean, default: defaultAppearanceSettings.highContrast }
  },
  { _id: false }
);

const NotificationSettingsSchema = new Schema(
  {
    emailNotifications: { type: Boolean, default: defaultNotificationSettings.emailNotifications },
    pushNotifications: { type: Boolean, default: defaultNotificationSettings.pushNotifications },
    workspaceInvites: { type: Boolean, default: defaultNotificationSettings.workspaceInvites },
    databaseShares: { type: Boolean, default: defaultNotificationSettings.databaseShares },
    mentions: { type: Boolean, default: defaultNotificationSettings.mentions },
    weeklyDigest: { type: Boolean, default: defaultNotificationSettings.weeklyDigest },
    notificationFrequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily', 'weekly'],
      default: defaultNotificationSettings.notificationFrequency
    }
  },
  { _id: false }
);

const DisplaySettingsSchema = new Schema(
  {
    layoutDensity: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: defaultDisplaySettings.layoutDensity
    },
    sidebarWidth: {
      type: Number,
      min: 200,
      max: 400,
      default: defaultDisplaySettings.sidebarWidth
    },
    contentWidth: {
      type: String,
      enum: ['narrow', 'medium', 'wide', 'full'],
      default: defaultDisplaySettings.contentWidth
    },
    showGridLines: { type: Boolean, default: defaultDisplaySettings.showGridLines },
    enableAnimations: { type: Boolean, default: defaultDisplaySettings.enableAnimations },
    autoHideSidebar: { type: Boolean, default: defaultDisplaySettings.autoHideSidebar },
    fullscreenMode: { type: Boolean, default: defaultDisplaySettings.fullscreenMode },
    zoomLevel: { type: Number, min: 75, max: 150, default: defaultDisplaySettings.zoomLevel }
  },
  { _id: false }
);

const SecuritySettingsSchema = new Schema(
  {
    twoFactorEnabled: { type: Boolean, default: defaultSecuritySettings.twoFactorEnabled },
    twoFactorMethod: {
      type: String,
      enum: ['app', 'sms'],
      default: defaultSecuritySettings.twoFactorMethod
    },
    sessionTimeout: {
      type: Number,
      min: 1,
      max: 365,
      default: defaultSecuritySettings.sessionTimeout
    },
    loginAlerts: { type: Boolean, default: defaultSecuritySettings.loginAlerts }
  },
  { _id: false }
);

const WorkspaceSettingsSchema = new Schema(
  {
    defaultView: {
      type: String,
      enum: ['list', 'board', 'calendar', 'timeline'],
      default: defaultWorkspaceSettings.defaultView
    },
    autoSave: { type: Boolean, default: defaultWorkspaceSettings.autoSave },
    showCompleted: { type: Boolean, default: defaultWorkspaceSettings.showCompleted },
    timezone: { type: String, default: defaultWorkspaceSettings.timezone },
    dateFormat: { type: String, default: defaultWorkspaceSettings.dateFormat },
    timeFormat: { type: String, enum: ['12h', '24h'], default: defaultWorkspaceSettings.timeFormat }
  },
  { _id: false }
);

// Main Settings Schema
const SettingsSchema = new Schema<ISettings & Document>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    appearance: {
      type: AppearanceSettingsSchema,
      default: () => defaultAppearanceSettings
    },
    notifications: {
      type: NotificationSettingsSchema,
      default: () => defaultNotificationSettings
    },
    display: {
      type: DisplaySettingsSchema,
      default: () => defaultDisplaySettings
    },
    security: {
      type: SecuritySettingsSchema,
      default: () => defaultSecuritySettings
    },
    workspace: {
      type: WorkspaceSettingsSchema,
      default: () => defaultWorkspaceSettings
    }
  },
  {
    timestamps: true,
    collection: 'settings'
  }
);

// Indexes
SettingsSchema.index({ userId: 1 });
SettingsSchema.index({ createdAt: -1 });
SettingsSchema.index({ updatedAt: -1 });

// Pre-save middleware to ensure defaults are set
SettingsSchema.pre('save', function (next) {
  if (!this.appearance) {
    this.appearance = defaultAppearanceSettings;
  }
  if (!this.notifications) {
    this.notifications = defaultNotificationSettings;
  }
  if (!this.display) {
    this.display = defaultDisplaySettings;
  }
  if (!this.security) {
    this.security = defaultSecuritySettings;
  }
  if (!this.workspace) {
    this.workspace = defaultWorkspaceSettings;
  }
  next();
});

// Static methods
SettingsSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

SettingsSchema.statics.findByUserIdOrCreate = async function (userId: string) {
  let settings = await this.findOne({ userId });
  if (!settings) {
    settings = new this({ userId });
    await settings.save();
  }
  return settings;
};

// Instance methods
SettingsSchema.methods.updateAppearance = function (settings: Partial<ISettings['appearance']>) {
  this.appearance = { ...this.appearance, ...settings };
  return this.save();
};

SettingsSchema.methods.updateNotifications = function (
  settings: Partial<ISettings['notifications']>
) {
  this.notifications = { ...this.notifications, ...settings };
  return this.save();
};

SettingsSchema.methods.updateDisplay = function (settings: Partial<ISettings['display']>) {
  this.display = { ...this.display, ...settings };
  return this.save();
};

SettingsSchema.methods.updateSecurity = function (settings: Partial<ISettings['security']>) {
  this.security = { ...this.security, ...settings };
  return this.save();
};

SettingsSchema.methods.updateWorkspace = function (settings: Partial<ISettings['workspace']>) {
  this.workspace = { ...this.workspace, ...settings };
  return this.save();
};

export const Settings = model<ISettings & Document, ISettingsModel>('Settings', SettingsSchema);
export default Settings;
