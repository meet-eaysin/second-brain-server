import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
    title: string;
    description?: string;
    
    // Goal Type & Timeline
    type: 'annual' | 'quarterly' | 'monthly' | 'weekly';
    status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
    
    // Timeline
    startDate: Date;
    endDate: Date;
    
    // Progress
    targetValue?: number;
    currentValue?: number;
    unit?: string; // e.g., 'books', 'hours', 'projects'
    
    // Relationships
    parentGoal?: mongoose.Types.ObjectId;
    subGoals: mongoose.Types.ObjectId[];
    projects: mongoose.Types.ObjectId[];
    habits: mongoose.Types.ObjectId[];
    
    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    archivedAt?: Date;
}

const GoalSchema = new Schema<IGoal>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // Goal Type & Timeline
    type: { 
        type: String, 
        enum: ['annual', 'quarterly', 'monthly', 'weekly'],
        required: true
    },
    status: { 
        type: String, 
        enum: ['draft', 'active', 'completed', 'paused', 'cancelled'],
        default: 'draft'
    },
    
    // Timeline
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Progress
    targetValue: { type: Number, min: 0 },
    currentValue: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true },
    
    // Relationships
    parentGoal: { type: Schema.Types.ObjectId, ref: 'Goal' },
    subGoals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    habits: [{ type: Schema.Types.ObjectId, ref: 'Habit' }],
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'areas'
    },
    tags: [{ type: String, trim: true }],
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for progress percentage
GoalSchema.virtual('progressPercentage').get(function() {
    if (!this.targetValue || this.targetValue === 0) return 0;
    return Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
});

// Indexes
GoalSchema.index({ createdBy: 1, type: 1 });
GoalSchema.index({ createdBy: 1, status: 1 });
GoalSchema.index({ createdBy: 1, endDate: 1 });
GoalSchema.index({ createdBy: 1, area: 1 });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
