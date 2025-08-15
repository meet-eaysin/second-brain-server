import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import { createAppError } from '../../../../utils';
import * as personService from '../services/person.service';
import { Person } from '../models/person.model';
import { Project } from '../../project/models/project.model';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

// Get all people with CRM features
export const getPeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const {
        relationship,
        tags,
        company,
        needsContact,
        search,
        page = 1,
        limit = 50
    } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    // Build filters for service
    const filters: any = {};

    if (relationship) filters.relationship = Array.isArray(relationship) ? relationship : [relationship];
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (company) filters.company = company as string;
    if (search) filters.search = search as string;
    if (needsContact === 'true') filters.contactOverdue = true;

    // Build options for service
    const options = {
        page: Number(page),
        limit: Number(limit),
        sort: search ? 'score' : 'lastName firstName',
        populate: ['projects', 'tasks', 'notes']
    };

    const result = await personService.getPeople(userId, filters, options);

    sendSuccessResponse(res, 'People retrieved successfully', result);
});

// Get single person with full CRM details
export const getPerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.getPersonById(userId, id);
    const interactions = await personService.getPersonInteractions(userId, id);

    // Calculate contact frequency insights
    const contactInsights = {
        daysSinceLastContact: person.lastContacted
            ? Math.floor((new Date().getTime() - new Date(person.lastContacted).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        isOverdue: person.nextContactDate && new Date(person.nextContactDate) < new Date(),
        upcomingContact: person.nextContactDate && new Date(person.nextContactDate) > new Date()
    };

    const result = {
        person,
        interactions,
        contactInsights
    };

    sendSuccessResponse(res, 'Person retrieved successfully', result);
});

// Create person with CRM setup
export const createPerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.createPerson(userId, req.body);

    sendSuccessResponse(res, 'Person created successfully', person, 201);
});

// Update person with contact tracking
export const updatePerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.updatePerson(userId, id, req.body);

    sendSuccessResponse(res, 'Person updated successfully', person);
});

// Delete person with cleanup
export const deletePerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    await personService.deletePerson(userId, id);

    sendSuccessResponse(res, 'Person deleted successfully', null, 204);
});

// Record contact interaction
export const recordContact = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { type = 'general', notes, nextContactDate } = req.body;

    const person = await Person.findOne({ _id: id, createdBy: userId });
    if (!person) {
        throw createAppError('Person not found', 404);
    }

    // Update last contacted date
    person.lastContacted = new Date();
    
    // Update next contact date if provided
    if (nextContactDate) {
        person.nextContactDate = new Date(nextContactDate);
    } else if (person.contactFrequency) {
        // Auto-calculate next contact based on frequency
        const today = new Date();
        switch (person.contactFrequency) {
            case 'weekly':
                person.nextContactDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                person.nextContactDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarterly':
                person.nextContactDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                break;
            case 'yearly':
                person.nextContactDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
                break;
        }
    }

    await person.save();

    // Note: Meeting notes functionality would be handled by the notes module
    // if (notes) {
    //     // Create meeting note through notes service
    // }

    res.status(200).json({
        success: true,
        data: person
    });
});

// Get people who need contact
export const getPeopleNeedingContact = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const today = new Date();
    const people = await Person.find({
        createdBy: userId,
        nextContactDate: { $lte: today },
        archivedAt: { $exists: false }
    }).sort({ nextContactDate: 1 });

    res.status(200).json({
        success: true,
        data: people
    });
});

// Get contact frequency insights
export const getContactInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const people = await Person.find({
        createdBy: userId,
        archivedAt: { $exists: false }
    });

    const today = new Date();
    const insights = {
        totalContacts: people.length,
        needContact: people.filter(p => p.nextContactDate && new Date(p.nextContactDate) <= today).length,
        upcomingContact: people.filter(p => {
            if (!p.nextContactDate) return false;
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return new Date(p.nextContactDate) > today && new Date(p.nextContactDate) <= nextWeek;
        }).length,
        byRelationship: people.reduce((acc, person) => {
            acc[person.relationship] = (acc[person.relationship] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        recentContacts: people.filter(p => {
            if (!p.lastContacted) return false;
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return new Date(p.lastContacted) >= weekAgo;
        }).length
    };

    res.status(200).json({
        success: true,
        data: insights
    });
});

// Add person to project
export const addToProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { projectId } = req.body;

    const [person, project] = await Promise.all([
        Person.findOne({ _id: id, createdBy: userId }),
        Project.findOne({ _id: projectId, createdBy: userId })
    ]);

    if (!person) {
        throw createAppError('Person not found', 404);
    }
    if (!project) {
        throw createAppError('Project not found', 404);
    }

    // Add person to project
    const personObjectId = new (require('mongoose').Types.ObjectId)(id);
    if (!project.people.some(p => p.toString() === id)) {
        project.people.push(personObjectId);
        await project.save();
    }

    // Add project to person
    const projectObjectId = new (require('mongoose').Types.ObjectId)(projectId);
    if (!person.projects.some(p => p.toString() === projectId)) {
        person.projects.push(projectObjectId);
        await person.save();
    }

    res.status(200).json({
        success: true,
        data: { person, project }
    });
});

// Remove person from project
export const removeFromProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id, projectId } = req.params;

    const [person, project] = await Promise.all([
        Person.findOne({ _id: id, createdBy: userId }),
        Project.findOne({ _id: projectId, createdBy: userId })
    ]);

    if (!person) {
        throw createAppError('Person not found', 404);
    }
    if (!project) {
        throw createAppError('Project not found', 404);
    }

    // Remove person from project
    project.people = project.people.filter(p => p.toString() !== id);
    await project.save();

    // Remove project from person
    person.projects = person.projects.filter(p => p.toString() !== projectId);
    await person.save();

    res.status(200).json({
        success: true,
        data: { person, project }
    });
});

// Get person statistics
export const getPersonStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const stats = await personService.getPersonStats(userId);
    sendSuccessResponse(res, 'Person statistics retrieved successfully', stats);
});

// Get person analytics
export const getPersonAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { period = 'month' } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const analytics = await personService.getPersonAnalytics(userId, period as string);
    sendSuccessResponse(res, 'Person analytics retrieved successfully', analytics);
});

// Import people
export const importPeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.importPeople(userId, req.body);
    sendSuccessResponse(res, 'People imported successfully', result, 201);
});

// Export people
export const exportPeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { format = 'json' } = req.query;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.exportPeople(userId, format as string);
    sendSuccessResponse(res, 'People exported successfully', result);
});

// Bulk update people
export const bulkUpdatePeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.bulkUpdatePeople(userId, req.body);
    sendSuccessResponse(res, 'People updated successfully', result);
});

// Bulk delete people
export const bulkDeletePeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.bulkDeletePeople(userId, req.body);
    sendSuccessResponse(res, 'People deleted successfully', result);
});

// Archive person
export const archivePerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.archivePerson(userId, id);
    sendSuccessResponse(res, 'Person archived successfully', person);
});

// Toggle favorite
export const toggleFavorite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.toggleFavorite(userId, id);
    sendSuccessResponse(res, 'Person favorite status updated successfully', person);
});

// Duplicate person
export const duplicatePerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.duplicatePerson(userId, id);
    sendSuccessResponse(res, 'Person duplicated successfully', person, 201);
});

// Link task
export const linkTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { taskId } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.linkTask(userId, id, taskId);
    sendSuccessResponse(res, 'Task linked successfully', result);
});

// Unlink task
export const unlinkTask = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { personId, taskId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.unlinkTask(userId, personId, taskId);
    sendSuccessResponse(res, 'Task unlinked successfully', result);
});

// Link project
export const linkProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { projectId } = req.body;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.linkProject(userId, id, projectId);
    sendSuccessResponse(res, 'Project linked successfully', result);
});

// Unlink project
export const unlinkProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { personId, projectId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const result = await personService.unlinkProject(userId, personId, projectId);
    sendSuccessResponse(res, 'Project unlinked successfully', result);
});

// Add interaction
export const addInteraction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const interaction = await personService.addInteraction(userId, id, req.body);
    sendSuccessResponse(res, 'Interaction added successfully', interaction, 201);
});

// Get interactions
export const getInteractions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const interactions = await personService.getInteractions(userId, id);
    sendSuccessResponse(res, 'Interactions retrieved successfully', interactions);
});

// Update interaction
export const updateInteraction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { personId, interactionId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const interaction = await personService.updateInteraction(userId, personId, interactionId, req.body);
    sendSuccessResponse(res, 'Interaction updated successfully', interaction);
});

// Delete interaction
export const deleteInteraction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { personId, interactionId } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    await personService.deleteInteraction(userId, personId, interactionId);
    sendSuccessResponse(res, 'Interaction deleted successfully', null);
});
