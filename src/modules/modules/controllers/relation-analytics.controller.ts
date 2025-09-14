import { Request, Response, NextFunction } from 'express';
import { relationAnalyticsService } from '../services/relation-analytics.service';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { getUserId } from '@/auth/index';

// Get comprehensive relation analytics
export const getRelationAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const analytics = await relationAnalyticsService.generateRelationAnalytics(userId);

    sendSuccessResponse(res, 'Relation analytics generated successfully', analytics);
  }
);

// Get productivity insights
export const getProductivityInsights = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const insights = await relationAnalyticsService.generateProductivityInsights(userId);

    sendSuccessResponse(res, 'Productivity insights generated successfully', insights);
  }
);

// Get relation dashboard data
export const getRelationDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    // Get both analytics and productivity insights for dashboard
    const [analytics, productivityInsights] = await Promise.all([
      relationAnalyticsService.generateRelationAnalytics(userId),
      relationAnalyticsService.generateProductivityInsights(userId)
    ]);

    // Create dashboard summary
    const dashboard = {
      summary: {
        totalConnections: analytics.overview.totalConnections,
        activeModules: analytics.overview.activeModules,
        connectionDensity: analytics.overview.connectionDensity,
        healthScore: calculateHealthScore(analytics, productivityInsights)
      },
      quickStats: {
        mostConnectedModule: analytics.moduleBreakdown.reduce((prev, current) =>
          prev.connectionCount > current.connectionCount ? prev : current
        ),
        strongestRelation: analytics.relationPatterns.find(p => p.strength === 'strong'),
        recentGrowth: analytics.temporalAnalysis.growthRate,
        topRecommendation: analytics.recommendations[0]
      },
      charts: {
        moduleConnections: analytics.moduleBreakdown.map(m => ({
          module: m.module,
          connections: m.connectionCount
        })),
        relationStrength: analytics.relationPatterns.map(p => ({
          relation: `${p.sourceModule} → ${p.targetModule}`,
          strength: p.strength,
          count: p.connectionCount
        })),
        temporalTrend: analytics.temporalAnalysis.connectionsByMonth
      },
      productivity: {
        goalEffectiveness: productivityInsights.goalAchievement,
        workflowHealth: productivityInsights.workflowEfficiency,
        personalGrowth: productivityInsights.personalDevelopment
      }
    };

    sendSuccessResponse(res, 'Relation dashboard data retrieved successfully', dashboard);
  }
);

// Get relation recommendations
export const getRelationRecommendations = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { priority, type, limit } = req.query;

    const analytics = await relationAnalyticsService.generateRelationAnalytics(userId);
    const productivityInsights =
      await relationAnalyticsService.generateProductivityInsights(userId);

    // Combine recommendations from both sources
    let allRecommendations = [
      ...analytics.recommendations,
      ...productivityInsights.recommendations.map(r => ({
        type: 'productivity',
        priority: r.impact as 'high' | 'medium' | 'low',
        title: r.suggestion,
        description: `${r.area.charAt(0).toUpperCase() + r.area.slice(1)} improvement`,
        actionable: true,
        estimatedImpact: `${r.impact} impact, ${r.effort} effort`
      }))
    ];

    // Apply filters
    if (priority) {
      allRecommendations = allRecommendations.filter(r => r.priority === priority);
    }

    if (type) {
      allRecommendations = allRecommendations.filter(r => r.type === type);
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Apply limit
    if (limit) {
      allRecommendations = allRecommendations.slice(0, parseInt(limit as string));
    }

    sendSuccessResponse(res, 'Relation recommendations retrieved successfully', allRecommendations);
  }
);

// Get relation trends
export const getRelationTrends = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const { period, moduleType } = req.query;

    const analytics = await relationAnalyticsService.generateRelationAnalytics(userId);

    // Extract trend data
    const trends = {
      temporal: analytics.temporalAnalysis,
      moduleGrowth: analytics.moduleBreakdown.map(m => ({
        module: m.module,
        recordCount: m.recordCount,
        connectionCount: m.connectionCount,
        density: m.recordCount > 0 ? m.connectionCount / m.recordCount : 0
      })),
      relationEvolution: analytics.relationPatterns.map(p => ({
        relation: `${p.sourceModule} → ${p.targetModule}`,
        strength: p.strength,
        connectionCount: p.connectionCount,
        trend: 'stable' // This would be calculated from historical data
      }))
    };

    // Filter by module type if specified
    if (moduleType) {
      trends.moduleGrowth = trends.moduleGrowth.filter(m => m.module === moduleType);
      trends.relationEvolution = trends.relationEvolution.filter(r =>
        r.relation.includes(moduleType as string)
      );
    }

    sendSuccessResponse(res, 'Relation trends retrieved successfully', trends);
  }
);

// Get relation impact analysis
export const getRelationImpactAnalysis = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const [analytics, productivityInsights] = await Promise.all([
      relationAnalyticsService.generateRelationAnalytics(userId),
      relationAnalyticsService.generateProductivityInsights(userId)
    ]);

    // Calculate impact metrics
    const impactAnalysis = {
      productivityImpact: {
        goalAchievementBoost: calculateGoalBoost(productivityInsights.goalAchievement),
        workflowEfficiencyGain: calculateWorkflowGain(productivityInsights.workflowEfficiency),
        knowledgeReuseImprovement: productivityInsights.workflowEfficiency.knowledgeReuse * 100
      },
      organizationalImpact: {
        dataConnectivity: analytics.overview.connectionDensity * 100,
        informationDiscoverability: calculateDiscoverability(analytics),
        crossModuleInsights: analytics.relationPatterns.length
      },
      userExperience: {
        navigationEfficiency: calculateNavigationEfficiency(analytics),
        contextualRelevance: calculateContextualRelevance(analytics),
        workflowSmoothness: calculateWorkflowSmoothness(productivityInsights)
      },
      potentialImprovements: {
        connectionOpportunities:
          analytics.overview.totalRecords - analytics.overview.totalConnections,
        automationPotential: calculateAutomationPotential(analytics, productivityInsights),
        insightGeneration: calculateInsightPotential(analytics)
      }
    };

    sendSuccessResponse(res, 'Relation impact analysis completed successfully', impactAnalysis);
  }
);

// Get relation health metrics
export const getRelationHealthMetrics = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const analytics = await relationAnalyticsService.generateRelationAnalytics(userId);
    const productivityInsights =
      await relationAnalyticsService.generateProductivityInsights(userId);

    // Calculate health metrics
    const healthMetrics = {
      overallHealth: calculateHealthScore(analytics, productivityInsights),
      dimensions: {
        connectivity: {
          score: Math.min(analytics.overview.connectionDensity * 100, 100),
          status:
            analytics.overview.connectionDensity > 0.3
              ? 'good'
              : analytics.overview.connectionDensity > 0.1
                ? 'fair'
                : 'poor',
          description: 'How well your data is interconnected'
        },
        balance: {
          score: calculateBalanceScore(analytics.moduleBreakdown),
          status: getBalanceStatus(analytics.moduleBreakdown),
          description: 'Distribution of connections across modules'
        },
        productivity: {
          score: calculateProductivityScore(productivityInsights),
          status: getProductivityStatus(productivityInsights),
          description: 'How well relations support your productivity'
        },
        growth: {
          score: Math.max(0, Math.min(100, analytics.temporalAnalysis.growthRate + 50)),
          status:
            analytics.temporalAnalysis.growthRate > 10
              ? 'good'
              : analytics.temporalAnalysis.growthRate > 0
                ? 'fair'
                : 'poor',
          description: 'Rate of new connections being created'
        }
      },
      alerts: generateHealthAlerts(analytics, productivityInsights),
      recommendations: analytics.recommendations.slice(0, 3)
    };

    sendSuccessResponse(res, 'Relation health metrics calculated successfully', healthMetrics);
  }
);

// Helper functions
function calculateHealthScore(analytics: any, productivityInsights: any): number {
  const connectivityScore = Math.min(analytics.overview.connectionDensity * 100, 100);
  const productivityScore =
    ((productivityInsights.goalAchievement.goalsWithConnectedTasks +
      productivityInsights.workflowEfficiency.projectTaskAlignment +
      productivityInsights.personalDevelopment.habitGoalAlignment) /
      3) *
    100;

  return Math.round(connectivityScore * 0.4 + productivityScore * 0.6);
}

function calculateGoalBoost(goalAchievement: any): number {
  return Math.round(
    ((goalAchievement.goalsWithConnectedTasks + goalAchievement.goalsWithConnectedHabits) / 2) * 100
  );
}

function calculateWorkflowGain(workflowEfficiency: any): number {
  return Math.round(
    ((workflowEfficiency.projectTaskAlignment + workflowEfficiency.noteProjectConnection) / 2) * 100
  );
}

function calculateDiscoverability(analytics: any): number {
  return Math.min(analytics.overview.averageConnectionsPerRecord * 20, 100);
}

function calculateNavigationEfficiency(analytics: any): number {
  return Math.min(analytics.overview.connectionDensity * 200, 100);
}

function calculateContextualRelevance(analytics: any): number {
  const strongRelations = analytics.relationPatterns.filter(
    (p: any) => p.strength === 'strong'
  ).length;
  return Math.min(strongRelations * 25, 100);
}

function calculateWorkflowSmoothness(productivityInsights: any): number {
  return Math.round(
    ((productivityInsights.workflowEfficiency.projectTaskAlignment +
      productivityInsights.workflowEfficiency.resourceUtilization) /
      2) *
      100
  );
}

function calculateAutomationPotential(analytics: any, productivityInsights: any): number {
  return Math.round(
    analytics.relationPatterns.length * 10 +
      productivityInsights.workflowEfficiency.knowledgeReuse * 50
  );
}

function calculateInsightPotential(analytics: any): number {
  return Math.min(analytics.overview.totalConnections * 2, 100);
}

function calculateBalanceScore(moduleBreakdown: any[]): number {
  if (moduleBreakdown.length === 0) return 0;

  const connections = moduleBreakdown.map(m => m.connectionCount);
  const mean = connections.reduce((a, b) => a + b, 0) / connections.length;
  const variance = connections.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / connections.length;

  // Lower variance = better balance
  return Math.max(0, 100 - variance);
}

function getBalanceStatus(moduleBreakdown: any[]): string {
  const score = calculateBalanceScore(moduleBreakdown);
  return score > 70 ? 'good' : score > 40 ? 'fair' : 'poor';
}

function calculateProductivityScore(productivityInsights: any): number {
  return Math.round(
    ((productivityInsights.goalAchievement.goalsWithConnectedTasks +
      productivityInsights.workflowEfficiency.projectTaskAlignment +
      productivityInsights.personalDevelopment.habitGoalAlignment) /
      3) *
      100
  );
}

function getProductivityStatus(productivityInsights: any): string {
  const score = calculateProductivityScore(productivityInsights);
  return score > 70 ? 'good' : score > 40 ? 'fair' : 'poor';
}

function generateHealthAlerts(analytics: any, productivityInsights: any): any[] {
  const alerts = [];

  if (analytics.overview.connectionDensity < 0.1) {
    alerts.push({
      type: 'warning',
      title: 'Low Connectivity',
      message: 'Your data has very few connections. Consider linking related items.',
      priority: 'high'
    });
  }

  if (productivityInsights.goalAchievement.goalsWithConnectedTasks < 0.5) {
    alerts.push({
      type: 'info',
      title: 'Goal-Task Alignment',
      message: 'Many goals lack connected tasks. Link tasks to goals for better tracking.',
      priority: 'medium'
    });
  }

  return alerts;
}
