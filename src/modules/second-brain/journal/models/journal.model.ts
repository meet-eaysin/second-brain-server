import mongoose, { Schema, Document } from 'mongoose';

export interface IJournal extends Document {
    // Entry Details
    date: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'reflection';
    title?: string;
    content: string;
    
    // Mood & Energy
    mood?: {
        value: number; // 1-10 scale
        emoji?: string;
        notes?: string;
    };
    energy?: {
        value: number; // 1-10 scale
        notes?: string;
    };
    
    // Daily Template Fields
    gratitude?: string[];
    wins?: string[];
    challenges?: string[];
    learnings?: string[];
    tomorrowFocus?: string[];
    
    // Weekly/Monthly Template Fields
    weeklyReflection?: {
        accomplishments: string[];
        challenges: string[];
        insights: string[];
        nextWeekGoals: string[];
    };
    
    // Relationships
    linkedTasks: mongoose.Types.ObjectId[];
    linkedProjects: mongoose.Types.ObjectId[];
    linkedGoals: mongoose.Types.ObjectId[];
    linkedHabits: mongoose.Types.ObjectId[];
    tags: string[];
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

const JournalSchema = new Schema<IJournal>({
    // Entry Details
    date: { type: Date, required: true },
    type: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly', 'reflection'],
        required: true
    },
    title: { type: String, trim: true },
    content: { type: String, required: true },
    
    // Mood & Energy
    mood: {
        value: { type: Number, min: 1, max: 10 },
        emoji: { type: String, trim: true },
        notes: { type: String, trim: true }
    },
    energy: {
        value: { type: Number, min: 1, max: 10 },
        notes: { type: String, trim: true }
    },
    
    // Daily Template Fields
    gratitude: [{ type: String, trim: true }],
    wins: [{ type: String, trim: true }],
    challenges: [{ type: String, trim: true }],
    learnings: [{ type: String, trim: true }],
    tomorrowFocus: [{ type: String, trim: true }],
    
    // Weekly/Monthly Template Fields
    weeklyReflection: {
        accomplishments: [{ type: String, trim: true }],
        challenges: [{ type: String, trim: true }],
        insights: [{ type: String, trim: true }],
        nextWeekGoals: [{ type: String, trim: true }]
    },
    
    // Relationships
    linkedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    linkedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    linkedGoals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    linkedHabits: [{ type: Schema.Types.ObjectId, ref: 'Habit' }],
    tags: [{ type: String, trim: true }],
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure one entry per date per type per user
JournalSchema.index({ createdBy: 1, date: 1, type: 1 }, { unique: true });

// Other indexes
JournalSchema.index({ createdBy: 1, type: 1 });
JournalSchema.index({ createdBy: 1, date: -1 });
JournalSchema.index({ createdBy: 1, tags: 1 });

// Text search
JournalSchema.index({ 
    title: 'text', 
    content: 'text',
    tags: 'text'
});

export const Journal = mongoose.model<IJournal>('Journal', JournalSchema);
