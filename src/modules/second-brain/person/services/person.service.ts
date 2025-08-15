import { Person } from '../models/person.model';
import { Task } from '../../task/models/task.model';
import { Project } from '../../project/models/project.model';
import { Note } from '../../note/models/note.model';
import { createAppError, createNotFoundError, createValidationError } from '@/utils';
import { Types } from 'mongoose';
import { findById, findOneAndUpdate, findOne, updateOne } from '../../../../../utils/mongoose-helpers';

export interface CreatePersonRequest {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    relationship?: 'family' | 'friend' | 'colleague' | 'client' | 'mentor' | 'other';
    tags?: string[];
    notes?: string;
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
        other?: string[];
    };
    birthday?: Date;
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    nextContactDate?: Date;
    lastContacted?: Date;
    bio?: string;
    personalNotes?: string;
    customProperties?: Record<string, any>;
}

export interface UpdatePersonRequest extends Partial<CreatePersonRequest> {
    archivedAt?: Date;
    isFavorite?: boolean;
}

export interface PersonFilters {
    relationship?: string | string[];
    company?: string;
    tags?: string | string[];
    search?: string;
    isArchived?: boolean;
    contactOverdue?: boolean;
}

export interface PersonQueryOptions {
    page?: number;
    limit?: number;
    sort?: string;
    populate?: string[];
}

export interface CreateInteractionRequest {
    type: 'call' | 'email' | 'meeting' | 'message' | 'other';
    date: Date;
    notes?: string;
    duration?: number;
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
}

export interface UpdateInteractionRequest extends Partial<CreateInteractionRequest> {}

export const createPerson = async (userId: string, personData: CreatePersonRequest) => {
    try {
        const person = new Person({
            ...personData,
            createdBy: userId
        });

        await person.save();
        return person;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Person validation failed', error.errors);
        }
        throw createAppError('Failed to create person', 500);
    }
};

export const getPersonById = async (userId: string, personId: string) => {
    if (!Types.ObjectId.isValid(personId)) {
        throw createValidationError('Invalid person ID');
    }

    const person = await Person.findOne({ 
        _id: personId, 
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    if (!person) {
        throw createNotFoundError('Person not found');
    }

    // Transform person to flatten custom properties
    const personObj = person.toObject();

    // Flatten custom properties to root level (shallow copy only)
    if (personObj.customProperties && typeof personObj.customProperties === 'object') {
        const custom = personObj.customProperties as Record<string, unknown>;
        for (const key of Object.keys(custom)) {
            if (!(key in personObj)) {
                (personObj as any)[key] = custom[key];
            }
        }
    }

    return personObj;
};

export const getPeople = async (userId: string, filters: PersonFilters = {}, options: PersonQueryOptions = {}) => {
    const {
        page = 1,
        limit = 20,
        sort = 'lastName firstName',
        populate = []
    } = options;

    // Build query
    const query: any = {
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    // Apply filters
    if (filters.relationship) {
        query.relationship = Array.isArray(filters.relationship) 
            ? { $in: filters.relationship }
            : filters.relationship;
    }

    if (filters.company) {
        query.company = { $regex: filters.company, $options: 'i' };
    }

    if (filters.tags) {
        query.tags = Array.isArray(filters.tags)
            ? { $in: filters.tags }
            : { $in: [filters.tags] };
    }

    if (filters.search) {
        query.$or = [
            { firstName: { $regex: filters.search, $options: 'i' } },
            { lastName: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } },
            { company: { $regex: filters.search, $options: 'i' } }
        ];
    }

    if (filters.contactOverdue) {
        query.nextContactDate = { $lt: new Date() };
    }

    if (filters.isArchived) {
        delete query.archivedAt;
        query.archivedAt = { $exists: true };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    let personQuery = Person.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    // Apply population
    if (populate.length > 0) {
        populate.forEach(field => {
            personQuery = personQuery.populate(field);
        });
    }

    const [people, total] = await Promise.all([
        personQuery.exec(),
        Person.countDocuments(query)
    ]);

    // Transform people to flatten custom properties
    const transformedPeople = people.map(person => {
        const personObj = person.toObject();

        // Flatten custom properties to root level (shallow copy only)
        if (personObj.customProperties && typeof personObj.customProperties === 'object') {
            const custom = personObj.customProperties as Record<string, unknown>;
            for (const key of Object.keys(custom)) {
                if (!(key in personObj)) {
                    (personObj as any)[key] = custom[key];
                }
            }
        }

        return personObj;
    });

    const totalPages = Math.ceil(total / limit);

    return {
        people: transformedPeople,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

export const updatePerson = async (userId: string, personId: string, updates: UpdatePersonRequest) => {
    if (!Types.ObjectId.isValid(personId)) {
        throw createValidationError('Invalid person ID');
    }

    try {
        // Separate custom properties from regular updates
        const regularUpdates: any = {};
        const customPropertyUpdates: any = {};

        for (const [key, value] of Object.entries(updates)) {
            if (key.startsWith('custom_')) {
                // This is a custom property
                customPropertyUpdates[`customProperties.${key}`] = value;
            } else {
                // This is a regular field
                regularUpdates[key] = value;
            }
        }

        // Combine updates
        const finalUpdates = {
            ...regularUpdates,
            ...customPropertyUpdates
        };

        const person = await Person.findOneAndUpdate(
            {
                _id: personId,
                createdBy: userId,
                archivedAt: { $exists: false }
            },
            finalUpdates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!person) {
            throw createNotFoundError('Person not found');
        }

        // Transform person to flatten custom properties
        const personObj = person.toObject();

        // Flatten custom properties to root level (shallow copy only)
        if (personObj.customProperties && typeof personObj.customProperties === 'object') {
            const custom = personObj.customProperties as Record<string, unknown>;
            for (const key of Object.keys(custom)) {
                if (!(key in personObj)) {
                    (personObj as any)[key] = custom[key];
                }
            }
        }

        return personObj;
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createValidationError('Person validation failed', error.errors);
        }
        if (error.statusCode) {
            throw error;
        }
        throw createAppError('Failed to update person', 500);
    }
};

export const deletePerson = async (userId: string, personId: string) => {
    if (!Types.ObjectId.isValid(personId)) {
        throw createValidationError('Invalid person ID');
    }

    const person = await Person.findOneAndDelete({
        _id: personId,
        createdBy: userId
    });

    if (!person) {
        throw createNotFoundError('Person not found');
    }

    // Remove person references from tasks, projects, and notes
    await Promise.all([
        Task.updateMany(
            { assignedTo: personId },
            { $unset: { assignedTo: 1 } }
        ),
        Project.updateMany(
            { members: personId },
            { $pull: { members: personId } }
        ),
        Note.updateMany(
            { linkedPeople: personId },
            { $pull: { linkedPeople: personId } }
        )
    ]);

    return person;
};

export const getPersonInteractions = async (userId: string, personId: string) => {
    if (!Types.ObjectId.isValid(personId)) {
        throw createValidationError('Invalid person ID');
    }

    // Verify person exists and belongs to user
    await getPersonById(userId, personId);

    // Get related tasks, projects, and notes
    const [tasks, projects, notes] = await Promise.all([
        Task.find({
            createdBy: userId,
            assignedTo: personId,
            archivedAt: { $exists: false }
        }).select('title status priority dueDate createdAt').sort({ updatedAt: -1 }).limit(10),
        
        Project.find({
            createdBy: userId,
            members: personId,
            archivedAt: { $exists: false }
        }).select('title status area createdAt').sort({ updatedAt: -1 }).limit(10),
        
        Note.find({
            createdBy: userId,
            linkedPeople: personId,
            archivedAt: { $exists: false }
        }).select('title type createdAt').sort({ updatedAt: -1 }).limit(10)
    ]);

    return {
        tasks,
        projects,
        notes
    };
};

export const updateContactDate = async (userId: string, personId: string, contactDate?: Date) => {
    const updates: any = {
        lastContacted: contactDate || new Date()
    };

    // Calculate next contact date based on contact frequency
    const person = await getPersonById(userId, personId);
    if (person.contactFrequency) {
        const nextDate = new Date(updates.lastContacted);
        switch (person.contactFrequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        updates.nextContactDate = nextDate;
    }

    return await updatePerson(userId, personId, updates);
};

export const getPersonStats = async (userId: string) => {
    const stats = await Person.aggregate([
        { 
            $match: { 
                createdBy: new Types.ObjectId(userId), 
                archivedAt: { $exists: false } 
            } 
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                byRelationship: {
                    $push: {
                        relationship: '$relationship',
                        count: 1
                    }
                },
                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $lt: ['$nextContactDate', new Date()] },
                                    { $exists: ['$nextContactDate', true] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || { total: 0, byRelationship: [], overdue: 0 };
};

// Get person analytics
export const getPersonAnalytics = async (userId: string, period: string = 'month') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default: // month
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Person.aggregate([
        {
            $match: {
                createdBy: new Types.ObjectId(userId),
                archivedAt: { $exists: false }
            }
        },
        {
            $facet: {
                totalPeople: [{ $count: "count" }],
                newPeople: [
                    { $match: { createdAt: { $gte: startDate } } },
                    { $count: "count" }
                ],
                byRelationship: [
                    { $group: { _id: "$relationship", count: { $sum: 1 } } }
                ],
                contactActivity: [
                    { $match: { lastContacted: { $gte: startDate } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastContacted" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ]);

    return analytics[0] || {};
};

// Import people
export const importPeople = async (userId: string, importData: any) => {
    const { people, options = {} } = importData;
    const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
    };

    for (const personData of people) {
        try {
            await createPerson(userId, personData);
            results.imported++;
        } catch (error: any) {
            results.errors.push(`Failed to import ${personData.firstName} ${personData.lastName}: ${error.message}`);
            results.skipped++;
        }
    }

    return results;
};

// Export people
export const exportPeople = async (userId: string, format: string = 'json') => {
    const people = await Person.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    }).lean();

    if (format === 'csv') {
        // Convert to CSV format (simplified)
        const headers = ['firstName', 'lastName', 'email', 'phone', 'company', 'relationship'];
        const csvData = people.map(p =>
            headers.map(header => (p as any)[header] || '').join(',')
        );
        return {
            format: 'csv',
            headers: headers.join(','),
            data: csvData.join('\n')
        };
    }

    return {
        format: 'json',
        data: people
    };
};

// Bulk update people
export const bulkUpdatePeople = async (userId: string, bulkData: any) => {
    const { personIds, updates } = bulkData;
    const results = {
        updated: 0,
        errors: [] as string[]
    };

    for (const personId of personIds) {
        try {
            await updatePerson(userId, personId, updates);
            results.updated++;
        } catch (error: any) {
            results.errors.push(`Failed to update person ${personId}: ${error.message}`);
        }
    }

    return results;
};

// Bulk delete people
export const bulkDeletePeople = async (userId: string, bulkData: any) => {
    const { personIds } = bulkData;
    const results = {
        deleted: 0,
        errors: [] as string[]
    };

    for (const personId of personIds) {
        try {
            await deletePerson(userId, personId);
            results.deleted++;
        } catch (error: any) {
            results.errors.push(`Failed to delete person ${personId}: ${error.message}`);
        }
    }

    return results;
};

// Archive person
export const archivePerson = async (userId: string, personId: string) => {
    return await updatePerson(userId, personId, { archivedAt: new Date() });
};

// Toggle favorite
export const toggleFavorite = async (userId: string, personId: string) => {
    const person = await getPersonById(userId, personId);
    const isFavorite = !person.isFavorite;
    return await updatePerson(userId, personId, { isFavorite });
};

// Duplicate person
export const duplicatePerson = async (userId: string, personId: string) => {
    const originalPerson = await getPersonById(userId, personId);

    const duplicateData: CreatePersonRequest = {
        firstName: `${originalPerson.firstName} (Copy)`,
        lastName: originalPerson.lastName,
        email: undefined, // Remove email to avoid duplicates
        phone: undefined, // Remove phone to avoid duplicates
        company: originalPerson.company,
        position: originalPerson.position,
        relationship: originalPerson.relationship,
        tags: originalPerson.tags,
        socialLinks: originalPerson.socialLinks,
        birthday: originalPerson.birthday,
        contactFrequency: originalPerson.contactFrequency,
        nextContactDate: originalPerson.nextContactDate,
        lastContacted: originalPerson.lastContacted,
        bio: originalPerson.bio,
        personalNotes: originalPerson.personalNotes,
        customProperties: originalPerson.customProperties
    };

    return await createPerson(userId, duplicateData);
};

// Link task
export const linkTask = async (userId: string, personId: string, taskId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    const taskObjectId = new Types.ObjectId(taskId);
    // Add task to person's tasks if not already linked
    if (!person.tasks.includes(taskObjectId)) {
        person.tasks.push(taskObjectId);
        await person.save();
    }

    return person;
};

// Unlink task
export const unlinkTask = async (userId: string, personId: string, taskId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    person.tasks = person.tasks.filter(id => id.toString() !== taskId);
    await person.save();
    return person;
};

// Link project
export const linkProject = async (userId: string, personId: string, projectId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    const projectObjectId = new Types.ObjectId(projectId);
    // Add project to person's projects if not already linked
    if (!person.projects.includes(projectObjectId)) {
        person.projects.push(projectObjectId);
        await person.save();
    }

    return person;
};

// Unlink project
export const unlinkProject = async (userId: string, personId: string, projectId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    person.projects = person.projects.filter(id => id.toString() !== projectId);
    await person.save();
    return person;
};

// Add interaction
export const addInteraction = async (userId: string, personId: string, interactionData: any) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    const interaction = {
        id: new Types.ObjectId().toString(),
        type: interactionData.type || 'general',
        date: interactionData.date || new Date(),
        notes: interactionData.notes || '',
        duration: interactionData.duration,
        outcome: interactionData.outcome,
        followUpRequired: interactionData.followUpRequired || false,
        followUpDate: interactionData.followUpDate
    };

    person.interactions = person.interactions || [];
    person.interactions.push(interaction);
    person.lastContacted = interaction.date;
    await person.save();

    return interaction;
};

// Get interactions
export const getInteractions = async (userId: string, personId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    return person.interactions || [];
};

// Update interaction
export const updateInteraction = async (userId: string, personId: string, interactionId: string, updates: any) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    const interactionIndex = person.interactions?.findIndex(i => i.id === interactionId);
    if (interactionIndex === -1 || interactionIndex === undefined || !person.interactions) {
        throw createNotFoundError('Interaction not found');
    }

    person.interactions[interactionIndex] = { ...person.interactions[interactionIndex], ...updates };
    await person.save();

    return person.interactions[interactionIndex];
};

// Delete interaction
export const deleteInteraction = async (userId: string, personId: string, interactionId: string) => {
    const person = await Person.findOne({ _id: personId, createdBy: userId });
    if (!person) {
        throw createNotFoundError('Person not found');
    }

    person.interactions = person.interactions?.filter(i => i.id !== interactionId) || [];
    await person.save();

    return true;
};
