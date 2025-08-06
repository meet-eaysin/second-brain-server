import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
    // Book Details
    title: string;
    author: string;
    isbn?: string;
    genre?: string[];
    pages?: number;
    
    // Reading Status
    status: 'want-to-read' | 'reading' | 'completed' | 'paused' | 'abandoned';
    startDate?: Date;
    endDate?: Date;
    currentPage?: number;
    
    // Rating & Review
    rating?: number; // 1-5 stars
    review?: string;
    
    // Notes & Highlights
    notes: {
        page?: number;
        chapter?: string;
        content: string;
        type: 'note' | 'highlight' | 'quote';
        createdAt: Date;
    }[];
    
    // Key Insights
    keyInsights?: string[];
    actionItems?: string[];
    
    // PARA Classification
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    
    // Relationships
    linkedProjects: mongoose.Types.ObjectId[];
    linkedGoals: mongoose.Types.ObjectId[];
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

const BookSchema = new Schema<IBook>({
    // Book Details
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    genre: [{ type: String, trim: true }],
    pages: { type: Number, min: 1 },
    
    // Reading Status
    status: { 
        type: String, 
        enum: ['want-to-read', 'reading', 'completed', 'paused', 'abandoned'],
        default: 'want-to-read'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    currentPage: { type: Number, min: 0 },
    
    // Rating & Review
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true },
    
    // Notes & Highlights
    notes: [{
        page: { type: Number, min: 1 },
        chapter: { type: String, trim: true },
        content: { type: String, required: true, trim: true },
        type: { 
            type: String, 
            enum: ['note', 'highlight', 'quote'],
            required: true
        },
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Key Insights
    keyInsights: [{ type: String, trim: true }],
    actionItems: [{ type: String, trim: true }],
    
    // PARA Classification
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'resources'
    },
    tags: [{ type: String, trim: true }],
    
    // Relationships
    linkedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    linkedGoals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for reading progress
BookSchema.virtual('readingProgress').get(function() {
    if (!this.pages || !this.currentPage) return 0;
    return Math.min(100, Math.round((this.currentPage / this.pages) * 100));
});

// Indexes
BookSchema.index({ createdBy: 1, status: 1 });
BookSchema.index({ createdBy: 1, area: 1 });
BookSchema.index({ createdBy: 1, tags: 1 });
BookSchema.index({ createdBy: 1, genre: 1 });

// Text search
BookSchema.index({ 
    title: 'text', 
    author: 'text',
    tags: 'text'
});

export const Book = mongoose.model<IBook>('Book', BookSchema);
