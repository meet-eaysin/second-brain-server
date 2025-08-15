import mongoose, { Schema, Document } from 'mongoose';

export interface IPerson extends Document {
    // Basic Info
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    
    // Personal Details
    birthday?: Date;
    company?: string;
    position?: string;
    
    // Contact Management
    lastContacted?: Date;
    nextContactDate?: Date;
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    
    // Relationships
    relationship: 'family' | 'friend' | 'colleague' | 'client' | 'mentor' | 'other';
    tags: string[];
    isFavorite?: boolean;

    // Linked Data
    projects: mongoose.Types.ObjectId[];
    tasks: mongoose.Types.ObjectId[];
    notes: mongoose.Types.ObjectId[]; // Meeting notes, etc.
    
    // Social/Professional
    socialLinks: {
        linkedin?: string;
        twitter?: string;
        website?: string;
        other?: string[];
    };
    
    // Notes
    bio?: string;
    personalNotes?: string;

    // Interactions
    interactions?: Array<{
        id: string;
        type: 'call' | 'email' | 'meeting' | 'message' | 'other';
        date: Date;
        notes?: string;
        duration?: number;
        outcome?: string;
        followUpRequired?: boolean;
        followUpDate?: Date;
    }>;

    // Custom Properties (for user-defined fields)
    customProperties?: Record<string, any>;

    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

const PersonSchema = new Schema<IPerson>({
    // Basic Info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    
    // Personal Details
    birthday: { type: Date },
    company: { type: String, trim: true },
    position: { type: String, trim: true },
    
    // Contact Management
    lastContacted: { type: Date },
    nextContactDate: { type: Date },
    contactFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']
    },
    
    // Relationships
    relationship: { 
        type: String, 
        enum: ['family', 'friend', 'colleague', 'client', 'mentor', 'other'],
        default: 'other'
    },
    tags: [{ type: String, trim: true }],
    isFavorite: { type: Boolean, default: false },

    // Linked Data
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    
    // Social/Professional
    socialLinks: {
        linkedin: { type: String, trim: true },
        twitter: { type: String, trim: true },
        website: { type: String, trim: true },
        other: [{ type: String, trim: true }]
    },
    
    // Notes
    bio: { type: String, trim: true },
    personalNotes: { type: String, trim: true },

    // Interactions
    interactions: [{
        id: { type: String, required: true },
        type: {
            type: String,
            enum: ['call', 'email', 'meeting', 'message', 'other'],
            required: true
        },
        date: { type: Date, required: true },
        notes: { type: String, trim: true },
        duration: { type: Number }, // in minutes
        outcome: { type: String, trim: true },
        followUpRequired: { type: Boolean, default: false },
        followUpDate: { type: Date }
    }],

    // Custom Properties (for user-defined fields)
    customProperties: { type: Schema.Types.Mixed, default: {} },

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
PersonSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Indexes
PersonSchema.index({ createdBy: 1, relationship: 1 });
PersonSchema.index({ createdBy: 1, tags: 1 });
PersonSchema.index({ createdBy: 1, nextContactDate: 1 });
PersonSchema.index({ email: 1 });

// Text search
PersonSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    company: 'text'
});

// Additional indexes for relationships
PersonSchema.index({ tasks: 1 });
PersonSchema.index({ projects: 1 });

// Cascade deletion middleware
PersonSchema.pre('deleteOne', { document: true, query: false }, async function() {
    const personId = this._id;

    // Import models dynamically to avoid circular dependencies
    const { Task } = await import('../../task/models/task.model');
    const { Project } = await import('../../project/models/project.model');
    const { Note } = await import('../../note/models/note.model');
    const { Finance } = await import('../../finance/models/finance.model');

    // Update related tasks - remove assignedTo reference
    await Task.updateMany(
        { assignedTo: personId },
        { $unset: { assignedTo: 1 } }
    );

    // Update related projects - remove from people array
    await Project.updateMany(
        { people: personId },
        { $pull: { people: personId } }
    );

    // Update related notes - remove from people array
    await Note.updateMany(
        { people: personId },
        { $pull: { people: personId } }
    );

    // Update related finance records - remove client reference
    await Finance.updateMany(
        { 'invoice.client': personId },
        { $unset: { 'invoice.client': 1 } }
    );

    console.log(`🗑️ Cleaned up relationships for deleted person: ${personId}`);
});

export const Person = mongoose.model<IPerson>('Person', PersonSchema);
