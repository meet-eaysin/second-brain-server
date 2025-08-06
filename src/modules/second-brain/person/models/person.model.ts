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
    contactFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    
    // Relationships
    relationship: 'family' | 'friend' | 'colleague' | 'client' | 'mentor' | 'other';
    tags: string[];
    
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
        enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom']
    },
    
    // Relationships
    relationship: { 
        type: String, 
        enum: ['family', 'friend', 'colleague', 'client', 'mentor', 'other'],
        default: 'other'
    },
    tags: [{ type: String, trim: true }],
    
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

export const Person = mongoose.model<IPerson>('Person', PersonSchema);
