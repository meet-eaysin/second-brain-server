// Habit Document View Service
// This service provides document-view functionality for habits

// Default habit properties configuration
export const getDefaultHabitProperties = async () => {
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
            id: 'frequency',
            name: 'Frequency',
            type: 'SELECT',
            required: false,
            description: 'Frequency',
            options: {
                selectOptions: [
                    { id: 'daily', name: 'Daily', color: '#10b981' },
                    { id: 'weekly', name: 'Weekly', color: '#3b82f6' },
                    { id: 'monthly', name: 'Monthly', color: '#f59e0b' }
                ]
            }
        },
        {
            id: 'category',
            name: 'Category',
            type: 'SELECT',
            required: false,
            description: 'Category',
            options: {
                selectOptions: [
                    { id: 'health', name: 'Health', color: '#10b981' },
                    { id: 'productivity', name: 'Productivity', color: '#3b82f6' },
                    { id: 'learning', name: 'Learning', color: '#f59e0b' },
                    { id: 'social', name: 'Social', color: '#8b5cf6' }
                ]
            }
        },
        {
            id: 'streak',
            name: 'Current Streak',
            type: 'NUMBER',
            required: false,
            description: 'Current Streak',
            options: {}
        },
        {
            id: 'isActive',
            name: 'Active',
            type: 'CHECKBOX',
            required: false,
            description: 'Active',
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

// Default habit views configuration
export const getDefaultHabitViews = async () => {
    return [
        {
            id: 'all-habits',
            name: 'All Habits',
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

// Get habit view configuration
export const getHabitViewConfig = async () => {
    return {
        moduleType: 'habits',
        displayName: 'Habit',
        displayNamePlural: 'Habits',
        description: 'Build and track your daily habits',
        icon: '🔄',
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
        defaultProperties: await getDefaultHabitProperties(),
        defaultViews: await getDefaultHabitViews()
    };
};

// Service functions (simplified implementations)
export const getUserHabitViews = async (userId: string) => {
    return await getDefaultHabitViews();
};

export const getHabitView = async (userId: string, viewId: string) => {
    const views = await getUserHabitViews(userId);
    return views.find(view => view.id === viewId);
};

export const getDefaultHabitView = async (userId: string) => {
    const views = await getUserHabitViews(userId);
    return views.find(view => view.isDefault) || views[0];
};

export const createHabitView = async (userId: string, viewData: any) => {
    return {
        id: `view-${Date.now()}`,
        ...viewData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
};

export const updateHabitView = async (userId: string, viewId: string, updateData: any) => {
    return {
        id: viewId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteHabitView = async (userId: string, viewId: string) => {
    return true;
};

export const getHabitFrozenConfig = async () => {
    return {
        frozenProperties: ['title', 'createdAt', 'updatedAt'],
        frozenViews: ['all-habits'],
        canAddProperties: true,
        canEditProperties: true,
        canDeleteProperties: true,
        canAddViews: true,
        canEditViews: true,
        canDeleteViews: true
    };
};

// Property management functions (simplified)
export const addHabitProperty = async (userId: string, propertyData: any) => {
    return {
        id: `prop-${Date.now()}`,
        ...propertyData,
        createdBy: userId,
        createdAt: new Date()
    };
};

export const updateHabitCustomProperty = async (userId: string, propertyId: string, updateData: any) => {
    return {
        id: propertyId,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
    };
};

export const deleteHabitCustomProperty = async (userId: string, propertyId: string) => {
    return true;
};

// Placeholder functions for other operations
export const updateHabitViewProperties = async (userId: string, viewId: string, properties: any[]) => {
    return true;
};

export const updateHabitViewFilters = async (userId: string, viewId: string, filters: any[]) => {
    return true;
};

export const updateHabitViewSorts = async (userId: string, viewId: string, sorts: any[]) => {
    return true;
};

export const duplicateHabitView = async (userId: string, viewId: string) => {
    return await createHabitView(userId, { name: 'Copy of View' });
};

export const insertHabitProperty = async (userId: string, propertyData: any, position: number) => {
    return await addHabitProperty(userId, propertyData);
};

export const duplicateHabitProperty = async (userId: string, propertyId: string) => {
    return await addHabitProperty(userId, { name: 'Copy of Property' });
};

export const freezeHabitProperty = async (userId: string, propertyId: string, frozen: boolean) => {
    return true;
};