import { registerModuleConfig } from '../config/module-config-registry';
import { tasksModuleConfig } from './tasks.config';
import { peopleModuleConfig } from './people.config';
import { notesModuleConfig } from './notes.config';
import { goalsModuleConfig } from './goals.config';
import { booksModuleConfig } from './books.config';
import { habitsModuleConfig } from './habits.config';
import { projectsModuleConfig } from './projects.config';
import { journalsModuleConfig } from './journals.config';
import { moodsModuleConfig } from './moods.config';
import { contentModuleConfig } from './content.config';
import { financeModuleConfig } from './finance.config';
import { databasesModuleConfig } from './databases.config';

/**
 * Module Configuration Registry
 * Registers all module configurations with the centralized document-view system
 */

/**
 * Initialize all module configurations
 * This should be called during application startup
 */
export function initializeModuleConfigurations(): void {
    // Register Tasks module
    registerModuleConfig(tasksModuleConfig);
    
    // Register People module
    registerModuleConfig(peopleModuleConfig);

    // Register Notes module
    registerModuleConfig(notesModuleConfig);

    // Register Goals module
    registerModuleConfig(goalsModuleConfig);

    // Register Books module
    registerModuleConfig(booksModuleConfig);

    // Register Habits module
    registerModuleConfig(habitsModuleConfig);

    // Register Projects module
    registerModuleConfig(projectsModuleConfig);

    // Register Journals module
    registerModuleConfig(journalsModuleConfig);

    // Register Moods module
    registerModuleConfig(moodsModuleConfig);

    // Register Content module
    registerModuleConfig(contentModuleConfig);

    // Register Finance module
    registerModuleConfig(financeModuleConfig);

    // Register Databases module
    registerModuleConfig(databasesModuleConfig);
    
    console.log('✅ Document-view module configurations initialized');
}

// Export configurations for direct access if needed
export {
    tasksModuleConfig,
    peopleModuleConfig,
    notesModuleConfig,
    goalsModuleConfig,
    booksModuleConfig,
    habitsModuleConfig,
    projectsModuleConfig,
    journalsModuleConfig,
    moodsModuleConfig,
    contentModuleConfig,
    financeModuleConfig,
    databasesModuleConfig
};
