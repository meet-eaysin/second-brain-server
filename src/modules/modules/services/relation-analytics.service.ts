import { ObjectId } from 'mongodb';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { crossModuleRelationsService } from './cross-module-relations.service';
import { EDatabaseType } from '@/modules/core/types/database.types';

export interface IRelationAnalytics {
  overview: {
    totalModules: number;
    activeModules: number;
    totalRecords: number;
    totalConnections: number;
    averageConnectionsPerRecord: number;
    connectionDensity: number;
  };
  moduleBreakdown: Array<{
    module: EDatabaseType;
    recordCount: number;
    connectionCount: number;
    averageConnectionsPerRecord: number;
    mostConnectedRecord: {
      id: string;
      title: string;
      connectionCount: number;
    };
  }>;
  relationPatterns: Array<{
    sourceModule: EDatabaseType;
    targetModule: EDatabaseType;
    connectionCount: number;
    strength: 'weak' | 'moderate' | 'strong';
    bidirectional: boolean;
  }>;
  temporalAnalysis: {
    connectionsByMonth: { [month: string]: number };
    growthRate: number;
    peakActivity: {
      month: string;
      connectionCount: number;
    };
  };
  contentAnalysis: {
    topTags: Array<{ tag: string; connectionCount: number }>;
    topCategories: Array<{ category: string; connectionCount: number }>;
    semanticClusters: Array<{
      clusterId: string;
      theme: string;
      recordCount: number;
      modules: EDatabaseType[];
    }>;
  };
  recommendations: Array<{
    type: 'connection' | 'organization' | 'cleanup';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionable: boolean;
    estimatedImpact: string;
  }>;
}

export interface IProductivityInsights {
  goalAchievement: {
    goalsWithConnectedTasks: number;
    goalsWithConnectedHabits: number;
    averageTasksPerGoal: number;
    averageHabitsPerGoal: number;
    completionCorrelation: number;
  };
  workflowEfficiency: {
    projectTaskAlignment: number;
    noteProjectConnection: number;
    resourceUtilization: number;
    knowledgeReuse: number;
  };
  personalDevelopment: {
    habitGoalAlignment: number;
    journalReflectionDepth: number;
    learningResourceConnection: number;
    moodProductivityCorrelation: number;
  };
  recommendations: Array<{
    area: 'goals' | 'projects' | 'habits' | 'knowledge';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
}

export class RelationAnalyticsService {
  // Generate comprehensive relation analytics
  async generateRelationAnalytics(userId: string): Promise<IRelationAnalytics> {
    const userModules = await this.getUserModules(userId);
    const insights = await crossModuleRelationsService.getRelationInsights(userId);

    // Calculate overview metrics
    const totalModules = userModules.length;
    const activeModules = userModules.filter(m => m.isActive !== false).length;

    let totalRecords = 0;
    const moduleBreakdown = [];

    for (const module of userModules) {
      const recordCount = await RecordModel.countDocuments({
        databaseId: module._id.toString(),
        isDeleted: { $ne: true }
      });

      totalRecords += recordCount;

      const stats = await crossModuleRelationsService.getModuleRelationStats(module.type, userId);
      const mostConnected = stats.mostConnectedRecords[0] || {
        recordId: '',
        recordTitle: 'No records',
        connectionCount: 0
      };

      moduleBreakdown.push({
        module: module.type,
        recordCount,
        connectionCount: stats.totalRelations,
        averageConnectionsPerRecord: recordCount > 0 ? stats.totalRelations / recordCount : 0,
        mostConnectedRecord: {
          id: mostConnected.recordId,
          title: mostConnected.recordTitle,
          connectionCount: mostConnected.connectionCount
        }
      });
    }

    const totalConnections = insights.totalCrossModuleConnections;
    const averageConnectionsPerRecord = totalRecords > 0 ? totalConnections / totalRecords : 0;
    const maxPossibleConnections = totalRecords * (totalRecords - 1) / 2;
    const connectionDensity = maxPossibleConnections > 0 ? totalConnections / maxPossibleConnections : 0;

    // Analyze relation patterns
    const relationPatterns = insights.relationPatterns.map(pattern => ({
      sourceModule: pattern.sourceModule,
      targetModule: pattern.targetModule,
      connectionCount: pattern.connectionCount,
      strength: this.calculateRelationStrength(pattern.connectionCount, totalConnections),
      bidirectional: this.checkBidirectional(pattern, insights.relationPatterns)
    }));

    // Temporal analysis
    const temporalAnalysis = await this.analyzeTemporalPatterns(userId);

    // Content analysis
    const contentAnalysis = await this.analyzeContent(userId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      { totalModules, activeModules, totalRecords, totalConnections, averageConnectionsPerRecord, connectionDensity },
      moduleBreakdown,
      insights
    );

    return {
      overview: {
        totalModules,
        activeModules,
        totalRecords,
        totalConnections,
        averageConnectionsPerRecord,
        connectionDensity
      },
      moduleBreakdown,
      relationPatterns,
      temporalAnalysis,
      contentAnalysis,
      recommendations
    };
  }

  // Generate productivity-focused insights
  async generateProductivityInsights(userId: string): Promise<IProductivityInsights> {
    // Goal achievement analysis
    const goalAchievement = await this.analyzeGoalAchievement(userId);

    // Workflow efficiency analysis
    const workflowEfficiency = await this.analyzeWorkflowEfficiency(userId);

    // Personal development analysis
    const personalDevelopment = await this.analyzePersonalDevelopment(userId);

    // Generate productivity recommendations
    const recommendations = this.generateProductivityRecommendations(
      goalAchievement,
      workflowEfficiency,
      personalDevelopment
    );

    return {
      goalAchievement,
      workflowEfficiency,
      personalDevelopment,
      recommendations
    };
  }

  // Analyze goal achievement patterns
  private async analyzeGoalAchievement(userId: string): Promise<any> {
    const goalsDb = await DatabaseModel.findOne({ type: EDatabaseType.GOALS, createdBy: userId });
    if (!goalsDb) return this.getEmptyGoalAnalysis();

    const goals = await RecordModel.find({
      databaseId: goalsDb.id.toString(),
      isDeleted: { $ne: true }
    });

    let goalsWithConnectedTasks = 0;
    let goalsWithConnectedHabits = 0;
    let totalTaskConnections = 0;
    let totalHabitConnections = 0;

    for (const goal of goals) {
      const relatedRecords = await crossModuleRelationsService.getRelatedRecords(
        goal.id.toString(),
        { moduleTypes: [EDatabaseType.TASKS, EDatabaseType.HABITS] }
      );

      const taskConnections = relatedRecords.filter(r => r.module === EDatabaseType.TASKS);
      const habitConnections = relatedRecords.filter(r => r.module === EDatabaseType.HABITS);

      if (taskConnections.length > 0) {
        goalsWithConnectedTasks++;
        totalTaskConnections += taskConnections.length;
      }

      if (habitConnections.length > 0) {
        goalsWithConnectedHabits++;
        totalHabitConnections += habitConnections.length;
      }
    }

    return {
      goalsWithConnectedTasks,
      goalsWithConnectedHabits,
      averageTasksPerGoal: goals.length > 0 ? totalTaskConnections / goals.length : 0,
      averageHabitsPerGoal: goals.length > 0 ? totalHabitConnections / goals.length : 0,
      completionCorrelation: this.calculateCompletionCorrelation(goals)
    };
  }

  // Analyze workflow efficiency
  private async analyzeWorkflowEfficiency(userId: string): Promise<any> {
    const projectsDb = await DatabaseModel.findOne({ type: EDatabaseType.PARA_PROJECTS, createdBy: userId });

    if (!projectsDb) return this.getEmptyWorkflowAnalysis();

    const projects = await RecordModel.find({
      databaseId: projectsDb.id.toString(),
      isDeleted: { $ne: true }
    });

    let projectsWithTasks = 0;
    let projectsWithNotes = 0;
    let projectsWithResources = 0;

    for (const project of projects) {
      const relatedRecords = await crossModuleRelationsService.getRelatedRecords(
        project.id.toString(),
        { moduleTypes: [EDatabaseType.TASKS, EDatabaseType.NOTES, EDatabaseType.PARA_RESOURCES] }
      );

      if (relatedRecords.some(r => r.module === EDatabaseType.TASKS)) projectsWithTasks++;
      if (relatedRecords.some(r => r.module === EDatabaseType.NOTES)) projectsWithNotes++;
      if (relatedRecords.some(r => r.module === EDatabaseType.PARA_RESOURCES)) projectsWithResources++;
    }

    const totalProjects = projects.length;

    return {
      projectTaskAlignment: totalProjects > 0 ? projectsWithTasks / totalProjects : 0,
      noteProjectConnection: totalProjects > 0 ? projectsWithNotes / totalProjects : 0,
      resourceUtilization: totalProjects > 0 ? projectsWithResources / totalProjects : 0,
      knowledgeReuse: await this.calculateKnowledgeReuse(userId)
    };
  }

  // Analyze personal development patterns
  private async analyzePersonalDevelopment(userId: string): Promise<any> {
    const habitsDb = await DatabaseModel.findOne({ type: EDatabaseType.HABITS, createdBy: userId });
    const journalDb = await DatabaseModel.findOne({ type: EDatabaseType.JOURNAL, createdBy: userId });

    if (!habitsDb || !journalDb) return this.getEmptyPersonalDevelopmentAnalysis();

    // Calculate habit-goal alignment
    const habits = await RecordModel.find({
      databaseId: habitsDb.id.toString(),
      isDeleted: { $ne: true }
    });

    let habitsWithGoals = 0;
    for (const habit of habits) {
      const relatedRecords = await crossModuleRelationsService.getRelatedRecords(
        habit.id.toString(),
        { moduleTypes: [EDatabaseType.GOALS] }
      );
      if (relatedRecords.length > 0) habitsWithGoals++;
    }

    const habitGoalAlignment = habits.length > 0 ? habitsWithGoals / habits.length : 0;

    // Calculate journal reflection depth
    const journalEntries = await RecordModel.find({
      databaseId: journalDb.id.toString(),
      isDeleted: { $ne: true }
    });

    let entriesWithConnections = 0;
    for (const entry of journalEntries) {
      const relatedRecords = await crossModuleRelationsService.getRelatedRecords(entry.id.toString());
      if (relatedRecords.length > 0) entriesWithConnections++;
    }

    const journalReflectionDepth = journalEntries.length > 0 ? entriesWithConnections / journalEntries.length : 0;

    return {
      habitGoalAlignment,
      journalReflectionDepth,
      learningResourceConnection: await this.calculateLearningResourceConnection(userId),
      moodProductivityCorrelation: await this.calculateMoodProductivityCorrelation(userId)
    };
  }

  // Private helper methods
  private async getUserModules(userId: string): Promise<any[]> {
    return DatabaseModel.find({
      createdBy: userId,
      isDeleted: { $ne: true }
    });
  }

  private calculateRelationStrength(connectionCount: number, totalConnections: number): 'weak' | 'moderate' | 'strong' {
    const percentage = totalConnections > 0 ? (connectionCount / totalConnections) * 100 : 0;

    if (percentage >= 20) return 'strong';
    if (percentage >= 5) return 'moderate';
    return 'weak';
  }

  private checkBidirectional(pattern: any, allPatterns: any[]): boolean {
    return allPatterns.some(p =>
      p.sourceModule === pattern.targetModule &&
      p.targetModule === pattern.sourceModule
    );
  }

  private async analyzeTemporalPatterns(userId: string): Promise<any> {
    // Simplified temporal analysis
    const connectionsByMonth: { [month: string]: number } = {};
    const currentDate = new Date();

    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      connectionsByMonth[monthKey] = Math.floor(Math.random() * 20); // Placeholder data
    }

    const months = Object.keys(connectionsByMonth);
    const values = Object.values(connectionsByMonth);
    const growthRate = values.length > 1 ?
      ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

    const peakMonth = months[values.indexOf(Math.max(...values))];

    return {
      connectionsByMonth,
      growthRate,
      peakActivity: {
        month: peakMonth,
        connectionCount: Math.max(...values)
      }
    };
  }

  private async analyzeContent(userId: string): Promise<any> {
    // Simplified content analysis
    return {
      topTags: [
        { tag: 'productivity', connectionCount: 15 },
        { tag: 'learning', connectionCount: 12 },
        { tag: 'health', connectionCount: 8 }
      ],
      topCategories: [
        { category: 'work', connectionCount: 25 },
        { category: 'personal', connectionCount: 18 },
        { category: 'learning', connectionCount: 12 }
      ],
      semanticClusters: [
        {
          clusterId: 'cluster-1',
          theme: 'Professional Development',
          recordCount: 15,
          modules: [EDatabaseType.GOALS, EDatabaseType.TASKS, EDatabaseType.PARA_RESOURCES]
        }
      ]
    };
  }

  private generateRecommendations(overview: any, moduleBreakdown: any[], insights: any): any[] {
    const recommendations = [];

    if (overview.connectionDensity < 0.1) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        title: 'Increase Cross-Module Connections',
        description: 'Your data has low connectivity. Consider linking related items across modules.',
        actionable: true,
        estimatedImpact: 'High - Better insights and workflow efficiency'
      });
    }

    if (insights.orphanedRecords.length > 5) {
      recommendations.push({
        type: 'cleanup',
        priority: 'medium',
        title: 'Connect Orphaned Records',
        description: `You have ${insights.orphanedRecords.length} unconnected records that could be linked.`,
        actionable: true,
        estimatedImpact: 'Medium - Improved data organization'
      });
    }

    return recommendations;
  }

  private generateProductivityRecommendations(goalAchievement: any, workflowEfficiency: any, personalDevelopment: any): any[] {
    const recommendations = [];

    if (goalAchievement.goalsWithConnectedTasks < goalAchievement.goalsWithConnectedTasks * 0.5) {
      recommendations.push({
        area: 'goals',
        suggestion: 'Connect more tasks to your goals to improve achievement tracking',
        impact: 'high',
        effort: 'low'
      });
    }

    if (workflowEfficiency.projectTaskAlignment < 0.7) {
      recommendations.push({
        area: 'projects',
        suggestion: 'Link tasks to projects for better project management',
        impact: 'high',
        effort: 'medium'
      });
    }

    return recommendations;
  }

  // Placeholder methods for complex calculations
  private calculateCompletionCorrelation(goals: any[]): number {
    return 0.75; // Placeholder
  }

  private async calculateKnowledgeReuse(userId: string): Promise<number> {
    return 0.6; // Placeholder
  }

  private async calculateLearningResourceConnection(userId: string): Promise<number> {
    return 0.8; // Placeholder
  }

  private async calculateMoodProductivityCorrelation(userId: string): Promise<number> {
    return 0.65; // Placeholder
  }

  private getEmptyGoalAnalysis(): any {
    return {
      goalsWithConnectedTasks: 0,
      goalsWithConnectedHabits: 0,
      averageTasksPerGoal: 0,
      averageHabitsPerGoal: 0,
      completionCorrelation: 0
    };
  }

  private getEmptyWorkflowAnalysis(): any {
    return {
      projectTaskAlignment: 0,
      noteProjectConnection: 0,
      resourceUtilization: 0,
      knowledgeReuse: 0
    };
  }

  private getEmptyPersonalDevelopmentAnalysis(): any {
    return {
      habitGoalAlignment: 0,
      journalReflectionDepth: 0,
      learningResourceConnection: 0,
      moodProductivityCorrelation: 0
    };
  }
}

export const relationAnalyticsService = new RelationAnalyticsService();
