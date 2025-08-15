/**
 * Relationship Manager Service
 * 
 * Manages bidirectional relationships between Second Brain models
 * and ensures consistency when creating, updating, or deleting records.
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
import { Finance } from '../../finance/models/finance.model';

export interface RelationshipOperation {
    action: 'add' | 'remove';
    sourceModel: string;
    sourceId: string;
    targetModel: string;
    targetId: string;
    relationshipField: string;
    reverseField?: string;
}

/**
 * Manage bidirectional relationships between models
 */
export class RelationshipManager {
    
    /**
     * Add a bidirectional relationship
     */
    static async addRelationship(
        sourceModel: string,
        sourceId: string,
        targetModel: string,
        targetId: string,
        relationshipField: string,
        reverseField?: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Add forward relationship
            await this.updateRelationship(
                sourceModel,
                sourceId,
                relationshipField,
                targetId,
                'add',
                session
            );
            
            // Add reverse relationship if specified
            if (reverseField) {
                await this.updateRelationship(
                    targetModel,
                    targetId,
                    reverseField,
                    sourceId,
                    'add',
                    session
                );
            }
            
            await session.commitTransaction();
            console.log(`✅ Added relationship: ${sourceModel}(${sourceId}) → ${targetModel}(${targetId})`);
            
        } catch (error) {
            await session.abortTransaction();
            console.error(`❌ Failed to add relationship:`, error);
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Remove a bidirectional relationship
     */
    static async removeRelationship(
        sourceModel: string,
        sourceId: string,
        targetModel: string,
        targetId: string,
        relationshipField: string,
        reverseField?: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Remove forward relationship
            await this.updateRelationship(
                sourceModel,
                sourceId,
                relationshipField,
                targetId,
                'remove',
                session
            );
            
            // Remove reverse relationship if specified
            if (reverseField) {
                await this.updateRelationship(
                    targetModel,
                    targetId,
                    reverseField,
                    sourceId,
                    'remove',
                    session
                );
            }
            
            await session.commitTransaction();
            console.log(`✅ Removed relationship: ${sourceModel}(${sourceId}) ↛ ${targetModel}(${targetId})`);
            
        } catch (error) {
            await session.abortTransaction();
            console.error(`❌ Failed to remove relationship:`, error);
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Update a single relationship field
     */
    private static async updateRelationship(
        modelName: string,
        documentId: string,
        field: string,
        relatedId: string,
        action: 'add' | 'remove',
        session?: mongoose.ClientSession
    ): Promise<void> {
        const Model = this.getModelByName(modelName);
        if (!Model) {
            throw new Error(`Model ${modelName} not found`);
        }
        
        const updateOperation = action === 'add'
            ? { $addToSet: { [field]: relatedId } }
            : { $pull: { [field]: relatedId } };
            
        await Model.updateOne(
            { _id: documentId },
            updateOperation,
            { session }
        );
    }
    
    /**
     * Link a task to a project (bidirectional)
     */
    static async linkTaskToProject(taskId: string, projectId: string): Promise<void> {
        await this.addRelationship(
            'Task',
            taskId,
            'Project',
            projectId,
            'project', // Task.project field
            'tasks'   // Project.tasks array
        );
    }
    
    /**
     * Unlink a task from a project (bidirectional)
     */
    static async unlinkTaskFromProject(taskId: string, projectId: string): Promise<void> {
        await this.removeRelationship(
            'Task',
            taskId,
            'Project',
            projectId,
            'project',
            'tasks'
        );
    }
    
    /**
     * Link a project to a goal (bidirectional)
     */
    static async linkProjectToGoal(projectId: string, goalId: string): Promise<void> {
        await this.addRelationship(
            'Project',
            projectId,
            'Goal',
            goalId,
            'goal',     // Project.goal field
            'projects'  // Goal.projects array
        );
    }
    
    /**
     * Link a book to a project (bidirectional)
     */
    static async linkBookToProject(bookId: string, projectId: string): Promise<void> {
        await this.addRelationship(
            'Book',
            bookId,
            'Project',
            projectId,
            'linkedProjects', // Book.linkedProjects array
            'linkedBooks'     // Project.linkedBooks array
        );
    }
    
    /**
     * Link a person to a task (assignment)
     */
    static async assignTaskToPerson(taskId: string, personId: string): Promise<void> {
        await this.addRelationship(
            'Task',
            taskId,
            'Person',
            personId,
            'assignedTo', // Task.assignedTo field
            'tasks'       // Person.tasks array
        );
    }
    
    /**
     * Link a habit to a goal
     */
    static async linkHabitToGoal(habitId: string, goalId: string): Promise<void> {
        await this.addRelationship(
            'Habit',
            habitId,
            'Goal',
            goalId,
            'goal',   // Habit.goal field
            'habits'  // Goal.habits array
        );
    }
    
    /**
     * Get all relationships for a specific record
     */
    static async getRelationships(modelName: string, documentId: string): Promise<any> {
        const Model = this.getModelByName(modelName);
        if (!Model) {
            throw new Error(`Model ${modelName} not found`);
        }
        
        const document = await Model.findById(documentId)
            .populate('project')
            .populate('goal')
            .populate('tasks')
            .populate('people')
            .populate('assignedTo')
            .populate('linkedProjects')
            .populate('linkedGoals')
            .populate('linkedBooks')
            .populate('linkedFinances')
            .populate('linkedContent')
            .populate('linkedJournals')
            .populate('linkedHabits')
            .lean();
            
        return document;
    }
    
    /**
     * Validate that a relationship is allowed
     */
    static async validateRelationship(
        sourceModel: string,
        sourceId: string,
        targetModel: string,
        targetId: string
    ): Promise<{ valid: boolean; reason?: string }> {
        // Check if both documents exist
        const sourceExists = await this.documentExists(sourceModel, sourceId);
        const targetExists = await this.documentExists(targetModel, targetId);
        
        if (!sourceExists) {
            return { valid: false, reason: `Source ${sourceModel} not found` };
        }
        
        if (!targetExists) {
            return { valid: false, reason: `Target ${targetModel} not found` };
        }
        
        // Check for circular references (e.g., goal cannot be its own parent)
        if (sourceModel === targetModel && sourceId === targetId) {
            return { valid: false, reason: 'Cannot create self-reference' };
        }
        
        // Additional validation rules can be added here
        
        return { valid: true };
    }
    
    /**
     * Check if a document exists
     */
    private static async documentExists(modelName: string, documentId: string): Promise<boolean> {
        const Model = this.getModelByName(modelName);
        if (!Model) return false;
        
        return !!(await Model.exists({ _id: documentId }));
    }
    
    /**
     * Get model by name
     */
    private static getModelByName(modelName: string) {
        const models: Record<string, typeof Task | typeof Project | typeof Goal | typeof Person | typeof Note | typeof Book | typeof Habit | typeof Journal | typeof Finance> = {
            Task, Project, Goal, Person, Note, Book, Habit, Journal, Finance
        };
        return models[modelName];
    }
    
    /**
     * Sync all relationships for a user (repair inconsistencies)
     */
    static async syncUserRelationships(userId: string): Promise<{
        synced: number;
        errors: string[];
    }> {
        let synced = 0;
        const errors: string[] = [];
        
        console.log(`🔄 Syncing relationships for user: ${userId}`);
        
        try {
            // Sync Task → Project relationships
            const tasks = await Task.find({ createdBy: userId, project: { $exists: true } });
            for (const task of tasks) {
                if (task.project) {
                    await Project.updateOne(
                        { _id: task.project },
                        { $addToSet: { tasks: task._id } }
                    );
                    synced++;
                }
            }
            
            // Sync Project → Goal relationships
            const projects = await Project.find({ createdBy: userId, goal: { $exists: true } });
            for (const project of projects) {
                if (project.goal) {
                    await Goal.updateOne(
                        { _id: project.goal },
                        { $addToSet: { projects: project._id } }
                    );
                    synced++;
                }
            }
            
            // Add more sync operations as needed...
            
        } catch (error: any) {
            errors.push(error.message);
        }
        
        console.log(`✅ Synced ${synced} relationships for user: ${userId}`);
        return { synced, errors };
    }
}
