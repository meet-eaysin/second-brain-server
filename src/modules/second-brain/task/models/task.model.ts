import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    estimatedTime?: number; // in minutes
    actualTime?: number; // in minutes

    // Hierarchy
    parentTask?: mongoose.Types.ObjectId;
    subtasks: mongoose.Types.ObjectId[];
    dependencies?: mongoose.Types.ObjectId[]; // Task dependencies

    // Relationships
    project?: mongoose.Types.ObjectId;
    area?: string; // PARA system
    tags: string[];
    assignedTo?: mongoose.Types.ObjectId; // People
    notes: mongoose.Types.ObjectId[]; // Linked notes

    // Recurrence
    isRecurring: boolean;
    recurrencePattern?: {
        type: 'daily' | 'weekly' | 'monthly' | 'custom';
        interval: number;
        daysOfWeek?: number[]; // 0-6, Sunday-Saturday
        endDate?: Date;
    };

    // Smart Views
    energy: 'low' | 'medium' | 'high';
    context: string[]; // @home, @office, @calls, etc.

    // Document-View Properties
    startDate?: Date; // For timeline and calendar views
    endDate?: Date; // For timeline views
    color?: string; // For visual categorization
    icon?: string; // Custom icon for the task

    // Time Tracking
    timeTracking?: {
        isActive: boolean;
        startTime?: Date;
        totalTime: number; // in minutes
        logs: Array<{
            _id?: string;
            duration: number; // in minutes
            description?: string;
            loggedAt: Date;
        }>;
    };

    // Comments
    comments?: Array<{
        _id?: string;
        content: string;
        author: mongoose.Types.ObjectId;
        createdAt: Date;
        updatedAt?: Date;
        isEdited?: boolean;
        mentions?: mongoose.Types.ObjectId[];
        attachments?: Array<{
            type: 'file' | 'image' | 'link';
            url: string;
            name: string;
            size?: number;
        }>;
    }>;

    // Custom Properties (for document-view extensibility)
    customProperties?: Record<string, any>;

    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    archivedAt?: Date;
}

const TaskSchema = new Schema<ITask>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: { type: Date },
    estimatedTime: { type: Number, min: 0 },
    actualTime: { type: Number, min: 0, default: 0 },

    // Hierarchy
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    subtasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],

    // Relationships
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    area: { type: String, enum: ['projects', 'areas', 'resources', 'archive'] },
    tags: [{ type: String, trim: true }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Person' },
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],

    // Recurrence
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom']
        },
        interval: { type: Number, min: 1 },
        daysOfWeek: [{ type: Number, min: 0, max: 6 }],
        endDate: { type: Date }
    },

    // Smart Views
    energy: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    context: [{ type: String, trim: true }],

    // Document-View Properties
    startDate: { type: Date },
    endDate: { type: Date },
    color: { type: String, trim: true },
    icon: { type: String, trim: true },

    // Time Tracking
    timeTracking: {
        isActive: { type: Boolean, default: false },
        startTime: { type: Date },
        totalTime: { type: Number, default: 0, min: 0 },
        logs: [{
            duration: { type: Number, required: true, min: 0 },
            description: { type: String, trim: true },
            loggedAt: { type: Date, default: Date.now }
        }]
    },

    // Comments
    comments: [{
        content: { type: String, required: true, trim: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
        isEdited: { type: Boolean, default: false },
        mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        attachments: [{
            type: { type: String, enum: ['file', 'image', 'link'], required: true },
            url: { type: String, required: true },
            name: { type: String, required: true },
            size: { type: Number }
        }]
    }],

    // Custom Properties (for document-view extensibility)
    customProperties: { type: Map, of: Schema.Types.Mixed },

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdBy: 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1, priority: 1 });
TaskSchema.index({ createdBy: 1, area: 1 });
TaskSchema.index({ createdBy: 1, tags: 1 });

// Virtual for completion percentage (for parent tasks)
TaskSchema.virtual('completionPercentage').get(function() {
    if (this.subtasks.length === 0) return 0;
    // This would need to be populated to calculate actual percentage
    return 0;
});

// Document-View Configuration for Tasks
export const TASK_FROZEN_PROPERTIES = {
    // Core properties that cannot be removed or hidden
    title: {
        frozen: true,
        removable: false,
        required: true,
        order: 0
    },
    status: {
        frozen: false,
        removable: false,
        required: true,
        order: 1
    },
    priority: {
        frozen: false,
        removable: false,
        required: true,
        order: 2
    },
    dueDate: {
        frozen: false,
        removable: false,
        required: false,
        order: 3
    }
};

export const TASK_PROPERTY_TYPES = {
    title: 'TEXT',
    description: 'TEXTAREA',
    status: 'SELECT',
    priority: 'SELECT',
    dueDate: 'DATE',
    startDate: 'DATE',
    endDate: 'DATE',
    estimatedTime: 'NUMBER',
    actualTime: 'NUMBER',
    assignedTo: 'PERSON',
    project: 'RELATION',
    area: 'SELECT',
    tags: 'MULTI_SELECT',
    energy: 'SELECT',
    context: 'MULTI_SELECT',
    color: 'COLOR',
    icon: 'ICON',
    isRecurring: 'CHECKBOX'
} as const;

export const Task = mongoose.model<ITask>('Task', TaskSchema);
