// Project Document View Service
// This service provides document-view functionality for projects

// Default project properties configuration
export const getDefaultProjectProperties = async () => {
    return [
        {
            id: 'title',
            name: 'Title',
            type: 'TEXT',
            required: true,
            description: 'Title',
            options: {}
        },
        {
            id: 'description',
            name: 'Description',
            type: 'RICH_TEXT',
            required: false,
            description: 'Description',
            options: {}
        },
        {
            id: 'status',
            name: 'Status',
            type: 'SELECT',
            required: false,
            description: 'Status',
            options: {
                selectOptions: [
                    { id: 'planning', name: 'Planning', color: '#f59e0b' },
                    { id: 'active', name: 'Active', color: '#10b981' },
                    { id: 'on-hold', name: 'On Hold', color: '#f97316' },
                    { id: 'completed', name: 'Completed', color: '#3b82f6' },
                    { id: 'cancelled', name: 'Cancelled', color: '#ef4444' }
                ]
            }
        },
        {
            id: 'priority',
            name: 'Priority',
            type: 'SELECT',
            required: false,
            description: 'Priority',
            options: {
                selectOptions: [
                    { id: 'low', name: 'Low', color: '#6b7280' },
                    { id: 'medium', name: 'Medium', color: '#f59e0b' },
                    { id: 'high', name: 'High', color: '#f97316' },
                    { id: 'urgent', name: 'Urgent', color: '#ef4444' }
                ]
            }
        },
        {
            id: 'startDate',
            name: 'Start Date',
            type: 'DATE',
            required: false,
            description: 'Start Date',
            options: {}
        },
        {
            id: 'endDate',
            name: 'End Date',
            type: 'DATE',
            required: false,
            description: 'End Date',
            options: {}
        },
        {
            id: 'progress',
            name: 'Progress',
            type: 'NUMBER',
            required: false,
            description: 'Progress',
            options: {}
        },
        {
            id: 'tags',
            name: 'Tags',
            type: 'MULTI_SELECT',
            required: false,
            description: 'Tags',
            options: {}
        },
        {
            id: 'createdAt',
            name: 'Created',
            type: 'DATE',
            required: false,
            description: 'Creation date',
            options: {}
        },
        {
            id: 'updatedAt',
            name: 'Updated',
            type: 'DATE',
            required: false,
            description: 'Last updated',
            options: {}
        }
    ];
};

// Default project views configuration
export const getDefaultProjectViews = async () => {
    return [
        {
            id: 'all-projects',
            name: 'All Projects',
            type: 'TABLE',
            isDefault: true,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'status', 'updatedAt'],
            config: {}
        },
        {
            id: 'by-status',
            name: 'By Status',
            type: 'BOARD',
            isDefault: false,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'updatedAt'],
            groupBy: 'status',
            config: {}
        }
    ];
};

// Get project view configuration
export const getProjectViewConfig = async () => {
    return {
        moduleType: 'projects',
        displayName: 'Project',
        displayNamePlural: 'Projects',
        description: 'Manage your projects and initiatives',
        icon: '📋',
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        enableViews: true,
        enableSearch: true,
        enableFilters: true,
        enableSorts: true,
        enableGrouping: true,
        supportedViewTypes: ['TABLE', 'BOARD', 'GALLERY', 'CALENDAR'],
        defaultProperties: await getDefaultProjectProperties(),
        defaultViews: await getDefaultProjectViews()
    };
};

// Service functions (simplified implementations)
export const getUserProjectViews = async (userId: string) => {
    return await getDefaultProjectViews();
};

export const getProjectView = async (userId: string, viewId: string) => {
    const views = await getUserProjectViews(userId);
    return views.find(view => view.id === viewId);
};

export const getDefaultProjectView = async (userId: string) => {
    const views = await getUserProjectViews(userId);
    return views.find(view => view.isDefault) || views[0];
};

export const createProjectView = async (userId: string, viewData: any) => {
    return {
        id: `view-${Date.now()}`,
        ...viewData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
};

export const updateProjectView = async (userId: string, viewId: string, updateData: any) => {
    return {
        id: viewId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteProjectView = async (userId: string, viewId: string) => {
    return true;
};

export const getProjectFrozenConfig = async () => {
    return {
        frozenProperties: ['title', 'createdAt', 'updatedAt'],
        frozenViews: ['all-projects'],
        canAddProperties: true,
        canEditProperties: true,
        canDeleteProperties: true,
        canAddViews: true,
        canEditViews: true,
        canDeleteViews: true
    };
};

// Property management functions (simplified)
export const addProjectProperty = async (userId: string, propertyData: any) => {
    return {
        id: `prop-${Date.now()}`,
        ...propertyData,
        createdBy: userId,
        createdAt: new Date()
    };
};

export const updateProjectCustomProperty = async (userId: string, propertyId: string, updateData: any) => {
    return {
        id: propertyId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteProjectCustomProperty = async (userId: string, propertyId: string) => {
    return true;
};

// Placeholder functions for other operations
export const updateProjectViewProperties = async (userId: string, viewId: string, properties: any[]) => {
    return true;
};

export const updateProjectViewFilters = async (userId: string, viewId: string, filters: any[]) => {
    return true;
};

export const updateProjectViewSorts = async (userId: string, viewId: string, sorts: any[]) => {
    return true;
};

export const duplicateProjectView = async (userId: string, viewId: string) => {
    return await createProjectView(userId, { name: 'Copy of View' });
};

export const insertProjectProperty = async (userId: string, propertyData: any, position: number) => {
    return await addProjectProperty(userId, propertyData);
};

export const duplicateProjectProperty = async (userId: string, propertyId: string) => {
    return await addProjectProperty(userId, { name: 'Copy of Property' });
};

export const freezeProjectProperty = async (userId: string, propertyId: string, frozen: boolean) => {
    return true;
};