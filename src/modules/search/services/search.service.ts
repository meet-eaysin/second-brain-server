import { DatabaseModel } from '../../database/models/database.model';
import { DatabaseRecordModel } from '../../database/models/database-record.model';
import { FileModel } from '../../files/models/file.model';
import { WorkspaceModel } from '../../workspace/models/workspace.model';
import type {
  ISearchResult,
  ISearchResults,
  IGlobalSearchOptions,
  IDatabaseSearchOptions
} from '../types';

// Global search across all content types
export const globalSearch = async (
  userId: string,
  query: string,
  options: IGlobalSearchOptions = {}
): Promise<ISearchResults> => {
  const { type, limit = 20, offset = 0 } = options;
  
  if (!query || query.trim().length < 2) {
    return {
      results: [],
      total: 0,
      databases: [],
      records: [],
      files: [],
      workspaces: []
    };
  }

  const searchRegex = new RegExp(query.trim(), 'i');
  const results: ISearchResult[] = [];

  // Search databases if no specific type or type is 'database'
  if (!type || type === 'database') {
    const databases = await DatabaseModel.find({
      $and: [
        {
          $or: [
            { userId },
            { isPublic: true },
            { 'sharedWith.userId': userId }
          ]
        },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        }
      ]
    }).limit(limit).lean();

    const databaseResults: ISearchResult[] = databases.map(db => ({
      id: db._id.toString(),
      type: 'database' as const,
      title: db.name,
      description: db.description,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt
    }));

    results.push(...databaseResults);
  }

  // Search records if no specific type or type is 'record'
  if (!type || type === 'record') {
    // First get accessible databases
    const accessibleDatabases = await DatabaseModel.find({
      $or: [
        { userId },
        { isPublic: true },
        { 'sharedWith.userId': userId }
      ]
    }).select('_id name').lean();

    const databaseIds = accessibleDatabases.map(db => db._id);
    const databaseMap = new Map(accessibleDatabases.map(db => [db._id.toString(), db.name]));

    // Search in record properties
    const records = await DatabaseRecordModel.find({
      databaseId: { $in: databaseIds },
      $or: [
        { 'properties.title': searchRegex },
        { 'properties.name': searchRegex },
        { 'properties.description': searchRegex },
        { 'properties.content': searchRegex }
      ]
    }).limit(limit).lean();

    const recordResults: ISearchResult[] = records.map(record => ({
      id: record._id.toString(),
      type: 'record' as const,
      title: record.properties?.title || record.properties?.name || 'Untitled Record',
      description: record.properties?.description,
      content: record.properties?.content,
      databaseId: record.databaseId.toString(),
      databaseName: databaseMap.get(record.databaseId.toString()),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    results.push(...recordResults);
  }

  // Search files if no specific type or type is 'file'
  if (!type || type === 'file') {
    const files = await FileModel.find({
      $and: [
        {
          $or: [
            { userId },
            { isPublic: true }
          ]
        },
        {
          $or: [
            { originalName: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        }
      ]
    }).limit(limit).lean();

    const fileResults: ISearchResult[] = files.map(file => ({
      id: file._id.toString(),
      type: 'file' as const,
      title: file.originalName,
      description: file.description,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    }));

    results.push(...fileResults);
  }

  // Search workspaces if no specific type or type is 'workspace'
  if (!type || type === 'workspace') {
    const workspaces = await WorkspaceModel.find({
      $and: [
        {
          $or: [
            { ownerId: userId },
            { 'members.userId': userId }
          ]
        },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        }
      ]
    }).limit(limit).lean();

    const workspaceResults: ISearchResult[] = workspaces.map(workspace => ({
      id: workspace._id.toString(),
      type: 'workspace' as const,
      title: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    }));

    results.push(...workspaceResults);
  }

  // Sort by relevance (title matches first, then by update date)
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact matches first
    if (aTitle === queryLower && bTitle !== queryLower) return -1;
    if (bTitle === queryLower && aTitle !== queryLower) return 1;

    // Starts with query
    if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
    if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;

    // Most recent first
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Apply pagination
  const paginatedResults = results.slice(offset, offset + limit);

  // Group results by type
  const groupedResults = {
    results: paginatedResults,
    total: results.length,
    databases: paginatedResults.filter(r => r.type === 'database'),
    records: paginatedResults.filter(r => r.type === 'record'),
    files: paginatedResults.filter(r => r.type === 'file'),
    workspaces: paginatedResults.filter(r => r.type === 'workspace')
  };

  return groupedResults;
};

// Search only databases
export const searchDatabases = async (
  userId: string,
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ databases: ISearchResult[]; total: number }> => {
  const result = await globalSearch(userId, query, { ...options, type: 'database' });
  return {
    databases: result.databases || [],
    total: result.total
  };
};

// Search only records
export const searchRecords = async (
  userId: string,
  query: string,
  options: { databaseId?: string; limit?: number; offset?: number } = {}
): Promise<{ records: ISearchResult[]; total: number }> => {
  const { databaseId, limit = 20, offset = 0 } = options;

  if (!query || query.trim().length < 2) {
    return { records: [], total: 0 };
  }

  const searchRegex = new RegExp(query.trim(), 'i');

  // Build query
  let dbQuery: any = {
    $or: [
      { 'properties.title': searchRegex },
      { 'properties.name': searchRegex },
      { 'properties.description': searchRegex },
      { 'properties.content': searchRegex }
    ]
  };

  if (databaseId) {
    // Search in specific database
    dbQuery.databaseId = databaseId;
  } else {
    // Search in accessible databases
    const accessibleDatabases = await DatabaseModel.find({
      $or: [
        { userId },
        { isPublic: true },
        { 'sharedWith.userId': userId }
      ]
    }).select('_id').lean();

    dbQuery.databaseId = { $in: accessibleDatabases.map(db => db._id) };
  }

  const records = await DatabaseRecordModel.find(dbQuery)
    .limit(limit)
    .skip(offset)
    .lean();

  const total = await DatabaseRecordModel.countDocuments(dbQuery);

  // Get database names for context
  const databaseIds = [...new Set(records.map(r => r.databaseId.toString()))];
  const databases = await DatabaseModel.find({
    _id: { $in: databaseIds }
  }).select('_id name').lean();

  const databaseMap = new Map(databases.map(db => [db._id.toString(), db.name]));

  const recordResults: ISearchResult[] = records.map(record => ({
    id: record._id.toString(),
    type: 'record' as const,
    title: record.properties?.title || record.properties?.name || 'Untitled Record',
    description: record.properties?.description,
    content: record.properties?.content,
    databaseId: record.databaseId.toString(),
    databaseName: databaseMap.get(record.databaseId.toString()),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }));

  return {
    records: recordResults,
    total
  };
};

// Get search suggestions
export const getSearchSuggestions = async (
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchRegex = new RegExp(`^${query.trim()}`, 'i');
  const suggestions = new Set<string>();

  // Get database name suggestions
  const databases = await DatabaseModel.find({
    $and: [
      {
        $or: [
          { userId },
          { isPublic: true },
          { 'sharedWith.userId': userId }
        ]
      },
      { name: searchRegex }
    ]
  }).select('name').limit(limit).lean();

  databases.forEach(db => suggestions.add(db.name));

  // Get tag suggestions
  const taggedItems = await DatabaseModel.find({
    $and: [
      {
        $or: [
          { userId },
          { isPublic: true },
          { 'sharedWith.userId': userId }
        ]
      },
      { tags: { $elemMatch: { $regex: searchRegex } } }
    ]
  }).select('tags').limit(limit).lean();

  taggedItems.forEach(item => {
    item.tags?.forEach(tag => {
      if (tag.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(tag);
      }
    });
  });

  return Array.from(suggestions).slice(0, limit);
};
