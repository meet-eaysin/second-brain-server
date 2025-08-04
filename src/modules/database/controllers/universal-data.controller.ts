// Universal Data Controller - Handles all entity operations via REST API
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import UniversalDataService from '../services/universal-data.service';
import { sendSuccessResponse, sendErrorResponse } from '../../../utils/response.utils';
import { QueryOptions } from '../core/entity-registry';

/**
 * Universal Data Controller
 * Provides REST endpoints for any registered entity type
 */
export class UniversalDataController {
  
  /**
   * GET /api/entities
   * Get all available entities with their schemas
   */
  static async getEntities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await UniversalDataService.getEntities(req.user);
      sendSuccessResponse(res, 'Entities retrieved successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/:entityKey/schema
   * Get schema for a specific entity
   */
  static async getEntitySchema(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const result = await UniversalDataService.getEntitySchema(entityKey, req.user);
      sendSuccessResponse(res, 'Entity schema retrieved successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/:entityKey/records
   * Get records for an entity with filtering, sorting, and pagination
   */
  static async getRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const {
        page = 1,
        limit = 50,
        search,
        sort,
        filters,
        view,
        includeDeleted = false
      } = req.query;
      
      // Parse sort parameter
      let sortOptions: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      if (sort && typeof sort === 'string') {
        try {
          sortOptions = JSON.parse(sort);
        } catch {
          // Handle simple sort format: "field:direction"
          const [field, direction] = sort.split(':');
          if (field) {
            sortOptions = [{ field, direction: direction === 'desc' ? 'desc' : 'asc' }];
          }
        }
      }
      
      // Parse filters parameter
      let filterOptions: Array<{ field: string; operator: string; value: any }> = [];
      if (filters && typeof filters === 'string') {
        try {
          filterOptions = JSON.parse(filters);
        } catch (error) {
          console.warn('Invalid filters format:', filters);
        }
      }
      
      const options: QueryOptions = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 1000), // Max 1000 records
        search: search as string,
        sort: sortOptions,
        filters: filterOptions,
        includeDeleted: includeDeleted === 'true'
      };
      
      const result = await UniversalDataService.getRecords(entityKey, options, req.user);
      
      // Send response with pagination meta
      res.json({
        success: true,
        message: 'Records retrieved successfully',
        data: result.data,
        meta: result.meta,
        schema: result.schema
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/:entityKey/records/:recordId
   * Get a single record
   */
  static async getRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey, recordId } = req.params;
      const result = await UniversalDataService.getRecord(entityKey, recordId, req.user);
      sendSuccessResponse(res, 'Record retrieved successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/entities/:entityKey/records
   * Create a new record
   */
  static async createRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const data = req.body;
      
      const result = await UniversalDataService.createRecord(entityKey, data, req.user);
      sendSuccessResponse(res, 'Record created successfully', result.data, 201);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * PUT /api/entities/:entityKey/records/:recordId
   * Update a record
   */
  static async updateRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey, recordId } = req.params;
      const data = req.body;
      
      const result = await UniversalDataService.updateRecord(entityKey, recordId, data, req.user);
      sendSuccessResponse(res, 'Record updated successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /api/entities/:entityKey/records/:recordId
   * Delete a record (soft delete by default)
   */
  static async deleteRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey, recordId } = req.params;
      const { permanent = false } = req.query;
      
      const result = await UniversalDataService.deleteRecord(
        entityKey, 
        recordId, 
        permanent === 'true', 
        req.user
      );
      sendSuccessResponse(res, 'Record deleted successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/entities/:entityKey/records/:recordId/restore
   * Restore a soft-deleted record
   */
  static async restoreRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey, recordId } = req.params;
      
      const result = await UniversalDataService.updateRecord(
        entityKey, 
        recordId, 
        { $unset: { deletedAt: 1, deletedBy: 1 } }, 
        req.user
      );
      sendSuccessResponse(res, 'Record restored successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/entities/:entityKey/records/:recordId/duplicate
   * Duplicate a record
   */
  static async duplicateRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey, recordId } = req.params;
      
      // Get the original record
      const originalResult = await UniversalDataService.getRecord(entityKey, recordId, req.user);
      const originalData = originalResult.data;
      
      // Remove system fields and ID
      const { _id, id, createdAt, updatedAt, createdBy, updatedBy, ...duplicateData } = originalData;
      
      // Add "Copy" to title/name if it exists
      if (duplicateData.title) {
        duplicateData.title = `${duplicateData.title} (Copy)`;
      } else if (duplicateData.name) {
        duplicateData.name = `${duplicateData.name} (Copy)`;
      }
      
      const result = await UniversalDataService.createRecord(entityKey, duplicateData, req.user);
      sendSuccessResponse(res, 'Record duplicated successfully', result.data, 201);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * PUT /api/entities/:entityKey/records/bulk-update
   * Bulk update multiple records
   */
  static async bulkUpdateRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const { recordIds, data } = req.body;
      
      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        return sendErrorResponse(res, 'recordIds must be a non-empty array', 400);
      }
      
      const result = await UniversalDataService.bulkUpdateRecords(entityKey, recordIds, data, req.user);
      sendSuccessResponse(res, 'Records updated successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /api/entities/:entityKey/records/bulk-delete
   * Bulk delete multiple records
   */
  static async bulkDeleteRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const { recordIds, permanent = false } = req.body;
      
      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        return sendErrorResponse(res, 'recordIds must be a non-empty array', 400);
      }
      
      const result = await UniversalDataService.bulkDeleteRecords(
        entityKey, 
        recordIds, 
        permanent, 
        req.user
      );
      sendSuccessResponse(res, 'Records deleted successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/:entityKey/stats
   * Get statistics for an entity
   */
  static async getEntityStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const result = await UniversalDataService.getEntityStats(entityKey, req.user);
      sendSuccessResponse(res, 'Entity statistics retrieved successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/search
   * Global search across entities
   */
  static async globalSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { q: query, entities, limit = 50 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return sendErrorResponse(res, 'Search query is required', 400);
      }
      
      let entityKeys: string[] | undefined;
      if (entities && typeof entities === 'string') {
        entityKeys = entities.split(',').map(e => e.trim());
      }
      
      const result = await UniversalDataService.globalSearch(
        query,
        entityKeys,
        req.user,
        parseInt(limit as string)
      );
      
      sendSuccessResponse(res, 'Search completed successfully', result.data);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/entities/:entityKey/export
   * Export entity data
   */
  static async exportRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const { format = 'json', filters, sort } = req.query;
      
      // Parse filters and sort
      let filterOptions: Array<{ field: string; operator: string; value: any }> = [];
      if (filters && typeof filters === 'string') {
        try {
          filterOptions = JSON.parse(filters);
        } catch (error) {
          console.warn('Invalid filters format:', filters);
        }
      }
      
      let sortOptions: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      if (sort && typeof sort === 'string') {
        try {
          sortOptions = JSON.parse(sort);
        } catch {
          const [field, direction] = sort.split(':');
          if (field) {
            sortOptions = [{ field, direction: direction === 'desc' ? 'desc' : 'asc' }];
          }
        }
      }
      
      const options: QueryOptions = {
        limit: 10000, // Max export limit
        filters: filterOptions,
        sort: sortOptions
      };
      
      const result = await UniversalDataService.getRecords(entityKey, options, req.user);
      
      if (format === 'csv') {
        // Convert to CSV
        const schema = result.schema;
        if (!schema) {
          return sendErrorResponse(res, 'Schema not available for CSV export', 400);
        }
        
        const headers = schema.properties.map(p => p.name).join(',');
        const rows = result.data.map(record => 
          schema.properties.map(p => {
            const value = record[p.id];
            if (Array.isArray(value)) {
              return `"${value.join(', ')}"`;
            }
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value || '';
          }).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${entityKey}-export.csv"`);
        res.send(csv);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${entityKey}-export.json"`);
        res.json({
          entityKey,
          exportedAt: new Date().toISOString(),
          totalRecords: result.data.length,
          schema: result.schema,
          data: result.data
        });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/entities/:entityKey/import
   * Import entity data
   */
  static async importRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityKey } = req.params;
      const { data: importData, mode = 'create' } = req.body; // mode: 'create' | 'upsert' | 'update'
      
      if (!Array.isArray(importData) || importData.length === 0) {
        return sendErrorResponse(res, 'Import data must be a non-empty array', 400);
      }
      
      const results = {
        total: importData.length,
        created: 0,
        updated: 0,
        errors: [] as any[]
      };
      
      for (let i = 0; i < importData.length; i++) {
        const record = importData[i];
        
        try {
          if (mode === 'create' || !record.id) {
            // Create new record
            await UniversalDataService.createRecord(entityKey, record, req.user);
            results.created++;
          } else if (mode === 'update' || mode === 'upsert') {
            // Try to update existing record
            try {
              await UniversalDataService.updateRecord(entityKey, record.id, record, req.user);
              results.updated++;
            } catch (error: any) {
              if (mode === 'upsert' && error.statusCode === 404) {
                // Record doesn't exist, create it
                await UniversalDataService.createRecord(entityKey, record, req.user);
                results.created++;
              } else {
                throw error;
              }
            }
          }
        } catch (error: any) {
          results.errors.push({
            index: i,
            record,
            error: error.message
          });
        }
      }
      
      sendSuccessResponse(res, 'Import completed', results);
    } catch (error) {
      next(error);
    }
  }
}

export default UniversalDataController;