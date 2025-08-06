import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    estimatedTime?: number; // in minutes
    actualTime?: number; // in minutes
    
    // Hierarchy
    parentTask?: mongoose.Types.ObjectId;
    subtasks: mongoose.Types.ObjectId[];
    
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
        enum: ['todo', 'in-progress', 'completed', 'cancelled'],
        default: 'todo'
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: { type: Date },
    estimatedTime: { type: Number, min: 0 },
    actualTime: { type: Number, min: 0 },
    
    // Hierarchy
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    subtasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    
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

export const Task = mongoose.model<ITask>('Task', TaskSchema);
