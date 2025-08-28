import { Request, Response, NextFunction } from 'express';
import { peopleService } from '../services/people.service';
import { getUserId } from '@/modules/auth';
import { catchAsync, sendSuccessResponse, sendPaginatedResponse } from '@/utils';
import {
  ICreatePersonRequest,
  IUpdatePersonRequest,
  IPeopleQueryParams,
  EContactType,
  ERelationshipStatus
} from '../types/people.types';

// ===== PERSON CONTROLLERS =====

export const createPerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: ICreatePersonRequest = req.body;
    const userId = getUserId(req);

    const person = await peopleService.createPerson(data, userId);

    sendSuccessResponse(res, 'Person created successfully', person, 201);
  }
);

export const getPeople = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IPeopleQueryParams = req.query as any;
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'People retrieved successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getPersonById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const person = await peopleService.getPersonById(id, userId);

    sendSuccessResponse(res, 'Person retrieved successfully', person);
  }
);

export const updatePerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const data: IUpdatePersonRequest = req.body;
    const userId = getUserId(req);

    const person = await peopleService.updatePerson(id, data, userId);

    sendSuccessResponse(res, 'Person updated successfully', person);
  }
);

export const deletePerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { permanent } = req.query;
    const userId = getUserId(req);

    await peopleService.deletePerson(id, userId, permanent === 'true');

    sendSuccessResponse(res, 'Person deleted successfully', null, 204);
  }
);

// ===== PEOPLE ANALYTICS =====

export const getFavorites = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      isFavorite: true
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'Favorite people retrieved successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getPeopleByType = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.params;
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      type: [type as EContactType]
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      `People of type "${type}" retrieved successfully`,
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getPeopleByCompany = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { company } = req.params;
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      company: decodeURIComponent(company)
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      `People from "${company}" retrieved successfully`,
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getUpcomingFollowUps = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      hasUpcomingFollowUp: true
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'People with upcoming follow-ups retrieved successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getOverdueFollowUps = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      hasOverdueFollowUp: true
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'People with overdue follow-ups retrieved successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const getUpcomingBirthdays = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const currentMonth = new Date().getMonth() + 1;
    const params: IPeopleQueryParams = { 
      ...req.query as any, 
      birthdayMonth: currentMonth
    };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'People with upcoming birthdays retrieved successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const searchPeople = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { q: search } = req.query;
    const params: IPeopleQueryParams = { ...req.query as any, search: search as string };
    const userId = getUserId(req);

    const result = await peopleService.getPeople(params, userId);

    sendPaginatedResponse(
      res,
      'People search completed successfully',
      result.people,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    );
  }
);

export const addToFavorites = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const person = await peopleService.updatePerson(id, { isFavorite: true }, userId);

    sendSuccessResponse(res, 'Person added to favorites successfully', person);
  }
);

export const removeFromFavorites = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const person = await peopleService.updatePerson(id, { isFavorite: false }, userId);

    sendSuccessResponse(res, 'Person removed from favorites successfully', person);
  }
);

export const archivePerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const person = await peopleService.updatePerson(id, { 
      isArchived: true,
      status: ERelationshipStatus.ARCHIVED 
    }, userId);

    sendSuccessResponse(res, 'Person archived successfully', person);
  }
);

export const unarchivePerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    const person = await peopleService.updatePerson(id, { 
      isArchived: false,
      status: ERelationshipStatus.ACTIVE 
    }, userId);

    sendSuccessResponse(res, 'Person unarchived successfully', person);
  }
);

export const duplicatePerson = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { firstName, lastName, company } = req.body;
    const userId = getUserId(req);

    // Get the original person
    const originalPerson = await peopleService.getPersonById(id, userId);

    // Create duplicate with new values
    const duplicateData: ICreatePersonRequest = {
      databaseId: originalPerson.databaseId,
      firstName: firstName || `${originalPerson.firstName} (Copy)`,
      lastName: lastName || originalPerson.lastName,
      nickname: originalPerson.nickname,
      title: originalPerson.title,
      company: company || originalPerson.company,
      department: originalPerson.department,
      position: originalPerson.position,
      contactInfo: { ...originalPerson.contactInfo },
      type: originalPerson.type,
      relationshipNotes: originalPerson.relationshipNotes,
      howWeMet: originalPerson.howWeMet,
      communicationPreference: [...originalPerson.communicationPreference],
      timezone: originalPerson.timezone,
      interests: [...originalPerson.interests],
      skills: [...originalPerson.skills],
      goals: originalPerson.goals ? [...originalPerson.goals] : [],
      challenges: originalPerson.challenges ? [...originalPerson.challenges] : [],
      personalNotes: originalPerson.personalNotes,
      industry: originalPerson.industry,
      experience: originalPerson.experience,
      expertise: [...originalPerson.expertise],
      contactFrequency: originalPerson.contactFrequency,
      tags: [...originalPerson.tags],
      customFields: { ...originalPerson.customFields },
      isFavorite: false,
      reminderEnabled: originalPerson.reminderEnabled
    };

    const duplicatedPerson = await peopleService.createPerson(duplicateData, userId);

    sendSuccessResponse(res, 'Person duplicated successfully', duplicatedPerson, 201);
  }
);

export const bulkUpdatePeople = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { personIds, updates } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      personIds.map((personId: string) => 
        peopleService.updatePerson(personId, updates, userId)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk update completed', {
      successful,
      failed,
      total: personIds.length,
      results: results.map((result, index) => ({
        personId: personIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });
  }
);

export const bulkDeletePeople = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { personIds, permanent } = req.body;
    const userId = getUserId(req);

    const results = await Promise.allSettled(
      personIds.map((personId: string) => 
        peopleService.deletePerson(personId, userId, permanent)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    sendSuccessResponse(res, 'Bulk delete completed', {
      successful,
      failed,
      total: personIds.length
    });
  }
);

// ===== STATISTICS =====

export const getPeopleStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.query;
    const userId = getUserId(req);

    // This would be implemented in the service
    // For now, return a placeholder response
    const stats = {
      total: 0,
      byType: {},
      byStatus: {},
      totalInteractions: 0,
      interactionsThisMonth: 0,
      averageInteractionsPerPerson: 0,
      activeRelationships: 0,
      staleRelationships: 0,
      upcomingFollowUps: 0,
      overdueFollowUps: 0,
      topIndustries: [],
      topCompanies: [],
      recentInteractions: [],
      upcomingBirthdays: []
    };

    sendSuccessResponse(res, 'People statistics retrieved successfully', stats);
  }
);
