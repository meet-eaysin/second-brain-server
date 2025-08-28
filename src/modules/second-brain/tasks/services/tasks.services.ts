import {
  ITask,
  ICreateTaskRequest,
  IUpdateTaskRequest,
  ITaskQueryParams,
  ITaskStats,
  ITaskChecklistItem
} from '../types/tasks.types';
import { RecordModel } from '@/modules/database/models/record.model';
import { DatabaseModel } from '@/modules/database/models/database.model';
import { EDatabaseType } from '@/modules/core/types/database.types';
import { EStatus, EPriority } from '@/modules/core/types/common.types';
import { TPropertyValue } from '@/modules/core/types/property.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import {
  getStatusProperty,
  getPriorityProperty,
  getDateProperty,
  getStringArrayProperty,
  getObjectArrayProperty,
  getStringProperty
} from '@/modules/core/utils/type-guards';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class TasksService {

  async createTask(data: ICreateTaskRequest, userId: string): Promise<ITask> {
    try {
      // Verify the database exists and is a tasks database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();
      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.TASKS) {
        throw createValidationError('Database must be of type TASKS');
      }

      // Prepare task properties
      const properties: Record<string, any> = {
        name: data.name,
        description: data.description || '',
        status: data.status || EStatus.NOT_STARTED,
        priority: data.priority || EPriority.MEDIUM,
        due_date: data.dueDate,
        start_date: data.startDate,
        estimated_hours: data.estimatedHours,
        project_id: data.projectId,
        assignee_ids: data.assigneeIds || [],
        parent_task_id: data.parentTaskId,
        labels: data.labels || [],
        progress_percentage: 0,
        is_recurring: false,
        total_time_spent: 0
      };

      // Add custom fields
      if (data.customFields) {
        Object.assign(properties, data.customFields);
      }

      // Create checklist items with IDs
      const checklistItems: ITaskChecklistItem[] = (data.checklistItems || []).map((item, index) => ({
        id: `checklist_${Date.now()}_${index}`,
        text: item.text,
        isCompleted: false,
        order: index
      }));

      // Create the task record
      const taskRecord = new RecordModel({
        databaseId: data.databaseId,
        properties,
        content: [], // Rich content blocks can be added later
        isTemplate: false,
        isFavorite: false,
        createdBy: userId,
        updatedBy: userId
      });

      // Add checklist items to custom properties
      if (checklistItems.length > 0) {
        taskRecord.properties.checklist_items = checklistItems as unknown as TPropertyValue;
      }

      await taskRecord.save();

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(
        data.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      return this.formatTaskResponse(taskRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create task: ${error.message}`, 500);
    }
  }

  async getTasks(params: ITaskQueryParams, userId: string): Promise<{
    tasks: ITask[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    stats?: ITaskStats;
  }> {
    try {
      const query = this.buildTaskQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [tasks, total] = await Promise.all([
        RecordModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedTasks = tasks.map(task => this.formatTaskResponse(task));

      // Calculate stats if requested
      let stats: ITaskStats | undefined;
      if (params.databaseId) {
        stats = await this.calculateTaskStats(params.databaseId, userId);
      }

      return {
        tasks: formattedTasks,
        total,
        page,
        limit,
        hasNext: skip + limit < total,
        hasPrev: page > 1,
        stats
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get tasks: ${error.message}`, 500);
    }
  }

  async getTaskById(id: string, userId: string): Promise<ITask> {
    try {
      const task = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!task) {
        throw createNotFoundError('Task', id);
      }

      // Check permission to read this task
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this task');
      }

      return this.formatTaskResponse(task);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get task: ${error.message}`, 500);
    }
  }

  async updateTask(id: string, data: IUpdateTaskRequest, userId: string): Promise<ITask> {
    try {
      const task = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!task) {
        throw createNotFoundError('Task', id);
      }

      // Check permission to edit this task
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this task');
      }
      // await this.checkTaskAccess(task, userId, 'edit');

      // Update properties
      const updates: Record<string, any> = {};

      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.status !== undefined) updates.status = data.status;
      if (data.priority !== undefined) updates.priority = data.priority;
      if (data.dueDate !== undefined) updates.due_date = data.dueDate;
      if (data.startDate !== undefined) updates.start_date = data.startDate;
      if (data.estimatedHours !== undefined) updates.estimated_hours = data.estimatedHours;
      if (data.actualHours !== undefined) updates.actual_hours = data.actualHours;
      if (data.projectId !== undefined) updates.project_id = data.projectId;
      if (data.assigneeIds !== undefined) updates.assignee_ids = data.assigneeIds;
      if (data.parentTaskId !== undefined) updates.parent_task_id = data.parentTaskId;
      if (data.progressPercentage !== undefined) updates.progress_percentage = data.progressPercentage;
      if (data.labels !== undefined) updates.labels = data.labels;

      // Add custom fields
      if (data.customFields) {
        Object.assign(updates, data.customFields);
      }

      // Update the properties
      Object.assign(task.properties, updates);
      task.updatedBy = userId;
      task.lastEditedBy = userId;
      task.lastEditedAt = new Date();

      // Handle status change to completed
      if (data.status === EStatus.COMPLETED && task.properties.status !== EStatus.COMPLETED) {
        task.properties.completed_at = new Date();
        task.properties.completed_by = userId;

        // Auto-complete all checklist items
        const checklistItems = getObjectArrayProperty(task.properties, 'checklist_items');
        if (checklistItems.length > 0) {
          const updatedChecklistItems = checklistItems.map((item: any) => ({
            ...item,
            isCompleted: true,
            completedAt: new Date(),
            completedBy: userId
          }));
          task.properties.checklist_items = updatedChecklistItems as any;
        }
      }

      task.markModified('properties');
      await task.save();

      return this.formatTaskResponse(task);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update task: ${error.message}`, 500);
    }
  }

  async deleteTask(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const task = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!task) {
        throw createNotFoundError('Task', id);
      }

      // Check permission to delete this task
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this task');
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
      await DatabaseModel.findByIdAndUpdate(
        task.databaseId,
        {
          $inc: { recordCount: -1 },
          lastActivityAt: new Date()
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete task: ${error.message}`, 500);
    }
  }

  async completeTask(id: string, userId: string): Promise<ITask> {
    const task = await this.updateTask(id, {
      status: EStatus.COMPLETED,
      progressPercentage: 100
    }, userId);

    // Send completion notification to other assignees
    try {
      const { createNotification } = await import('@/modules/system/services/notifications.service');
      const { ENotificationType, ENotificationPriority, ENotificationMethod } = await import('@/modules/system/types/notifications.types');

      const taskRecord = await RecordModel.findById(id);
      if (taskRecord) {
        const taskName = getStringProperty(taskRecord.properties, 'name', 'Untitled Task');
        const assigneeIds = getStringArrayProperty(taskRecord.properties, 'assignee_ids');

        // Get database to find workspaceId
        const database = await DatabaseModel.findById(taskRecord.databaseId);
        const workspaceId = database?.workspaceId || 'default';

        // Notify all assignees except the one who completed it
        for (const assigneeId of assigneeIds) {
          if (assigneeId === userId) continue;

          await createNotification({
            type: ENotificationType.TASK_COMPLETED,
            priority: ENotificationPriority.LOW,
            title: 'Task Completed',
            message: `"${taskName}" has been completed`,
            userId: assigneeId,
            workspaceId,
            entityId: id,
            entityType: 'task',
            metadata: {
              taskId: id,
              taskName,
              completedBy: userId
            },
            methods: [ENotificationMethod.IN_APP]
          });
        }
      }
    } catch (error) {
      console.error('Failed to send task completion notification:', error);
    }

    return task;
  }

  async assignTask(id: string, userIds: string[], _role: string = 'collaborator', userId: string): Promise<ITask> {
    try {
      const task = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!task) {
        throw createNotFoundError('Task', id);
      }

      // Check permission to assign users to this task
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to assign users to this task');
      }

      // Update assignee IDs
      const currentAssignees = getStringArrayProperty(task.properties, 'assignee_ids');
      const newAssignees = [...new Set([...currentAssignees, ...userIds])];

      task.properties.assignee_ids = newAssignees;
      task.updatedBy = userId;
      task.lastEditedBy = userId;
      task.lastEditedAt = new Date();

      task.markModified('properties');
      await task.save();

      // Send notification to newly assigned users
      const newlyAssigned = newAssignees.filter(id => !currentAssignees.includes(id));
      if (newlyAssigned.length > 0) {
        try {
          const { createNotification } = await import('@/modules/system/services/notifications.service');
          const { ENotificationType, ENotificationPriority, ENotificationMethod } = await import('@/modules/system/types/notifications.types');

          const taskName = getStringProperty(task.properties, 'name', 'Untitled Task');

          // Get database to find workspaceId
          const database = await DatabaseModel.findById(task.databaseId);
          const workspaceId = database?.workspaceId || 'default';

          // Send notification to each newly assigned user
          for (const assigneeId of newlyAssigned) {
            await createNotification({
              type: ENotificationType.TASK_ASSIGNED,
              priority: ENotificationPriority.MEDIUM,
              title: 'New Task Assigned',
              message: `You have been assigned to "${taskName}"`,
              userId: assigneeId,
              workspaceId,
              entityId: id,
              entityType: 'task',
              metadata: {
                taskId: id,
                taskName,
                assignedBy: userId
              },
              methods: [ENotificationMethod.IN_APP, ENotificationMethod.EMAIL]
            });
          }
        } catch (error) {
          console.error('Failed to send task assignment notifications:', error);
        }
      }

      return this.formatTaskResponse(task);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to assign task: ${error.message}`, 500);
    }
  }

  private buildTaskQuery(params: ITaskQueryParams, _userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    // Database filter
    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    // Status filter
    if (params.status) {
      query['properties.status'] = params.status;
    }

    // Priority filter
    if (params.priority) {
      query['properties.priority'] = params.priority;
    }

    // Project filter
    if (params.projectId) {
      query['properties.project_id'] = params.projectId;
    }

    // Assignee filter
    if (params.assigneeId) {
      query['properties.assignee_ids'] = params.assigneeId;
    }

    // Due date filters
    if (params.dueDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      switch (params.dueDate) {
        case 'today':
          query['properties.due_date'] = {
            $gte: today,
            $lt: tomorrow
          };
          break;
        case 'tomorrow':
          query['properties.due_date'] = {
            $gte: tomorrow,
            $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          };
          break;
        case 'this_week':
          query['properties.due_date'] = {
            $gte: today,
            $lt: weekFromNow
          };
          break;
        case 'overdue':
          query['properties.due_date'] = { $lt: today };
          query['properties.status'] = { $ne: EStatus.COMPLETED };
          break;
      }
    }

    // Labels filter
    if (params.labels && params.labels.length > 0) {
      query['properties.labels'] = { $in: params.labels };
    }

    // Search filter
    if (params.search) {
      query.$or = [
        { 'properties.name': { $regex: params.search, $options: 'i' } },
        { 'properties.description': { $regex: params.search, $options: 'i' } },
        { searchText: { $regex: params.search, $options: 'i' } }
      ];
    }

    // Include completed filter
    if (!params.includeCompleted) {
      query['properties.status'] = { $ne: EStatus.COMPLETED };
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      name: 'properties.name',
      dueDate: 'properties.due_date',
      priority: 'properties.priority',
      status: 'properties.status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    };

    return fieldMap[sortBy] || 'updatedAt';
  }

  private formatTaskResponse(taskRecord: any): ITask {
    const props = taskRecord.properties || {};

    return {
      id: taskRecord.id,
      databaseId: taskRecord.databaseId,
      properties: taskRecord.properties,
      content: taskRecord.content,
      isTemplate: taskRecord.isTemplate,
      isFavorite: taskRecord.isFavorite,
      isArchived: taskRecord.isArchived,
      lastEditedBy: taskRecord.lastEditedBy,
      lastEditedAt: taskRecord.lastEditedAt,
      commentCount: taskRecord.commentCount,
      version: taskRecord.version,
      autoTags: taskRecord.autoTags,
      aiSummary: taskRecord.aiSummary,
      relationsCache: taskRecord.relationsCache,
      createdAt: taskRecord.createdAt,
      updatedAt: taskRecord.updatedAt,
      createdBy: taskRecord.createdBy,
      updatedBy: taskRecord.updatedBy,
      isDeleted: taskRecord.isDeleted,

      // Task-specific fields
      name: props.name || '',
      description: props.description || '',
      status: props.status || EStatus.NOT_STARTED,
      priority: props.priority || EPriority.MEDIUM,
      dueDate: props.due_date ? new Date(props.due_date) : undefined,
      startDate: props.start_date ? new Date(props.start_date) : undefined,
      estimatedHours: props.estimated_hours,
      actualHours: props.actual_hours,
      projectId: props.project_id,
      projectName: props.project_name,
      assigneeIds: props.assignee_ids || [],
      assigneeNames: props.assignee_names || [],
      parentTaskId: props.parent_task_id,
      subtaskIds: props.subtask_ids || [],
      completedAt: props.completed_at ? new Date(props.completed_at) : undefined,
      completedBy: props.completed_by,
      isRecurring: props.is_recurring || false,
      recurrencePattern: props.recurrence_pattern,
      progressPercentage: props.progress_percentage || 0,
      checklistItems: props.checklist_items || [],
      dependsOnTaskIds: props.depends_on_task_ids || [],
      blockedByTaskIds: props.blocked_by_task_ids || [],
      timeEntries: props.time_entries || [],
      totalTimeSpent: props.total_time_spent || 0,
      labels: props.labels || [],
      customFields: this.extractCustomFields(props)
    };
  }

  private extractCustomFields(properties: Record<string, any>): Record<string, any> {
    const systemFields = new Set([
      'name', 'description', 'status', 'priority', 'due_date', 'start_date',
      'estimated_hours', 'actual_hours', 'project_id', 'project_name',
      'assignee_ids', 'assignee_names', 'parent_task_id', 'subtask_ids',
      'completed_at', 'completed_by', 'is_recurring', 'recurrence_pattern',
      'progress_percentage', 'checklist_items', 'depends_on_task_ids',
      'blocked_by_task_ids', 'time_entries', 'total_time_spent', 'labels'
    ]);

    const customFields: Record<string, any> = {};
    Object.entries(properties).forEach(([key, value]) => {
      if (!systemFields.has(key)) {
        customFields[key] = value;
      }
    });

    return customFields;
  }

  private async calculateTaskStats(databaseId: string, _userId: string): Promise<ITaskStats> {
    const tasks = await RecordModel.find({
      databaseId,
      isDeleted: { $ne: true }
    }).exec();

    const stats: ITaskStats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      byPriority: {
        [EPriority.LOW]: 0,
        [EPriority.MEDIUM]: 0,
        [EPriority.HIGH]: 0,
        [EPriority.URGENT]: 0
      },
      byProject: [],
      byAssignee: [],
      averageCompletionTime: 0,
      completionRate: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const projectCounts: Record<string, { name: string; count: number }> = {};
    const assigneeCounts: Record<string, { name: string; count: number }> = {};

    tasks.forEach(task => {
      const props = task.properties || {};
      const status = getStatusProperty(props, 'status', EStatus.NOT_STARTED);
      const priority = getPriorityProperty(props, 'priority', EPriority.MEDIUM);
      const dueDate = getDateProperty(props, 'due_date');

      // Status counts
      switch (status) {
        case EStatus.COMPLETED:
          stats.completed++;
          break;
        case EStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case EStatus.NOT_STARTED:
          stats.notStarted++;
          break;
      }

      // Priority counts
      stats.byPriority[priority]++;

      // Due date counts
      if (dueDate) {
        if (dueDate < today && status !== EStatus.COMPLETED) {
          stats.overdue++;
        } else if (dueDate >= today && dueDate < tomorrow) {
          stats.dueToday++;
        } else if (dueDate >= today && dueDate < weekFromNow) {
          stats.dueThisWeek++;
        }
      }

      // Project counts
      const projectId = getStringProperty(props, 'project_id');
      if (projectId) {
        if (!projectCounts[projectId]) {
          projectCounts[projectId] = {
            name: getStringProperty(props, 'project_name') || 'Unknown Project',
            count: 0
          };
        }
        projectCounts[projectId].count++;
      }

      // Assignee counts
      const assigneeIds = getStringArrayProperty(props, 'assignee_ids');
      const assigneeNames = getStringArrayProperty(props, 'assignee_names');

      assigneeIds.forEach((assigneeId: string, index: number) => {
        if (!assigneeCounts[assigneeId]) {
          assigneeCounts[assigneeId] = {
            name: assigneeNames[index] || 'Unknown User',
            count: 0
          };
        }
        assigneeCounts[assigneeId].count++;
      });
    });

    // Convert to arrays
    stats.byProject = Object.entries(projectCounts).map(([projectId, data]) => ({
      projectId,
      projectName: data.name,
      taskCount: data.count
    }));

    stats.byAssignee = Object.entries(assigneeCounts).map(([userId, data]) => ({
      userId,
      userName: data.name,
      taskCount: data.count
    }));

    // Calculate completion rate
    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    // TODO: Calculate average completion time
    stats.averageCompletionTime = 0;

    return stats;
  }

  // Bulk update tasks
  async bulkUpdateTasks(
    taskIds: string[],
    updates: {
      status?: EStatus;
      priority?: EPriority;
      projectId?: string;
      assigneeIds?: string[];
      labels?: string[];
    },
    userId: string
  ): Promise<{ updated: number; failed: string[] }> {
    try {
      const results = { updated: 0, failed: [] as string[] };

      // Process tasks in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < taskIds.length; i += batchSize) {
        const batch = taskIds.slice(i, i + batchSize);

        // Get all tasks in this batch
        const tasks = await RecordModel.find({
          _id: { $in: batch },
          isDeleted: { $ne: true }
        }).exec();

        // Update each task
        for (const task of tasks) {
          try {
            // Check permission to edit this task
            const hasPermission = await permissionService.hasPermission(
              EShareScope.RECORD,
              task.id,
              userId,
              EPermissionLevel.EDIT
            );

            if (!hasPermission) {
              results.failed.push(task.id);
              continue;
            }

            // Apply updates
            const taskUpdates: Record<string, any> = {};

            if (updates.status !== undefined) {
              taskUpdates.status = updates.status;

              // If marking as completed, set completion metadata
              if (updates.status === EStatus.COMPLETED) {
                taskUpdates.completed_at = new Date();
                taskUpdates.completed_by = userId;
                taskUpdates.progress_percentage = 100;
              }
            }

            if (updates.priority !== undefined) {
              taskUpdates.priority = updates.priority;
            }

            if (updates.projectId !== undefined) {
              taskUpdates.project_id = updates.projectId;
            }

            if (updates.assigneeIds !== undefined) {
              taskUpdates.assignee_ids = updates.assigneeIds;
            }

            if (updates.labels !== undefined) {
              taskUpdates.labels = updates.labels;
            }

            // Update task properties
            Object.keys(taskUpdates).forEach(key => {
              task.properties[key] = taskUpdates[key];
            });

            // Update metadata
            task.updatedBy = userId;
            task.lastEditedBy = userId;
            task.lastEditedAt = new Date();

            task.markModified('properties');
            await task.save();

            results.updated++;
          } catch (error: any) {
            console.error(`Failed to update task ${task.id}:`, error.message);
            results.failed.push(task.id);
          }
        }

        // Handle tasks that weren't found
        const foundTaskIds = tasks.map(t => t.id);
        const notFoundIds = batch.filter(id => !foundTaskIds.includes(id));
        results.failed.push(...notFoundIds);
      }

      return results;
    } catch (error: any) {
      throw createAppError(`Failed to bulk update tasks: ${error.message}`, 500);
    }
  }

  // Duplicate task
  async duplicateTask(
    taskId: string,
    options: {
      name: string;
      includeSubtasks?: boolean;
      includeAssignees?: boolean;
      includeChecklist?: boolean;
    },
    userId: string
  ): Promise<ITask> {
    try {
      const originalTask = await RecordModel.findOne({
        _id: taskId,
        isDeleted: { $ne: true }
      }).exec();

      if (!originalTask) {
        throw createNotFoundError('Task', taskId);
      }

      // Check permission to read the original task (needed for duplication)
      // Allow if user created the task or has read permission
      const isCreator = originalTask.createdBy === userId;
      const hasReadPermission = isCreator || await permissionService.hasPermission(
        EShareScope.RECORD,
        taskId,
        userId,
        EPermissionLevel.READ
      );

      if (!hasReadPermission) {
        throw createForbiddenError('Insufficient permissions to duplicate this task');
      }

      // Check permission to create tasks in the database
      // Allow if user created the original task or has edit permission
      const hasCreatePermission = isCreator || await permissionService.hasPermission(
        EShareScope.DATABASE,
        originalTask.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasCreatePermission) {
        throw createForbiddenError('Insufficient permissions to create tasks in this database');
      }

      // Create new task properties based on original
      const newProperties: Record<string, any> = {
        ...originalTask.properties,
        name: options.name || `${getStringProperty(originalTask.properties, 'name')} (Copy)`,
        status: EStatus.NOT_STARTED,
        progress_percentage: 0,
        completed_at: undefined,
        completed_by: undefined,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Handle assignees
      if (!options.includeAssignees) {
        newProperties.assignee_ids = [];
        newProperties.assignee_names = [];
      }

      // Handle checklist
      if (!options.includeChecklist) {
        newProperties.checklist_items = [];
      } else {
        // Reset checklist completion status
        const checklistItems = getObjectArrayProperty(originalTask.properties, 'checklist_items');
        newProperties.checklist_items = checklistItems.map((item: any) => ({
          ...item,
          id: generateId(),
          isCompleted: false,
          completedAt: undefined,
          completedBy: undefined
        }));
      }

      // Clear time tracking and comments
      newProperties.time_entries = [];
      newProperties.total_time_spent = 0;
      newProperties.active_time_tracking = undefined;
      newProperties.comments = [];
      newProperties.comment_count = 0;

      // Clear parent/child relationships initially
      newProperties.parent_task_id = undefined;
      newProperties.subtask_ids = [];

      // Create the duplicated task
      const duplicatedTask = new RecordModel({
        databaseId: originalTask.databaseId,
        properties: newProperties,
        content: originalTask.content ? [...originalTask.content] : [],
        createdBy: userId,
        updatedBy: userId,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      });

      await duplicatedTask.save();

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(
        originalTask.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      return this.formatTaskResponse(duplicatedTask);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to duplicate task: ${error.message}`, 500);
    }
  }
}

// Service instance
export const tasksService = new TasksService();

// Service functions for backward compatibility
export const createTaskService = tasksService.createTask.bind(tasksService);
export const getTasksService = tasksService.getTasks.bind(tasksService);
export const updateTaskService = tasksService.updateTask.bind(tasksService);
export const deleteTaskService = tasksService.deleteTask.bind(tasksService);
export const completeTaskService = tasksService.completeTask.bind(tasksService);
export const assignTaskService = tasksService.assignTask.bind(tasksService);
