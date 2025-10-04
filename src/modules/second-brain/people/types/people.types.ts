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
