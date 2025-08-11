import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as projectService from '../services/project.service';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

// Get all projects with rich data
export const getProjects = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const {
        status,
        area,
        tags,
        goal,
        includeStats = true,
        page = 1,
        limit = 50
    } = req.query;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const filters = {
        status: status as string,
        area: area as string,
        tags: tags as string | string[],
        goal: goal as string,
        search: req.query.search as string
    };

    const options = {
        page: Number(page),
        limit: Number(limit),
        includeStats: includeStats === 'true'
    };

    const result = await projectService.getProjects(userId, filters, options);
    sendSuccessResponse(res, 'Projects retrieved successfully', result);
});

// Get single project with full details
export const getProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.getProjectById(userId, id);
    sendSuccessResponse(res, 'Project retrieved successfully', project);
});

// Create project with automatic relationships
export const createProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.createProjectWithRelationships(userId, req.body);
    sendSuccessResponse(res, 'Project created successfully', project, 201);
});

// Update project with relationship management
export const updateProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.updateProjectWithRelationships(userId, id, req.body);
    sendSuccessResponse(res, 'Project updated successfully', project);
});

// Delete project with cleanup
export const deleteProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    await projectService.deleteProjectWithCleanup(userId, id);
    res.status(204).json({
        success: true,
        data: null
    });
});

// Get project statistics
export const getProjectStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const stats = await projectService.getProjectStats(userId, id);
    sendSuccessResponse(res, 'Project statistics retrieved successfully', stats);
});

// Add missing controller methods
export const getProjectAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const analytics = await projectService.getProjectAnalytics(userId);
    sendSuccessResponse(res, 'Project analytics retrieved successfully', analytics);
});

export const importProjects = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement project import functionality
    sendSuccessResponse(res, 'Project import functionality not yet implemented', null);
});

export const exportProjects = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement project export functionality
    sendSuccessResponse(res, 'Project export functionality not yet implemented', null);
});

export const bulkUpdateProjects = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { projectIds, updateData } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await projectService.bulkUpdateProjects(userId, projectIds, updateData);
    sendSuccessResponse(res, 'Projects updated successfully', result);
});

export const bulkDeleteProjects = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { projectIds } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await projectService.bulkDeleteProjects(userId, projectIds);
    sendSuccessResponse(res, 'Projects deleted successfully', result);
});

export const archiveProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.archiveProject(userId, id);
    sendSuccessResponse(res, 'Project archived successfully', project);
});

export const completeProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.completeProject(userId, id);
    sendSuccessResponse(res, 'Project completed successfully', project);
});

export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.toggleProjectFavorite(userId, id);
    sendSuccessResponse(res, 'Project favorite status updated', project);
});

export const duplicateProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.duplicateProject(userId, id);
    sendSuccessResponse(res, 'Project duplicated successfully', project, 201);
});

export const addTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { taskId } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await projectService.addTaskToProject(userId, id, taskId);
    sendSuccessResponse(res, 'Task added to project successfully', result);
});

export const removeTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { projectId, taskId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const result = await projectService.removeTaskFromProject(userId, projectId, taskId);
    sendSuccessResponse(res, 'Task removed from project successfully', result);
});

export const addMember = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { memberId } = req.body;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.addMemberToProject(userId, id, memberId);
    sendSuccessResponse(res, 'Member added to project successfully', project);
});

export const removeMember = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { projectId, memberId } = req.params;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    const project = await projectService.removeMemberFromProject(userId, projectId, memberId);
    sendSuccessResponse(res, 'Member removed from project successfully', project);
});

// Milestone methods (placeholder implementations)
export const addMilestone = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement milestone functionality
    sendSuccessResponse(res, 'Milestone functionality not yet implemented', null);
});

export const updateMilestone = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement milestone functionality
    sendSuccessResponse(res, 'Milestone functionality not yet implemented', null);
});

export const deleteMilestone = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return sendErrorResponse(res, 'User not authenticated', 401);
    }

    // TODO: Implement milestone functionality
    sendSuccessResponse(res, 'Milestone functionality not yet implemented', null);
});
