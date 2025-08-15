import mongoose, { Schema, Document } from 'mongoose';

export interface IMood extends Document {
    // Mood Entry
    date: Date;
    mood: {
        value: number; // 1-10 scale
        emoji?: string;
        label?: string; // 'Happy', 'Sad', 'Anxious', etc.
    };
    
    // Energy Level
    energy: {
        value: number; // 1-10 scale
        notes?: string;
    };
    
    // Additional Metrics
    stress?: number; // 1-10 scale
    productivity?: number; // 1-10 scale
    sleep?: {
        hours: number;
        quality: number; // 1-10 scale
    };
    moodScore?: number; // derived aggregate score
    
    // Context
    activities?: string[]; // What did you do today?
    location?: string;
    weather?: string;
    
    // Notes & Reflection
    notes?: string;
    gratitude?: string[];
    challenges?: string[];
    
    // Relationships
    linkedTasks?: mongoose.Types.ObjectId[];
    linkedJournal?: mongoose.Types.ObjectId;
    linkedHabits?: mongoose.Types.ObjectId[];
    tags: string[];
    
    // Metadata
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MoodSchema = new Schema<IMood>({
    // Mood Entry
    date: { type: Date, required: true },
    mood: {
        value: { type: Number, required: true, min: 1, max: 10 },
        emoji: { type: String, trim: true },
        label: { type: String, trim: true }
    },
    
    // Energy Level
    energy: {
        value: { type: Number, required: true, min: 1, max: 10 },
        notes: { type: String, trim: true }
    },
    
    // Additional Metrics
    stress: { type: Number, min: 1, max: 10 },
    productivity: { type: Number, min: 1, max: 10 },
    sleep: {
        hours: { type: Number, min: 0, max: 24 },
        quality: { type: Number, min: 1, max: 10 }
    },
    moodScore: { type: Number, min: 0, max: 10 }, // derived aggregate score
    
    // Context
    activities: [{ type: String, trim: true }],
    location: { type: String, trim: true },
    weather: { type: String, trim: true },
    
    // Notes & Reflection
    notes: { type: String, trim: true },
    gratitude: [{ type: String, trim: true }],
    challenges: [{ type: String, trim: true }],
    
    // Relationships
    linkedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    linkedJournal: { type: Schema.Types.ObjectId, ref: 'Journal' },
    linkedHabits: [{ type: Schema.Types.ObjectId, ref: 'Habit' }],
    tags: [{ type: String, trim: true }],
    
    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure one mood entry per day per user
MoodSchema.index({ createdBy: 1, date: 1 }, { unique: true });

// Other indexes
MoodSchema.index({ createdBy: 1, date: -1 });
MoodSchema.index({ createdBy: 1, 'mood.value': 1 });
MoodSchema.index({ createdBy: 1, 'energy.value': 1 });

export const Mood = mongoose.model<IMood>('Mood', MoodSchema);
