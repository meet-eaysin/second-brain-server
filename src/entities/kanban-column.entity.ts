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
import { DocumentView } from './document-view.entity';
import { KanbanCard } from './kanban-card.entity';

@Entity('kanban_columns')
@Index(['viewId', 'order'])
export class KanbanColumn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int' })
    order: number;

    @Column({ length: 7, nullable: true })
    color?: string; // Hex color code

    @Column({ type: 'int', nullable: true })
    limit?: number; // WIP limit

    @Column({ type: 'boolean', default: true })
    visible: boolean;

    @Column({ type: 'boolean', default: false })
    collapsed: boolean;

    // Column configuration
    @Column({ type: 'json', nullable: true })
    config: {
        // Visual settings
        width?: number;
        minWidth?: number;
        maxWidth?: number;
        
        // Behavior settings
        allowDrop?: boolean;
        allowDrag?: boolean;
        autoSort?: boolean;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
        
        // Display settings
        showCount?: boolean;
        showLimit?: boolean;
        cardTemplate?: string;
        
        // Filtering
        filterValue?: any; // The value this column represents
        additionalFilters?: Array<{
            propertyId: string;
            operator: string;
            value: any;
        }>;
    };

    // Relationships
    @Column('uuid')
    viewId: string;

    @ManyToOne(() => DocumentView, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'viewId' })
    view: DocumentView;

    @OneToMany(() => KanbanCard, card => card.column)
    cards: KanbanCard[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
