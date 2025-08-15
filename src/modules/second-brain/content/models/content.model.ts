import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
    // Content Details
    title: string;
    description?: string;
    type: 'blog' | 'video' | 'podcast' | 'social' | 'newsletter' | 'course' | 'other';

    // Content Pipeline
    status: 'idea' | 'draft' | 'in-review' | 'scheduled' | 'published' | 'archived';

    // Content Data
    content?: string; // Main content/script
    notes?: string; // Simple notes field managed via service helpers
    outline?: string[];
    keywords?: string[];

    // Publishing Details
    platform?: string[]; // YouTube, Blog, LinkedIn, etc.
    publishDate?: Date;
    scheduledDate?: Date;
    url?: string;

    // SEO & Marketing
    seoTitle?: string;
    metaDescription?: string;
    thumbnail?: string;

    // Performance Tracking
    metrics?: {
        views?: number;
        likes?: number;
        shares?: number;
        comments?: number;
        engagement?: number;
        revenue?: number;
    };

    // Collaboration
    collaborators?: mongoose.Types.ObjectId[];
    sponsors?: {
        name: string;
        amount?: number;
        requirements?: string[];
    }[];

    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];

    // Relationships
    linkedProjects: mongoose.Types.ObjectId[];
    linkedGoals: mongoose.Types.ObjectId[];

    // Favorites
    isFavorite?: boolean;

    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    archivedAt?: Date;
}

const ContentSchema = new Schema<IContent>({
    // Content Details
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { 
        type: String, 
        enum: ['blog', 'video', 'podcast', 'social', 'newsletter', 'course', 'other'],
        required: true
    },
    
    // Content Pipeline
    status: { 
        type: String, 
        enum: ['idea', 'draft', 'in-review', 'scheduled', 'published', 'archived'],
        default: 'idea'
    },
    
    // Content Data
    content: { type: String, trim: true },
    notes: { type: String, trim: true },
    outline: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],

    // Publishing Details
    platform: [{ type: String, trim: true }],
    publishDate: { type: Date },
    scheduledDate: { type: Date },
    url: { type: String, trim: true },
    
    // SEO & Marketing
    seoTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    
    // Performance Tracking
    metrics: {
        views: { type: Number, min: 0, default: 0 },
        likes: { type: Number, min: 0, default: 0 },
        shares: { type: Number, min: 0, default: 0 },
        comments: { type: Number, min: 0, default: 0 },
        engagement: { type: Number, min: 0, default: 0 },
        revenue: { type: Number, min: 0, default: 0 }
    },
    
    // Collaboration
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    sponsors: [{
        name: { type: String, required: true, trim: true },
        amount: { type: Number, min: 0 },
        requirements: [{ type: String, trim: true }]
    }],
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'projects'
    },
    tags: [{ type: String, trim: true }],
    
    // Relationships
    linkedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    linkedGoals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
ContentSchema.index({ createdBy: 1, status: 1 });
ContentSchema.index({ createdBy: 1, type: 1 });
ContentSchema.index({ createdBy: 1, area: 1 });
ContentSchema.index({ createdBy: 1, publishDate: 1 });
ContentSchema.index({ createdBy: 1, scheduledDate: 1 });

// Text search
ContentSchema.index({ 
    title: 'text', 
    description: 'text',
    content: 'text',
    tags: 'text'
});

export const Content = mongoose.model<IContent>('Content', ContentSchema);
