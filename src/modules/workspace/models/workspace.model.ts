import mongoose, { Document, Schema } from 'mongoose';

// Workspace interface for API responses
export interface IWorkspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  
  // Ownership and permissions
  ownerId: string;
  members: Array<{
    userId: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joinedAt: Date;
    invitedBy: string;
  }>;
  
  // Settings
  isPublic: boolean;
  allowMemberInvites: boolean;
  defaultDatabasePermission: 'read' | 'write' | 'admin';
  
  // Organization
  color?: string;
  tags?: string[];
  
  // Statistics
  databaseCount?: number;
  memberCount?: number;
  lastActivityAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

// Mongoose document interface
export interface IWorkspaceDocument extends Document {
  name: string;
  description?: string;
  icon?: string;
  cover?: string;
  
  ownerId: string;
  members: Array<{
    userId: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joinedAt: Date;
    invitedBy: string;
  }>;
  
  isPublic: boolean;
  allowMemberInvites: boolean;
  defaultDatabasePermission: 'read' | 'write' | 'admin';
  
  color?: string;
  tags?: string[];
  
  databaseCount?: number;
  memberCount?: number;
  lastActivityAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
}

// Member schema
const WorkspaceMemberSchema = new Schema({
  userId: { type: String, required: true, index: true },
  role: { 
    type: String, 
    enum: ['owner', 'admin', 'editor', 'viewer'], 
    required: true,
    default: 'viewer'
  },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: String, required: true }
}, { _id: false });

// Main workspace schema
const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String, 
      maxlength: 500,
      trim: true
    },
    icon: { 
      type: String, 
      maxlength: 50 
    },
    cover: { 
      type: String, 
      maxlength: 500 
    },
    
    // Ownership
    ownerId: { 
      type: String, 
      required: true, 
      index: true 
    },
    members: [WorkspaceMemberSchema],
    
    // Settings
    isPublic: { 
      type: Boolean, 
      default: false 
    },
    allowMemberInvites: { 
      type: Boolean, 
      default: true 
    },
    defaultDatabasePermission: { 
      type: String, 
      enum: ['read', 'write', 'admin'], 
      default: 'read' 
    },
    
    // Organization
    color: { 
      type: String, 
      maxlength: 7,
      match: /^#[0-9A-Fa-f]{6}$/
    },
    tags: [{ 
      type: String, 
      trim: true, 
      maxlength: 50 
    }],
    
    // Statistics (computed fields)
    databaseCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    memberCount: { 
      type: Number, 
      default: 1,
      min: 1
    },
    lastActivityAt: { 
      type: Date, 
      default: Date.now 
    },
    
    // Audit fields
    createdBy: { 
      type: String, 
      required: true 
    },
    lastEditedBy: { 
      type: String, 
      required: true 
    }
  },
  {
    timestamps: true,
    collection: 'workspaces',
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Indexes for performance
WorkspaceSchema.index({ ownerId: 1, createdAt: -1 });
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ isPublic: 1 });
WorkspaceSchema.index({ tags: 1 });
WorkspaceSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to update member count
WorkspaceSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.memberCount = this.members.length;
  }
  next();
});

// Virtual for checking if user is member
WorkspaceSchema.methods.isMember = function(userId: string): boolean {
  return this.members.some((member: any) => member.userId === userId);
};

// Virtual for getting user role
WorkspaceSchema.methods.getUserRole = function(userId: string): string | null {
  const member = this.members.find((member: any) => member.userId === userId);
  return member ? member.role : null;
};

// Virtual for checking permissions
WorkspaceSchema.methods.canUserEdit = function(userId: string): boolean {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'admin' || role === 'editor';
};

WorkspaceSchema.methods.canUserAdmin = function(userId: string): boolean {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'admin';
};

WorkspaceSchema.methods.isOwner = function(userId: string): boolean {
  return this.ownerId === userId;
};

export const WorkspaceModel = mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);

// Export document type for use in other files
export type WorkspaceDocument = IWorkspaceDocument;
