import { Person } from '../models/person.model';
import { Task } from '../../task/models/task.model';
import { Project } from '../../project/models/project.model';
import { Note } from '../../note/models/note.model';
import { createAppError, createNotFoundError, createValidationError } from '@/utils';
import { Types } from 'mongoose';

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
    socialMedia?: {
        linkedin?: string;
        twitter?: string;
        instagram?: string;
        facebook?: string;
    };
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    birthday?: Date;
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextContactDate?: Date;
    lastContacted?: Date;
    customProperties?: Record<string, any>;
}

export interface UpdatePersonRequest extends Partial<CreatePersonRequest> {
    archivedAt?: Date;
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

    // Flatten custom properties to root level
    if (personObj.customProperties) {
        Object.keys(personObj.customProperties).forEach(key => {
            personObj[key] = personObj.customProperties[key];
        });
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

        // Flatten custom properties to root level
        if (personObj.customProperties) {
            Object.keys(personObj.customProperties).forEach(key => {
                personObj[key] = personObj.customProperties[key];
            });
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

        // Flatten custom properties to root level
        if (personObj.customProperties) {
            Object.keys(personObj.customProperties).forEach(key => {
                personObj[key] = personObj.customProperties[key];
            });
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
    const person = await getPersonById(userId, personId);

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
