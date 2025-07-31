import { IDatabaseTemplate, EPropertyType } from '../types/database.types';

/**
 * Pre-built database templates for quick database creation
 */
export const DATABASE_TEMPLATES: IDatabaseTemplate[] = [
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Track projects, tasks, and team assignments with status updates',
    icon: '📋',
    category: 'Productivity',
    tags: ['project', 'task', 'team', 'management'],
    properties: [
      {
        name: 'Task Name',
        type: EPropertyType.TEXT,
        description: 'Name of the task or project',
        required: true,
        isVisible: true,
        order: 0
      },
      {
        name: 'Status',
        type: EPropertyType.SELECT,
        description: 'Current status of the task',
        required: true,
        isVisible: true,
        order: 1,
        selectOptions: [
          { id: 'not-started', name: 'Not Started', color: '#6B7280' },
          { id: 'in-progress', name: 'In Progress', color: '#3B82F6' },
          { id: 'review', name: 'In Review', color: '#F59E0B' },
          { id: 'completed', name: 'Completed', color: '#10B981' },
          { id: 'blocked', name: 'Blocked', color: '#EF4444' }
        ]
      },
      {
        name: 'Priority',
        type: EPropertyType.SELECT,
        description: 'Task priority level',
        required: false,
        isVisible: true,
        order: 2,
        selectOptions: [
          { id: 'low', name: 'Low', color: '#6B7280' },
          { id: 'medium', name: 'Medium', color: '#F59E0B' },
          { id: 'high', name: 'High', color: '#EF4444' },
          { id: 'urgent', name: 'Urgent', color: '#DC2626' }
        ]
      },
      {
        name: 'Assignee',
        type: EPropertyType.TEXT,
        description: 'Person assigned to this task',
        required: false,
        isVisible: true,
        order: 3
      },
      {
        name: 'Due Date',
        type: EPropertyType.DATE,
        description: 'When this task is due',
        required: false,
        isVisible: true,
        order: 4
      },
      {
        name: 'Description',
        type: EPropertyType.TEXT,
        description: 'Detailed description of the task',
        required: false,
        isVisible: true,
        order: 5
      }
    ]
  },
  {
    id: 'crm',
    name: 'Customer Relationship Management',
    description: 'Manage customer contacts, deals, and communication history',
    icon: '👥',
    category: 'Business',
    tags: ['crm', 'customer', 'sales', 'contact'],
    properties: [
      {
        name: 'Company Name',
        type: EPropertyType.TEXT,
        description: 'Name of the company or customer',
        required: true,
        isVisible: true,
        order: 0
      },
      {
        name: 'Contact Person',
        type: EPropertyType.TEXT,
        description: 'Primary contact person',
        required: true,
        isVisible: true,
        order: 1
      },
      {
        name: 'Email',
        type: EPropertyType.EMAIL,
        description: 'Primary email address',
        required: false,
        isVisible: true,
        order: 2
      },
      {
        name: 'Phone',
        type: EPropertyType.PHONE,
        description: 'Primary phone number',
        required: false,
        isVisible: true,
        order: 3
      },
      {
        name: 'Deal Stage',
        type: EPropertyType.SELECT,
        description: 'Current stage in the sales pipeline',
        required: false,
        isVisible: true,
        order: 4,
        selectOptions: [
          { id: 'lead', name: 'Lead', color: '#6B7280' },
          { id: 'qualified', name: 'Qualified', color: '#3B82F6' },
          { id: 'proposal', name: 'Proposal', color: '#F59E0B' },
          { id: 'negotiation', name: 'Negotiation', color: '#8B5CF6' },
          { id: 'closed-won', name: 'Closed Won', color: '#10B981' },
          { id: 'closed-lost', name: 'Closed Lost', color: '#EF4444' }
        ]
      },
      {
        name: 'Deal Value',
        type: EPropertyType.NUMBER,
        description: 'Potential or actual deal value',
        required: false,
        isVisible: true,
        order: 5
      },
      {
        name: 'Last Contact',
        type: EPropertyType.DATE,
        description: 'Date of last contact',
        required: false,
        isVisible: true,
        order: 6
      }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Track products, stock levels, and supplier information',
    icon: '📦',
    category: 'Business',
    tags: ['inventory', 'product', 'stock', 'supplier'],
    properties: [
      {
        name: 'Product Name',
        type: EPropertyType.TEXT,
        description: 'Name of the product',
        required: true,
        isVisible: true,
        order: 0
      },
      {
        name: 'SKU',
        type: EPropertyType.TEXT,
        description: 'Stock Keeping Unit identifier',
        required: true,
        isVisible: true,
        order: 1
      },
      {
        name: 'Category',
        type: EPropertyType.SELECT,
        description: 'Product category',
        required: false,
        isVisible: true,
        order: 2,
        selectOptions: [
          { id: 'electronics', name: 'Electronics', color: '#3B82F6' },
          { id: 'clothing', name: 'Clothing', color: '#8B5CF6' },
          { id: 'books', name: 'Books', color: '#10B981' },
          { id: 'home', name: 'Home & Garden', color: '#F59E0B' },
          { id: 'other', name: 'Other', color: '#6B7280' }
        ]
      },
      {
        name: 'Current Stock',
        type: EPropertyType.NUMBER,
        description: 'Current stock quantity',
        required: true,
        isVisible: true,
        order: 3
      },
      {
        name: 'Minimum Stock',
        type: EPropertyType.NUMBER,
        description: 'Minimum stock level before reorder',
        required: false,
        isVisible: true,
        order: 4
      },
      {
        name: 'Unit Price',
        type: EPropertyType.NUMBER,
        description: 'Price per unit',
        required: false,
        isVisible: true,
        order: 5
      },
      {
        name: 'Supplier',
        type: EPropertyType.TEXT,
        description: 'Primary supplier name',
        required: false,
        isVisible: true,
        order: 6
      },
      {
        name: 'Last Restocked',
        type: EPropertyType.DATE,
        description: 'Date when last restocked',
        required: false,
        isVisible: true,
        order: 7
      }
    ]
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Plan and track content creation, publishing, and performance',
    icon: '📅',
    category: 'Marketing',
    tags: ['content', 'calendar', 'marketing', 'social'],
    properties: [
      {
        name: 'Content Title',
        type: EPropertyType.TEXT,
        description: 'Title of the content piece',
        required: true,
        isVisible: true,
        order: 0
      },
      {
        name: 'Content Type',
        type: EPropertyType.SELECT,
        description: 'Type of content',
        required: true,
        isVisible: true,
        order: 1,
        selectOptions: [
          { id: 'blog-post', name: 'Blog Post', color: '#3B82F6' },
          { id: 'social-media', name: 'Social Media', color: '#8B5CF6' },
          { id: 'video', name: 'Video', color: '#EF4444' },
          { id: 'podcast', name: 'Podcast', color: '#10B981' },
          { id: 'newsletter', name: 'Newsletter', color: '#F59E0B' },
          { id: 'infographic', name: 'Infographic', color: '#06B6D4' }
        ]
      },
      {
        name: 'Status',
        type: EPropertyType.SELECT,
        description: 'Current status of the content',
        required: true,
        isVisible: true,
        order: 2,
        selectOptions: [
          { id: 'idea', name: 'Idea', color: '#6B7280' },
          { id: 'draft', name: 'Draft', color: '#F59E0B' },
          { id: 'review', name: 'In Review', color: '#8B5CF6' },
          { id: 'approved', name: 'Approved', color: '#3B82F6' },
          { id: 'published', name: 'Published', color: '#10B981' }
        ]
      },
      {
        name: 'Author',
        type: EPropertyType.TEXT,
        description: 'Content author or creator',
        required: false,
        isVisible: true,
        order: 3
      },
      {
        name: 'Publish Date',
        type: EPropertyType.DATE,
        description: 'Planned or actual publish date',
        required: false,
        isVisible: true,
        order: 4
      },
      {
        name: 'Platform',
        type: EPropertyType.MULTI_SELECT,
        description: 'Publishing platforms',
        required: false,
        isVisible: true,
        order: 5,
        selectOptions: [
          { id: 'website', name: 'Website', color: '#3B82F6' },
          { id: 'facebook', name: 'Facebook', color: '#1877F2' },
          { id: 'twitter', name: 'Twitter', color: '#1DA1F2' },
          { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
          { id: 'instagram', name: 'Instagram', color: '#E4405F' },
          { id: 'youtube', name: 'YouTube', color: '#FF0000' }
        ]
      }
    ]
  }
];

/**
 * Get all available database templates
 */
export const getAllTemplates = (): IDatabaseTemplate[] => {
  return DATABASE_TEMPLATES;
};

/**
 * Get template by ID
 */
export const getTemplateById = (templateId: string): IDatabaseTemplate | undefined => {
  return DATABASE_TEMPLATES.find(template => template.id === templateId);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): IDatabaseTemplate[] => {
  return DATABASE_TEMPLATES.filter(template => template.category === category);
};

/**
 * Search templates by name or tags
 */
export const searchTemplates = (query: string): IDatabaseTemplate[] => {
  const searchTerm = query.toLowerCase();
  return DATABASE_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};
