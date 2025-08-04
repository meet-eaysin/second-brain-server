// Tasks Entity Registration - Server-side example
import { Schema, model } from 'mongoose';
import { z } from 'zod';
import { 
  registerServerEntity, 
  ServerEntitySchema, 
  PropertyType,
  UniversalDataService
} from '../core/entity-registry';

// Mongoose Schema for Tasks
const TaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'completed', 'cancelled'],
    default: 'todo',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  dueDate: { type: Date, index: true },
  assignedTo: { type: String, index: true },
  estimatedTime: { type: Number }, // in minutes
  actualTime: { type: Number }, // in minutes
  energy: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  context: [{ type: String }], // @home, @office, etc.
  project: { type: String, index: true },
  tags: [{ type: String, index: true }],
  area: { 
    type: String, 
    enum: ['projects', 'areas', 'resources', 'archive'],
    default: 'projects',
    index: true
  },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    type: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
    interval: { type: Number },
    daysOfWeek: [{ type: Number }],
    endDate: { type: Date }
  },
  parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
  subtasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
  completedAt: { type: Date },
  
  // System fields
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true, index: true },
  updatedBy: { type: String },
  deletedAt: { type: Date },
  deletedBy: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdBy: 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1, priority: 1 });
TaskSchema.index({ createdBy: 1, project: 1 });
TaskSchema.index({ createdBy: 1, tags: 1 });

// Virtual for completion status
TaskSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completedAt when status changes from completed
  if (this.isModified('status') && this.status !== 'completed' && this.completedAt) {
    this.completedAt = undefined;
  }
  
  next();
});

// Create the model
const TaskModel = model('Task', TaskSchema);

// Zod validation schema
const taskValidationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['todo', 'in-progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  assignedTo: z.string().optional(),
  estimatedTime: z.number().min(0).max(10080).optional(), // Max 1 week in minutes
  actualTime: z.number().min(0).max(10080).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
  context: z.array(z.string()).optional(),
  project: z.string().optional(),
  tags: z.array(z.string()).optional(),
  area: z.enum(['projects', 'areas', 'resources', 'archive']).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: z.number().min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional().or(z.date().optional())
  }).optional(),
  parentTask: z.string().optional(),
  notes: z.array(z.string()).optional()
});

// Entity schema configuration
const tasksEntitySchema: ServerEntitySchema = {
  entityKey: 'tasks',
  displayName: 'Task',
  displayNamePlural: 'Tasks',
  description: 'Manage your tasks and to-dos efficiently',
  icon: 'CheckSquare',
  
  // Database configuration
  collection: 'tasks',
  
  // Properties definition
  properties: [
    {
      id: 'title',
      name: 'Title',
      type: PropertyType.TEXT,
      description: 'Task title or summary',
      required: true,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 0,
      validation: { minLength: 1, maxLength: 200 },
      permissions: { read: true, write: true }
    },
    {
      id: 'description',
      name: 'Description',
      type: PropertyType.TEXTAREA,
      description: 'Detailed task description',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: false,
      order: 1,
      validation: { maxLength: 1000 },
      permissions: { read: true, write: true }
    },
    {
      id: 'status',
      name: 'Status',
      type: PropertyType.SELECT,
      description: 'Current task status',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 2,
      selectOptions: [
        { id: 'todo', name: 'To Do', color: '#6b7280', order: 0 },
        { id: 'in-progress', name: 'In Progress', color: '#3b82f6', order: 1 },
        { id: 'completed', name: 'Completed', color: '#10b981', order: 2 },
        { id: 'cancelled', name: 'Cancelled', color: '#ef4444', order: 3 }
      ],
      defaultValue: 'todo',
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'priority',
      name: 'Priority',
      type: PropertyType.PRIORITY,
      description: 'Task priority level',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 3,
      selectOptions: [
        { id: 'low', name: 'Low', color: '#10b981', order: 0 },
        { id: 'medium', name: 'Medium', color: '#f59e0b', order: 1 },
        { id: 'high', name: 'High', color: '#f97316', order: 2 },
        { id: 'urgent', name: 'Urgent', color: '#ef4444', order: 3 }
      ],
      defaultValue: 'medium',
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'dueDate',
      name: 'Due Date',
      type: PropertyType.DATE,
      description: 'When the task is due',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 4,
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'assignedTo',
      name: 'Assigned To',
      type: PropertyType.PERSON,
      description: 'Person responsible for the task',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 5,
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'estimatedTime',
      name: 'Estimated Time (min)',
      type: PropertyType.NUMBER,
      description: 'Estimated time to complete in minutes',
      required: false,
      isVisible: false,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 6,
      validation: { min: 0, max: 10080 },
      permissions: { read: true, write: true }
    },
    {
      id: 'actualTime',
      name: 'Actual Time (min)',
      type: PropertyType.NUMBER,
      description: 'Actual time spent in minutes',
      required: false,
      isVisible: false,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 7,
      validation: { min: 0, max: 10080 },
      permissions: { read: true, write: true }
    },
    {
      id: 'energy',
      name: 'Energy Level',
      type: PropertyType.SELECT,
      description: 'Energy level required for this task',
      required: false,
      isVisible: false,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 8,
      selectOptions: [
        { id: 'low', name: 'Low', color: '#6b7280', order: 0 },
        { id: 'medium', name: 'Medium', color: '#f59e0b', order: 1 },
        { id: 'high', name: 'High', color: '#10b981', order: 2 }
      ],
      defaultValue: 'medium',
      permissions: { read: true, write: true }
    },
    {
      id: 'context',
      name: 'Context',
      type: PropertyType.MULTI_SELECT,
      description: 'Context tags for the task',
      required: false,
      isVisible: false,
      isEditable: true,
      isFilterable: true,
      isSortable: false,
      order: 9,
      selectOptions: [
        { id: 'home', name: '@home', color: '#10b981', order: 0 },
        { id: 'office', name: '@office', color: '#3b82f6', order: 1 },
        { id: 'calls', name: '@calls', color: '#f59e0b', order: 2 },
        { id: 'computer', name: '@computer', color: '#8b5cf6', order: 3 },
        { id: 'errands', name: '@errands', color: '#ef4444', order: 4 }
      ],
      permissions: { read: true, write: true }
    },
    {
      id: 'project',
      name: 'Project',
      type: PropertyType.RELATION,
      description: 'Associated project',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 10,
      relationConfig: {
        targetEntity: 'projects',
        targetField: 'title',
        relationType: 'many-to-one'
      },
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'tags',
      name: 'Tags',
      type: PropertyType.TAGS,
      description: 'Task tags for organization',
      required: false,
      isVisible: true,
      isEditable: true,
      isFilterable: true,
      isSortable: false,
      order: 11,
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'area',
      name: 'Area',
      type: PropertyType.SELECT,
      description: 'PARA method area',
      required: false,
      isVisible: false,
      isEditable: true,
      isFilterable: true,
      isSortable: true,
      order: 12,
      selectOptions: [
        { id: 'projects', name: 'Projects', color: '#3b82f6', order: 0 },
        { id: 'areas', name: 'Areas', color: '#10b981', order: 1 },
        { id: 'resources', name: 'Resources', color: '#f59e0b', order: 2 },
        { id: 'archive', name: 'Archive', color: '#6b7280', order: 3 }
      ],
      defaultValue: 'projects',
      indexed: true,
      permissions: { read: true, write: true }
    },
    {
      id: 'completedAt',
      name: 'Completed At',
      type: PropertyType.DATETIME,
      description: 'When the task was completed',
      required: false,
      isVisible: false,
      isEditable: false,
      isFilterable: true,
      isSortable: true,
      order: 13,
      permissions: { read: true, write: false }
    },
    {
      id: 'createdAt',
      name: 'Created',
      type: PropertyType.CREATED_TIME,
      description: 'When the task was created',
      required: false,
      isVisible: false,
      isEditable: false,
      isFilterable: true,
      isSortable: true,
      order: 98,
      indexed: true,
      permissions: { read: true, write: false }
    },
    {
      id: 'updatedAt',
      name: 'Updated',
      type: PropertyType.UPDATED_TIME,
      description: 'When the task was last updated',
      required: false,
      isVisible: false,
      isEditable: false,
      isFilterable: true,
      isSortable: true,
      order: 99,
      permissions: { read: true, write: false }
    }
  ],
  
  coreProperties: ['title', 'status'],
  
  // Query configuration
  defaultSort: [
    { field: 'dueDate', direction: 'asc' },
    { field: 'priority', direction: 'desc' },
    { field: 'createdAt', direction: 'desc' }
  ],
  searchableFields: ['title', 'description', 'tags'],
  
  // View configuration
  supportedViews: ['table', 'board', 'list', 'calendar', 'timeline'],
  defaultView: 'table',
  
  // Permissions
  permissions: {
    create: true,
    read: true,
    update: true,
    delete: true,
    bulkEdit: true
  },
  
  // Access control
  accessControl: {
    ownerField: 'createdBy',
    publicRead: false,
    roleBasedAccess: {
      admin: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update', 'delete'],
      viewer: ['read']
    }
  },
  
  // Data transformers
  dataTransformer: (data: any) => {
    // Transform input data before saving
    if (data.dueDate && typeof data.dueDate === 'string') {
      data.dueDate = new Date(data.dueDate);
    }
    return data;
  },
  
  responseTransformer: (data: any) => {
    // Transform output data before sending to client
    return {
      ...data,
      id: data._id?.toString() || data.id,
      isCompleted: data.status === 'completed',
      isOverdue: data.dueDate && new Date(data.dueDate) < new Date() && data.status !== 'completed'
    };
  },
  
  // Validation
  validationSchema: taskValidationSchema,
  
  // Hooks
  hooks: {
    beforeCreate: async (data: any, user: any) => {
      // Set default values
      data.status = data.status || 'todo';
      data.priority = data.priority || 'medium';
      data.area = data.area || 'projects';
      data.isRecurring = data.isRecurring || false;
      data.tags = data.tags || [];
      data.context = data.context || [];
      
      return data;
    },
    
    afterCreate: async (data: any, user: any) => {
      console.log(`Task created: ${data.title} by ${user?.userId}`);
    },
    
    beforeUpdate: async (data: any, user: any) => {
      // Handle status changes
      if (data.status === 'completed' && !data.completedAt) {
        data.completedAt = new Date();
      } else if (data.status !== 'completed') {
        data.completedAt = null;
      }
      
      return data;
    },
    
    afterUpdate: async (data: any, user: any) => {
      console.log(`Task updated: ${data.title} by ${user?.userId}`);
    },
    
    beforeDelete: async (id: string, user: any) => {
      console.log(`Task deleting: ${id} by ${user?.userId}`);
    },
    
    afterDelete: async (id: string, user: any) => {
      console.log(`Task deleted: ${id} by ${user?.userId}`);
    }
  },
  
  // Module information
  moduleId: 'second-brain',
  version: '1.0.0',
  
  // Will be set by registry
  createdAt: new Date(),
  updatedAt: new Date()
};

// Register the entity and model
export function registerTasksEntity() {
  // Register the entity schema
  registerServerEntity(tasksEntitySchema);
  
  // Register the Mongoose model
  UniversalDataService.registerModel('tasks', TaskModel);
  
  console.log('✅ Tasks entity registered successfully');
}

export { TaskModel, tasksEntitySchema, taskValidationSchema };
export default registerTasksEntity;