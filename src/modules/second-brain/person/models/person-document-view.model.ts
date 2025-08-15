import mongoose, { Schema, Document } from 'mongoose';

// Interface for Person Document View
export interface IPersonDocumentView extends Document {
    id: string;
    name: string;
    type: 'TABLE' | 'KANBAN' | 'GALLERY' | 'CALENDAR' | 'TIMELINE' | 'LIST' | 'CUSTOM_PROPERTIES';
    description?: string;
    isDefault: boolean;
    isSystemView: boolean;
    
    // View configuration
    filters: Array<{
        propertyId: string;
        operator: string;
        value: any;
        condition?: 'AND' | 'OR';
    }>;
    
    sorts: Array<{
        propertyId: string;
        direction: 'asc' | 'desc';
        order: number;
    }>;
    
    groupBy?: string;
    
    visibleProperties: string[];
    
    properties?: Array<{
        propertyId: string;
        order: number;
        width?: number;
        visible?: boolean;
        frozen?: boolean;
        displayConfig?: any;
    }>;

    customProperties?: Array<{
        id: string;
        name: string;
        type: string;
        description?: string;
        required?: boolean;
        order?: number;
        isVisible?: boolean;
        frozen?: boolean;
        selectOptions?: Array<{
            value: string;
            label: string;
            color?: string;
        }>;
    }>;

    frozenProperties: string[];
    
    config?: {
        canEdit?: boolean;
        canDelete?: boolean;
        isSystemView?: boolean;
        [key: string]: any;
    };
    
    // Metadata
    createdBy: string;
    databaseId: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted?: boolean;
    deletedAt?: Date;
}

// Person Document View Schema
const PersonDocumentViewSchema = new Schema<IPersonDocumentView>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    
    type: {
        type: String,
        enum: ['TABLE', 'KANBAN', 'GALLERY', 'CALENDAR', 'TIMELINE', 'LIST', 'CUSTOM_PROPERTIES'],
        default: 'TABLE',
        required: true
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    
    isDefault: {
        type: Boolean,
        default: false
    },
    
    isSystemView: {
        type: Boolean,
        default: false
    },
    
    filters: [{
        propertyId: {
            type: String,
            required: true
        },
        operator: {
            type: String,
            required: true,
            enum: [
                'equals', 'not_equals', 'contains', 'not_contains',
                'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
                'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
                'on_or_before', 'on_or_after', 'between', 'in', 'not_in'
            ]
        },
        value: Schema.Types.Mixed,
        condition: {
            type: String,
            enum: ['AND', 'OR'],
            default: 'AND'
        }
    }],
    
    sorts: [{
        propertyId: {
            type: String,
            required: true
        },
        direction: {
            type: String,
            enum: ['asc', 'desc'],
            required: true
        },
        order: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    
    groupBy: {
        type: String,
        trim: true
    },
    
    visibleProperties: [{
        type: String,
        required: true
    }],
    
    properties: [{
        propertyId: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: true,
            min: 0
        },
        width: {
            type: Number,
            min: 50,
            max: 1000
        },
        visible: {
            type: Boolean,
            default: true
        },
        frozen: {
            type: Boolean,
            default: false
        },
        displayConfig: Schema.Types.Mixed
    }],

    // Custom properties added by users
    customProperties: [{
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: [
                'TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL', 'SELECT', 'MULTI_SELECT',
                'DATE', 'NUMBER', 'CHECKBOX', 'PERSON', 'RELATION', 'CREATED_TIME', 'LAST_EDITED_TIME'
            ]
        },
        description: {
            type: String,
            default: ''
        },
        required: {
            type: Boolean,
            default: false
        },
        order: {
            type: Number,
            default: 0
        },
        isVisible: {
            type: Boolean,
            default: true
        },
        frozen: {
            type: Boolean,
            default: false
        },
        selectOptions: [{
            value: String,
            label: String,
            color: String
        }]
    }],

    frozenProperties: [{
        type: String,
        required: true
    }],
    
    config: {
        type: Schema.Types.Mixed,
        default: {}
    },
    
    // Metadata
    createdBy: {
        type: String,
        required: true,
        index: true
    },
    
    databaseId: {
        type: String,
        required: true,
        default: 'people-main-db',
        index: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function(_: unknown, ret: any) {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret as IPersonDocumentView;
        }
    }
});

// Indexes for better performance
PersonDocumentViewSchema.index({ createdBy: 1, databaseId: 1 });
PersonDocumentViewSchema.index({ createdBy: 1, isDefault: 1 });
PersonDocumentViewSchema.index({ createdBy: 1, isDeleted: 1 });
PersonDocumentViewSchema.index({ createdBy: 1, type: 1 });

// Pre-save middleware to update timestamps
PersonDocumentViewSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

// Static methods
PersonDocumentViewSchema.statics.findByUser = function(userId: string) {
    return this.find({ 
        createdBy: userId, 
        isDeleted: { $ne: true } 
    }).sort({ createdAt: -1 });
};

PersonDocumentViewSchema.statics.findDefaultByUser = function(userId: string) {
    return this.findOne({ 
        createdBy: userId, 
        isDefault: true,
        isDeleted: { $ne: true } 
    });
};

PersonDocumentViewSchema.statics.findByDatabase = function(userId: string, databaseId: string) {
    return this.find({ 
        createdBy: userId, 
        databaseId,
        isDeleted: { $ne: true } 
    }).sort({ createdAt: -1 });
};

// Instance methods
PersonDocumentViewSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

PersonDocumentViewSchema.methods.restore = function() {
    this.isDeleted = false;
    this.deletedAt = undefined;
    return this.save();
};

PersonDocumentViewSchema.methods.duplicate = function(newName?: string) {
    const duplicated = new PersonDocumentView({
        ...this.toObject(),
        _id: undefined,
        name: newName || `${this.name} (Copy)`,
        isDefault: false,
        isSystemView: false,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    return duplicated.save();
};

// Export the model
export const PersonDocumentView = mongoose.model<IPersonDocumentView>('PersonDocumentView', PersonDocumentViewSchema);
