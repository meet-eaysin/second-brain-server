# Mongoose Type-Safe Helpers

This file contains type-safe wrappers for Mongoose methods to resolve TypeScript union type issues that occur with newer versions of Mongoose and TypeScript.

## Problem

With newer versions of Mongoose and TypeScript, you may encounter errors like:

```
This expression is not callable.
Each member of the union type '{ <ResultDoc = Document<unknown, {}, IModel, {}, {}> & IModel & Required<{ _id: unknown; }> & { __v: number; }>(id: any, projection: ProjectionType<IModel> | null | undefined, options: QueryOptions<...> & { ...; }): Query<...>; <ResultDoc = Document<...> & ... 2 more ... & { ...; }>(id: any, projection?: ProjectionType<...> | ... 1 more ... | undefined, options?: QueryOptions<...> | ... 1 more ... | undefined): Query<...>; }' has signatures, but none of those signatures are compatible with each other.
```

## Solution

Use the type-safe wrappers provided in `mongoose-helpers.ts` instead of calling Mongoose methods directly.

## Usage Examples

### Before (Problematic)
```typescript
// This may cause TypeScript errors
const user = await UserModel.findById(id);
const result = await UserModel.updateOne(filter, update);
const doc = await UserModel.findOneAndUpdate(filter, update, options);
```

### After (Type-Safe)
```typescript
import { findById, updateOne, findOneAndUpdate } from '../../../utils/mongoose-helpers';

// These are type-safe
const user = await findById(UserModel, id);
const result = await updateOne(UserModel, filter, update);
const doc = await findOneAndUpdate(UserModel, filter, update, options);
```

## Available Helpers

### Query Methods
- `findById(model, id, projection?, options?)` - Find document by ID
- `findOne(model, filter, projection?, options?)` - Find single document
- `find(model, filter, projection?, options?)` - Find multiple documents
- `countDocuments(model, filter, options?)` - Count documents

### Update Methods
- `findByIdAndUpdate(model, id, update, options?)` - Find by ID and update
- `findOneAndUpdate(model, filter, update, options?)` - Find one and update
- `updateOne(model, filter, update, options?)` - Update single document
- `updateMany(model, filter, update, options?)` - Update multiple documents

### Delete Methods
- `deleteOne(model, filter, options?)` - Delete single document
- `deleteMany(model, filter, options?)` - Delete multiple documents

### Utility Methods
- `aggregate(model, pipeline, options?)` - Run aggregation pipeline
- `isValidObjectId(id)` - Validate MongoDB ObjectId
- `toObjectId(id)` - Convert string to ObjectId
- `toStringId(id)` - Convert ObjectId to string

## Import and Usage

```typescript
// Import the helpers you need
import { 
  findById, 
  findOneAndUpdate, 
  updateOne, 
  deleteOne 
} from '../../../utils/mongoose-helpers';

// Or import all helpers
import * as mongooseHelpers from '../../../utils/mongoose-helpers';

// Use in your service functions
export async function getUserById(id: string) {
  const user = await findById(UserModel, id);
  return user ? user.toJSON() : null;
}

export async function updateUser(id: string, updates: any) {
  const user = await findOneAndUpdate(
    UserModel, 
    { _id: id }, 
    updates, 
    { new: true, runValidators: true }
  );
  return user;
}
```

## Files Already Updated

The following files have been updated to use these type-safe helpers:

- `src/modules/users/services/users.services.ts`
- `src/modules/second-brain/person/services/person.service.ts`
- `src/modules/second-brain/habits/services/habit.service.ts`

## Files That May Need Updates

If you encounter similar TypeScript errors in other files, consider updating them to use these helpers:

- `src/modules/workspace/services/workspace.service.ts`
- `src/modules/files/services/files.service.ts`
- Any other service files using Mongoose methods directly

## Benefits

1. **Type Safety**: Eliminates TypeScript union type errors
2. **Consistency**: Uniform API across all services
3. **Maintainability**: Centralized Mongoose method handling
4. **Future-Proof**: Easy to update if Mongoose types change
5. **Developer Experience**: Clear, predictable method signatures

## Notes

- These helpers use type assertions (`as any`) internally to bypass TypeScript's overly strict union types
- The runtime behavior is identical to calling Mongoose methods directly
- All Mongoose features (population, lean queries, etc.) are still available through the options parameter
