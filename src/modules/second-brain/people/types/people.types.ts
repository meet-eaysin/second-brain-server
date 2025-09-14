import { z } from 'zod';

// Contact type enum
export enum EContactType {
  PERSONAL = 'personal',
  PROFESSIONAL = 'professional',
  FAMILY = 'family',
  FRIEND = 'friend',
  COLLEAGUE = 'colleague',
  CLIENT = 'client',
  VENDOR = 'vendor',
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  OTHER = 'other'
}

// Relationship status enum
export enum ERelationshipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked'
}

// Communication preference enum
export enum ECommunicationPreference {
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  SOCIAL_MEDIA = 'social_media',
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  MESSAGING_APP = 'messaging_app'
}

// Interaction type enum
export enum EInteractionType {
  MEETING = 'meeting',
  CALL = 'call',
  EMAIL = 'email',
  TEXT = 'text',
  SOCIAL = 'social',
  EVENT = 'event',
  PROJECT = 'project',
  FAVOR = 'favor',
  INTRODUCTION = 'introduction',
  OTHER = 'other'
}

// Contact information interface
export interface IContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
    website?: string;
  };
}

// Person interface
export interface IPerson {
  id: string;
  databaseId: string;

  // Basic information
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  title?: string;
  company?: string;
  department?: string;
  position?: string;

  // Contact information
  contactInfo: IContactInfo;

  // Relationship details
  type: EContactType;
  status: ERelationshipStatus;
  relationshipNotes?: string;
  howWeMet?: string;
  metDate?: Date;

  // Preferences and details
  communicationPreference: ECommunicationPreference[];
  timezone?: string;
  birthday?: Date;
  anniversary?: Date;

  // Personal details
  interests: string[];
  skills: string[];
  goals?: string[];
  challenges?: string[];
  personalNotes?: string;

  // Professional details
  industry?: string;
  experience?: string;
  expertise: string[];

  // Interaction tracking
  lastContactDate?: Date;
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
  nextFollowUpDate?: Date;

  // Relationships
  connectedPeople: string[]; // IDs of related people
  mutualConnections: string[];
  introducedBy?: string;

  // Projects and collaborations
  sharedProjects: string[];
  sharedGoals: string[];

  // Tags and categorization
  tags: string[];
  customFields: Record<string, any>;

  // Settings
  isArchived: boolean;
  isFavorite: boolean;
  reminderEnabled: boolean;

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Interaction interface
export interface IInteraction {
  id: string;
  personId: string;
  type: EInteractionType;
  title: string;
  description?: string;
  date: Date;
  duration?: number; // in minutes
  location?: string;

  // Context
  context?: string;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;

  // Relations
  relatedProject?: string;
  relatedGoal?: string;
  relatedTask?: string;

  // Participants
  otherParticipants: string[]; // IDs of other people involved

  // Attachments and references
  attachments: string[];
  references: string[];

  // Tags
  tags: string[];

  // Base properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// People statistics interface
export interface IPeopleStats {
  total: number;
  byType: Record<EContactType, number>;
  byStatus: Record<ERelationshipStatus, number>;

  // Interaction stats
  totalInteractions: number;
  interactionsThisMonth: number;
  averageInteractionsPerPerson: number;

  // Relationship health
  activeRelationships: number;
  staleRelationships: number; // No contact in 6+ months
  upcomingFollowUps: number;
  overdueFollowUps: number;

  // Top categories
  topIndustries: Array<{
    industry: string;
    count: number;
  }>;

  topCompanies: Array<{
    company: string;
    count: number;
  }>;

  // Recent activity
  recentInteractions: Array<{
    personId: string;
    personName: string;
    interactionType: EInteractionType;
    date: Date;
  }>;

  upcomingBirthdays: Array<{
    personId: string;
    personName: string;
    birthday: Date;
    daysUntil: number;
  }>;
}

// Request/Response interfaces
export interface ICreatePersonRequest {
  databaseId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  title?: string;
  company?: string;
  department?: string;
  position?: string;
  contactInfo?: IContactInfo;
  type: EContactType;
  relationshipNotes?: string;
  howWeMet?: string;
  metDate?: Date;
  communicationPreference?: ECommunicationPreference[];
  timezone?: string;
  birthday?: Date;
  anniversary?: Date;
  interests?: string[];
  skills?: string[];
  goals?: string[];
  challenges?: string[];
  personalNotes?: string;
  industry?: string;
  experience?: string;
  expertise?: string[];
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
  nextFollowUpDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  isFavorite?: boolean;
  reminderEnabled?: boolean;
}

export interface IUpdatePersonRequest {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  title?: string;
  company?: string;
  department?: string;
  position?: string;
  contactInfo?: IContactInfo;
  type?: EContactType;
  status?: ERelationshipStatus;
  relationshipNotes?: string;
  howWeMet?: string;
  metDate?: Date;
  communicationPreference?: ECommunicationPreference[];
  timezone?: string;
  birthday?: Date;
  anniversary?: Date;
  interests?: string[];
  skills?: string[];
  goals?: string[];
  challenges?: string[];
  personalNotes?: string;
  industry?: string;
  experience?: string;
  expertise?: string[];
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
  nextFollowUpDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  isArchived?: boolean;
  isFavorite?: boolean;
  reminderEnabled?: boolean;
}

export interface IPeopleQueryParams {
  databaseId?: string;
  type?: EContactType[];
  status?: ERelationshipStatus[];
  company?: string;
  industry?: string;
  tags?: string[];
  search?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  hasUpcomingFollowUp?: boolean;
  hasOverdueFollowUp?: boolean;
  birthdayMonth?: number;
  lastContactBefore?: Date;
  lastContactAfter?: Date;
  sortBy?: 'firstName' | 'lastName' | 'company' | 'lastContactDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ICreateInteractionRequest {
  personId: string;
  type: EInteractionType;
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  location?: string;
  context?: string;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  relatedProject?: string;
  relatedGoal?: string;
  relatedTask?: string;
  otherParticipants?: string[];
  tags?: string[];
}

export interface IUpdateInteractionRequest {
  type?: EInteractionType;
  title?: string;
  description?: string;
  date?: Date;
  duration?: number;
  location?: string;
  context?: string;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  relatedProject?: string;
  relatedGoal?: string;
  relatedTask?: string;
  otherParticipants?: string[];
  tags?: string[];
}

// Zod schemas for validation
export const PersonSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  fullName: z.string(),
  nickname: z.string().max(50).optional(),
  title: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        zipCode: z.string().optional()
      })
      .optional(),
    socialMedia: z
      .object({
        linkedin: z.string().url().optional(),
        twitter: z.string().optional(),
        facebook: z.string().url().optional(),
        instagram: z.string().optional(),
        github: z.string().optional(),
        website: z.string().url().optional()
      })
      .optional()
  }),
  type: z.enum(EContactType),
  status: z.enum(ERelationshipStatus),
  relationshipNotes: z.string().max(1000).optional(),
  howWeMet: z.string().max(500).optional(),
  metDate: z.date().optional(),
  communicationPreference: z.array(z.enum(ECommunicationPreference)),
  timezone: z.string().optional(),
  birthday: z.date().optional(),
  anniversary: z.date().optional(),
  interests: z.array(z.string()),
  skills: z.array(z.string()),
  goals: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  personalNotes: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  experience: z.string().max(500).optional(),
  expertise: z.array(z.string()),
  lastContactDate: z.date().optional(),
  contactFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed'])
    .optional(),
  nextFollowUpDate: z.date().optional(),
  connectedPeople: z.array(z.string()),
  mutualConnections: z.array(z.string()),
  introducedBy: z.string().optional(),
  sharedProjects: z.array(z.string()),
  sharedGoals: z.array(z.string()),
  tags: z.array(z.string()),
  customFields: z.record(z.string(), z.any()),
  isArchived: z.boolean(),
  isFavorite: z.boolean(),
  reminderEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string()
});

export const CreatePersonRequestSchema = z.object({
  databaseId: z.string().min(1, 'Database ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  nickname: z.string().max(50, 'Nickname too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  company: z.string().max(200, 'Company name too long').optional(),
  department: z.string().max(100, 'Department too long').optional(),
  position: z.string().max(100, 'Position too long').optional(),
  contactInfo: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      phone: z.string().max(20, 'Phone number too long').optional(),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          zipCode: z.string().optional()
        })
        .optional(),
      socialMedia: z
        .object({
          linkedin: z.string().url('Invalid LinkedIn URL').optional(),
          twitter: z.string().optional(),
          facebook: z.string().url('Invalid Facebook URL').optional(),
          instagram: z.string().optional(),
          github: z.string().optional(),
          website: z.string().url('Invalid website URL').optional()
        })
        .optional()
    })
    .default({}),
  type: z.enum(EContactType),
  relationshipNotes: z.string().max(1000, 'Relationship notes too long').optional(),
  howWeMet: z.string().max(500, 'How we met description too long').optional(),
  metDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  communicationPreference: z.array(z.enum(ECommunicationPreference)).default([]),
  timezone: z.string().optional(),
  birthday: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  anniversary: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  interests: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  personalNotes: z.string().max(2000, 'Personal notes too long').optional(),
  industry: z.string().max(100, 'Industry too long').optional(),
  experience: z.string().max(500, 'Experience description too long').optional(),
  expertise: z.array(z.string()).default([]),
  contactFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed'])
    .optional(),
  nextFollowUpDate: z
    .string()
    .datetime()
    .transform(val => new Date(val))
    .optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).default({}),
  isFavorite: z.boolean().default(false),
  reminderEnabled: z.boolean().default(true)
});

export const UpdatePersonRequestSchema = CreatePersonRequestSchema.omit({
  databaseId: true
}).partial();
