import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DocumentViewService, CreateViewDto, UpdateViewDto } from '../services/document-view.service';
import { DocumentView } from '../entities/document-view.entity';

@ApiTags('Document Views')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/document-views')
export class DocumentViewController {
    constructor(private readonly documentViewService: DocumentViewService) {}

    @Post('databases/:databaseId/views')
    @ApiOperation({ summary: 'Create a new view for a database' })
    @ApiResponse({ status: 201, description: 'View created successfully' })
    async createView(
        @Request() req,
        @Param('databaseId') databaseId: string,
        @Body() createViewDto: CreateViewDto,
    ): Promise<DocumentView> {
        return this.documentViewService.createView(
            req.user?.userId,
            databaseId,
            createViewDto,
        );
    }

    @Get('databases/:databaseId/views')
    @ApiOperation({ summary: 'Get all views for a database' })
    @ApiResponse({ status: 200, description: 'Views retrieved successfully' })
    async getViewsByDatabase(
        @Request() req,
        @Param('databaseId') databaseId: string,
    ): Promise<DocumentView[]> {
        return this.documentViewService.getViewsByDatabase(req.user?.userId, databaseId);
    }

    @Get(':viewId')
    @ApiOperation({ summary: 'Get a specific view by ID' })
    @ApiResponse({ status: 200, description: 'View retrieved successfully' })
    async getView(
        @Request() req,
        @Param('viewId') viewId: string,
    ): Promise<DocumentView> {
        return this.documentViewService.getViewById(req.user?.userId, viewId);
    }

    @Put(':viewId')
    @ApiOperation({ summary: 'Update a view' })
    @ApiResponse({ status: 200, description: 'View updated successfully' })
    async updateView(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() updateViewDto: Omit<UpdateViewDto, 'id'>,
    ): Promise<DocumentView> {
        return this.documentViewService.updateView(req.user?.userId, {
            ...updateViewDto,
            id: viewId,
        });
    }

    @Delete(':viewId')
    @ApiOperation({ summary: 'Delete a view' })
    @ApiResponse({ status: 200, description: 'View deleted successfully' })
    async deleteView(
        @Request() req,
        @Param('viewId') viewId: string,
    ): Promise<{ message: string }> {
        await this.documentViewService.deleteView(req.user?.userId, viewId);
        return { message: 'View deleted successfully' };
    }

    @Post(':viewId/duplicate')
    @ApiOperation({ summary: 'Duplicate a view' })
    @ApiResponse({ status: 201, description: 'View duplicated successfully' })
    async duplicateView(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() body: { name?: string },
    ): Promise<DocumentView> {
        return this.documentViewService.duplicateView(
            req.user?.userId,
            viewId,
            body.name,
        );
    }

    // Property management endpoints
    @Put(':viewId/properties')
    @ApiOperation({ summary: 'Update view properties configuration' })
    async updateViewProperties(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() properties: Array<{
            propertyId: string;
            order: number;
            width?: number;
            visible?: boolean;
            frozen?: boolean;
            displayConfig?: any;
        }>,
    ): Promise<DocumentView> {
        return this.documentViewService.updateView(req.user?.userId, {
            id: viewId,
            properties,
        });
    }

    @Put(':viewId/filters')
    @ApiOperation({ summary: 'Update view filters' })
    async updateViewFilters(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() filters: Array<{
            propertyId: string;
            operator: string;
            value: any;
            logic?: string;
            order?: number;
        }>,
    ): Promise<DocumentView> {
        return this.documentViewService.updateView(req.user?.userId, {
            id: viewId,
            filters,
        });
    }

    @Put(':viewId/sorts')
    @ApiOperation({ summary: 'Update view sorting' })
    async updateViewSorts(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() sorts: Array<{
            propertyId: string;
            direction: string;
            order: number;
        }>,
    ): Promise<DocumentView> {
        return this.documentViewService.updateView(req.user?.userId, {
            id: viewId,
            sorts,
        });
    }

    @Put(':viewId/config')
    @ApiOperation({ summary: 'Update view configuration' })
    async updateViewConfig(
        @Request() req,
        @Param('viewId') viewId: string,
        @Body() config: any,
    ): Promise<DocumentView> {
        return this.documentViewService.updateView(req.user?.userId, {
            id: viewId,
            config,
        });
    }
}
