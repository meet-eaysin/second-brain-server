import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// People controllers
import {
  // Person CRUD
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
} from '../controllers/people.controller';

// Validators
import {
  personIdSchema,
  createPersonSchema,
  updatePersonSchema,
  getPeopleQuerySchema,
  duplicatePersonSchema,
  bulkUpdatePeopleSchema,
  bulkDeletePeopleSchema,
  searchPeopleSchema,
  peopleStatsQuerySchema,
  contactTypeParamSchema,
  companyParamSchema
} from '../validators/people.validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== PEOPLE CRUD OPERATIONS =====

router.post(
  '/',
  validateBody(createPersonSchema),
  createPerson
);

router.get(
  '/',
  validateQuery(getPeopleQuerySchema),
  getPeople
);

router.get(
  '/stats',
  validateQuery(peopleStatsQuerySchema),
  getPeopleStats
);

router.get(
  '/favorites',
  validateQuery(getPeopleQuerySchema),
  getFavorites
);

router.get(
  '/follow-ups/upcoming',
  validateQuery(getPeopleQuerySchema),
  getUpcomingFollowUps
);

router.get(
  '/follow-ups/overdue',
  validateQuery(getPeopleQuerySchema),
  getOverdueFollowUps
);

router.get(
  '/birthdays/upcoming',
  validateQuery(getPeopleQuerySchema),
  getUpcomingBirthdays
);

router.get(
  '/search',
  validateQuery(searchPeopleSchema),
  searchPeople
);

router.get(
  '/type/:type',
  validateParams(contactTypeParamSchema),
  validateQuery(getPeopleQuerySchema),
  getPeopleByType
);

router.get(
  '/company/:company',
  validateParams(companyParamSchema),
  validateQuery(getPeopleQuerySchema),
  getPeopleByCompany
);

router.get(
  '/:id',
  validateParams(personIdSchema),
  getPersonById
);

router.put(
  '/:id',
  validateParams(personIdSchema),
  validateBody(updatePersonSchema),
  updatePerson
);

router.delete(
  '/:id',
  validateParams(personIdSchema),
  deletePerson
);

// ===== PERSON ACTIONS =====

router.post(
  '/:id/favorite',
  validateParams(personIdSchema),
  addToFavorites
);

router.delete(
  '/:id/favorite',
  validateParams(personIdSchema),
  removeFromFavorites
);

router.post(
  '/:id/archive',
  validateParams(personIdSchema),
  archivePerson
);

router.post(
  '/:id/unarchive',
  validateParams(personIdSchema),
  unarchivePerson
);

router.post(
  '/:id/duplicate',
  validateParams(personIdSchema),
  validateBody(duplicatePersonSchema),
  duplicatePerson
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdatePeopleSchema),
  bulkUpdatePeople
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeletePeopleSchema),
  bulkDeletePeople
);

export default router;
