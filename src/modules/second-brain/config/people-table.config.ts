// People Table Configuration
import { 
  TableConfiguration, 
  TableColumn, 
  TableView, 
  TableAction,
  registerTableConfig 
} from '../../database/core/table-config';
import { registerTableModel } from '../../database/services/table.service';
import { Person } from '../models';

// Define columns for people table
const peopleColumns: TableColumn[] = [
  {
    key: 'firstName',
    label: 'First Name',
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
    order: 0,
    validation: {
      required: true,
      minLength: 1,
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
    required: true,
    editable: true,
    visible: true,
    frozen: false,
    order: 1,
    validation: {
      required: true,
      minLength: 1,
      maxLength: 50
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
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 2,
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'phone',
    label: 'Phone',
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
    order: 3,
    validation: {
      maxLength: 20
    }
  },
  {
    key: 'company',
    label: 'Company',
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
    order: 4,
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'position',
    label: 'Position',
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
    order: 5,
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'relationship',
    label: 'Relationship',
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
    order: 6,
    selectOptions: [
      { value: 'family', label: 'Family', color: '#ef4444' },
      { value: 'friend', label: 'Friend', color: '#10b981' },
      { value: 'colleague', label: 'Colleague', color: '#3b82f6' },
      { value: 'client', label: 'Client', color: '#f59e0b' },
      { value: 'mentor', label: 'Mentor', color: '#8b5cf6' },
      { value: 'other', label: 'Other', color: '#6b7280' }
    ]
  },
  {
    key: 'lastContactDate',
    label: 'Last Contact',
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
    order: 7,
    format: 'YYYY-MM-DD'
  },
  {
    key: 'contactFrequency',
    label: 'Contact Frequency',
    type: 'select',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 8,
    selectOptions: [
      { value: 'daily', label: 'Daily', color: '#ef4444' },
      { value: 'weekly', label: 'Weekly', color: '#f59e0b' },
      { value: 'monthly', label: 'Monthly', color: '#10b981' },
      { value: 'quarterly', label: 'Quarterly', color: '#3b82f6' },
      { value: 'yearly', label: 'Yearly', color: '#8b5cf6' },
      { value: 'as-needed', label: 'As Needed', color: '#6b7280' }
    ]
  },
  {
    key: 'birthday',
    label: 'Birthday',
    type: 'date',
    width: 120,
    alignment: 'center',
    sortable: true,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 9,
    format: 'MM-DD'
  },
  {
    key: 'notes',
    label: 'Notes',
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
    order: 10,
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
    order: 11
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

// Define views for people table
const peopleViews: TableView[] = [
  {
    id: 'all',
    name: 'All People',
    description: 'All people in your network',
    isDefault: true,
    isPublic: true,
    columns: ['firstName', 'lastName', 'email', 'phone', 'company', 'relationship', 'lastContactDate', 'tags'],
    sorts: [
      { column: 'lastName', direction: 'asc' },
      { column: 'firstName', direction: 'asc' }
    ]
  },
  {
    id: 'needs-contact',
    name: 'Needs Contact',
    description: 'People who need to be contacted',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'email', 'phone', 'lastContactDate', 'contactFrequency'],
    sorts: [
      { column: 'lastContactDate', direction: 'asc' }
    ]
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family members',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'email', 'phone', 'birthday', 'lastContactDate'],
    filters: [
      {
        column: 'relationship',
        operator: 'equals',
        value: 'family'
      }
    ],
    sorts: [
      { column: 'firstName', direction: 'asc' }
    ]
  },
  {
    id: 'colleagues',
    name: 'Colleagues',
    description: 'Work colleagues',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'email', 'company', 'position', 'lastContactDate'],
    filters: [
      {
        column: 'relationship',
        operator: 'equals',
        value: 'colleague'
      }
    ],
    sorts: [
      { column: 'company', direction: 'asc' },
      { column: 'lastName', direction: 'asc' }
    ]
  },
  {
    id: 'clients',
    name: 'Clients',
    description: 'Client contacts',
    isDefault: false,
    isPublic: true,
    columns: ['firstName', 'lastName', 'email', 'company', 'phone', 'lastContactDate'],
    filters: [
      {
        column: 'relationship',
        operator: 'equals',
        value: 'client'
      }
    ],
    sorts: [
      { column: 'lastContactDate', direction: 'desc' }
    ]
  }
];

// Define actions for people table
const peopleActions: TableAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'Edit',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'contact',
    label: 'Record Contact',
    icon: 'Phone',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: 'Mail',
    type: 'single',
    variant: 'outline',
    showWhen: (record) => record?.email
  },
  {
    id: 'add-to-project',
    label: 'Add to Project',
    icon: 'FolderPlus',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: 'Copy',
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
    confirmationMessage: 'Are you sure you want to delete this person?'
  },
  {
    id: 'bulk-contact',
    label: 'Record Contact',
    icon: 'Phone',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-relationship',
    label: 'Set Relationship',
    icon: 'Users',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-tag',
    label: 'Add Tags',
    icon: 'Tag',
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
    confirmationMessage: 'Are you sure you want to delete the selected people?'
  },
  {
    id: 'create',
    label: 'New Person',
    icon: 'Plus',
    type: 'global',
    variant: 'default'
  },
  {
    id: 'import',
    label: 'Import Contacts',
    icon: 'Upload',
    type: 'global',
    variant: 'outline'
  },
  {
    id: 'export',
    label: 'Export Contacts',
    icon: 'Download',
    type: 'global',
    variant: 'outline'
  }
];

// People table configuration
const peopleTableConfig: TableConfiguration = {
  entityKey: 'people',
  displayName: 'Person',
  displayNamePlural: 'People',
  description: 'Manage your personal and professional network',
  icon: 'Users',
  
  collection: 'people',
  primaryKey: '_id',
  
  columns: peopleColumns,
  defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'company', 'relationship', 'lastContactDate', 'tags'],
  
  views: peopleViews,
  defaultView: 'all',
  
  actions: peopleActions,
  
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
      return data.map(person => ({
        ...person,
        fullName: `${person.firstName} ${person.lastName}`,
        needsContact: person.lastContactDate && person.contactFrequency ? 
          isContactOverdue(person.lastContactDate, person.contactFrequency) : false,
        daysSinceContact: person.lastContactDate ? 
          Math.floor((new Date() - new Date(person.lastContactDate)) / (1000 * 60 * 60 * 24)) : null
      }));
    },
    
    beforeCreate: (data, user) => {
      data.relationship = data.relationship || 'other';
      data.tags = data.tags || [];
      data.contactHistory = data.contactHistory || [];
      return data;
    },
    
    afterCreate: (data, user) => {
      console.log(`Person created: ${data.firstName} ${data.lastName} by ${user?.userId}`);
    },
    
    beforeUpdate: (data, user) => {
      return data;
    },
    
    afterUpdate: (data, user) => {
      console.log(`Person updated: ${data.firstName} ${data.lastName} by ${user?.userId}`);
    }
  }
};

// Helper function to check if contact is overdue
function isContactOverdue(lastContactDate: string, frequency: string): boolean {
  const lastContact = new Date(lastContactDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  
  switch (frequency) {
    case 'daily': return daysSince > 1;
    case 'weekly': return daysSince > 7;
    case 'monthly': return daysSince > 30;
    case 'quarterly': return daysSince > 90;
    case 'yearly': return daysSince > 365;
    default: return false;
  }
}

/**
 * Register people table configuration
 */
export function registerPeopleTableConfig(): void {
  registerTableConfig(peopleTableConfig);
  registerTableModel('people', Person);
  console.log('✅ People table configuration registered');
}

export { peopleTableConfig };
export default registerPeopleTableConfig;