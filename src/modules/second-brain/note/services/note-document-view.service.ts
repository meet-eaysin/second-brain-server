// Note Document View Service
// This service provides document-view functionality for notes

// Default note properties configuration
export const getDefaultNotesProperties = async () => {
    return [
        {
            id: 'title',
            name: 'Title',
            type: 'TEXT',
            required: true,
            description: 'Note title',
            options: {}
        },
        {
            id: 'content',
            name: 'Content',
            type: 'RICH_TEXT',
            required: false,
            description: 'Note content',
            options: {}
        },
        {
            id: 'type',
            name: 'Type',
            type: 'SELECT',
            required: false,
            description: 'Note type',
            options: {
                selectOptions: [
                    { id: 'note', name: 'Note', color: '#3b82f6' },
                    { id: 'idea', name: 'Idea', color: '#f59e0b' },
                    { id: 'reference', name: 'Reference', color: '#10b981' },
                    { id: 'meeting', name: 'Meeting', color: '#8b5cf6' },
                    { id: 'journal', name: 'Journal', color: '#ef4444' }
                ]
            }
        },
        {
            id: 'area',
            name: 'Area',
            type: 'SELECT',
            required: false,
            description: 'PARA area',
            options: {
                selectOptions: [
                    { id: 'projects', name: 'Projects', color: '#3b82f6' },
                    { id: 'areas', name: 'Areas', color: '#10b981' },
                    { id: 'resources', name: 'Resources', color: '#f59e0b' },
                    { id: 'archive', name: 'Archive', color: '#6b7280' }
                ]
            }
        },
        {
            id: 'tags',
            name: 'Tags',
            type: 'MULTI_SELECT',
            required: false,
            description: 'Note tags',
            options: {
                selectOptions: [
                    { id: 'important', name: 'Important', color: '#ef4444' },
                    { id: 'urgent', name: 'Urgent', color: '#f97316' },
                    { id: 'review', name: 'Review', color: '#8b5cf6' },
                    { id: 'draft', name: 'Draft', color: '#6b7280' }
                ]
            }
        },
        {
            id: 'isFavorite',
            name: 'Favorite',
            type: 'CHECKBOX',
            required: false,
            description: 'Mark as favorite',
            options: {}
        },
        {
            id: 'isPinned',
            name: 'Pinned',
            type: 'CHECKBOX',
            required: false,
            description: 'Pin to top',
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

// Default note views configuration
export const getDefaultNotesViews = async () => {
    return [
        {
            id: 'all-notes',
            name: 'All Notes',
            type: 'TABLE',
            isDefault: true,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'isPinned', direction: 'desc' },
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'type', 'area', 'tags', 'updatedAt'],
            config: {}
        },
        {
            id: 'favorites',
            name: 'Favorites',
            type: 'TABLE',
            isDefault: false,
            isSystemView: true,
            filters: [
                { propertyId: 'isFavorite', operator: 'equals', value: true }
            ],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'type', 'area', 'tags', 'updatedAt'],
            config: {}
        },
        {
            id: 'by-type',
            name: 'By Type',
            type: 'BOARD',
            isDefault: false,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'area', 'tags', 'updatedAt'],
            groupBy: 'type',
            config: {}
        },
        {
            id: 'recent',
            name: 'Recent',
            type: 'TABLE',
            isDefault: false,
            isSystemView: true,
            filters: [],
            sorts: [
                { propertyId: 'updatedAt', direction: 'desc' }
            ],
            visibleProperties: ['title', 'type', 'area', 'updatedAt'],
            config: {}
        }
    ];
};

// Get notes view configuration
export const getNotesViewConfig = async () => {
    return {
        moduleType: 'notes',
        displayName: 'Note',
        displayNamePlural: 'Notes',
        description: 'Manage your personal knowledge base',
        icon: '📝',
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
        defaultProperties: await getDefaultNotesProperties(),
        defaultViews: await getDefaultNotesViews()
    };
};

// Get user's notes views
export const getUserNotesViews = async (userId: string) => {
    // For now, return default views
    // In a full implementation, this would fetch user's custom views from database
    return await getDefaultNotesViews();
};

// Get specific notes view
export const getNotesView = async (userId: string, viewId: string) => {
    const views = await getUserNotesViews(userId);
    return views.find(view => view.id === viewId);
};

// Get default notes view
export const getDefaultNotesView = async (userId: string) => {
    const views = await getUserNotesViews(userId);
    return views.find(view => view.isDefault) || views[0];
};

// Create notes view
export const createNotesView = async (userId: string, viewData: any) => {
    // In a full implementation, this would save to database
    return {
        id: `view-${Date.now()}`,
        ...viewData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
};

// Update notes view
export const updateNotesView = async (userId: string, viewId: string, updateData: any) => {
    // In a full implementation, this would update in database
    return {
        id: viewId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

// Delete notes view
export const deleteNotesView = async (userId: string, viewId: string) => {
    // In a full implementation, this would delete from database
    return true;
};

// Get frozen configuration
export const getNotesFrozenConfig = async () => {
    return {
        frozenProperties: ['title', 'createdAt', 'updatedAt'],
        frozenViews: ['all-notes'],
        canAddProperties: true,
        canEditProperties: true,
        canDeleteProperties: true,
        canAddViews: true,
        canEditViews: true,
        canDeleteViews: true
    };
};

// Property management functions (simplified)
export const addNotesProperty = async (userId: string, propertyData: any) => {
    return {
        id: `prop-${Date.now()}`,
        ...propertyData,
        createdBy: userId,
        createdAt: new Date()
    };
};

export const updateNotesCustomProperty = async (userId: string, propertyId: string, updateData: any) => {
    return {
        id: propertyId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteNotesCustomProperty = async (userId: string, propertyId: string) => {
    return true;
};

// Placeholder functions for other operations
export const updateNotesViewProperties = async (userId: string, viewId: string, properties: any[]) => {
    return true;
};

export const updateNotesViewFilters = async (userId: string, viewId: string, filters: any[]) => {
    return true;
};

export const updateNotesViewSorts = async (userId: string, viewId: string, sorts: any[]) => {
    return true;
};

export const duplicateNotesView = async (userId: string, viewId: string) => {
    return await createNotesView(userId, { name: 'Copy of View' });
};

export const insertNotesProperty = async (userId: string, propertyData: any, position: number) => {
    return await addNotesProperty(userId, propertyData);
};

export const duplicateNotesProperty = async (userId: string, propertyId: string) => {
    return await addNotesProperty(userId, { name: 'Copy of Property' });
};

export const freezeNotesProperty = async (userId: string, propertyId: string, frozen: boolean) => {
    return true;
};
