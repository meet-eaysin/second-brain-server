import { Request, Response, NextFunction } from 'express';
import { projectsService } from '../services/projects.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreateProjectRequest,
  IUpdateProjectRequest,
  IProjectQueryParams,
  EProjectStatus,
  EProjectCategory,
  EProjectPriority,
  EProjectPhase
} from '../types/projects.types';

// ===== PROJECT CONTROLLERS =====

export const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreateProjectRequest = req.body;
    const userId = getUserId(req);

    const project = await projectsService.createProject(data, userId);

    sendSuccessResponse(res, 'Project created successfully', project, 201);
  }
);

export const getProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IProjectQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'Projects retrieved successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getProjectById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const project = await projectsService.getProjectById(id, userId);

    sendSuccessResponse(res, 'Project retrieved successfully', project);
  }
);

export const updateProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdateProjectRequest = req.body;
    const userId = getUserId(req);

    const project = await projectsService.updateProject(id, data, userId);

    sendSuccessResponse(res, 'Project updated successfully', project);
  }
);

export const deleteProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await projectsService.deleteProject(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Project deleted successfully', null, 204);
  }
);

// ===== PROJECT ANALYTICS =====

export const getActiveProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IProjectQueryParams = {
      ...(req.query as any),
      status: [EProjectStatus.ACTIVE, EProjectStatus.PLANNING]
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'Active projects retrieved successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getCompletedProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IProjectQueryParams = {
      ...(req.query as any),
      status: [EProjectStatus.COMPLETED]
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'Completed projects retrieved successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getProjectsByStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.params;
    const params: IProjectQueryParams = {
      ...(req.query as any),
      status: [status as EProjectStatus]
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(
      res,
      `Projects with status "${status}" retrieved successfully`,
      result.projects,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getProjectsByCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const params: IProjectQueryParams = {
      ...(req.query as any),
      category: [category as EProjectCategory]
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(
      res,
      `Projects in category "${category}" retrieved successfully`,
      result.projects,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getProjectsByPriority = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { priority } = req.params;
    const params: IProjectQueryParams = {
      ...(req.query as any),
      priority: [priority as EProjectPriority]
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(
      res,
      `Projects with priority "${priority}" retrieved successfully`,
      result.projects,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getMyProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const params: IProjectQueryParams = {
      ...(req.query as any),
      ownerId: userId
    };

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'My projects retrieved successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const getProjectsImInvolvedIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const params: IProjectQueryParams = {
      ...(req.query as any),
      teamMemberId: userId
    };

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(
      res,
      'Projects I am involved in retrieved successfully',
      result.projects,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getProjectTemplates = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IProjectQueryParams = {
      ...(req.query as any),
      isTemplate: true
    };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'Project templates retrieved successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

export const searchProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IProjectQueryParams = { ...(req.query as any), search: search as string };
    const userId = getUserId(req);

    const result = await projectsService.getProjects(params, userId);

    sendPaginatedResponse(res, 'Project search completed successfully', result.projects, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    });
  }
);

// ===== PROJECT ACTIONS =====

export const startProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const project = await projectsService.updateProject(
      id,
      {
        status: EProjectStatus.ACTIVE,
        phase: EProjectPhase.EXECUTION
      },
      userId
    );

    sendSuccessResponse(res, 'Project started successfully', project);
  }
);

export const completeProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const project = await projectsService.updateProject(
      id,
      {
        status: EProjectStatus.COMPLETED,
        phase: EProjectPhase.CLOSURE,
        progressPercentage: 100
      },
      userId
    );

    sendSuccessResponse(res, 'Project completed successfully', project);
  }
);

export const pauseProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const project = await projectsService.updateProject(
      id,
      {
        status: EProjectStatus.ON_HOLD
      },
      userId
    );

    sendSuccessResponse(res, 'Project paused successfully', project);
  }
);

export const archiveProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const project = await projectsService.updateProject(
      id,
      {
        isArchived: true
      },
      userId
    );

    sendSuccessResponse(res, 'Project archived successfully', project);
  }
);

export const duplicateProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, databaseId } = req.body;
    const userId = getUserId(req);

    // Get the original project
    const originalProject = await projectsService.getProjectById(id, userId);

    // Create duplicate with new values
    const duplicateData: ICreateProjectRequest = {
      databaseId: databaseId || originalProject.databaseId,
      name: name || `${originalProject.name} (Copy)`,
      description: originalProject.description,
      category: originalProject.category,
      priority: originalProject.priority,
      phase: EProjectPhase.INITIATION,
      startDate: originalProject.startDate,
      endDate: originalProject.endDate,
      ownerId: userId, // Set current user as owner
      teamMemberIds: [...originalProject.teamMemberIds],
      stakeholderIds: [...originalProject.stakeholderIds],
      objectives: [...originalProject.objectives],
      tags: [...originalProject.tags],
      customFields: { ...originalProject.customFields },
      budget: originalProject.budget
        ? {
            totalBudget: originalProject.budget.totalBudget,
            currency: originalProject.budget.currency,
            categories: originalProject.budget.categories.map(cat => ({
              name: cat.name,
              budgeted: cat.budgeted
            }))
          }
        : undefined,
      timeTracking: originalProject.timeTracking
        ? {
            estimatedHours: originalProject.timeTracking.estimatedHours
          }
        : undefined,
      milestones: originalProject.milestones.map(milestone => ({
        title: milestone.title,
        description: milestone.description,
        targetDate: milestone.targetDate,
        order: milestone.order
      })),
      deliverables: originalProject.deliverables.map(deliverable => ({
        title: deliverable.title,
        description: deliverable.description,
        type: deliverable.type,
        assigneeId: deliverable.assigneeId,
        dueDate: deliverable.dueDate
      })),
      isTemplate: false,
      isPublic: originalProject.isPublic,
      notificationSettings: { ...originalProject.notificationSettings }
    };

    const duplicatedProject = await projectsService.createProject(duplicateData, userId);

    sendSuccessResponse(res, 'Project duplicated successfully', duplicatedProject, 201);
  }
);

export const bulkUpdateProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { projectIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      projectIds.map((projectId: string) =>
        projectsService.updateProject(projectId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: projectIds.length,
      results: results.map((result, index) => ({
        projectId: projectIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeleteProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { projectIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      projectIds.map((projectId: string) =>
        projectsService.deleteProject(projectId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: projectIds.length
    });
  }
);

// ===== STATISTICS =====

export const getProjectStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    // This would be implemented in the service
    // For now, return a placeholder response
    const stats = {
      total: 0,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      byPhase: {},
      averageProgress: 0,
      completedProjects: 0,
      overdueProjects: 0,
      projectsStartingThisWeek: 0,
      projectsEndingThisWeek: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      totalTeamMembers: 0,
      averageTeamSize: 0,
      recentlyCompleted: [],
      upcomingDeadlines: [],
      onTimeCompletionRate: 0,
      budgetComplianceRate: 0,
      averageProjectDuration: 0
    };

    sendSuccessResponse(res, 'Project statistics retrieved successfully', stats);
  }
);

export const projectsController = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getActiveProjects,
  getCompletedProjects,
  getProjectsByStatus,
  getProjectsByCategory,
  getProjectsByPriority,
  getMyProjects,
  getProjectsImInvolvedIn,
  getProjectTemplates,
  searchProjects,
  startProject,
  completeProject,
  pauseProject,
  archiveProject,
  duplicateProject,
  bulkUpdateProjects,
  bulkDeleteProjects,
  getProjectStats
};
