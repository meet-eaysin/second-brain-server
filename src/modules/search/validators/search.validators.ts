import { z } from 'zod';

// Global search schema
const globalSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'databases', 'records', 'files']).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// Search databases schema
const searchDatabasesSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// Search records schema
const searchRecordsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  databaseId: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// Search suggestions schema
const searchSuggestionsSchema = z.object({
  q: z.string().min(1, 'Search query is required')
});

export {
  globalSearchSchema,
  searchDatabasesSchema,
  searchRecordsSchema,
  searchSuggestionsSchema
};
