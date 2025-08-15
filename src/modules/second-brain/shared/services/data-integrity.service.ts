/**
 * Data Integrity Service
 * 
 * Provides utilities for maintaining referential integrity across
 * all Second Brain models and cleaning up orphaned records.
 */

import mongoose from 'mongoose';
import { Task } from '../../task/models/task.model';
import { Project } from '../../project/models/project.model';
import { Goal } from '../../goal/models/goal.model';
import { Person } from '../../person/models/person.model';
import { Note } from '../../note/models/note.model';
import { Book } from '../../books/models/book.model';
import { Habit } from '../../habits/models/habit.model';
import { Journal } from '../../journal/models/journal.model';
import { Mood } from '../../mood/models/mood.model';
import { Content } from '../../content/models/content.model';
import { Finance } from '../../finance/models/finance.model';

export interface IntegrityCheckResult {
    model: string;
    field: string;
    orphanedCount: number;
    orphanedIds: string[];
}

export interface IntegrityReport {
    totalChecks: number;
    issuesFound: number;
    results: IntegrityCheckResult[];
    summary: {
        orphanedReferences: number;
        modelsAffected: string[];
    };
}

/**
 * Check for orphaned references across all models
 */
export const checkDataIntegrity = async (userId?: string): Promise<IntegrityReport> => {
    const results: IntegrityCheckResult[] = [];
    
    console.log('🔍 Starting data integrity check...');
    
    // Define all reference checks to perform
    const referenceChecks = [
        // Task references
        { model: Task, field: 'project', targetModel: Project, name: 'Task.project' },
        { model: Task, field: 'assignedTo', targetModel: Person, name: 'Task.assignedTo' },
        { model: Task, field: 'parentTask', targetModel: Task, name: 'Task.parentTask' },
        
        // Project references
        { model: Project, field: 'goal', targetModel: Goal, name: 'Project.goal' },
        
        // Goal references
        { model: Goal, field: 'parentGoal', targetModel: Goal, name: 'Goal.parentGoal' },
        
        // Note references
        { model: Note, field: 'project', targetModel: Project, name: 'Note.project' },
        
        // Book references
        { model: Book, field: 'linkedProjects', targetModel: Project, name: 'Book.linkedProjects', isArray: true },
        { model: Book, field: 'linkedGoals', targetModel: Goal, name: 'Book.linkedGoals', isArray: true },
        
        // Habit references
        { model: Habit, field: 'goal', targetModel: Goal, name: 'Habit.goal' },
        
        // Journal references
        { model: Journal, field: 'linkedTasks', targetModel: Task, name: 'Journal.linkedTasks', isArray: true },
        { model: Journal, field: 'linkedProjects', targetModel: Project, name: 'Journal.linkedProjects', isArray: true },
        
        // Finance references
        { model: Finance, field: 'linkedProject', targetModel: Project, name: 'Finance.linkedProject' },
        { model: Finance, field: 'linkedGoal', targetModel: Goal, name: 'Finance.linkedGoal' },
        { model: Finance, field: 'invoice.client', targetModel: Person, name: 'Finance.invoice.client' },
    ];
    
    // Perform each reference check
    for (const check of referenceChecks) {
        try {
            const result = await checkReference(check, userId);
            if (result.orphanedCount > 0) {
                results.push(result);
            }
        } catch (error) {
            console.error(`❌ Error checking ${check.name}:`, error);
        }
    }
    
    const report: IntegrityReport = {
        totalChecks: referenceChecks.length,
        issuesFound: results.length,
        results,
        summary: {
            orphanedReferences: results.reduce((sum, r) => sum + r.orphanedCount, 0),
            modelsAffected: [...new Set(results.map(r => r.model))]
        }
    };
    
    console.log(`✅ Data integrity check complete. Found ${report.issuesFound} issues.`);
    return report;
};

/**
 * Check a specific reference field for orphaned records
 */
const checkReference = async (
    check: any,
    userId?: string
): Promise<IntegrityCheckResult> => {
    const { model, field, targetModel, name, isArray = false } = check;
    
    // Build query
    const query: any = {};
    if (userId) {
        query.createdBy = userId;
    }
    
    // Find records with the reference field
    if (isArray) {
        query[field] = { $exists: true, $ne: [] };
    } else {
        query[field] = { $exists: true, $ne: null };
    }
    
    const records = await model.find(query).lean();
    const orphanedIds: string[] = [];
    
    for (const record of records) {
        const referenceValue = field.includes('.') 
            ? getNestedValue(record, field)
            : record[field];
            
        if (!referenceValue) continue;
        
        if (isArray && Array.isArray(referenceValue)) {
            // Check each ID in the array
            for (const refId of referenceValue) {
                if (refId && !(await targetModel.exists({ _id: refId }))) {
                    orphanedIds.push(`${record._id}:${refId}`);
                }
            }
        } else if (referenceValue) {
            // Check single reference
            if (!(await targetModel.exists({ _id: referenceValue }))) {
                orphanedIds.push(record._id.toString());
            }
        }
    }
    
    return {
        model: model.modelName,
        field,
        orphanedCount: orphanedIds.length,
        orphanedIds
    };
};

/**
 * Clean up orphaned references
 */
export const cleanupOrphanedReferences = async (
    report: IntegrityReport,
    dryRun: boolean = true
): Promise<{ cleaned: number; errors: string[] }> => {
    let cleaned = 0;
    const errors: string[] = [];
    
    console.log(`🧹 ${dryRun ? 'Simulating' : 'Performing'} cleanup of orphaned references...`);
    
    for (const result of report.results) {
        try {
            const Model = getModelByName(result.model);
            if (!Model) {
                errors.push(`Model ${result.model} not found`);
                continue;
            }
            
            for (const orphanedId of result.orphanedIds) {
                if (!dryRun) {
                    if (result.field.includes('.')) {
                        // Handle nested fields (like invoice.client)
                        await Model.updateOne(
                            { _id: orphanedId },
                            { $unset: { [result.field]: 1 } }
                        );
                    } else if (orphanedId.includes(':')) {
                        // Handle array references
                        const [recordId, refId] = orphanedId.split(':');
                        await Model.updateOne(
                            { _id: recordId },
                            { $pull: { [result.field]: refId } }
                        );
                    } else {
                        // Handle single references
                        await Model.updateOne(
                            { _id: orphanedId },
                            { $unset: { [result.field]: 1 } }
                        );
                    }
                }
                cleaned++;
            }
            
            console.log(`${dryRun ? '🔍' : '✅'} ${result.model}.${result.field}: ${result.orphanedCount} references`);
            
        } catch (error: any) {
            errors.push(`Error cleaning ${result.model}.${result.field}: ${error.message}`);
        }
    }
    
    console.log(`${dryRun ? '🔍' : '✅'} Cleanup complete. ${cleaned} references ${dryRun ? 'would be' : 'were'} cleaned.`);
    
    return { cleaned, errors };
};

/**
 * Validate that a reference exists before saving
 */
export const validateReference = async (
    modelName: string,
    referenceId: string
): Promise<boolean> => {
    const Model = getModelByName(modelName);
    if (!Model) return false;
    
    return !!(await Model.exists({ _id: referenceId }));
};

/**
 * Get model by name
 */
const getModelByName = (modelName: string) => {
    const models: Record<string, typeof Task | typeof Project | typeof Goal | typeof Person | typeof Note | typeof Book | typeof Habit | typeof Journal | typeof Mood | typeof Content | typeof Finance> = {
        Task, Project, Goal, Person, Note, Book, Habit, Journal, Mood, Content, Finance
    };
    return models[modelName];
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((current, key) => current?.[key as keyof typeof current], obj);
};

/**
 * Run a complete integrity check and cleanup
 */
export const runIntegrityMaintenance = async (
    userId?: string,
    autoCleanup: boolean = false
): Promise<{ report: IntegrityReport; cleanup?: { cleaned: number; errors: string[] } }> => {
    const report = await checkDataIntegrity(userId);
    
    let cleanup;
    if (autoCleanup && report.issuesFound > 0) {
        cleanup = await cleanupOrphanedReferences(report, false);
    }
    
    return { report, cleanup };
};
