import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    title: string;
    description?: string;
    status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
    
    // Timeline
    startDate?: Date;
    endDate?: Date;
    deadline?: Date;
    
    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    isFavorite?: boolean;

    // Relationships
    goal?: mongoose.Types.ObjectId;
    tasks: mongoose.Types.ObjectId[];
    notes: mongoose.Types.ObjectId[];
    people: mongoose.Types.ObjectId[]; // Collaborators

    // Additional bidirectional relationships
    linkedBooks: mongoose.Types.ObjectId[];
    linkedFinances: mongoose.Types.ObjectId[];
    linkedContent: mongoose.Types.ObjectId[];
    linkedJournals: mongoose.Types.ObjectId[];
    
    // Progress
    completionPercentage: number;
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    archivedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { 
        type: String, 
        enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
        default: 'planned'
    },
    
    // Timeline
    startDate: { type: Date },
    endDate: { type: Date },
    deadline: { type: Date },
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'projects'
    },
    tags: [{ type: String, trim: true }],
    isFavorite: { type: Boolean, default: false },

    // Relationships
    goal: { type: Schema.Types.ObjectId, ref: 'Goal' },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    people: [{ type: Schema.Types.ObjectId, ref: 'Person' }],

    // Additional bidirectional relationships
    linkedBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    linkedFinances: [{ type: Schema.Types.ObjectId, ref: 'Finance' }],
    linkedContent: [{ type: Schema.Types.ObjectId, ref: 'Content' }],
    linkedJournals: [{ type: Schema.Types.ObjectId, ref: 'Journal' }],
    
    // Progress
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
ProjectSchema.index({ createdBy: 1, status: 1 });
ProjectSchema.index({ createdBy: 1, area: 1 });
ProjectSchema.index({ createdBy: 1, tags: 1 });
ProjectSchema.index({ createdBy: 1, deadline: 1 });

// Additional indexes for relationships
ProjectSchema.index({ goal: 1, status: 1 });
ProjectSchema.index({ people: 1, status: 1 });
ProjectSchema.index({ tasks: 1 });

// Cascade deletion middleware
ProjectSchema.pre('deleteOne', { document: true, query: false }, async function() {
    const projectId = this._id;

    // Import models dynamically to avoid circular dependencies
    const { Task } = await import('../../task/models/task.model');
    const { Goal } = await import('../../goal/models/goal.model');
    const { Note } = await import('../../note/models/note.model');

    // Update related tasks - remove project reference
    await Task.updateMany(
        { project: projectId },
        { $unset: { project: 1 } }
    );

    // Update related goals - remove from projects array
    await Goal.updateMany(
        { projects: projectId },
        { $pull: { projects: projectId } }
    );

    // Update related notes - remove from project reference
    await Note.updateMany(
        { project: projectId },
        { $unset: { project: 1 } }
    );

    console.log(`🗑️ Cleaned up relationships for deleted project: ${projectId}`);
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
