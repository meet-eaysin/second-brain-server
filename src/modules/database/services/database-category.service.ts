import { DatabaseModel } from './../models/database.model';
import { DatabaseCategoryModel, IDatabaseCategory } from '../models/database-category.model';
import { TDatabaseCategoryCreateRequest, TDatabaseCategoryUpdateRequest } from '../types/database.types';
import { createNotFoundError, createAppError } from '../../../utils/error.utils';

/**
 * Create a new database category
 */
export const createCategory = async (
  ownerId: string,
  data: TDatabaseCategoryCreateRequest
): Promise<IDatabaseCategory> => {
  try {
    // Check if category name already exists for this user
    const existingCategory = await DatabaseCategoryModel.findOne({
      ownerId,
      name: data.name
    });

    if (existingCategory) {
      throw createAppError('Category name already exists', 400, true);
    }

    // Get the next sort order
    const lastCategory = await DatabaseCategoryModel.findOne({ ownerId })
      .sort({ sortOrder: -1 })
      .limit(1);

    const sortOrder = data.sortOrder ?? (lastCategory ? lastCategory.sortOrder + 1 : 0);

    const category = await DatabaseCategoryModel.create({
      ...data,
      ownerId,
      sortOrder,
      isDefault: false
    });

    return toCategoryInterface(category);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError('Failed to create category', 500, true);
  }
};

/**
 * Get all categories for a user
 */
export const getUserCategories = async (ownerId: string): Promise<IDatabaseCategory[]> => {
  try {
    const categories = await DatabaseCategoryModel.find({ ownerId })
      .sort({ sortOrder: 1, createdAt: 1 });

    return categories.map(toCategoryInterface);
  } catch (error: any) {
    throw createAppError('Failed to fetch categories', 500, true);
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (
  categoryId: string,
  ownerId: string
): Promise<IDatabaseCategory> => {
  try {
    const category = await DatabaseCategoryModel.findOne({
      _id: categoryId,
      ownerId
    });

    if (!category) {
      throw createNotFoundError('Category not found');
    }

    return toCategoryInterface(category);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError('Failed to fetch category', 500, true);
  }
};

/**
 * Update category
 */
export const updateCategory = async (
  categoryId: string,
  ownerId: string,
  data: TDatabaseCategoryUpdateRequest
): Promise<IDatabaseCategory> => {
  try {
    // Check if category exists and belongs to user
    const category = await DatabaseCategoryModel.findOne({
      _id: categoryId,
      ownerId
    });

    if (!category) {
      throw createNotFoundError('Category not found');
    }

    // Check if new name conflicts with existing categories
    if (data.name && data.name !== category.name) {
      const existingCategory = await DatabaseCategoryModel.findOne({
        ownerId,
        name: data.name,
        _id: { $ne: categoryId }
      });

      if (existingCategory) {
        throw createAppError('Category name already exists', 400, true);
      }
    }

    const updatedCategory = await DatabaseCategoryModel.findByIdAndUpdate(
      categoryId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      throw createNotFoundError('Category not found');
    }

    return toCategoryInterface(updatedCategory);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError('Failed to update category', 500, true);
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (
  categoryId: string,
  ownerId: string
): Promise<void> => {
  try {
    const category = await DatabaseCategoryModel.findOne({
      _id: categoryId,
      ownerId
    });

    if (!category) {
      throw createNotFoundError('Category not found');
    }

    // Cannot delete default category
    if (category.isDefault) {
      throw createAppError('Cannot delete default category', 400, true);
    }

    // Move databases in this category to uncategorized
    await DatabaseModel.updateMany(
      { categoryId },
      { $unset: { categoryId: 1 } }
    );

    await DatabaseCategoryModel.findByIdAndDelete(categoryId);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError('Failed to delete category', 500, true);
  }
};

/**
 * Reorder categories
 */
export const reorderCategories = async (
  ownerId: string,
  categoryIds: string[]
): Promise<IDatabaseCategory[]> => {
  try {
    // Verify all categories belong to the user
    const categories = await DatabaseCategoryModel.find({
      _id: { $in: categoryIds },
      ownerId
    });

    if (categories.length !== categoryIds.length) {
      throw createAppError('Some categories not found', 400, true);
    }

    // Update sort orders
    const updatePromises = categoryIds.map((categoryId, index) =>
      DatabaseCategoryModel.findByIdAndUpdate(
        categoryId,
        { sortOrder: index },
        { new: true }
      )
    );

    const updatedCategories = await Promise.all(updatePromises);
    return updatedCategories
      .filter(cat => cat !== null)
      .map(toCategoryInterface);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createAppError('Failed to reorder categories', 500, true);
  }
};

/**
 * Create default category for new user
 */
export const createDefaultCategory = async (ownerId: string): Promise<IDatabaseCategory> => {
  try {
    const defaultCategory = await DatabaseCategoryModel.create({
      name: 'General',
      description: 'Default category for databases',
      icon: '📁',
      color: '#6B7280',
      ownerId,
      isDefault: true,
      sortOrder: 0
    });

    return toCategoryInterface(defaultCategory);
  } catch (error: any) {
    throw createAppError('Failed to create default category', 500, true);
  }
};

/**
 * Convert Mongoose document to interface
 */
const toCategoryInterface = (doc: any): IDatabaseCategory => {
  return doc.toJSON() as IDatabaseCategory;
};
