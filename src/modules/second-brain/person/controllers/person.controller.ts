import { Request, Response } from 'express';
import { catchAsync, sendSuccessResponse, sendErrorResponse } from '../../../../utils';
import * as personService from '../services/person.service';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

// Get all people with CRM features
export const getPeople = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
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
    const userId = req.user?.userId;
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
    const userId = req.user?.userId;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    const person = await personService.createPerson(userId, req.body);

    sendSuccessResponse(res, person, 'Person created successfully', 201);
});

// Update person with contact tracking
export const updatePerson = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
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
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        sendErrorResponse(res, 'User not authenticated', 401);
        return;
    }

    await personService.deletePerson(userId, id);

    sendSuccessResponse(res, null, 'Person deleted successfully', 204);
});

// Record contact interaction
export const recordContact = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
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

    // Create a meeting note if notes provided
    if (notes) {
        const meetingNote = await Note.create({
            title: `Meeting with ${person.firstName} ${person.lastName}`,
            content: notes,
            type: 'meeting',
            area: 'areas',
            tags: ['meeting', 'contact'],
            people: [person._id],
            createdBy: userId
        });

        // Add note to person's notes array
        person.notes.push(meetingNote._id);
        await person.save();
    }

    res.status(200).json({
        success: true,
        data: person
    });
});

// Get people who need contact
export const getPeopleNeedingContact = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

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
export const getContactInsights = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

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
export const addToProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
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
    if (!project.people.includes(id)) {
        project.people.push(id);
        await project.save();
    }

    // Add project to person
    if (!person.projects.includes(projectId)) {
        person.projects.push(projectId);
        await person.save();
    }

    res.status(200).json({
        success: true,
        data: { person, project }
    });
});

// Remove person from project
export const removeFromProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
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
