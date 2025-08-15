import mongoose, { Schema, Document } from 'mongoose';
import { DocumentViewConfig, Property, DocumentView, ModuleType } from '../types/document-view.types';

// Property Schema
const PropertySchema = new Schema<Property>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['text', 'number', 'date', 'select', 'multiSelect', 'checkbox', 'url', 'email', 'phone', 'file', 'relation']
    },
    description: { type: String },
    required: { type: Boolean, default: false },
    defaultValue: { type: Schema.Types.Mixed },
    options: [{
        name: { type: String, required: true },
        color: { type: String },
        value: { type: Schema.Types.Mixed }
    }],
    validation: {
        min: { type: Number },
        max: { type: Number },
        pattern: { type: String },
        message: { type: String }
    },
    frozen: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    width: { type: Number, default: 150 },
    moduleSpecific: { type: Schema.Types.Mixed }
}, { _id: false });

// View Schema
const ViewSchema = new Schema<DocumentView>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['TABLE', 'BOARD', 'KANBAN', 'GALLERY', 'LIST', 'CALENDAR', 'TIMELINE']
    },
    description: { type: String },
    isDefault: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    filters: [{
        propertyId: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        enabled: { type: Boolean, default: true }
    }],
    sorts: [{
        propertyId: { type: String, required: true },
        direction: { type: String, enum: ['asc', 'desc'], required: true },
        order: { type: Number, default: 0 },
        enabled: { type: Boolean, default: true }
    }],
    groupBy: { type: String },
    visibleProperties: [{ type: String }],
    customProperties: [PropertySchema],
    config: { type: Schema.Types.Mixed, default: {} },
    permissions: [{
        userId: { type: String, required: true },
        permission: { type: String, enum: ['read', 'write', 'admin'], required: true }
    }],
    createdBy: { type: String },
    lastEditedBy: { type: String }
}, { _id: false, timestamps: true });

// Main Document View Schema
const DocumentViewSchema = new Schema<IDocumentView>({
    userId: { type: String, required: true, index: true },
    moduleType: {
        type: String,
        required: true,
        enum: ['tasks', 'people', 'notes', 'goals', 'books', 'habits', 'projects', 'journals', 'moods', 'finances', 'content', 'databases'],
        index: true
    },
    databaseId: { type: String, required: true, index: true },

    // View configuration
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },

    // Properties and views
    properties: [PropertySchema],
    views: [ViewSchema],

    // Permissions and access
    isPublic: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    frozen: { type: Boolean, default: false },
    frozenAt: { type: Date },
    frozenBy: { type: String },
    frozenReason: { type: String },

    permissions: [{
        userId: { type: String, required: true },
        permission: { type: String, enum: ['read', 'write', 'admin'], required: true }
    }],

    // Required and frozen properties
    requiredProperties: [{ type: String }],
    frozenProperties: [{ type: String }],

    // Metadata
    createdBy: { type: String, required: true },
    lastEditedBy: { type: String, required: true }
}, {
    timestamps: true,
    collection: 'document_views'
});

// Compound indexes for better query performance
DocumentViewSchema.index({ userId: 1, moduleType: 1 });
DocumentViewSchema.index({ userId: 1, databaseId: 1 });
DocumentViewSchema.index({ userId: 1, moduleType: 1, databaseId: 1 }, { unique: true });

// Instance methods
DocumentViewSchema.methods.addView = function(view: DocumentView) {
    this.views.push(view);
    this.lastEditedBy = this.userId;
    return this.save();
};

DocumentViewSchema.methods.updateView = function(viewId: string, updates: Partial<DocumentView>) {
    const viewIndex = this.views.findIndex((v: DocumentView) => v.id === viewId);
    if (viewIndex === -1) {
        throw new Error('View not found');
    }
    
    Object.assign(this.views[viewIndex], updates);
    this.lastEditedBy = this.userId;
    return this.save();
};

DocumentViewSchema.methods.removeView = function(viewId: string) {
    this.views = this.views.filter((v: DocumentView) => v.id !== viewId);
    this.lastEditedBy = this.userId;
    return this.save();
};

DocumentViewSchema.methods.addProperty = function(property: Property) {
    this.properties.push(property);
    this.lastEditedBy = this.userId;
    return this.save();
};

DocumentViewSchema.methods.updateProperty = function(propertyId: string, updates: Partial<Property>) {
    const propertyIndex = this.properties.findIndex((p: Property) => p.id === propertyId);
    if (propertyIndex === -1) {
        throw new Error('Property not found');
    }
    
    Object.assign(this.properties[propertyIndex], updates);
    this.lastEditedBy = this.userId;
    return this.save();
};

DocumentViewSchema.methods.removeProperty = function(propertyId: string) {
    // Check if property is required or frozen
    if (this.requiredProperties.includes(propertyId) || this.frozenProperties.includes(propertyId)) {
        throw new Error('Cannot remove required or frozen property');
    }
    
    this.properties = this.properties.filter((p: Property) => p.id !== propertyId);
    this.lastEditedBy = this.userId;
    return this.save();
};

// Static methods
DocumentViewSchema.statics.findByModule = function(userId: string, moduleType: ModuleType) {
    return this.findOne({ userId, moduleType });
};

DocumentViewSchema.statics.findByDatabase = function(userId: string, databaseId: string) {
    return this.findOne({ userId, databaseId });
};

export interface IDocumentView extends DocumentViewConfig, Document {
    addView(view: DocumentView): Promise<IDocumentView>;
    updateView(viewId: string, updates: Partial<DocumentView>): Promise<IDocumentView>;
    removeView(viewId: string): Promise<IDocumentView>;
    addProperty(property: Property): Promise<IDocumentView>;
    updateProperty(propertyId: string, updates: Partial<Property>): Promise<IDocumentView>;
    removeProperty(propertyId: string): Promise<IDocumentView>;
}

export interface IDocumentViewModel extends mongoose.Model<IDocumentView> {
    findByModule(userId: string, moduleType: ModuleType): Promise<IDocumentView | null>;
    findByDatabase(userId: string, databaseId: string): Promise<IDocumentView | null>;
}

export const DocumentView = mongoose.model<IDocumentView, IDocumentViewModel>('DocumentView', DocumentViewSchema);
