import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import {
  IProject,
  IProjectStats,
  ICreateProjectRequest,
  IUpdateProjectRequest,
  IProjectQueryParams,
  IUpdateMilestoneRequest,
  IUpdateDeliverableRequest,
  IAddTimeEntryRequest,
  EProjectStatus,
  EProjectCategory,
  EProjectPriority,
  EProjectPhase
} from '../types/projects.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

// ===== HELPER METHODS =====

function buildProjectsQuery(params: IProjectQueryParams, userId: string): any {
  const query: any = {
    isDeleted: { $ne: true }
  };

  if (params.databaseId) {
    query.databaseId = params.databaseId;
  }

  if (params.status && params.status.length > 0) {
    query['properties.Status'] = { $in: params.status };
  }

  if (params.category && params.category.length > 0) {
    query['properties.Category'] = { $in: params.category };
  }

  if (params.priority && params.priority.length > 0) {
    query['properties.Priority'] = { $in: params.priority };
  }

  if (params.phase && params.phase.length > 0) {
    query['properties.Phase'] = { $in: params.phase };
  }

  if (params.ownerId) {
    query['properties.Owner ID'] = params.ownerId;
  }

  if (params.teamMemberId) {
    query['properties.Team Member IDs'] = { $in: [params.teamMemberId] };
  }

  if (params.tags && params.tags.length > 0) {
    query['properties.Tags'] = { $in: params.tags };
  }

  if (params.search) {
    query.$or = [
      { 'properties.Name': { $regex: params.search, $options: 'i' } },
      { 'properties.Description': { $regex: params.search, $options: 'i' } },
      { 'properties.Objectives': { $elemMatch: { $regex: params.search, $options: 'i' } } }
    ];
  }

  if (params.isArchived !== undefined) {
    query['properties.Is Archived'] = params.isArchived;
  }

  if (params.isTemplate !== undefined) {
    query['properties.Is Template'] = params.isTemplate;
  }

  if (params.isPublic !== undefined) {
    query['properties.Is Public'] = params.isPublic;
  }

  if (params.startDateAfter || params.startDateBefore) {
    const dateQuery: any = {};
    if (params.startDateAfter) {
      dateQuery.$gte = params.startDateAfter;
    }
    if (params.startDateBefore) {
      dateQuery.$lte = params.startDateBefore;
    }
    query['properties.Start Date'] = dateQuery;
  }

  if (params.endDateAfter || params.endDateBefore) {
    const dateQuery: any = {};
    if (params.endDateAfter) {
      dateQuery.$gte = params.endDateAfter;
    }
    if (params.endDateBefore) {
      dateQuery.$lte = params.endDateBefore;
    }
    query['properties.End Date'] = dateQuery;
  }

  if (params.progressMin !== undefined || params.progressMax !== undefined) {
    const progressQuery: any = {};
    if (params.progressMin !== undefined) {
      progressQuery.$gte = params.progressMin;
    }
    if (params.progressMax !== undefined) {
      progressQuery.$lte = params.progressMax;
    }
    query['properties.Progress Percentage'] = progressQuery;
  }

  if (params.budgetMin !== undefined || params.budgetMax !== undefined) {
    const budgetQuery: any = {};
    if (params.budgetMin !== undefined) {
      budgetQuery.$gte = params.budgetMin;
    }
    if (params.budgetMax !== undefined) {
      budgetQuery.$lte = params.budgetMax;
    }
    query['properties.Budget.totalBudget'] = budgetQuery;
  }

  return query;
}

function mapSortField(sortBy: string): string {
  const fieldMap: Record<string, string> = {
    name: 'properties.Name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    startDate: 'properties.Start Date',
    endDate: 'properties.End Date',
    priority: 'properties.Priority',
    progress: 'properties.Progress Percentage'
  };
  return fieldMap[sortBy] || 'updatedAt';
}

function formatProjectResponse(record: any): IProject {
  return {
    id: record._id.toString(),
    databaseId: record.databaseId,
    name: record.properties.Name || '',
    description: record.properties.Description,
    category: record.properties.Category || EProjectCategory.OTHER,
    status: record.properties.Status || EProjectStatus.PLANNING,
    priority: record.properties.Priority || EProjectPriority.MEDIUM,
    phase: record.properties.Phase || EProjectPhase.INITIATION,
    startDate: record.properties['Start Date'],
    endDate: record.properties['End Date'],
    actualStartDate: record.properties['Actual Start Date'],
    actualEndDate: record.properties['Actual End Date'],
    progressPercentage: record.properties['Progress Percentage'] || 0,
    milestones: record.properties.Milestones || [],
    deliverables: record.properties.Deliverables || [],
    ownerId: record.properties['Owner ID'] || record.createdBy,
    teamMemberIds: record.properties['Team Member IDs'] || [],
    stakeholderIds: record.properties['Stakeholder IDs'] || [],
    budget: record.properties.Budget,
    timeTracking: record.properties['Time Tracking'],
    relatedTaskIds: record.properties['Related Task IDs'] || [],
    relatedGoalIds: record.properties['Related Goal IDs'] || [],
    relatedNoteIds: record.properties['Related Note IDs'] || [],
    relatedResourceIds: record.properties['Related Resource IDs'] || [],
    parentProjectId: record.properties['Parent Project ID'],
    subProjectIds: record.properties['Sub Project IDs'] || [],
    objectives: record.properties.Objectives || [],
    risks: record.properties.Risks || [],
    tags: record.properties.Tags || [],
    customFields: record.properties['Custom Fields'] || {},
    isArchived: record.properties['Is Archived'] || false,
    isTemplate: record.properties['Is Template'] || false,
    isPublic: record.properties['Is Public'] || false,
    notificationSettings: record.properties['Notification Settings'] || {
      milestoneReminders: true,
      deadlineAlerts: true,
      statusUpdates: true
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy
  };
}

async function getNextOrder(databaseId: string): Promise<number> {
  const lastRecord = await RecordModel.findOne(
    { databaseId, isDeleted: { $ne: true } },
    { order: 1 }
  )
    .sort({ order: -1 })
    .exec();

  return (lastRecord?.order || 0) + 1;
}

export const projectsService = {
  // ===== PROJECT OPERATIONS =====

  createProject: async (data: ICreateProjectRequest, userId: string): Promise<IProject> => {
    try {
      // Verify the database exists and is a projects database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.PARA_PROJECTS) {
        throw createValidationError('Database must be of type PROJECTS');
      }

      // Check permission to create projects in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to create projects in this database');
      }

      // Process milestones
      const milestones =
        data.milestones?.map((milestone, index) => ({
          id: generateId(),
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate,
          completedDate: null,
          isCompleted: false,
          completedBy: null,
          order: milestone.order || index,
          dependencies: []
        })) || [];

      // Process deliverables
      const deliverables =
        data.deliverables?.map(deliverable => ({
          id: generateId(),
          title: deliverable.title,
          description: deliverable.description,
          type: deliverable.type,
          status: 'not_started' as const,
          assigneeId: deliverable.assigneeId,
          dueDate: deliverable.dueDate,
          completedDate: null,
          fileUrl: null,
          notes: null
        })) || [];

      // Process budget
      const budget = data.budget
        ? {
            totalBudget: data.budget.totalBudget,
            spentAmount: 0,
            remainingAmount: data.budget.totalBudget,
            currency: data.budget.currency,
            categories:
              data.budget.categories?.map(cat => ({
                name: cat.name,
                budgeted: cat.budgeted,
                spent: 0
              })) || []
          }
        : null;

      // Process time tracking
      const timeTracking = data.timeTracking
        ? {
            estimatedHours: data.timeTracking.estimatedHours,
            actualHours: 0,
            remainingHours: data.timeTracking.estimatedHours,
            timeEntries: []
          }
        : null;

      // Create project record
      const projectRecord = new RecordModel({
        _id: generateId(),
        databaseId: data.databaseId,
        properties: {
          Name: data.name,
          Description: data.description || '',
          Category: data.category,
          Status: EProjectStatus.PLANNING,
          Priority: data.priority || EProjectPriority.MEDIUM,
          Phase: data.phase || EProjectPhase.INITIATION,
          'Start Date': data.startDate,
          'End Date': data.endDate,
          'Actual Start Date': null,
          'Actual End Date': null,
          'Progress Percentage': 0,
          Milestones: milestones,
          Deliverables: deliverables,
          'Owner ID': data.ownerId || userId,
          'Team Member IDs': data.teamMemberIds || [],
          'Stakeholder IDs': data.stakeholderIds || [],
          Budget: budget,
          'Time Tracking': timeTracking,
          'Related Task IDs': [],
          'Related Goal IDs': [],
          'Related Note IDs': [],
          'Related Resource IDs': [],
          'Parent Project ID': null,
          'Sub Project IDs': [],
          Objectives: data.objectives || [],
          Risks: [],
          Tags: data.tags || [],
          'Custom Fields': data.customFields || {},
          'Is Archived': false,
          'Is Template': data.isTemplate || false,
          'Is Public': data.isPublic || false,
          'Notification Settings': data.notificationSettings || {
            milestoneReminders: true,
            deadlineAlerts: true,
            statusUpdates: true
          }
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await getNextOrder(data.databaseId)
      });

      const savedRecord = await projectRecord.save();

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(data.databaseId, {
        $inc: { recordCount: 1 },
        lastActivityAt: new Date()
      });

      return formatProjectResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create project: ${error.message}`, 500);
    }
  },

  getProjects: async (
    params: IProjectQueryParams,
    userId: string
  ): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> => {
    try {
      const query = buildProjectsQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [projects, total] = await Promise.all([
        RecordModel.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedProjects = projects.map(project => formatProjectResponse(project));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        projects: formattedProjects,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get projects: ${error.message}`, 500);
    }
  },

  getProjectById: async (id: string, userId: string): Promise<IProject> => {
    try {
      const project = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!project) {
        throw createNotFoundError('Project', id);
      }

      // Check permission to read this project
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this project');
      }

      return formatProjectResponse(project);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get project: ${error.message}`, 500);
    }
  },

  updateProject: async (
    id: string,
    data: IUpdateProjectRequest,
    userId: string
  ): Promise<IProject> => {
    try {
      const project = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!project) {
        throw createNotFoundError('Project', id);
      }

      // Check permission to edit this project
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this project');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      if (data.name !== undefined) {
        updateData['properties.Name'] = data.name;
      }
      if (data.description !== undefined) {
        updateData['properties.Description'] = data.description;
      }
      if (data.category !== undefined) {
        updateData['properties.Category'] = data.category;
      }
      if (data.status !== undefined) {
        updateData['properties.Status'] = data.status;

        // Update actual dates based on status changes
        if (data.status === EProjectStatus.ACTIVE && !project.properties['Actual Start Date']) {
          updateData['properties.Actual Start Date'] = new Date();
        }
        if (data.status === EProjectStatus.COMPLETED && !project.properties['Actual End Date']) {
          updateData['properties.Actual End Date'] = new Date();
          updateData['properties.Progress Percentage'] = 100;
        }
      }
      if (data.priority !== undefined) {
        updateData['properties.Priority'] = data.priority;
      }
      if (data.phase !== undefined) {
        updateData['properties.Phase'] = data.phase;
      }
      if (data.startDate !== undefined) {
        updateData['properties.Start Date'] = data.startDate;
      }
      if (data.endDate !== undefined) {
        updateData['properties.End Date'] = data.endDate;
      }
      if (data.actualStartDate !== undefined) {
        updateData['properties.Actual Start Date'] = data.actualStartDate;
      }
      if (data.actualEndDate !== undefined) {
        updateData['properties.Actual End Date'] = data.actualEndDate;
      }
      if (data.progressPercentage !== undefined) {
        updateData['properties.Progress Percentage'] = data.progressPercentage;
      }
      if (data.ownerId !== undefined) {
        updateData['properties.Owner ID'] = data.ownerId;
      }
      if (data.teamMemberIds !== undefined) {
        updateData['properties.Team Member IDs'] = data.teamMemberIds;
      }
      if (data.stakeholderIds !== undefined) {
        updateData['properties.Stakeholder IDs'] = data.stakeholderIds;
      }
      if (data.objectives !== undefined) {
        updateData['properties.Objectives'] = data.objectives;
      }
      if (data.tags !== undefined) {
        updateData['properties.Tags'] = data.tags;
      }
      if (data.customFields !== undefined) {
        updateData['properties.Custom Fields'] = data.customFields;
      }
      if (data.isArchived !== undefined) {
        updateData['properties.Is Archived'] = data.isArchived;
      }
      if (data.isTemplate !== undefined) {
        updateData['properties.Is Template'] = data.isTemplate;
      }
      if (data.isPublic !== undefined) {
        updateData['properties.Is Public'] = data.isPublic;
      }
      if (data.notificationSettings !== undefined) {
        updateData['properties.Notification Settings'] = data.notificationSettings;
      }

      const updatedProject = await RecordModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).exec();

      if (!updatedProject) {
        throw createNotFoundError('Project', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(updatedProject.databaseId, {
        lastActivityAt: new Date()
      });

      return formatProjectResponse(updatedProject);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update project: ${error.message}`, 500);
    }
  },

  deleteProject: async (id: string, userId: string, permanent: boolean = false): Promise<void> => {
    try {
      const project = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!project) {
        throw createNotFoundError('Project', id);
      }

      // Check permission to delete this project
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this project');
      }

      if (permanent) {
        await RecordModel.findByIdAndDelete(id);
      } else {
        await RecordModel.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        });
      }

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(project.databaseId, {
        $inc: { recordCount: -1 },
        lastActivityAt: new Date()
      });
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete project: ${error.message}`, 500);
    }
  }
};
