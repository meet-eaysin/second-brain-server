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
    
    // Relationships
    goal?: mongoose.Types.ObjectId;
    tasks: mongoose.Types.ObjectId[];
    notes: mongoose.Types.ObjectId[];
    people: mongoose.Types.ObjectId[]; // Collaborators
    
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
    
    // Relationships
    goal: { type: Schema.Types.ObjectId, ref: 'Goal' },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    people: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    
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

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
