// Notes Table Configuration
import { 
  TableConfiguration, 
  TableColumn, 
  TableView, 
  TableAction,
  registerTableConfig 
} from '../../database/core/table-config';
import { registerTableModel } from '../../database/services/table.service';
import { Note } from '../second-brain';

// Define columns for notes table
const notesColumns: TableColumn[] = [
  {
    key: 'title',
    label: 'Note Title',
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
    key: 'type',
    label: 'Type',
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
      { value: 'general', label: 'General', color: '#6b7280' },
      { value: 'meeting', label: 'Meeting', color: '#3b82f6' },
      { value: 'research', label: 'Research', color: '#10b981' },
      { value: 'idea', label: 'Idea', color: '#f59e0b' },
      { value: 'reference', label: 'Reference', color: '#8b5cf6' },
      { value: 'template', label: 'Template', color: '#ec4899' }
    ]
  },
  {
    key: 'content',
    label: 'Content',
    type: 'text',
    width: 400,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: true,
    required: false,
    editable: true,
    visible: true,
    frozen: false,
    order: 2,
    validation: {
      maxLength: 10000
    }
  },
  {
    key: 'isFavorite',
    label: 'Favorite',
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
    order: 3
  },
  {
    key: 'isPinned',
    label: 'Pinned',
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
    order: 4
  },
  {
    key: 'linkedTasks',
    label: 'Linked Tasks',
    type: 'relation',
    width: 150,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 5
  },
  {
    key: 'linkedProjects',
    label: 'Linked Projects',
    type: 'relation',
    width: 150,
    alignment: 'left',
    sortable: false,
    filterable: true,
    searchable: false,
    required: false,
    editable: true,
    visible: false,
    frozen: false,
    order: 6
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
    order: 7
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
    visible: true,
    frozen: false,
    order: 99,
    format: 'YYYY-MM-DD HH:mm'
  }
];

// Define views for notes table
const notesViews: TableView[] = [
  {
    id: 'all',
    name: 'All Notes',
    description: 'All notes in the system',
    isDefault: true,
    isPublic: true,
    columns: ['title', 'type', 'content', 'isFavorite', 'isPinned', 'tags', 'updatedAt'],
    sorts: [
      { column: 'isPinned', direction: 'desc' },
      { column: 'updatedAt', direction: 'desc' }
    ]
  },
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'Favorite notes',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'type', 'content', 'tags', 'updatedAt'],
    filters: [
      {
        column: 'isFavorite',
        operator: 'equals',
        value: true
      }
    ],
    sorts: [
      { column: 'updatedAt', direction: 'desc' }
    ]
  },
  {
    id: 'pinned',
    name: 'Pinned',
    description: 'Pinned notes',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'type', 'content', 'tags', 'updatedAt'],
    filters: [
      {
        column: 'isPinned',
        operator: 'equals',
        value: true
      }
    ],
    sorts: [
      { column: 'updatedAt', direction: 'desc' }
    ]
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Notes from meetings',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'content', 'tags', 'updatedAt'],
    filters: [
      {
        column: 'type',
        operator: 'equals',
        value: 'meeting'
      }
    ],
    sorts: [
      { column: 'updatedAt', direction: 'desc' }
    ]
  },
  {
    id: 'ideas',
    name: 'Ideas',
    description: 'Idea notes',
    isDefault: false,
    isPublic: true,
    columns: ['title', 'content', 'tags', 'updatedAt'],
    filters: [
      {
        column: 'type',
        operator: 'equals',
        value: 'idea'
      }
    ],
    sorts: [
      { column: 'updatedAt', direction: 'desc' }
    ]
  }
];

// Define actions for notes table
const notesActions: TableAction[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'Edit',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'favorite',
    label: 'Toggle Favorite',
    icon: 'Star',
    type: 'single',
    variant: 'outline'
  },
  {
    id: 'pin',
    label: 'Toggle Pin',
    icon: 'Pin',
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
    id: 'link-task',
    label: 'Link to Task',
    icon: 'Link',
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
    confirmationMessage: 'Are you sure you want to delete this note?'
  },
  {
    id: 'bulk-favorite',
    label: 'Add to Favorites',
    icon: 'Star',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-pin',
    label: 'Pin Selected',
    icon: 'Pin',
    type: 'bulk',
    variant: 'outline'
  },
  {
    id: 'bulk-type',
    label: 'Change Type',
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
    confirmationMessage: 'Are you sure you want to delete the selected notes?'
  },
  {
    id: 'create',
    label: 'New Note',
    icon: 'Plus',
    type: 'global',
    variant: 'default'
  },
  {
    id: 'create-from-template',
    label: 'From Template',
    icon: 'FileText',
    type: 'global',
    variant: 'outline'
  },
  {
    id: 'import',
    label: 'Import Notes',
    icon: 'Upload',
    type: 'global',
    variant: 'outline'
  },
  {
    id: 'export',
    label: 'Export Notes',
    icon: 'Download',
    type: 'global',
    variant: 'outline'
  }
];

// Notes table configuration
const notesTableConfig: TableConfiguration = {
  entityKey: 'notes',
  displayName: 'Note',
  displayNamePlural: 'Notes',
  description: 'Manage your notes and documentation',
  icon: 'FileText',
  
  collection: 'notes',
  primaryKey: '_id',
  
  columns: notesColumns,
  defaultColumns: ['title', 'type', 'content', 'isFavorite', 'isPinned', 'tags', 'updatedAt'],
  
  views: notesViews,
  defaultView: 'all',
  
  actions: notesActions,
  
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
    charts: false,
    customViews: true,
    realtime: false
  },
  
  hooks: {
    beforeQuery: (query, user) => {
      query.createdBy = user?.userId;
      return query;
    },
    
    afterQuery: (data, user) => {
      return data.map(note => ({
        ...note,
        wordCount: note.content ? note.content.split(' ').length : 0,
        hasLinks: (note.linkedTasks && note.linkedTasks.length > 0) || (note.linkedProjects && note.linkedProjects.length > 0)
      }));
    },
    
    beforeCreate: (data, user) => {
      data.type = data.type || 'general';
      data.isFavorite = data.isFavorite || false;
      data.isPinned = data.isPinned || false;
      data.tags = data.tags || [];
      data.linkedTasks = data.linkedTasks || [];
      data.linkedProjects = data.linkedProjects || [];
      return data;
    },
    
    afterCreate: (data, user) => {
      console.log(`Note created: ${data.title} by ${user?.userId}`);
    },
    
    beforeUpdate: (data, user) => {
      return data;
    },
    
    afterUpdate: (data, user) => {
      console.log(`Note updated: ${data.title} by ${user?.userId}`);
    }
  }
};

/**
 * Register notes table configuration
 */
export function registerNotesTableConfig(): void {
  registerTableConfig(notesTableConfig);
  registerTableModel('notes', Note);
  console.log('✅ Notes table configuration registered');
}

export { notesTableConfig };
export default registerNotesTableConfig;