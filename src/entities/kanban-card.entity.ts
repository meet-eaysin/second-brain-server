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
import { KanbanColumn } from './kanban-column.entity';
import { DatabaseRecord } from './database-record.entity';

@Entity('kanban_cards')
@Index(['columnId', 'order'])
@Index(['recordId'])
export class KanbanCard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    order: number; // Position within the column

    @Column({ type: 'boolean', default: false })
    collapsed: boolean;

    // Card display configuration
    @Column({ type: 'json', nullable: true })
    displayConfig: {
        // Visual settings
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        
        // Size settings
        height?: number;
        width?: number;
        
        // Content settings
        showProperties?: string[]; // Which properties to display
        hideProperties?: string[]; // Which properties to hide
        compactMode?: boolean;
        
        // Custom styling
        customCss?: string;
        template?: string;
    };

    // Relationships
    @Column('uuid')
    columnId: string;

    @ManyToOne(() => KanbanColumn, column => column.cards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'columnId' })
    column: KanbanColumn;

    @Column('uuid')
    recordId: string;

    @ManyToOne(() => DatabaseRecord, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recordId' })
    record: DatabaseRecord;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
