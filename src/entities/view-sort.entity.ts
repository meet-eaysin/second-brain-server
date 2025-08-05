import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { DocumentView } from './document-view.entity';
import { DatabaseProperty } from './database-property.entity';

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

@Entity('view_sorts')
@Index(['viewId', 'order'])
export class ViewSort {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    order: number; // Sort priority (0 = primary sort)

    @Column({
        type: 'enum',
        enum: SortDirection,
        default: SortDirection.ASC,
    })
    direction: SortDirection;

    @Column({ type: 'boolean', default: true })
    enabled: boolean;

    // Advanced sort options
    @Column({ type: 'json', nullable: true })
    config: {
        // Text sorting
        caseSensitive?: boolean;
        locale?: string; // For locale-specific sorting
        
        // Number sorting
        treatAsNumber?: boolean; // For text fields that contain numbers
        
        // Date sorting
        dateFormat?: string; // For custom date formats
        
        // Custom sorting
        customComparator?: string; // Custom sort function
        
        // Null handling
        nullsFirst?: boolean;
        emptyStringHandling?: 'first' | 'last' | 'as_null';
    };

    // Relationships
    @Column('uuid')
    viewId: string;

    @ManyToOne(() => DocumentView, view => view.sorts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'viewId' })
    view: DocumentView;

    @Column('uuid')
    propertyId: string;

    @ManyToOne(() => DatabaseProperty, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' })
    property: DatabaseProperty;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
