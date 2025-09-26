export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDatabases: number;
  totalNotes: number;
  systemHealth: 'Good' | 'Warning' | 'Critical';
  recentActivity: number;
  growthRate: number;
  uptime: number;
}

export interface AdminUserStats {
  total: number;
  active: number;
  admins: number;
  moderators: number;
  users: number;
}

export interface SystemHealthMetrics {
  status: 'Good' | 'Warning' | 'Critical';
  uptime: number;
  lastBackup: string;
  responseTime: number;
  errorRate: number;
}

export interface AdminAnalyticsData {
  period: string;
  metrics: {
    users: AdminUserStats;
    system: SystemHealthMetrics;
    activity: {
      totalSessions: number;
      averageSessionDuration: number;
      peakUsageHours: string[];
    };
  };
}
