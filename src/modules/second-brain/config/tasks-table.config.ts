// Tasks Table Configuration - Independent module configuration
import { 
  TableConfiguration, 
  TableColumn, 
  TableView, 
  TableAction,
  registerTableConfig 
} from '../../database/core/table-config';
import { registerTableModel } from '../../database/services/table.service';
import { Task } from '../models';

// Define columns for tasks table
const tasksColumns: TableColumn[] = [
  {
    key: 'title',
    label: 'Task Title',
    type: 'text',
    width: 300,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: true,
    editable: true,
    visible: true,
    frozen: false,
    order: 0,
    validation: {
      required: true,
      minLength: 1,
      maxLength: 200
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 1,
    selectOptions: [
      { value: 'todo', label: 'To Do', color: '#6b7280' },
      { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
      { value: 'completed', label: 'Completed', color: '#10b981' },
      { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
    ]
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    width: 100,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 2,
    selectOptions: [
      { value: 'low', label: 'Low', color: '#10b981' },
      { value: 'medium', label: 'Medium', color: '#f59e0b' },
      { value: 'high', label: 'High', color: '#f97316' },
      { value: 'urgent', label: 'Urgent', color: '#ef4444' }
    ]
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    type: 'date',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 3,
    format: 'YYYY-MM-DD'
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    type: 'person',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 4
  },
  {
    key: 'project',
    label: 'Project',
    type: 'relation',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 5
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'tags',
    width: 200,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 6
  },
  {
    key: 'estimatedTime',
    label: 'Est. Time (min)',
    type: 'number',
    width: 120,
    alignment: 'right',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 7,
    validation: {
      min: 0,
      max: 10080 // Max 1 week in minutes
    }
  },
  {
    key: 'actualTime',
    label: 'Actual Time (min)',
    type: 'number',
    width: 120,
    alignment: 'right',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 8,
    validation: {
      min: 0,
      max: 10080
    }
  },
  {
    key: 'energy',
    label: 'Energy Level',
    type: 'select',
    width: 100,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 9,
    selectOptions: [
      { value: 'low', label: 'Low', color: '#6b7280' },
      { value: 'medium', label: 'Medium', color: '#f59e0b' },
      { value: 'high', label: 'High', color: '#10b981' }
    ]
  },
  {
    key: 'context',
    label: 'Context',
    type: 'multi-select',
    width: 150,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 10,
    selectOptions: [
      { value: 'home', label: '@home', color: '#10b981' },
      { value: 'office', label: '@office', color: '#3b82f6' },
      { value: 'calls', label: '@calls', color: '#f59e0b' },
      { value: 'computer', label: '@computer', color: '#8b5cf6' },
      { value: 'errands', label: '@errands', color: '#ef4444' }
    ]
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    width: 300,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 11,
    validation: {
      maxLength: 1000
    }
  },
  {
    key: 'completedAt',
    label: 'Completed At',
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
    order: 12,
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

// Define views for tasks table
const tasksViews: TableView[] = [
  {
    id: 'all',
    name: 'All Tasks',
    description: 'All tasks in the system',
    isDefault: true,
    isPublic: true,
    columns: ['title', 'status', 'priority', 'dueDate', 'assignedTo', 'project', 'tags'],
    sorts: [
      { column: 'priority', direction: 'desc' },
      { column: 'dueDate', direction: 'asc' },
      { column: 'createdAt', direction: 'desc' }
    ]
  },
  {
    id: 'today',
    name: 'Today',
    description: 'Tasks due today',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'status', 'priority', 'dueDate', 'assignedTo'],
    filters: [
      {
        column: 'dueDate',
        operator: 'between',
        values: [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]]
      }
    ],
    sorts: [
      { column: 'priority', direction: 'desc' },
      { column: 'createdAt', direction: 'asc' }
    ]
  },
  {
    id: 'overdue',
    name: 'Overdue',
    description: 'Tasks that are past their due date',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'status', 'priority', 'dueDate', 'assignedTo'],
    filters: [
      {
        column: 'dueDate',
        operator: 'less_than',
        value: new Date().toISOString().split('T')[0]
      },
      {
        column: 'status',
        operator: 'not_equals',
        value: 'completed'
      }
    ],
    sorts: [
      { column: 'dueDate', direction: 'asc' },
      { column: 'priority', direction: 'desc' }
    ]
  },
  {
    id: 'my-tasks',
    name: 'My Tasks',
    description: 'Tasks assigned to me',
    isDefault: false,
    isPublic: false,
    columns: ['title', 'status', 'priority', 'dueDate', 'project'],
    sorts: [
      { column: 'priority', direction: 'desc' },
      { column: 'dueDate', direction: 'asc' }
    ]
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    description: 'High and urgent priority tasks',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'status', 'priority', 'dueDate', 'assignedTo'],
    filters: [
      {
        column: 'priority',
        operator: 'in',
        values: ['high', 'urgent']
      }
    ],
    sorts: [
      { column: 'priority', direction: 'desc' },
      { column: 'dueDate', direction: 'asc' }
    ]
  },
  {
    id: 'completed',
    name: 'Completed',
    description: 'Completed tasks',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'priority', 'dueDate', 'completedAt', 'assignedTo'],
    filters: [
      {
        column: 'status',
        operator: 'equals',
        value: 'completed'
      }
    ],
    sorts: [
      { column: 'completedAt', direction: 'desc' }
    ]
  }
];

// Define actions for tasks table
const tasksActions: TableAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'Edit',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'complete',
    label: 'Mark Complete',
    icon: 'CheckCircle2',
    type: 'single',
    variant: 'outline',
    showWhen: (record) => record?.status !== 'completed'
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: 'Copy',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'assign',
    label: 'Assign To',
    icon: 'User',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'add-to-project',
    label: 'Add to Project',
    icon: 'FolderPlus',
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
    confirmationMessage: 'Are you sure you want to delete this task?'
  },
  {
    id: 'bulk-complete',
    label: 'Mark Complete',
    icon: 'CheckCircle2',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-assign',
    label: 'Assign To',
    icon: 'Users',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-priority',
    label: 'Set Priority',
    icon: 'AlertTriangle',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-project',
    label: 'Add to Project',
    icon: 'FolderPlus',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-delete',
    label: 'Delete Selected',
    icon: 'Trash2',
    type: 'bulk',
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected tasks?'
  },
  {
    id: 'create',
    label: 'New Task',
    icon: 'Plus',
    type: 'global',
    variant: 'default'
  },
  {
    id: 'import',
    label: 'Import Tasks',
    icon: 'Upload',
    type: 'global',
    variant: 'outline'
  },
  {
    id: 'export',
    label: 'Export Tasks',
    icon: 'Download',
    type: 'global',
    variant: 'outline'
  }
];

// Tasks table configuration
const tasksTableConfig: TableConfiguration = {
  entityKey: 'tasks',
  displayName: 'Task',
  displayNamePlural: 'Tasks',
  description: 'Manage your tasks and to-dos efficiently',
  icon: 'CheckSquare',
  
  collection: 'tasks',
  primaryKey: '_id',
  
  columns: tasksColumns,
  defaultColumns: ['title', 'status', 'priority', 'dueDate', 'assignedTo', 'project', 'tags'],
  
  views: tasksViews,
  defaultView: 'all',
  
  actions: tasksActions,
  
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
      ownerField: 'createdBy',
      canViewAll: false,
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
      // Add user-specific filtering
      query.createdBy = user?.userId;
      return query;
    },
    
    afterQuery: (data, user) => {
      // Add computed fields
      return data.map(task => ({
        ...task,
        isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed',
        isCompleted: task.status === 'completed',
        timeSpent: task.actualTime || 0,
        timeRemaining: task.estimatedTime ? Math.max(0, task.estimatedTime - (task.actualTime || 0)) : null
      }));
    },
    
    beforeCreate: (data, user) => {
      // Set defaults
      data.status = data.status || 'todo';
      data.priority = data.priority || 'medium';
      data.isRecurring = data.isRecurring || false;
      data.tags = data.tags || [];
      data.context = data.context || [];
      
      return data;
    },
    
    afterCreate: (data, user) => {
      console.log(`Task created: ${data.title} by ${user?.userId}`);
    },
    
    beforeUpdate: (data, user) => {
      // Handle status changes
      if (data.status === 'completed' && !data.completedAt) {
        data.completedAt = new Date();
      } else if (data.status !== 'completed') {
        data.completedAt = null;
      }
      
      return data;
    },
    
    afterUpdate: (data, user) => {
      console.log(`Task updated: ${data.title} by ${user?.userId}`);
    },
    
    beforeDelete: (id, user) => {
      console.log(`Task deleting: ${id} by ${user?.userId}`);
    },
    
    afterDelete: (id, user) => {
      console.log(`Task deleted: ${id} by ${user?.userId}`);
    }
  }
};

/**
 * Register tasks table configuration
 */
export function registerTasksTableConfig(): void {
  // Register the table configuration
  registerTableConfig(tasksTableConfig);
  
  // Register the Mongoose model
  registerTableModel('tasks', Task);
  
  console.log('✅ Tasks table configuration registered');
}

export { tasksTableConfig };
export default registerTasksTableConfig;