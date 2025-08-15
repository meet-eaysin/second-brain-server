import mongoose, { Schema, Document } from 'mongoose';
import type { GoalType, GoalStatus, GoalArea } from '../types/goal.types';

export interface IGoalModel extends Document {
    title: string;
    description?: string;

    // Goal Type & Timeline
    type: GoalType;
    status: GoalStatus;

    // Timeline
    startDate?: Date;
    endDate?: Date;

    // Progress
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    progressPercentage: number; // Virtual field

    // Relationships
    parentGoal?: mongoose.Types.ObjectId;
    subGoals: mongoose.Types.ObjectId[];
    projects: mongoose.Types.ObjectId[];
    habits: mongoose.Types.ObjectId[];

    // PARA Classification
    area?: GoalArea;
    tags: string[];

    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    archivedAt?: Date;
    isArchived: boolean;
    isFavorite?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

const GoalSchema = new Schema<IGoalModel>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Goal Type & Timeline
    type: {
        type: String,
        enum: ['outcome', 'process', 'learning', 'health', 'financial', 'career', 'personal'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'paused', 'cancelled'],
        default: 'draft'
    },

    // Timeline
    startDate: { type: Date },
    endDate: { type: Date },

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
        enum: ['projects', 'areas', 'resources', 'archive']
    },
    tags: [{ type: String, trim: true }],

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    archivedAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent']
    }
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

// Additional indexes for relationships
GoalSchema.index({ parentGoal: 1 });
GoalSchema.index({ projects: 1 });
GoalSchema.index({ habits: 1 });

// Cascade deletion middleware
GoalSchema.pre('deleteOne', { document: true, query: false }, async function() {
    const goalId = this._id;

    // Import models dynamically to avoid circular dependencies
    const { Project } = await import('../../project/models/project.model');
    const { Habit } = await import('../../habits/models/habit.model');

    // Update child goals - remove parent reference
    await Goal.updateMany(
        { parentGoal: goalId },
        { $unset: { parentGoal: 1 } }
    );

    // Update parent goal - remove from subGoals array
    if (this.parentGoal) {
        await Goal.updateOne(
            { _id: this.parentGoal },
            { $pull: { subGoals: goalId } }
        );
    }

    // Update related projects - remove goal reference
    await Project.updateMany(
        { goal: goalId },
        { $unset: { goal: 1 } }
    );

    // Update related habits - remove goal reference
    await Habit.updateMany(
        { goal: goalId },
        { $unset: { goal: 1 } }
    );

    console.log(`🗑️ Cleaned up relationships for deleted goal: ${goalId}`);
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
