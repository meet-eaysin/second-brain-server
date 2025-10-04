import { DatabaseModel } from '@/modules/database/models/database.model';
import { RecordModel } from '@/modules/database/models/record.model';
import { EDatabaseType } from '@/modules/database';
import {
  IPerson,
  IInteraction,
  IPeopleStats,
  ICreatePersonRequest,
  IUpdatePersonRequest,
  IPeopleQueryParams,
  ICreateInteractionRequest,
  IUpdateInteractionRequest,
  EContactType,
  ERelationshipStatus,
  ECommunicationPreference,
  EInteractionType
} from '../types/people.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { permissionService } from '../../../permissions/services/permission.service';
import { EShareScope, EPermissionLevel } from '@/modules/core/types/permission.types';

export class PeopleService {

  // ===== PERSON OPERATIONS =====

  async createPerson(data: ICreatePersonRequest, userId: string): Promise<IPerson> {
    try {
      // Verify the database exists and is a people database
      const database = await DatabaseModel.findOne({
        _id: data.databaseId,
        isDeleted: { $ne: true }
      }).exec();

      if (!database) {
        throw createNotFoundError('Database', data.databaseId);
      }

      if (database.type !== EDatabaseType.PEOPLE) {
        throw createValidationError('Database must be of type PEOPLE');
      }

      // Check permission to create people in this database
      const hasPermission = await permissionService.hasPermission(
        EShareScope.DATABASE,
        data.databaseId,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to create people in this database');
      }

      // Generate full name
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      // Create person record
      const personRecord = new RecordModel({
        _id: generateId(),
        databaseId: data.databaseId,
        properties: {
          'First Name': data.firstName,
          'Last Name': data.lastName,
          'Full Name': fullName,
          Nickname: data.nickname || '',
          Title: data.title || '',
          Company: data.company || '',
          Department: data.department || '',
          Position: data.position || '',
          'Contact Info': data.contactInfo || {},
          Type: data.type,
          Status: ERelationshipStatus.ACTIVE,
          'Relationship Notes': data.relationshipNotes || '',
          'How We Met': data.howWeMet || '',
          'Met Date': data.metDate,
          'Communication Preference': data.communicationPreference || [],
          Timezone: data.timezone || '',
          Birthday: data.birthday,
          Anniversary: data.anniversary,
          Interests: data.interests || [],
          Skills: data.skills || [],
          Goals: data.goals || [],
          Challenges: data.challenges || [],
          'Personal Notes': data.personalNotes || '',
          Industry: data.industry || '',
          Experience: data.experience || '',
          Expertise: data.expertise || [],
          'Last Contact Date': null,
          'Contact Frequency': data.contactFrequency,
          'Next Follow Up Date': data.nextFollowUpDate,
          'Connected People': [],
          'Mutual Connections': [],
          'Introduced By': null,
          'Shared Projects': [],
          'Shared Goals': [],
          Tags: data.tags || [],
          'Custom Fields': data.customFields || {},
          'Is Archived': false,
          'Is Favorite': data.isFavorite || false,
          'Reminder Enabled': data.reminderEnabled !== false
        },
        content: [],
        createdBy: userId,
        updatedBy: userId,
        order: await this.getNextOrder(data.databaseId)
      });

      const savedRecord = await personRecord.save();

      // Update database record count and activity
      await DatabaseModel.findByIdAndUpdate(
        data.databaseId,
        {
          $inc: { recordCount: 1 },
          lastActivityAt: new Date()
        }
      );

      return this.formatPersonResponse(savedRecord);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create person: ${error.message}`, 500);
    }
  }

  async getPeople(params: IPeopleQueryParams, userId: string): Promise<{
    people: IPerson[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const query = this.buildPeopleQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'lastName', sortOrder = 'asc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [people, total] = await Promise.all([
        RecordModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        RecordModel.countDocuments(query)
      ]);

      const formattedPeople = people.map(person => this.formatPersonResponse(person));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        people: formattedPeople,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get people: ${error.message}`, 500);
    }
  }

  async getPersonById(id: string, userId: string): Promise<IPerson> {
    try {
      const person = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!person) {
        throw createNotFoundError('Person', id);
      }

      // Check permission to read this person
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.READ
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to view this person');
      }

      return this.formatPersonResponse(person);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get person: ${error.message}`, 500);
    }
  }

  async updatePerson(id: string, data: IUpdatePersonRequest, userId: string): Promise<IPerson> {
    try {
      const person = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!person) {
        throw createNotFoundError('Person', id);
      }

      // Check permission to edit this person
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.EDIT
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to edit this person');
      }

      // Build update object
      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      if (data.firstName !== undefined) {
        updateData['properties.First Name'] = data.firstName;
      }
      if (data.lastName !== undefined) {
        updateData['properties.Last Name'] = data.lastName;
      }
      if (data.firstName !== undefined || data.lastName !== undefined) {
        const firstName = data.firstName || person.properties['First Name'];
        const lastName = data.lastName || person.properties['Last Name'];
        updateData['properties.Full Name'] = `${firstName} ${lastName}`.trim();
      }
      if (data.nickname !== undefined) {
        updateData['properties.Nickname'] = data.nickname;
      }
      if (data.title !== undefined) {
        updateData['properties.Title'] = data.title;
      }
      if (data.company !== undefined) {
        updateData['properties.Company'] = data.company;
      }
      if (data.department !== undefined) {
        updateData['properties.Department'] = data.department;
      }
      if (data.position !== undefined) {
        updateData['properties.Position'] = data.position;
      }
      if (data.contactInfo !== undefined) {
        updateData['properties.Contact Info'] = data.contactInfo;
      }
      if (data.type !== undefined) {
        updateData['properties.Type'] = data.type;
      }
      if (data.status !== undefined) {
        updateData['properties.Status'] = data.status;
      }
      if (data.relationshipNotes !== undefined) {
        updateData['properties.Relationship Notes'] = data.relationshipNotes;
      }
      if (data.howWeMet !== undefined) {
        updateData['properties.How We Met'] = data.howWeMet;
      }
      if (data.metDate !== undefined) {
        updateData['properties.Met Date'] = data.metDate;
      }
      if (data.communicationPreference !== undefined) {
        updateData['properties.Communication Preference'] = data.communicationPreference;
      }
      if (data.timezone !== undefined) {
        updateData['properties.Timezone'] = data.timezone;
      }
      if (data.birthday !== undefined) {
        updateData['properties.Birthday'] = data.birthday;
      }
      if (data.anniversary !== undefined) {
        updateData['properties.Anniversary'] = data.anniversary;
      }
      if (data.interests !== undefined) {
        updateData['properties.Interests'] = data.interests;
      }
      if (data.skills !== undefined) {
        updateData['properties.Skills'] = data.skills;
      }
      if (data.goals !== undefined) {
        updateData['properties.Goals'] = data.goals;
      }
      if (data.challenges !== undefined) {
        updateData['properties.Challenges'] = data.challenges;
      }
      if (data.personalNotes !== undefined) {
        updateData['properties.Personal Notes'] = data.personalNotes;
      }
      if (data.industry !== undefined) {
        updateData['properties.Industry'] = data.industry;
      }
      if (data.experience !== undefined) {
        updateData['properties.Experience'] = data.experience;
      }
      if (data.expertise !== undefined) {
        updateData['properties.Expertise'] = data.expertise;
      }
      if (data.contactFrequency !== undefined) {
        updateData['properties.Contact Frequency'] = data.contactFrequency;
      }
      if (data.nextFollowUpDate !== undefined) {
        updateData['properties.Next Follow Up Date'] = data.nextFollowUpDate;
      }
      if (data.tags !== undefined) {
        updateData['properties.Tags'] = data.tags;
      }
      if (data.customFields !== undefined) {
        updateData['properties.Custom Fields'] = data.customFields;
      }
      if (data.isArchived !== undefined) {
        updateData['properties.Is Archived'] = data.isArchived;
      }
      if (data.isFavorite !== undefined) {
        updateData['properties.Is Favorite'] = data.isFavorite;
      }
      if (data.reminderEnabled !== undefined) {
        updateData['properties.Reminder Enabled'] = data.reminderEnabled;
      }

      const updatedPerson = await RecordModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedPerson) {
        throw createNotFoundError('Person', id);
      }

      // Update database activity
      await DatabaseModel.findByIdAndUpdate(
        updatedPerson.databaseId,
        { lastActivityAt: new Date() }
      );

      return this.formatPersonResponse(updatedPerson);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update person: ${error.message}`, 500);
    }
  }

  async deletePerson(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const person = await RecordModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!person) {
        throw createNotFoundError('Person', id);
      }

      // Check permission to delete this person
      const hasPermission = await permissionService.hasPermission(
        EShareScope.RECORD,
        id,
        userId,
        EPermissionLevel.FULL_ACCESS
      );

      if (!hasPermission) {
        throw createForbiddenError('Insufficient permissions to delete this person');
      }

      if (permanent) {
        await RecordModel.findByIdAndDelete(id);
      } else {
        await RecordModel.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        });
      }

      // Update database record count
      await DatabaseModel.findByIdAndUpdate(
        person.databaseId,
        {
          $inc: { recordCount: -1 },
          lastActivityAt: new Date()
        }
      );
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete person: ${error.message}`, 500);
    }
  }

  // ===== HELPER METHODS =====

  private buildPeopleQuery(params: IPeopleQueryParams, userId: string): any {
    const query: any = {
      isDeleted: { $ne: true }
    };

    if (params.databaseId) {
      query.databaseId = params.databaseId;
    }

    if (params.type && params.type.length > 0) {
      query['properties.Type'] = { $in: params.type };
    }

    if (params.status && params.status.length > 0) {
      query['properties.Status'] = { $in: params.status };
    }

    if (params.company) {
      query['properties.Company'] = { $regex: params.company, $options: 'i' };
    }

    if (params.industry) {
      query['properties.Industry'] = { $regex: params.industry, $options: 'i' };
    }

    if (params.tags && params.tags.length > 0) {
      query['properties.Tags'] = { $in: params.tags };
    }

    if (params.search) {
      query.$or = [
        { 'properties.First Name': { $regex: params.search, $options: 'i' } },
        { 'properties.Last Name': { $regex: params.search, $options: 'i' } },
        { 'properties.Full Name': { $regex: params.search, $options: 'i' } },
        { 'properties.Company': { $regex: params.search, $options: 'i' } },
        { 'properties.Position': { $regex: params.search, $options: 'i' } },
        { 'properties.Personal Notes': { $regex: params.search, $options: 'i' } }
      ];
    }

    if (params.isFavorite !== undefined) {
      query['properties.Is Favorite'] = params.isFavorite;
    }

    if (params.isArchived !== undefined) {
      query['properties.Is Archived'] = params.isArchived;
    }

    if (params.hasUpcomingFollowUp) {
      query['properties.Next Follow Up Date'] = { $gte: new Date() };
    }

    if (params.hasOverdueFollowUp) {
      query['properties.Next Follow Up Date'] = { $lt: new Date() };
    }

    if (params.birthdayMonth) {
      const startOfMonth = new Date();
      startOfMonth.setMonth(params.birthdayMonth - 1, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      query['properties.Birthday'] = { $gte: startOfMonth, $lte: endOfMonth };
    }

    if (params.lastContactBefore || params.lastContactAfter) {
      const dateQuery: any = {};
      if (params.lastContactBefore) {
        dateQuery.$lt = params.lastContactBefore;
      }
      if (params.lastContactAfter) {
        dateQuery.$gt = params.lastContactAfter;
      }
      query['properties.Last Contact Date'] = dateQuery;
    }

    return query;
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'firstName': 'properties.First Name',
      'lastName': 'properties.Last Name',
      'company': 'properties.Company',
      'lastContactDate': 'properties.Last Contact Date',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    return fieldMap[sortBy] || 'properties.Last Name';
  }

  private formatPersonResponse(record: any): IPerson {
    return {
      id: record._id.toString(),
      databaseId: record.databaseId,
      firstName: record.properties['First Name'] || '',
      lastName: record.properties['Last Name'] || '',
      fullName: record.properties['Full Name'] || '',
      nickname: record.properties.Nickname,
      title: record.properties.Title,
      company: record.properties.Company,
      department: record.properties.Department,
      position: record.properties.Position,
      contactInfo: record.properties['Contact Info'] || {},
      type: record.properties.Type || EContactType.OTHER,
      status: record.properties.Status || ERelationshipStatus.ACTIVE,
      relationshipNotes: record.properties['Relationship Notes'],
      howWeMet: record.properties['How We Met'],
      metDate: record.properties['Met Date'],
      communicationPreference: record.properties['Communication Preference'] || [],
      timezone: record.properties.Timezone,
      birthday: record.properties.Birthday,
      anniversary: record.properties.Anniversary,
      interests: record.properties.Interests || [],
      skills: record.properties.Skills || [],
      goals: record.properties.Goals || [],
      challenges: record.properties.Challenges || [],
      personalNotes: record.properties['Personal Notes'],
      industry: record.properties.Industry,
      experience: record.properties.Experience,
      expertise: record.properties.Expertise || [],
      lastContactDate: record.properties['Last Contact Date'],
      contactFrequency: record.properties['Contact Frequency'],
      nextFollowUpDate: record.properties['Next Follow Up Date'],
      connectedPeople: record.properties['Connected People'] || [],
      mutualConnections: record.properties['Mutual Connections'] || [],
      introducedBy: record.properties['Introduced By'],
      sharedProjects: record.properties['Shared Projects'] || [],
      sharedGoals: record.properties['Shared Goals'] || [],
      tags: record.properties.Tags || [],
      customFields: record.properties['Custom Fields'] || {},
      isArchived: record.properties['Is Archived'] || false,
      isFavorite: record.properties['Is Favorite'] || false,
      reminderEnabled: record.properties['Reminder Enabled'] !== false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy
    };
  }

  private async getNextOrder(databaseId: string): Promise<number> {
    const lastRecord = await RecordModel.findOne(
      { databaseId, isDeleted: { $ne: true } },
      { order: 1 }
    ).sort({ order: -1 }).exec();

    return (lastRecord?.order || 0) + 1;
  }
}

export const peopleService = new PeopleService();
export default peopleService;
