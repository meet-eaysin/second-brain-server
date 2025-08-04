// Entity Registration Bootstrap - Register all entities on server startup
// import { registerTasksEntity } from '../entities/tasks.entity';

/**
 * Register all entities
 * This should be called during server startup
 */
export async function registerAllEntities(): Promise<void> {
  console.log('🚀 Registering server entities...');
  
  try {
    // Old entity registration disabled - using new table system instead
    // registerTasksEntity();
    
    // TODO: Register other entities
    // registerProjectsEntity();
    // registerNotesEntity();
    // registerPeopleEntity();
    // registerFinanceEntity();
    // registerHabitsEntity();
    // registerGoalsEntity();
    // registerJournalEntity();
    // registerBooksEntity();
    // registerContentEntity();
    // registerMoodEntity();
    
    console.log('✅ All entities registered successfully (using new table system)');
  } catch (error) {
    console.error('❌ Error registering entities:', error);
    throw error;
  }
}

export default registerAllEntities;