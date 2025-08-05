import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { DatabaseProperty } from './database-property.entity';
import { DatabaseRecord } from './database-record.entity';
import { DocumentView } from './document-view.entity';
import { User } from './user.entity';

export enum DatabaseType {
    GENERAL = 'GENERAL',
    TASK_MANAGEMENT = 'TASK_MANAGEMENT',
    PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
    CRM = 'CRM',
    INVENTORY = 'INVENTORY',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
    CUSTOM = 'CUSTOM',
}

@Entity('databases')
@Index(['userId', 'type'])
@Index(['isTemplate'])
export class Database {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: DatabaseType,
        default: DatabaseType.GENERAL,
    })
    type: DatabaseType;

    @Column({ length: 50, nullable: true })
    icon?: string;

    @Column({ length: 7, nullable: true })
    color?: string; // Hex color code

    @Column({ type: 'boolean', default: false })
    isTemplate: boolean;

    @Column({ type: 'boolean', default: false })
    isSystem: boolean; // System databases have restricted editing

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // Database configuration
    @Column({ type: 'json', nullable: true })
    config: {
        // View settings
        defaultViewType?: string;
        allowedViewTypes?: string[];
        
        // Permission settings
        allowPublicViews?: boolean;
        allowViewSharing?: boolean;
        allowExport?: boolean;
        
        // Feature settings
        enableComments?: boolean;
        enableAttachments?: boolean;
        enableVersioning?: boolean;
        enableAuditLog?: boolean;
        
        // Integration settings
        integrations?: {
            taskManagement?: {
                enabled: boolean;
                statusProperty?: string;
                priorityProperty?: string;
                assigneeProperty?: string;
                dueDateProperty?: string;
            };
            calendar?: {
                enabled: boolean;
                dateProperty?: string;
                titleProperty?: string;
            };
            kanban?: {
                enabled: boolean;
                groupByProperty?: string;
                cardFields?: string[];
            };
        };
        
        // Automation settings
        automations?: Array<{
            id: string;
            name: string;
            trigger: string;
            conditions: any[];
            actions: any[];
            enabled: boolean;
        }>;
    };

    // Core properties that cannot be deleted (for system databases)
    @Column({ type: 'json', nullable: true })
    coreProperties?: string[]; // Property IDs that are protected

    // Permission settings
    @Column({ type: 'json', nullable: true })
    permissions: {
        // Global permissions
        canCreateViews?: boolean;
        canEditStructure?: boolean;
        canDeleteRecords?: boolean;
        canExportData?: boolean;
        
        // Property-level permissions
        editableProperties?: string[];
        readonlyProperties?: string[];
        hiddenProperties?: string[];
        
        // View-level permissions
        allowedViewTypes?: string[];
        maxViewsPerUser?: number;
    };

    // Relationships
    @Column('uuid')
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => DatabaseProperty, property => property.database, { cascade: true })
    properties: DatabaseProperty[];

    @OneToMany(() => DatabaseRecord, record => record.database, { cascade: true })
    records: DatabaseRecord[];

    @OneToMany(() => DocumentView, view => view.database, { cascade: true })
    views: DocumentView[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
