import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    title: string;
    content: string; // Rich text content
    type: 'general' | 'meeting' | 'book' | 'research' | 'template';
    
    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    
    // Relationships
    project?: mongoose.Types.ObjectId;
    tasks: mongoose.Types.ObjectId[]; // Linked tasks
    people: mongoose.Types.ObjectId[]; // Related people
    linkedBooks: mongoose.Types.ObjectId[]; // Related books for reading notes
    linkedGoals: mongoose.Types.ObjectId[]; // Related goals
    
    // Organization
    isFavorite: boolean;
    isPinned: boolean;
    template?: {
        isTemplate: boolean;
        templateName?: string;
        templateDescription?: string;
    };
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt?: Date;
    archivedAt?: Date;
}

const NoteSchema = new Schema<INote>({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['general', 'meeting', 'book', 'research', 'template'],
        default: 'general'
    },
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'resources'
    },
    tags: [{ type: String, trim: true }],
    
    // Relationships
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    people: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    linkedBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    linkedGoals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    
    // Organization
    isFavorite: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    template: {
        isTemplate: { type: Boolean, default: false },
        templateName: { type: String, trim: true },
        templateDescription: { type: String, trim: true }
    },
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastAccessedAt: { type: Date },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
NoteSchema.index({ createdBy: 1, area: 1 });
NoteSchema.index({ createdBy: 1, tags: 1 });
NoteSchema.index({ createdBy: 1, type: 1 });
NoteSchema.index({ createdBy: 1, isFavorite: 1 });
NoteSchema.index({ createdBy: 1, isPinned: 1 });

// Text search index
NoteSchema.index({ 
    title: 'text', 
    content: 'text',
    tags: 'text'
});

export const Note = mongoose.model<INote>('Note', NoteSchema);
