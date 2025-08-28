import { z } from 'zod';
import { 
  EContactType, 
  ERelationshipStatus, 
  ECommunicationPreference, 
  EInteractionType 
} from '../types/people.types';

// Base schemas
export const personIdSchema = z.object({
  id: z.string().min(1, 'Person ID is required')
});

export const contactTypeParamSchema = z.object({
  type: z.nativeEnum(EContactType)
});

export const companyParamSchema = z.object({
  company: z.string().min(1, 'Company name is required')
});

// Contact info schema
export const contactInfoSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional()
  }).optional(),
  socialMedia: z.object({
    linkedin: z.string().url('Invalid LinkedIn URL').optional(),
    twitter: z.string().optional(),
    facebook: z.string().url('Invalid Facebook URL').optional(),
    instagram: z.string().optional(),
    github: z.string().optional(),
    website: z.string().url('Invalid website URL').optional()
  }).optional()
}).default({});

// Person CRUD schemas
export const createPersonSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  nickname: z.string().max(50, 'Nickname too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  company: z.string().max(200, 'Company name too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  position: z.string().max(100, 'Position too long').optional(),
  contactInfo: contactInfoSchema,
  type: z.nativeEnum(EContactType),
  relationshipNotes: z.string().max(1000, 'Relationship notes too long').optional(),
  howWeMet: z.string().max(500, 'How we met description too long').optional(),
  metDate: z.string().datetime().transform(val => new Date(val)).optional(),
  communicationPreference: z.array(z.nativeEnum(ECommunicationPreference)).default([]),
  timezone: z.string().optional(),
  birthday: z.string().datetime().transform(val => new Date(val)).optional(),
  anniversary: z.string().datetime().transform(val => new Date(val)).optional(),
  interests: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  industry: z.string().max(100, 'Industry too long').optional(),
  experience: z.string().max(500, 'Experience description too long').optional(),
  expertise: z.array(z.string()).default([]),
  contactFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed']).optional(),
  nextFollowUpDate: z.string().datetime().transform(val => new Date(val)).optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  isFavorite: z.boolean().default(false),
  reminderEnabled: z.boolean().default(true)
});

export const updatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  nickname: z.string().max(50, 'Nickname too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  company: z.string().max(200, 'Company name too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  position: z.string().max(100, 'Position too long').optional(),
  contactInfo: contactInfoSchema.optional(),
  type: z.nativeEnum(EContactType).optional(),
  status: z.nativeEnum(ERelationshipStatus).optional(),
  relationshipNotes: z.string().max(1000, 'Relationship notes too long').optional(),
  howWeMet: z.string().max(500, 'How we met description too long').optional(),
  metDate: z.string().datetime().transform(val => new Date(val)).optional(),
  communicationPreference: z.array(z.nativeEnum(ECommunicationPreference)).optional(),
  timezone: z.string().optional(),
  birthday: z.string().datetime().transform(val => new Date(val)).optional(),
  anniversary: z.string().datetime().transform(val => new Date(val)).optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  industry: z.string().max(100, 'Industry too long').optional(),
  experience: z.string().max(500, 'Experience description too long').optional(),
  expertise: z.array(z.string()).optional(),
  contactFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed']).optional(),
  nextFollowUpDate: z.string().datetime().transform(val => new Date(val)).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  isArchived: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  reminderEnabled: z.boolean().optional()
});

export const getPeopleQuerySchema = z.object({
  databaseId: z.string().optional(),
  type: z.array(z.nativeEnum(EContactType)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EContactType))
  ).optional(),
  status: z.array(z.nativeEnum(ERelationshipStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as ERelationshipStatus))
  ).optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).or(z.string().transform(val => val.split(','))).optional(),
  search: z.string().optional(),
  isFavorite: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  isArchived: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  hasUpcomingFollowUp: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  hasOverdueFollowUp: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
  birthdayMonth: z.number().min(1).max(12).or(z.string().transform(val => parseInt(val, 10))).optional(),
  lastContactBefore: z.string().datetime().transform(val => new Date(val)).optional(),
  lastContactAfter: z.string().datetime().transform(val => new Date(val)).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10))),
  sortBy: z.enum(['firstName', 'lastName', 'company', 'lastContactDate', 'createdAt', 'updatedAt']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const duplicatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  company: z.string().max(200, 'Company name too long').optional()
});

export const bulkUpdatePeopleSchema = z.object({
  personIds: z.array(z.string().min(1)).min(1, 'At least one person ID is required'),
  updates: updatePersonSchema
});

export const bulkDeletePeopleSchema = z.object({
  personIds: z.array(z.string().min(1)).min(1, 'At least one person ID is required'),
  permanent: z.boolean().default(false)
});

// Interaction schemas
export const createInteractionSchema = z.object({
  personId: z.string().min(1, 'Person ID is required'),
  type: z.nativeEnum(EInteractionType),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  date: z.string().datetime().transform(val => new Date(val)),
  duration: z.number().min(0, 'Duration must be non-negative').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  context: z.string().max(500, 'Context too long').optional(),
  outcome: z.string().max(500, 'Outcome too long').optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().datetime().transform(val => new Date(val)).optional(),
  followUpNotes: z.string().max(500, 'Follow-up notes too long').optional(),
  relatedProject: z.string().optional(),
  relatedGoal: z.string().optional(),
  relatedTask: z.string().optional(),
  otherParticipants: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

export const updateInteractionSchema = z.object({
  type: z.nativeEnum(EInteractionType).optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  date: z.string().datetime().transform(val => new Date(val)).optional(),
  duration: z.number().min(0, 'Duration must be non-negative').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  context: z.string().max(500, 'Context too long').optional(),
  outcome: z.string().max(500, 'Outcome too long').optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().transform(val => new Date(val)).optional(),
  followUpNotes: z.string().max(500, 'Follow-up notes too long').optional(),
  relatedProject: z.string().optional(),
  relatedGoal: z.string().optional(),
  relatedTask: z.string().optional(),
  otherParticipants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export const interactionIdSchema = z.object({
  interactionId: z.string().min(1, 'Interaction ID is required')
});

// Search schemas
export const searchPeopleSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  databaseId: z.string().optional(),
  type: z.array(z.nativeEnum(EContactType)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as EContactType))
  ).optional(),
  status: z.array(z.nativeEnum(ERelationshipStatus)).or(
    z.string().transform(val => val.split(',').map(s => s.trim() as ERelationshipStatus))
  ).optional(),
  page: z.number().min(1).default(1).or(z.string().transform(val => parseInt(val, 10))),
  limit: z.number().min(1).max(100).default(25).or(z.string().transform(val => parseInt(val, 10)))
});

// Statistics schemas
export const peopleStatsQuerySchema = z.object({
  databaseId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().datetime().transform(val => new Date(val)).optional(),
  endDate: z.string().datetime().transform(val => new Date(val)).optional()
});

// Export all schemas
export const peopleValidators = {
  // Person CRUD
  personIdSchema,
  createPersonSchema,
  updatePersonSchema,
  getPeopleQuerySchema,
  duplicatePersonSchema,
  bulkUpdatePeopleSchema,
  bulkDeletePeopleSchema,
  
  // Interactions
  createInteractionSchema,
  updateInteractionSchema,
  interactionIdSchema,
  
  // Search and analytics
  searchPeopleSchema,
  peopleStatsQuerySchema,
  contactTypeParamSchema,
  companyParamSchema,
  
  // Utility schemas
  contactInfoSchema
};
