import { Model, Document, Types, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Type-safe wrapper for Mongoose findById method
 * Resolves TypeScript union type issues with Mongoose methods
 */
export async function findById<T extends Document>(
  model: Model<T>,
  id: string | Types.ObjectId,
  projection?: any,
  options?: QueryOptions<T>
): Promise<T | null> {
  return await (model.findById as any)(id, projection, options);
}

/**
 * Type-safe wrapper for Mongoose findByIdAndUpdate method
 */
export async function findByIdAndUpdate<T extends Document>(
  model: Model<T>,
  id: string | Types.ObjectId,
  update: UpdateQuery<T>,
  options?: QueryOptions<T> & { new?: boolean; runValidators?: boolean }
): Promise<T | null> {
  return await (model.findByIdAndUpdate as any)(id, update, options);
}

/**
 * Type-safe wrapper for Mongoose findOne method
 */
export async function findOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  projection?: any,
  options?: QueryOptions<T>
): Promise<T | null> {
  return await (model.findOne as any)(filter, projection, options);
}

/**
 * Type-safe wrapper for Mongoose findOneAndUpdate method
 */
export async function findOneAndUpdate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options?: QueryOptions<T> & { new?: boolean; runValidators?: boolean }
): Promise<T | null> {
  return await (model.findOneAndUpdate as any)(filter, update, options);
}

/**
 * Type-safe wrapper for Mongoose updateOne method
 */
export async function updateOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options?: QueryOptions<T>
): Promise<{ acknowledged: boolean; modifiedCount: number; upsertedId?: any; upsertedCount?: number; matchedCount: number }> {
  return await (model.updateOne as any)(filter, update, options);
}

/**
 * Type-safe wrapper for Mongoose updateMany method
 */
export async function updateMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options?: QueryOptions<T>
): Promise<{ acknowledged: boolean; modifiedCount: number; upsertedId?: any; upsertedCount?: number; matchedCount: number }> {
  return await (model.updateMany as any)(filter, update, options);
}

/**
 * Type-safe wrapper for Mongoose deleteOne method
 */
export async function deleteOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: QueryOptions<T>
): Promise<{ acknowledged: boolean; deletedCount: number }> {
  return await (model.deleteOne as any)(filter, options);
}

/**
 * Type-safe wrapper for Mongoose deleteMany method
 */
export async function deleteMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: QueryOptions<T>
): Promise<{ acknowledged: boolean; deletedCount: number }> {
  return await (model.deleteMany as any)(filter, options);
}

/**
 * Type-safe wrapper for Mongoose find method
 */
export async function find<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  projection?: any,
  options?: QueryOptions<T>
): Promise<T[]> {
  return await (model.find as any)(filter, projection, options);
}

/**
 * Type-safe wrapper for Mongoose countDocuments method
 */
export async function countDocuments<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: QueryOptions<T>
): Promise<number> {
  return await (model.countDocuments as any)(filter, options);
}

/**
 * Type-safe wrapper for Mongoose aggregate method
 */
export async function aggregate<T extends Document, R = any>(
  model: Model<T>,
  pipeline: any[],
  options?: any
): Promise<R[]> {
  return await (model.aggregate as any)(pipeline, options);
}

/**
 * Utility function to validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Utility function to convert string to ObjectId
 */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/**
 * Utility function to convert ObjectId to string
 */
export function toStringId(id: Types.ObjectId | string): string {
  return id.toString();
}
