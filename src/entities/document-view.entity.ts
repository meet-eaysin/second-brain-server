import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Database } from './database.entity';
import { ViewProperty } from './view-property.entity';
import { ViewFilter } from './view-filter.entity';
import { ViewSort } from './view-sort.entity';

export enum ViewType {
    TABLE = 'TABLE',
    KANBAN = 'KANBAN',
    CALENDAR = 'CALENDAR',
    GALLERY = 'GALLERY',
    TIMELINE = 'TIMELINE',
}

@Entity('document_views')
@Index(['userId', 'databaseId'])
@Index(['databaseId', 'isDefault'])
export class DocumentView {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({
        type: 'enum',
        enum: ViewType,
        default: ViewType.TABLE,
    })
    type: ViewType;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    isDefault: boolean;

    @Column({ type: 'boolean', default: false })
    isPublic: boolean;

    @Column({ type: 'boolean', default: false })
    isSystem: boolean; // System views can't be deleted

    // View Configuration
    @Column({ type: 'json', nullable: true })
    config: {
        // Table specific
        rowHeight?: 'compact' | 'medium' | 'tall';
        showRowNumbers?: boolean;
        enableGrouping?: boolean;
        groupBy?: string[];
        
        // Kanban specific
        kanbanGroupBy?: string;
        kanbanCardFields?: string[];
        kanbanShowEmptyColumns?: boolean;
        
        // Calendar specific
        calendarDateField?: string;
        calendarTitleField?: string;
        calendarColorField?: string;
        
        // Gallery specific
        galleryImageField?: string;
        galleryTitleField?: string;
        galleryColumns?: number;
        
        // Timeline specific
        timelineStartField?: string;
        timelineEndField?: string;
        timelineTitleField?: string;
        
        // General
        pageSize?: number;
        showFilters?: boolean;
        showSearch?: boolean;
        showToolbar?: boolean;
        frozenColumns?: number;
    };

    // Relationships
    @Column('uuid')
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('uuid')
    databaseId: string;

    @ManyToOne(() => Database, database => database.views, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'databaseId' })
    database: Database;

    @OneToMany(() => ViewProperty, property => property.view, { cascade: true })
    properties: ViewProperty[];

    @OneToMany(() => ViewFilter, filter => filter.view, { cascade: true })
    filters: ViewFilter[];

    @OneToMany(() => ViewSort, sort => sort.view, { cascade: true })
    sorts: ViewSort[];

    // Permissions
    @Column({ type: 'json', nullable: true })
    permissions: {
        canEdit?: boolean;
        canDelete?: boolean;
        canShare?: boolean;
        canExport?: boolean;
        editableProperties?: string[]; // Specific properties user can edit
        readonlyProperties?: string[]; // Properties user cannot edit
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
