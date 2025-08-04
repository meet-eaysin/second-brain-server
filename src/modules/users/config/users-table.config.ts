// Users Table Configuration
import { 
  TableConfiguration, 
  TableColumn, 
  TableView, 
  TableAction,
  registerTableConfig 
} from '../../database/core/table-config';
import { registerTableModel } from '../../database/services/table.service';
import { UserModel } from '../models/users.model';

// Define columns for users table
const usersColumns: TableColumn[] = [
  {
    key: 'firstName',
    label: 'First Name',
    type: 'text',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 0,
    validation: {
      maxLength: 50
    }
  },
  {
    key: 'lastName',
    label: 'Last Name',
    type: 'text',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 1,
    validation: {
      maxLength: 50
    }
  },
  {
    key: 'username',
    label: 'Username',
    type: 'text',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: true,
    editable: true,
    visible: true,
    frozen: false,
    order: 2,
    validation: {
      required: true,
      minLength: 3,
      maxLength: 30
    }
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    width: 200,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: true,
    editable: true,
    visible: true,
    frozen: false,
    order: 3,
    validation: {
      required: true,
      maxLength: 100
    }
  },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: true,
    editable: true,
    visible: true,
    frozen: false,
    order: 4,
    selectOptions: [
      { value: 'user', label: 'User', color: '#6b7280' },
      { value: 'moderator', label: 'Moderator', color: '#3b82f6' },
      { value: 'admin', label: 'Admin', color: '#ef4444' }
    ],
    permissions: {
      view: true,
      edit: true,
      roles: ['admin', 'moderator']
    }
  },
  {
    key: 'authProvider',
    label: 'Auth Provider',
    type: 'select',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: true,
    editable: false,
    visible: true,
    frozen: false,
    order: 5,
    selectOptions: [
      { value: 'local', label: 'Local', color: '#6b7280' },
      { value: 'google', label: 'Google', color: '#ef4444' }
    ]
  },
  {
    key: 'isActive',
    label: 'Active',
    type: 'boolean',
    width: 80,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 6,
    permissions: {
      view: true,
      edit: true,
      roles: ['admin', 'moderator']
    }
  },
  {
    key: 'isEmailVerified',
    label: 'Email Verified',
    type: 'boolean',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 7,
    permissions: {
      view: true,
      edit: true,
      roles: ['admin', 'moderator']
    }
  },
  {
    key: 'profilePicture',
    label: 'Profile Picture',
    type: 'image',
    width: 100,
    alignment: 'center',
    sortable: false,
    filterable: false,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 8
  },
  {
    key: 'lastLoginAt',
    label: 'Last Login',
    type: 'datetime',
    width: 150,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: false,
    visible: true,
    frozen: false,
    order: 9,
    format: 'YYYY-MM-DD HH:mm'
  },
  {
    key: 'createdAt',
    label: 'Created',
    type: 'datetime',
    width: 150,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: false,
    visible: false,
    frozen: false,
    order: 98,
    format: 'YYYY-MM-DD HH:mm'
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    type: 'datetime',
    width: 150,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: false,
    visible: false,
    frozen: false,
    order: 99,
    format: 'YYYY-MM-DD HH:mm'
  }
];

// Define views for users table
const usersViews: TableView[] = [
  {
    id: 'all',
    name: 'All Users',
    description: 'All users in the system',
    isDefault: true,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'role', 'authProvider', 'isActive', 'isEmailVerified', 'lastLoginAt'],
    sorts: [
      { column: 'createdAt', direction: 'desc' }
    ]
  },
  {
    id: 'active',
    name: 'Active Users',
    description: 'Currently active users',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'role', 'lastLoginAt'],
    filters: [
      {
        column: 'isActive',
        operator: 'equals',
        value: true
      }
    ],
    sorts: [
      { column: 'lastLoginAt', direction: 'desc' }
    ]
  },
  {
    id: 'inactive',
    name: 'Inactive Users',
    description: 'Inactive or suspended users',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'role', 'createdAt'],
    filters: [
      {
        column: 'isActive',
        operator: 'equals',
        value: false
      }
    ],
    sorts: [
      { column: 'createdAt', direction: 'desc' }
    ]
  },
  {
    id: 'admins',
    name: 'Administrators',
    description: 'Admin users',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'isActive', 'lastLoginAt'],
    filters: [
      {
        column: 'role',
        operator: 'equals',
        value: 'admin'
      }
    ],
    sorts: [
      { column: 'lastName', direction: 'asc' }
    ]
  },
  {
    id: 'unverified',
    name: 'Unverified Email',
    description: 'Users with unverified email addresses',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'authProvider', 'createdAt'],
    filters: [
      {
        column: 'isEmailVerified',
        operator: 'equals',
        value: false
      }
    ],
    sorts: [
      { column: 'createdAt', direction: 'desc' }
    ]
  },
  {
    id: 'recent',
    name: 'Recent Users',
    description: 'Recently registered users',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'username', 'email', 'role', 'authProvider', 'createdAt'],
    sorts: [
      { column: 'createdAt', direction: 'desc' }
    ]
  }
];

// Define actions for users table
const usersActions: TableAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'Edit',
    type: 'single',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'toggle-status',
    label: 'Toggle Status',
    icon: 'Power',
    type: 'single',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'change-role',
    label: 'Change Role',
    icon: 'Shield',
    type: 'single',
    variant: 'outline',
    permissions: ['admin']
  },
  {
    id: 'reset-password',
    label: 'Reset Password',
    icon: 'Key',
    type: 'single',
    variant: 'outline',
    permissions: ['admin']
  },
  {
    id: 'send-verification',
    label: 'Send Verification',
    icon: 'Mail',
    type: 'single',
    variant: 'outline',
    permissions: ['admin', 'moderator'],
    showWhen: (record) => !record?.isEmailVerified
  },
  {
    id: 'view-profile',
    label: 'View Profile',
    icon: 'User',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'Trash2',
    type: 'single',
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete this user?',
    permissions: ['admin']
  },
  {
    id: 'bulk-activate',
    label: 'Activate Selected',
    icon: 'CheckCircle2',
    type: 'bulk',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'bulk-deactivate',
    label: 'Deactivate Selected',
    icon: 'XCircle',
    type: 'bulk',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'bulk-role',
    label: 'Change Role',
    icon: 'Shield',
    type: 'bulk',
    variant: 'outline',
    permissions: ['admin']
  },
  {
    id: 'bulk-verification',
    label: 'Send Verification',
    icon: 'Mail',
    type: 'bulk',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'bulk-delete',
    label: 'Delete Selected',
    icon: 'Trash2',
    type: 'bulk',
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected users?',
    permissions: ['admin']
  },
  {
    id: 'create',
    label: 'New User',
    icon: 'Plus',
    type: 'global',
    variant: 'default',
    permissions: ['admin']
  },
  {
    id: 'import',
    label: 'Import Users',
    icon: 'Upload',
    type: 'global',
    variant: 'outline',
    permissions: ['admin']
  },
  {
    id: 'export',
    label: 'Export Users',
    icon: 'Download',
    type: 'global',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  },
  {
    id: 'user-stats',
    label: 'View Statistics',
    icon: 'BarChart3',
    type: 'global',
    variant: 'outline',
    permissions: ['admin', 'moderator']
  }
];

// Users table configuration
const usersTableConfig: TableConfiguration = {
  entityKey: 'users',
  displayName: 'User',
  displayNamePlural: 'Users',
  description: 'Manage system users and their permissions',
  icon: 'Users',
  
  collection: 'users',
  primaryKey: '_id',
  
  columns: usersColumns,
  defaultColumns: ['firstName', 'lastName', 'username', 'email', 'role', 'authProvider', 'isActive', 'isEmailVerified', 'lastLoginAt'],
  
  views: usersViews,
  defaultView: 'all',
  
  actions: usersActions,
  
  permissions: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    export: true,
    import: true,
    bulkEdit: true,
    manageViews: true,
    
    rowPermissions: {
      canViewAll: true,
      canEditAll: false,
      canDeleteAll: false
    }
  },
  
  features: {
    search: true,
    filters: true,
    sorting: true,
    pagination: true,
    export: true,
    import: true,
    bulkActions: true,
    charts: true,
    customViews: true,
    realtime: false
  },
  
  hooks: {
    beforeQuery: (query, user) => {
      // Admin and moderators can see all users
      if (user?.role === 'admin' || user?.role === 'moderator') {
        return query;
      }
      // Regular users can only see active users (limited view)
      query.isActive = true;
      return query;
    },
    
    afterQuery: (data, user) => {
      return data.map(userRecord => {
        // Remove sensitive data for non-admin users
        if (user?.role !== 'admin' && user?.role !== 'moderator') {
          const { password, googleId, ...safeUser } = userRecord;
          return {
            ...safeUser,
            fullName: userRecord.firstName && userRecord.lastName ? 
              `${userRecord.firstName} ${userRecord.lastName}` : userRecord.username,
            daysSinceLogin: userRecord.lastLoginAt ? 
              Math.floor((new Date() - new Date(userRecord.lastLoginAt)) / (1000 * 60 * 60 * 24)) : null
          };
        }
        
        return {
          ...userRecord,
          fullName: userRecord.firstName && userRecord.lastName ? 
            `${userRecord.firstName} ${userRecord.lastName}` : userRecord.username,
          daysSinceLogin: userRecord.lastLoginAt ? 
            Math.floor((new Date() - new Date(userRecord.lastLoginAt)) / (1000 * 60 * 60 * 24)) : null
        };
      });
    },
    
    beforeCreate: (data, user) => {
      // Only admins can create users
      if (user?.role !== 'admin') {
        throw new Error('Insufficient permissions to create users');
      }
      
      data.role = data.role || 'user';
      data.isActive = data.isActive !== undefined ? data.isActive : true;
      data.isEmailVerified = data.isEmailVerified || false;
      data.authProvider = data.authProvider || 'local';
      
      return data;
    },
    
    afterCreate: (data, user) => {
      console.log(`User created: ${data.username} by ${user?.userId}`);
    },
    
    beforeUpdate: (data, user) => {
      // Only admins can change roles
      if (data.role && user?.role !== 'admin') {
        delete data.role;
      }
      
      // Only admins and moderators can change active status
      if (data.isActive !== undefined && user?.role !== 'admin' && user?.role !== 'moderator') {
        delete data.isActive;
      }
      
      return data;
    },
    
    afterUpdate: (data, user) => {
      console.log(`User updated: ${data.username} by ${user?.userId}`);
    },
    
    beforeDelete: (id, user) => {
      // Only admins can delete users
      if (user?.role !== 'admin') {
        throw new Error('Insufficient permissions to delete users');
      }
      console.log(`User deleting: ${id} by ${user?.userId}`);
    },
    
    afterDelete: (id, user) => {
      console.log(`User deleted: ${id} by ${user?.userId}`);
    }
  }
};

/**
 * Register users table configuration
 */
export function registerUsersTableConfig(): void {
  registerTableConfig(usersTableConfig);
  registerTableModel('users', UserModel);
  console.log('✅ Users table configuration registered');
}

export { usersTableConfig };
export default registerUsersTableConfig;