import { Task } from '../models/task.model';
import { Types } from 'mongoose';

export interface AnalyticsOptions {
    period?: '7d' | '30d' | '90d' | '1y';
    startDate?: Date;
    endDate?: Date;
}

export const getTaskAnalytics = async (userId: string, options: AnalyticsOptions = {}) => {
    const { period = '30d' } = options;

    // Calculate date range based on period
    const now = new Date();
    let startDate = options.startDate || new Date();
    let endDate = options.endDate || now;
    
    if (!options.startDate) {
        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }
    }

    // Aggregate analytics data
    const analytics = await Task.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                createdAt: { $gte: startDate, $lte: endDate },
                archivedAt: { $exists: false }
            }
        },
        {
            $facet: {
                // Completion rate over time
                completionTrend: [
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                status: "$status"
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.date": 1 } }
                ],
                
                // Priority distribution
                priorityDistribution: [
                    {
                        $group: {
                            _id: "$priority",
                            count: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            }
                        }
                    }
                ],
                
                // Average completion time
                avgCompletionTime: [
                    {
                        $match: { 
                            status: "completed",
                            completedAt: { $exists: true },
                            estimatedTime: { $exists: true }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgEstimated: { $avg: "$estimatedTime" },
                            avgActual: { $avg: "$actualTime" },
                            totalTasks: { $sum: 1 }
                        }
                    }
                ],
                
                // Productivity by day of week
                productivityByDay: [
                    {
                        $match: { status: "completed", completedAt: { $exists: true } }
                    },
                    {
                        $group: {
                            _id: { $dayOfWeek: "$completedAt" },
                            count: { $sum: 1 },
                            avgTime: { $avg: "$actualTime" }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ],
                
                // Overdue tasks trend
                overdueTrend: [
                    {
                        $match: {
                            dueDate: { $exists: true, $lt: now },
                            status: { $ne: "completed" }
                        }
                    },
                    {
                        $group: {
                            _id: "$priority",
                            count: { $sum: 1 }
                        }
                    }
                ],

                // Task creation trend
                creationTrend: [
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ],

                // Energy level distribution
                energyDistribution: [
                    {
                        $group: {
                            _id: "$energy",
                            count: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            }
                        }
                    }
                ],

                // Context analysis
                contextAnalysis: [
                    { $unwind: { path: "$context", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: "$context",
                            count: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            }
                        }
                    },
                    { $match: { "_id": { $ne: null } } },
                    { $sort: { "count": -1 } },
                    { $limit: 10 }
                ],

                // Tag analysis
                tagAnalysis: [
                    { $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: "$tags",
                            count: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            }
                        }
                    },
                    { $match: { "_id": { $ne: null } } },
                    { $sort: { "count": -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ]);

    return {
        period,
        dateRange: { startDate, endDate },
        analytics: analytics[0] || {
            completionTrend: [],
            priorityDistribution: [],
            avgCompletionTime: [],
            productivityByDay: [],
            overdueTrend: [],
            creationTrend: [],
            energyDistribution: [],
            contextAnalysis: [],
            tagAnalysis: []
        }
    };
};

export const getProductivityInsights = async (userId: string) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const insights = await Task.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                createdAt: { $gte: thirtyDaysAgo },
                archivedAt: { $exists: false }
            }
        },
        {
            $facet: {
                // Most productive hours
                productiveHours: [
                    {
                        $match: { status: "completed", completedAt: { $exists: true } }
                    },
                    {
                        $group: {
                            _id: { $hour: "$completedAt" },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "count": -1 } },
                    { $limit: 5 }
                ],

                // Completion rate by priority
                completionByPriority: [
                    {
                        $group: {
                            _id: "$priority",
                            total: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                            }
                        }
                    },
                    {
                        $project: {
                            priority: "$_id",
                            total: 1,
                            completed: 1,
                            completionRate: {
                                $multiply: [
                                    { $divide: ["$completed", "$total"] },
                                    100
                                ]
                            }
                        }
                    }
                ],

                // Average task duration by energy level
                durationByEnergy: [
                    {
                        $match: { 
                            status: "completed", 
                            actualTime: { $exists: true, $gt: 0 } 
                        }
                    },
                    {
                        $group: {
                            _id: "$energy",
                            avgDuration: { $avg: "$actualTime" },
                            count: { $sum: 1 }
                        }
                    }
                ],

                // Streak analysis
                streakData: [
                    {
                        $match: { status: "completed", completedAt: { $exists: true } }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]
            }
        }
    ]);

    return insights[0] || {
        productiveHours: [],
        completionByPriority: [],
        durationByEnergy: [],
        streakData: []
    };
};

export const getTaskForecast = async (userId: string) => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const forecast = await Task.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                status: { $in: ['todo', 'in-progress'] },
                archivedAt: { $exists: false }
            }
        },
        {
            $facet: {
                // Upcoming deadlines
                upcomingDeadlines: [
                    {
                        $match: {
                            dueDate: { $exists: true, $gte: now, $lte: nextWeek }
                        }
                    },
                    { $sort: { dueDate: 1 } },
                    { $limit: 10 }
                ],

                // Overdue tasks
                overdueTasks: [
                    {
                        $match: {
                            dueDate: { $exists: true, $lt: now }
                        }
                    },
                    { $sort: { dueDate: 1 } }
                ],

                // Workload by day (next 7 days)
                workloadForecast: [
                    {
                        $match: {
                            dueDate: { $exists: true, $gte: now, $lte: nextWeek }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$dueDate" } },
                            taskCount: { $sum: 1 },
                            estimatedTime: { $sum: "$estimatedTime" },
                            highPriorityCount: {
                                $sum: { $cond: [{ $in: ["$priority", ["high", "urgent"]] }, 1, 0] }
                            }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]
            }
        }
    ]);

    return forecast[0] || {
        upcomingDeadlines: [],
        overdueTasks: [],
        workloadForecast: []
    };
};
