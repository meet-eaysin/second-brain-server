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

export enum FilterOperator {
    // Text operators
    EQUALS = 'equals',
    NOT_EQUALS = 'not_equals',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains',
    STARTS_WITH = 'starts_with',
    ENDS_WITH = 'ends_with',
    IS_EMPTY = 'is_empty',
    IS_NOT_EMPTY = 'is_not_empty',
    
    // Number operators
    GREATER_THAN = 'greater_than',
    GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
    LESS_THAN = 'less_than',
    LESS_THAN_OR_EQUAL = 'less_than_or_equal',
    
    // Date operators
    IS_TODAY = 'is_today',
    IS_YESTERDAY = 'is_yesterday',
    IS_TOMORROW = 'is_tomorrow',
    IS_THIS_WEEK = 'is_this_week',
    IS_THIS_MONTH = 'is_this_month',
    IS_THIS_YEAR = 'is_this_year',
    IS_PAST_WEEK = 'is_past_week',
    IS_PAST_MONTH = 'is_past_month',
    IS_NEXT_WEEK = 'is_next_week',
    IS_NEXT_MONTH = 'is_next_month',
    DATE_EQUALS = 'date_equals',
    DATE_BEFORE = 'date_before',
    DATE_AFTER = 'date_after',
    DATE_BETWEEN = 'date_between',
    
    // Array operators (for multi-select)
    INCLUDES = 'includes',
    NOT_INCLUDES = 'not_includes',
    INCLUDES_ALL = 'includes_all',
    INCLUDES_ANY = 'includes_any',
    
    // Boolean operators
    IS_TRUE = 'is_true',
    IS_FALSE = 'is_false',
}

export enum FilterLogic {
    AND = 'AND',
    OR = 'OR',
}

@Entity('view_filters')
@Index(['viewId', 'order'])
export class ViewFilter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({
        type: 'enum',
        enum: FilterOperator,
    })
    operator: FilterOperator;

    @Column({ type: 'json', nullable: true })
    value: any; // The filter value(s)

    @Column({
        type: 'enum',
        enum: FilterLogic,
        default: FilterLogic.AND,
    })
    logic: FilterLogic; // How this filter combines with others

    @Column({ type: 'boolean', default: true })
    enabled: boolean;

    @Column({ type: 'int', nullable: true })
    groupId?: number; // For grouping filters with parentheses

    // Advanced filter options
    @Column({ type: 'boolean', default: false })
    caseSensitive: boolean;

    @Column({ type: 'json', nullable: true })
    config: {
        // Date range config
        dateRange?: {
            start: string;
            end: string;
            includeTime?: boolean;
        };
        
        // Number range config
        numberRange?: {
            min: number;
            max: number;
        };
        
        // Text search config
        textSearch?: {
            wholeWord?: boolean;
            regex?: boolean;
        };
        
        // Custom filter function
        customFunction?: string;
    };

    // Relationships
    @Column('uuid')
    viewId: string;

    @ManyToOne(() => DocumentView, view => view.filters, { onDelete: 'CASCADE' })
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
