import { Request, Response, NextFunction } from 'express';
import { catchAsync, sendSuccessResponse } from '@/utils';
import { createAppError } from '@/utils/error.utils';
import { propertiesService } from '../services/properties.services';
import {
  ICreatePropertyRequest,
  IUpdatePropertyRequest
} from '@/modules/core/types/property.types';
import { IReorderPropertiesRequest } from '../types/properties.types';
import { getUserId } from '@/auth/index';

export const createDatabaseProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const data: ICreatePropertyRequest = req.body;
    const userId = getUserId(req);

    if (!data.viewId) {
      throw createAppError('viewId is required to create a property', 400);
    }

    const property = await propertiesService.createProperty(databaseId, data, userId);

    sendSuccessResponse(res, 'Property created successfully', property, 201);
  }
);

export const getDatabaseProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const { includeHidden, viewId } = req.query;
    const userId = getUserId(req);

    const properties = await propertiesService.getProperties(
      databaseId,
      userId,
      includeHidden === 'true',
      viewId as string
    );

    sendSuccessResponse(res, 'Properties retrieved successfully', properties);
  }
);

export const getDatabasePropertyById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const userId = getUserId(req);

    const property = await propertiesService.getPropertyById(databaseId, propertyId, userId);

    sendSuccessResponse(res, 'Property retrieved successfully', property);
  }
);

export const updateDatabaseProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const data: IUpdatePropertyRequest = req.body;
    const userId = getUserId(req);

    const property = await propertiesService.updateProperty(databaseId, propertyId, data, userId);

    sendSuccessResponse(res, 'Property updated successfully', property);
  }
);

export const reorderDatabaseProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const data: IReorderPropertiesRequest = req.body;
    const userId = getUserId(req);

    await propertiesService.reorderProperties(databaseId, data, userId);

    sendSuccessResponse(res, 'Properties reordered successfully', {
      updatedProperties: data.propertyOrders.length,
      updatedAt: new Date()
    });
  }
);

export const deleteDatabaseProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const userId = getUserId(req);

    await propertiesService.deleteProperty(databaseId, propertyId, userId);

    sendSuccessResponse(res, 'Property deleted successfully', null, 204);
  }
);

export const validatePropertyValue = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const { value } = req.body;
    const userId = getUserId(req);

    const property = await propertiesService.getPropertyById(databaseId, propertyId);

    // Basic validation - just check if property exists
    const validation = {
      isValid: true,
      errors: [],
      convertedValue: value
    };

    sendSuccessResponse(res, 'Property value validated', validation);
  }
);

export const duplicateDatabaseProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const { name } = req.body;
    const userId = getUserId(req);

    const duplicatedProperty = await propertiesService.duplicateProperty(
      databaseId,
      propertyId,
      userId,
      name
    );

    sendSuccessResponse(res, 'Property duplicated successfully', duplicatedProperty, 201);
  }
);

export const changePropertyType = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const { type, config } = req.body;
    const userId = getUserId(req);

    const property = await propertiesService.changePropertyType(
      databaseId,
      propertyId,
      type,
      config,
      userId
    );

    sendSuccessResponse(res, 'Property type changed successfully', property);
  }
);

export const insertPropertyAfter = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId } = req.params;
    const { afterPropertyId, ...propertyData } = req.body;
    const userId = getUserId(req);

    const property = await propertiesService.insertPropertyAt(
      databaseId,
      propertyData,
      afterPropertyId,
      userId
    );

    sendSuccessResponse(res, 'Property inserted successfully', property, 201);
  }
);

export const getPropertyCalculations = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const userId = getUserId(req);

    const calculations = await propertiesService.getPropertyCalculations(
      databaseId,
      propertyId,
      userId
    );

    sendSuccessResponse(res, 'Property calculations retrieved successfully', calculations);
  }
);

export const togglePropertyVisibility = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { databaseId, propertyId } = req.params;
    const { viewId } = req.query;
    const userId = getUserId(req);

    if (!viewId || typeof viewId !== 'string') {
      throw createAppError('viewId is required to toggle property visibility', 400);
    }

    const property = await propertiesService.togglePropertyVisibility(
      databaseId,
      propertyId,
      viewId,
      userId
    );

    sendSuccessResponse(res, 'Property visibility toggled successfully', property);
  }
);
