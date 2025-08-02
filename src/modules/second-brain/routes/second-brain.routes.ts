import { Router } from 'express';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../../../middlewares/auth';
import { Request, Response, NextFunction } from 'express';
import * as secondBrainController from '../controllers/second-brain.controller';
import * as taskController from '../controllers/task.controller';
import * as projectController from '../controllers/project.controller';
import * as noteController from '../controllers/note.controller';
import * as personController from '../controllers/person.controller';
import * as goalController from '../controllers/goal.controller';
import * as habitController from '../controllers/habit.controller';
import * as journalController from '../controllers/journal.controller';
import * as bookController from '../controllers/book.controller';
import * as contentController from '../controllers/content.controller';
import * as financeController from '../controllers/finance.controller';
import * as moodController from '../controllers/mood.controller';

const router = Router();

// Development middleware to provide mock user when not authenticated
const developmentAuth = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development') {
        // If no user is present, provide a mock user for development
        if (!(req as AuthenticatedRequest).user) {
            (req as AuthenticatedRequest).user = {
                userId: 'dev-user-123',
                id: 'dev-user-123',
                email: 'dev@example.com',
                role: 'user' as any,
                iat: Date.now(),
                exp: Date.now() + 86400000 // 24 hours
            };
        }
    }
    next();
};

// Apply authentication to all routes
if (process.env.NODE_ENV === 'development') {
    router.use(optionalAuth);
    router.use(developmentAuth);
} else {
    router.use(authenticateToken);
}

// Main Second Brain routes
router.post('/quick-capture', secondBrainController.quickCapture);
router.get('/dashboard', secondBrainController.getDashboard);
router.get('/my-day', secondBrainController.getMyDay);
router.get('/search', secondBrainController.globalSearch);

// Task routes
router.route('/tasks')
    .get(taskController.getTasks)
    .post(taskController.createTask);

router.route('/tasks/bulk')
    .patch(taskController.bulkUpdateTasks);

router.route('/tasks/:id')
    .get(taskController.getTask)
    .patch(taskController.updateTask)
    .delete(taskController.deleteTask);

// Project routes
router.route('/projects')
    .get(projectController.getProjects)
    .post(projectController.createProject);

router.route('/projects/:id')
    .get(projectController.getProject)
    .patch(projectController.updateProject)
    .delete(projectController.deleteProject);

router.get('/projects/:id/stats', projectController.getProjectStats);
router.post('/projects/:id/tasks', projectController.addTaskToProject);
router.delete('/projects/:id/tasks/:taskId', projectController.removeTaskFromProject);

// Note routes
router.route('/notes')
    .get(noteController.getNotes)
    .post(noteController.createNote);

router.route('/notes/:id')
    .get(noteController.getNote)
    .patch(noteController.updateNote)
    .delete(noteController.deleteNote);

router.patch('/notes/:id/favorite', noteController.toggleFavorite);
router.patch('/notes/:id/pin', noteController.togglePin);
router.get('/notes/templates', noteController.getTemplates);
router.post('/notes/templates/:templateId', noteController.createFromTemplate);
router.post('/notes/:id/tasks', noteController.linkToTask);
router.delete('/notes/:id/tasks/:taskId', noteController.unlinkFromTask);

// People (CRM) routes
router.route('/people')
    .get(personController.getPeople)
    .post(personController.createPerson);

router.route('/people/:id')
    .get(personController.getPerson)
    .patch(personController.updatePerson)
    .delete(personController.deletePerson);

router.post('/people/:id/contact', personController.recordContact);
router.get('/people/needs-contact', personController.getPeopleNeedingContact);
router.get('/people/insights', personController.getContactInsights);
router.post('/people/:id/projects', personController.addToProject);
router.delete('/people/:id/projects/:projectId', personController.removeFromProject);

// Goal routes
router.route('/goals')
    .get(goalController.getGoals)
    .post(goalController.createGoal);

router.route('/goals/:id')
    .get(goalController.getGoal)
    .patch(goalController.updateGoal)
    .delete(goalController.deleteGoal);

router.patch('/goals/:id/progress', goalController.updateProgress);
router.get('/goals/insights', goalController.getGoalInsights);

// Habit routes
router.route('/habits')
    .get(habitController.getHabits)
    .post(habitController.createHabit);

router.route('/habits/:id')
    .get(habitController.getHabit)
    .patch(habitController.updateHabit)
    .delete(habitController.deleteHabit);

router.post('/habits/:id/track', habitController.trackEntry);
router.get('/habits/today', habitController.getTodayHabits);
router.get('/habits/insights', habitController.getHabitInsights);

// Journal routes
router.route('/journal')
    .get(journalController.getJournalEntries)
    .post(journalController.createJournalEntry);

router.route('/journal/:id')
    .get(journalController.getJournalEntry)
    .patch(journalController.updateJournalEntry)
    .delete(journalController.deleteJournalEntry);

router.get('/journal/today', journalController.getTodayEntry);
router.get('/journal/templates', journalController.getJournalTemplates);
router.post('/journal/templates', journalController.createFromTemplate);
router.get('/journal/insights', journalController.getJournalInsights);

// Book routes
router.route('/books')
    .get(bookController.getBooks)
    .post(bookController.createBook);

router.route('/books/:id')
    .get(bookController.getBook)
    .patch(bookController.updateBook)
    .delete(bookController.deleteBook);

router.post('/books/:id/notes', bookController.addNote);
router.patch('/books/:id/progress', bookController.updateProgress);
router.get('/books/stats', bookController.getReadingStats);
router.get('/books/reading', bookController.getCurrentlyReading);
router.get('/books/recommendations', bookController.getRecommendations);
router.get('/books/search', bookController.searchBooks);

// Content routes
router.route('/content')
    .get(contentController.getContent)
    .post(contentController.createContent);

router.route('/content/:id')
    .get(contentController.getContentItem)
    .patch(contentController.updateContent)
    .delete(contentController.deleteContent);

router.get('/content/pipeline', contentController.getPipelineOverview);
router.get('/content/analytics', contentController.getContentAnalytics);

// Finance routes
router.route('/finances')
    .get(financeController.getFinances)
    .post(financeController.createFinance);

router.route('/finances/:id')
    .get(financeController.getFinance)
    .patch(financeController.updateFinance)
    .delete(financeController.deleteFinance);

router.get('/finances/summary', financeController.getFinancialSummary);
router.get('/finances/invoices', financeController.getInvoiceDashboard);
router.post('/finances/invoices', financeController.createInvoice);
router.patch('/finances/invoices/:id/status', financeController.updateInvoiceStatus);

// Mood routes
router.route('/mood')
    .get(moodController.getMoodEntries)
    .post(moodController.createMoodEntry);

router.route('/mood/:id')
    .get(moodController.getMoodEntry)
    .patch(moodController.updateMoodEntry)
    .delete(moodController.deleteMoodEntry);

router.get('/mood/today', moodController.getTodayMood);
router.get('/mood/analytics', moodController.getMoodAnalytics);
router.get('/mood/patterns', moodController.getMoodPatterns);

export default router;
