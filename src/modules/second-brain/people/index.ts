// People Module - Contact and relationship management
// This module provides comprehensive people and relationship management with interaction tracking

// Routes - People-specific operations
export { default as peopleRoutes } from './routes/people.routes';

// Controllers - People business logic
export {
  // Person CRUD operations
  createPerson,
  getPeople,
  getPersonById,
  updatePerson,
  deletePerson,
  
  // People analytics
  getFavorites,
  getPeopleByType,
  getPeopleByCompany,
  getUpcomingFollowUps,
  getOverdueFollowUps,
  getUpcomingBirthdays,
  searchPeople,
  addToFavorites,
  removeFromFavorites,
  archivePerson,
  unarchivePerson,
  duplicatePerson,
  bulkUpdatePeople,
  bulkDeletePeople,
  
  // Statistics
  getPeopleStats
} from './controllers/people.controller';

// Services - People-specific services
export {
  PeopleService,
  peopleService
} from './services/people.service';

// Types
export type * from './types/people.types';

// Types - Specific exports for better IDE support
export type {
  IPerson,
  IInteraction,
  IPeopleStats,
  IContactInfo,
  ICreatePersonRequest,
  IUpdatePersonRequest,
  IPeopleQueryParams,
  ICreateInteractionRequest,
  IUpdateInteractionRequest,
  EContactType,
  ERelationshipStatus,
  ECommunicationPreference,
  EInteractionType
} from './types/people.types';

// Validators
export {
  peopleValidators,
  personIdSchema,
  createPersonSchema,
  updatePersonSchema,
  getPeopleQuerySchema,
  duplicatePersonSchema,
  bulkUpdatePeopleSchema,
  bulkDeletePeopleSchema,
  createInteractionSchema,
  updateInteractionSchema,
  interactionIdSchema,
  searchPeopleSchema,
  peopleStatsQuerySchema,
  contactTypeParamSchema,
  companyParamSchema,
  contactInfoSchema
} from './validators/people.validators';
