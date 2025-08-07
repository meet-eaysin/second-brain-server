import mongoose, { Schema, Document } from 'mongoose';

// Task Document View Types
export type TaskPropertyType = 
    | 'TEXT' 
    | 'TEXTAREA' 
    | 'SELECT' 
    | 'MULTI_SELECT' 
    | 'DATE' 
    | 'NUMBER' 
    | 'PERSON' 
    | 'CHECKBOX' 
    | 'URL'
    | 'EMAIL'
    | 'PHONE'
    | 'RELATION'
    | 'FORMULA'
    | 'ROLLUP'
    | 'CREATED_TIME'
    | 'CREATED_BY'
    | 'LAST_EDITED_TIME'
    | 'LAST_EDITED_BY';

export type TaskViewType = 'TABLE' | 'KANBAN' | 'CALENDAR' | 'TIMELINE' | 'GALLERY' | 'LIST';

export interface ITaskSelectOption {
    id: string;
    name: string;
    color: string;
}

export interface ITaskRelationConfig {
    relatedDatabaseId: string;
    relationType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
}

export interface ITaskFormulaConfig {
    expression: string;
    returnType: TaskPropertyType;
}

export interface ITaskProperty {
    id: string;
    name: string;
    type: TaskPropertyType;
    description?: string;
    required: boolean;
    isVisible: boolean;
    order: number;
    frozen?: boolean;
    width?: number;
    selectOptions?: ITaskSelectOption[];
    relationConfig?: ITaskRelationConfig;
    formulaConfig?: ITaskFormulaConfig;
}

export interface ITaskViewFilter {
    propertyId: string;
    operator: string;
    value: unknown;
    logic?: 'AND' | 'OR';
}

export interface ITaskViewSort {
    propertyId: string;
    direction: 'asc' | 'desc';
    order: number;
}

export interface ITaskView {
    id: string;
    name: string;
    type: TaskViewType;
    isDefault: boolean;
    filters: ITaskViewFilter[];
    sorts: ITaskViewSort[];
    groupBy?: string;
    visibleProperties: string[];
    propertyWidths?: Record<string, number>;
    config?: {
        // Kanban specific
        groupByPropertyId?: string;
        showUngrouped?: boolean;
        
        // Calendar specific
        dateProperty?: string;
        colorProperty?: string;
        
        // Timeline specific
        startDateProperty?: string;
        endDateProperty?: string;
        groupByProperty?: string;
        
        // Display settings
        rowHeight?: 'compact' | 'medium' | 'tall';
        showRowNumbers?: boolean;
        enableGrouping?: boolean;
        pageSize?: number;

        // Protection settings
        canEdit?: boolean;
        canDelete?: boolean;
        isSystemView?: boolean;
    };
}

export interface ITaskDocumentView extends Document {
    userId: string;
    databaseId: string;
    moduleType: 'tasks';
    documentType: 'TASKS';
    
    // View configuration
    name: string;
    description?: string;
    icon?: string;
    
    // Properties and views
    properties: ITaskProperty[];
    views: ITaskView[];
    
    // Permissions and access
    isPublic: boolean;
    isDefault: boolean;
    permissions: Array<{
        userId: string;
        permission: 'read' | 'write' | 'admin';
    }>;
    
    // Backend-controlled configuration
    requiredProperties: string[]; // Properties that cannot be removed
    frozenProperties: string[]; // Properties that cannot be unfrozen

    // Freeze functionality
    frozen: boolean;
    frozenAt?: Date;
    frozenBy?: string;
    frozenReason?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastEditedBy: string;
}

// Schemas
const TaskSelectOptionSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true }
});

const TaskRelationConfigSchema = new Schema({
    relatedDatabaseId: { type: String, required: true },
    relationType: { 
        type: String, 
        enum: ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'],
        required: true 
    }
});

const TaskFormulaConfigSchema = new Schema({
    expression: { type: String, required: true },
    returnType: { 
        type: String, 
        enum: ['TEXT', 'NUMBER', 'DATE', 'CHECKBOX'],
        required: true 
    }
});

const TaskPropertySchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: [
            'TEXT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'DATE', 'NUMBER', 
            'PERSON', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE', 'RELATION', 
            'FORMULA', 'ROLLUP', 'CREATED_TIME', 'CREATED_BY', 
            'LAST_EDITED_TIME', 'LAST_EDITED_BY'
        ],
        required: true
    },
    description: String,
    required: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, required: true },
    frozen: { type: Boolean, default: false },
    width: Number,
    selectOptions: [TaskSelectOptionSchema],
    relationConfig: TaskRelationConfigSchema,
    formulaConfig: TaskFormulaConfigSchema
});

const TaskViewFilterSchema = new Schema({
    propertyId: { type: String, required: true },
    operator: { type: String, required: true },
    value: Schema.Types.Mixed,
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' }
});

const TaskViewSortSchema = new Schema({
    propertyId: { type: String, required: true },
    direction: { type: String, enum: ['asc', 'desc'], required: true },
    order: { type: Number, required: true }
});

const TaskViewSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['TABLE', 'KANBAN', 'CALENDAR', 'TIMELINE', 'GALLERY', 'LIST'],
        required: true
    },
    isDefault: { type: Boolean, default: false },
    filters: [TaskViewFilterSchema],
    sorts: [TaskViewSortSchema],
    groupBy: String,
    visibleProperties: [String],
    propertyWidths: { type: Map, of: Number },
    config: {
        // Kanban specific
        groupByPropertyId: String,
        showUngrouped: { type: Boolean, default: true },
        
        // Calendar specific
        dateProperty: String,
        colorProperty: String,
        
        // Timeline specific
        startDateProperty: String,
        endDateProperty: String,
        groupByProperty: String,
        
        // Display settings
        rowHeight: { type: String, enum: ['compact', 'medium', 'tall'], default: 'medium' },
        showRowNumbers: { type: Boolean, default: false },
        enableGrouping: { type: Boolean, default: true },
        pageSize: { type: Number, default: 50 },

        // Protection settings
        canEdit: { type: Boolean, default: true },
        canDelete: { type: Boolean, default: true },
        isSystemView: { type: Boolean, default: false }
    }
});

const TaskDocumentViewSchema = new Schema<ITaskDocumentView>({
    userId: { type: String, required: true, index: true },
    databaseId: { type: String, required: true, index: true },
    moduleType: { type: String, default: 'tasks', immutable: true },
    documentType: { type: String, default: 'TASKS', immutable: true },
    
    // View configuration
    name: { type: String, required: true },
    description: String,
    icon: { type: String, default: '✅' },
    
    // Properties and views
    properties: [TaskPropertySchema],
    views: [TaskViewSchema],
    
    // Permissions and access
    isPublic: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    permissions: [{
        userId: String,
        permission: { type: String, enum: ['read', 'write', 'admin'] }
    }],
    
    // Backend-controlled configuration
    requiredProperties: [String], // Properties that cannot be removed
    frozenProperties: [String], // Properties that cannot be unfrozen

    // Freeze functionality
    frozen: { type: Boolean, default: false },
    frozenAt: Date,
    frozenBy: String,
    frozenReason: String,

    // Metadata
    createdBy: { type: String, required: true },
    lastEditedBy: { type: String, required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
TaskDocumentViewSchema.index({ userId: 1, databaseId: 1 });
TaskDocumentViewSchema.index({ userId: 1, moduleType: 1 });
TaskDocumentViewSchema.index({ userId: 1, isDefault: 1 });

export const TaskDocumentView = mongoose.model<ITaskDocumentView>('TaskDocumentView', TaskDocumentViewSchema);
