import { Request, Response } from 'express';
import { catchAsync, createAppError } from '../../../utils';
import { Person, Task, Project, Note } from '../second-brain';

// Get all people with CRM features
export const getPeople = catchAsync(async (req: Request, res: Response) => {
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
        throw createAppError('User not authenticated', 401);
    }

    // Build filter query
    const filter: any = { 
        createdBy: userId,
        archivedAt: { $exists: false }
    };

    if (relationship) filter.relationship = relationship;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (company) filter.company = new RegExp(company as string, 'i');

    // Filter for people who need contact
    if (needsContact === 'true') {
        const today = new Date();
        filter.nextContactDate = { $lte: today };
    }

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortQuery: any = {};
    if (search) {
        sortQuery.score = { $meta: 'textScore' };
    } else {
        sortQuery.lastName = 1;
        sortQuery.firstName = 1;
    }

    const [people, total] = await Promise.all([
        Person.find(filter)
            .populate('projects', 'title status')
            .populate('tasks', 'title status priority')
            .populate('notes', 'title type updatedAt')
            .sort(sortQuery)
            .skip(skip)
            .limit(Number(limit)),
        Person.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            people,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

// Get single person with full CRM details
export const getPerson = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const person = await Person.findOne({ 
        _id: id, 
        createdBy: userId 
    })
    .populate('projects', 'title status area completionPercentage')
    .populate('tasks', 'title status priority dueDate')
    .populate('notes', 'title type content updatedAt');

    if (!person) {
        throw createAppError('Person not found', 404);
    }

    // Get interaction timeline
    const interactions = await Note.find({
        people: person._id,
        createdBy: userId,
        type: 'meeting',
        archivedAt: { $exists: false }
    }).sort({ updatedAt: -1 }).limit(10);

    // Calculate contact frequency insights
    const contactInsights = {
        daysSinceLastContact: person.lastContacted 
            ? Math.floor((new Date().getTime() - new Date(person.lastContacted).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        isOverdue: person.nextContactDate && new Date(person.nextContactDate) < new Date(),
        upcomingContact: person.nextContactDate && new Date(person.nextContactDate) > new Date()
    };

    res.status(200).json({
        success: true,
        data: {
            person,
            interactions,
            contactInsights
        }
    });
});

// Create person with CRM setup
export const createPerson = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
        throw createAppError('User not authenticated', 401);
    }

    const personData = {
        ...req.body,
        createdBy: userId
    };

    // Set default next contact date based on relationship
    if (!personData.nextContactDate && personData.contactFrequency) {
        const today = new Date();
        switch (personData.contactFrequency) {
            case 'weekly':
                personData.nextContactDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                personData.nextContactDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarterly':
                personData.nextContactDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                break;
            case 'yearly':
                personData.nextContactDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
                break;
        }
    }

    const person = await Person.create(personData);

    res.status(201).json({
        success: true,
        data: person
    });
});

// Update person with contact tracking
export const updatePerson = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const person = await Person.findOneAndUpdate(
        { _id: id, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!person) {
        throw createAppError('Person not found', 404);
    }

    res.status(200).json({
        success: true,
        data: person
    });
});

// Delete person with cleanup
export const deletePerson = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const person = await Person.findOneAndDelete({ 
        _id: id, 
        createdBy: userId 
    });

    if (!person) {
        throw createAppError('Person not found', 404);
    }

    // Remove person references from projects
    await Project.updateMany(
        { people: person._id },
        { $pull: { people: person._id } }
    );

    // Remove person references from tasks
    await Task.updateMany(
        { assignedTo: person._id },
        { $unset: { assignedTo: 1 } }
    );

    // Remove person references from notes
    await Note.updateMany(
        { people: person._id },
        { $pull: { people: person._id } }
    );

    res.status(204).json({
        success: true,
        data: null
    });
});

// Record contact interaction
export const recordContact = catchAsync(async (req: Request, res: Response) => {
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
export const getContactInsights = catchAsync(async (req: Request, res: Response) => {
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
export const addToProject = catchAsync(async (req: Request, res: Response) => {
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
