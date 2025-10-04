import { Router } from 'express';
import { authenticateToken } from '@/middlewares/auth';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';

// People controllers
import { peopleController } from '../controllers/people.controller';

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

router.post('/', validateBody(createPersonSchema), peopleController.createPerson);

router.get('/', validateQuery(getPeopleQuerySchema), peopleController.getPeople);

router.get('/stats', validateQuery(peopleStatsQuerySchema), peopleController.getPeopleStats);

router.get('/favorites', validateQuery(getPeopleQuerySchema), peopleController.getFavorites);

router.get(
  '/follow-ups/upcoming',
  validateQuery(getPeopleQuerySchema),
  peopleController.getUpcomingFollowUps
);

router.get(
  '/follow-ups/overdue',
  validateQuery(getPeopleQuerySchema),
  peopleController.getOverdueFollowUps
);

router.get(
  '/birthdays/upcoming',
  validateQuery(getPeopleQuerySchema),
  peopleController.getUpcomingBirthdays
);

router.get('/search', validateQuery(searchPeopleSchema), peopleController.searchPeople);

router.get(
  '/type/:type',
  validateParams(contactTypeParamSchema),
  validateQuery(getPeopleQuerySchema),
  peopleController.getPeopleByType
);

router.get(
  '/company/:company',
  validateParams(companyParamSchema),
  validateQuery(getPeopleQuerySchema),
  peopleController.getPeopleByCompany
);

router.get('/:id', validateParams(personIdSchema), peopleController.getPersonById);

router.put(
  '/:id',
  validateParams(personIdSchema),
  validateBody(updatePersonSchema),
  peopleController.updatePerson
);

router.delete('/:id', validateParams(personIdSchema), peopleController.deletePerson);

// ===== PERSON ACTIONS =====

router.post('/:id/favorite', validateParams(personIdSchema), peopleController.addToFavorites);

router.delete(
  '/:id/favorite',
  validateParams(personIdSchema),
  peopleController.removeFromFavorites
);

router.post('/:id/archive', validateParams(personIdSchema), peopleController.archivePerson);

router.post('/:id/unarchive', validateParams(personIdSchema), peopleController.unarchivePerson);

router.post(
  '/:id/duplicate',
  validateParams(personIdSchema),
  validateBody(duplicatePersonSchema),
  peopleController.duplicatePerson
);

// ===== BULK OPERATIONS =====

router.post(
  '/bulk/update',
  validateBody(bulkUpdatePeopleSchema),
  peopleController.bulkUpdatePeople
);

router.post(
  '/bulk/delete',
  validateBody(bulkDeletePeopleSchema),
  peopleController.bulkDeletePeople
);

export default router;
