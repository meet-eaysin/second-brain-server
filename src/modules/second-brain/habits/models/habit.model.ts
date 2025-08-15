import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit extends Document {
    title: string;
    description?: string;
    
    // Habit Configuration
    frequency: 'daily' | 'weekly' | 'custom';
    targetCount: number; // How many times per frequency period
    unit?: string; // e.g., 'minutes', 'pages', 'glasses'
    
    // Custom frequency (if frequency is 'custom')
    customFrequency?: {
        daysOfWeek: number[]; // 0-6, Sunday-Saturday
        timesPerWeek?: number;
    };
    
    // Tracking
    entries: {
        date: Date;
        completed: boolean;
        value?: number; // For quantifiable habits
        notes?: string;
    }[];
    
    // Relationships
    goal?: mongoose.Types.ObjectId;
    area: 'projects' | 'areas' | 'resources' | 'archive';
    tags: string[];
    
    // Settings
    isActive: boolean;
    startDate: Date;
    endDate?: Date;
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

const HabitSchema = new Schema<IHabit>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // Habit Configuration
    frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'custom'],
        required: true
    },
    targetCount: { type: Number, required: true, min: 1 },
    unit: { type: String, trim: true },
    
    // Custom frequency
    customFrequency: {
        daysOfWeek: [{ type: Number, min: 0, max: 6 }],
        timesPerWeek: { type: Number, min: 1, max: 7 }
    },
    
    // Tracking
    entries: [{
        date: { type: Date, required: true },
        completed: { type: Boolean, required: true },
        value: { type: Number, min: 0 },
        notes: { type: String, trim: true }
    }],
    
    // Relationships
    goal: { type: Schema.Types.ObjectId, ref: 'Goal' },
    area: { 
        type: String, 
        enum: ['projects', 'areas', 'resources', 'archive'],
        default: 'areas'
    },
    tags: [{ type: String, trim: true }],
    
    // Settings
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for current streak
HabitSchema.virtual('currentStreak').get(function() {
    // Calculate current streak based on entries
    // This would need implementation logic
    return 0;
});

// Virtual for completion rate
HabitSchema.virtual('completionRate').get(function() {
    if (this.entries.length === 0) return 0;
    const completed = this.entries.filter(entry => entry.completed).length;
    return Math.round((completed / this.entries.length) * 100);
});

// Indexes
HabitSchema.index({ createdBy: 1, isActive: 1 });
HabitSchema.index({ createdBy: 1, frequency: 1 });
HabitSchema.index({ createdBy: 1, area: 1 });
HabitSchema.index({ 'entries.date': 1 });

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);
