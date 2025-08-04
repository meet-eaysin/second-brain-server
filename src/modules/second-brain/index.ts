// Second Brain Module Index - Register table configurations
import { registerTasksTableConfig } from './config/tasks-table.config';
import { registerProjectsTableConfig } from './config/projects-table.config';
import { registerNotesTableConfig } from './config/notes-table.config';
import { registerPeopleTableConfig } from './config/people-table.config';

// Register all table configurations for this module
export function registerSecondBrainTables(): void {
  console.log('🧠 Registering Second Brain table configurations...');
  
  // Register completed tables
  registerTasksTableConfig();
  registerProjectsTableConfig();
  registerNotesTableConfig();
  registerPeopleTableConfig();
  
  // TODO: Register remaining tables
  // registerGoalsTableConfig();
  // registerHabitsTableConfig();
  // registerJournalTableConfig();
  // registerBooksTableConfig();
  // registerContentTableConfig();
  // registerFinanceTableConfig();
  // registerMoodTableConfig();
  
  console.log('✅ Second Brain table configurations registered');
}

// Auto-register when module is imported
registerSecondBrainTables();

export default {
  registerSecondBrainTables
};