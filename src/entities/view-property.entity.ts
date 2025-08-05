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

@Entity('view_properties')
@Index(['viewId', 'order'])
@Index(['viewId', 'propertyId'])
export class ViewProperty {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    order: number; // Display order in the view

    @Column({ type: 'int', nullable: true })
    width?: number; // Column width in pixels

    @Column({ type: 'boolean', default: true })
    visible: boolean;

    @Column({ type: 'boolean', default: false })
    frozen: boolean; // Frozen columns stay visible when scrolling

    @Column({ type: 'boolean', default: false })
    pinned: boolean; // Pinned to left or right

    @Column({ 
        type: 'enum', 
        enum: ['left', 'right'], 
        nullable: true 
    })
    pinnedSide?: 'left' | 'right';

    // Display configuration
    @Column({ type: 'json', nullable: true })
    displayConfig: {
        // Text formatting
        textAlign?: 'left' | 'center' | 'right';
        textWrap?: boolean;
        textColor?: string;
        backgroundColor?: string;
        
        // Number formatting
        numberFormat?: 'number' | 'currency' | 'percentage';
        decimalPlaces?: number;
        currencySymbol?: string;
        
        // Date formatting
        dateFormat?: string;
        timeFormat?: string;
        
        // Boolean display
        booleanDisplay?: 'checkbox' | 'text' | 'icon';
        
        // Select display
        selectDisplay?: 'badge' | 'text' | 'color';
        
        // Custom display rules
        conditionalFormatting?: Array<{
            condition: string;
            style: {
                color?: string;
                backgroundColor?: string;
                fontWeight?: string;
                icon?: string;
            };
        }>;
    };

    // Relationships
    @Column('uuid')
    viewId: string;

    @ManyToOne(() => DocumentView, view => view.properties, { onDelete: 'CASCADE' })
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
