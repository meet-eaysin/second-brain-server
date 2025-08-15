export interface IDashboardAnalytics {
  totalDatabases: number;
  totalRecords: number;
  totalFiles: number;
  totalWorkspaces: number;
  recentActivity: IActivityItem[];
  usage: {
    databasesCreated: number;
    recordsCreated: number;
    filesUploaded: number;
    workspacesCreated: number;
  };
  trends: {
    databases: ITrendData[];
    records: ITrendData[];
    files: ITrendData[];
  };
}

export interface IDatabaseAnalytics {
  databaseId: string;
  databaseName: string;
  totalRecords: number;
  totalViews: number;
  totalProperties: number;
  recordsCreated: number;
  viewsCreated: number;
  lastAccessed: Date | null;
  accessCount: number;
  usage: ITrendData[];
  topProperties: IPropertyUsage[];
  recordActivity: IActivityItem[];
}

export interface IUsageStatistics {
  totalUsers: number;
  activeUsers: number;
  totalDatabases: number;
  totalRecords: number;
  totalFiles: number;
  totalWorkspaces: number;
  storageUsed: number;
  apiCalls: number;
  userGrowth: ITrendData[];
  contentGrowth: ITrendData[];
}

export interface IActivityItem {
  id: string;
  type: 'database_created' | 'record_created' | 'file_uploaded' | 'workspace_created';
  title: string;
  description?: string;
  userId: string;
  createdAt: Date;
}

export interface ITrendData {
  date: string;
  value: number;
}

export interface IPropertyUsage {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  usageCount: number;
  percentage: number;
}

// Request/Response types
export interface IAnalyticsQuery {
  period?: string;
}

export interface IDatabaseAnalyticsQuery extends IAnalyticsQuery {
  databaseId: string;
}

export interface IUsageStatisticsQuery extends IAnalyticsQuery {
  // Admin-only query parameters can be added here
}
