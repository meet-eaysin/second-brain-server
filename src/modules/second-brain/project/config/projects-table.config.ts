// Projects Table Configuration
import { 
  TableConfiguration, 
  TableColumn, 
  TableView, 
  TableAction,
  registerTableConfig 
} from '../../database/core/table-config';
import { registerTableModel } from '../../database/services/table.service';
import { Project } from '../second-brain';

// Define columns for projects table
const projectsColumns: TableColumn[] = [
  {
    key: 'title',
    label: 'Project Title',
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
      { value: 'planned', label: 'Planned', color: '#6b7280' },
      { value: 'active', label: 'Active', color: '#3b82f6' },
      { value: 'paused', label: 'Paused', color: '#f59e0b' },
      { value: 'completed', label: 'Completed', color: '#10b981' },
      { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
    ]
  },
  {
    key: 'completionPercentage',
    label: 'Progress',
    type: 'progress',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 2,
    validation: {
      min: 0,
      max: 100
    }
  },
  {
    key: 'startDate',
    label: 'Start Date',
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
    key: 'endDate',
    label: 'End Date',
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
    order: 4,
    format: 'YYYY-MM-DD'
  },
  {
    key: 'deadline',
    label: 'Deadline',
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
    order: 5,
    format: 'YYYY-MM-DD'
  },
  {
    key: 'goal',
    label: 'Goal',
    type: 'relation',
    width: 150,
    alignment: 'left',
    sortable: true,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 6
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
    order: 7,
    validation: {
      maxLength: 1000
    }
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
    order: 8
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

// Define views for projects table
const projectsViews: TableView[] = [
  {
    id: 'all',
    name: 'All Projects',
    description: 'All projects in the system',
    isDefault: true,
    isPublic: true,
    columns: ['title', 'status', 'completionPercentage', 'startDate', 'endDate', 'tags'],
    sorts: [
      { column: 'status', direction: 'asc' },
      { column: 'endDate', direction: 'asc' },
      { column: 'createdAt', direction: 'desc' }
    ]
  },
  {
    id: 'active',
    name: 'Active Projects',
    description: 'Currently active projects',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'status', 'completionPercentage', 'endDate', 'deadline'],
    filters: [
      {
        column: 'status',
        operator: 'equals',
        value: 'active'
      }
    ],
    sorts: [
      { column: 'deadline', direction: 'asc' },
      { column: 'endDate', direction: 'asc' }
    ]
  },
  {
    id: 'completed',
    name: 'Completed Projects',
    description: 'Successfully completed projects',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'completionPercentage', 'endDate', 'tags'],
    filters: [
      {
        column: 'status',
        operator: 'equals',
        value: 'completed'
      }
    ],
    sorts: [
      { column: 'endDate', direction: 'desc' }
    ]
  },
  {
    id: 'overdue',
    name: 'Overdue Projects',
    description: 'Projects past their deadline',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'status', 'deadline', 'completionPercentage'],
    filters: [
      {
        column: 'deadline',
        operator: 'less_than',
        value: new Date().toISOString().split('T')[0]
      },
      {
        column: 'status',
        operator: 'not_in',
        values: ['completed', 'cancelled']
      }
    ],
    sorts: [
      { column: 'deadline', direction: 'asc' }
    ]
  }
];

// Define actions for projects table
const projectsActions: TableAction[] = [
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
    id: 'archive',
    label: 'Archive',
    icon: 'Archive',
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
    confirmationMessage: 'Are you sure you want to delete this project?'
  },
  {
    id: 'bulk-complete',
    label: 'Mark Complete',
    icon: 'CheckCircle2',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-status',
    label: 'Change Status',
    icon: 'Settings',
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
    confirmationMessage: 'Are you sure you want to delete the selected projects?'
  },
  {
    id: 'create',
    label: 'New Project',
    icon: 'Plus',
    type: 'global',
    variant: 'default'
  },
  {
    id: 'import',
    label: 'Import Projects',
    icon: 'Upload',
    type: 'global',
    variant: 'outline'
  },
  {
    id: 'export',
    label: 'Export Projects',
    icon: 'Download',
    type: 'global',
    variant: 'outline'
  }
];

// Projects table configuration
const projectsTableConfig: TableConfiguration = {
  entityKey: 'projects',
  displayName: 'Project',
  displayNamePlural: 'Projects',
  description: 'Manage your projects and track their progress',
  icon: 'FolderOpen',
  
  collection: 'projects',
  primaryKey: '_id',
  
  columns: projectsColumns,
  defaultColumns: ['title', 'status', 'completionPercentage', 'startDate', 'endDate', 'tags'],
  
  views: projectsViews,
  defaultView: 'all',
  
  actions: projectsActions,
  
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
      query.createdBy = user?.userId;
      return query;
    },
    
    afterQuery: (data, user) => {
      return data.map(project => ({
        ...project,
        isOverdue: project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed',
        isCompleted: project.status === 'completed',
        daysRemaining: project.deadline ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }));
    },
    
    beforeCreate: (data, user) => {
      data.status = data.status || 'planned';
      data.completionPercentage = data.completionPercentage || 0;
      data.tags = data.tags || [];
      return data;
    },
    
    afterCreate: (data, user) => {
      console.log(`Project created: ${data.title} by ${user?.userId}`);
    },
    
    beforeUpdate: (data, user) => {
      if (data.status === 'completed' && data.completionPercentage !== 100) {
        data.completionPercentage = 100;
      }
      return data;
    },
    
    afterUpdate: (data, user) => {
      console.log(`Project updated: ${data.title} by ${user?.userId}`);
    }
  }
};

/**
 * Register projects table configuration
 */
export function registerProjectsTableConfig(): void {
  registerTableConfig(projectsTableConfig);
  registerTableModel('projects', Project);
  console.log('✅ Projects table configuration registered');
}

export { projectsTableConfig };
export default registerProjectsTableConfig;