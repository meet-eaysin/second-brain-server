import { TagModel, ITag, ITagDocument } from '../models/tag.model';
import { DatabaseModel } from '../../database/models/database.model';
import { FileModel } from '../../files/models/file.model';
import { WorkspaceModel } from '../../workspace/models/workspace.model';
import { createNotFoundError, createValidationError } from '../../../utils/error.utils';

export interface ITagCreateRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface ITagUpdateRequest {
  name?: string;
  color?: string;
  description?: string;
}

export interface ITagWithUsage extends ITag {
  usedInDatabases: number;
  usedInFiles: number;
  usedInWorkspaces: number;
}

// Get user's tags
export const getUserTags = async (
  userId: string,
  options: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ tags: ITagWithUsage[]; total: number }> => {
  const {
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    limit = 50,
    offset = 0
  } = options;

  // Build query
  let query: any = { userId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get tags
  const tags = await TagModel.find(query)
    .sort(sort)
    .limit(limit)
    .skip(offset);

  const total = await TagModel.countDocuments(query);

  // Get usage counts for each tag
  const tagsWithUsage: ITagWithUsage[] = await Promise.all(
    tags.map(async (tag) => {
      const [usedInDatabases, usedInFiles, usedInWorkspaces] = await Promise.all([
        DatabaseModel.countDocuments({
          userId,
          tags: tag.name
        }),
        FileModel.countDocuments({
          userId,
          tags: tag.name
        }),
        WorkspaceModel.countDocuments({
          $or: [
            { ownerId: userId },
            { 'members.userId': userId }
          ],
          tags: tag.name
        })
      ]);

      return {
        ...tag,
        id: tag._id.toString(),
        usedInDatabases,
        usedInFiles,
        usedInWorkspaces
      } as ITagWithUsage;
    })
  );

  return { tags: tagsWithUsage, total };
};

// Create new tag
export const createTag = async (
  userId: string,
  data: ITagCreateRequest
): Promise<ITag> => {
  // Check if tag with same name already exists for user
  const existingTag = await TagModel.findOne({
    userId,
    name: data.name.trim()
  });

  if (existingTag) {
    throw createValidationError('Tag with this name already exists');
  }

  // Generate random color if not provided
  const color = data.color || generateRandomColor();

  const tag = await TagModel.create({
    name: data.name.trim(),
    color,
    description: data.description?.trim(),
    userId
  });

  return toTagInterface(tag);
};

// Get tag by ID
export const getTagById = async (
  tagId: string,
  userId: string
): Promise<ITagWithUsage> => {
  const tag = await TagModel.findOne({
    _id: tagId,
    userId
  });

  if (!tag) {
    throw createNotFoundError('Tag not found');
  }

  // Get usage counts
  const [usedInDatabases, usedInFiles, usedInWorkspaces] = await Promise.all([
    DatabaseModel.countDocuments({
      userId,
      tags: tag.name
    }),
    FileModel.countDocuments({
      userId,
      tags: tag.name
    }),
    WorkspaceModel.countDocuments({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ],
      tags: tag.name
    })
  ]);

  return {
    ...tag,
    id: tag._id.toString(),
    usedInDatabases,
    usedInFiles,
    usedInWorkspaces
  } as ITagWithUsage;
};

// Update tag
export const updateTag = async (
  tagId: string,
  userId: string,
  data: ITagUpdateRequest
): Promise<ITag> => {
  const tag = await TagModel.findOne({
    _id: tagId,
    userId
  });

  if (!tag) {
    throw createNotFoundError('Tag not found');
  }

  // Check if new name conflicts with existing tag
  if (data.name && data.name.trim() !== tag.name) {
    const existingTag = await TagModel.findOne({
      userId,
      name: data.name.trim(),
      _id: { $ne: tagId }
    });

    if (existingTag) {
      throw createValidationError('Tag with this name already exists');
    }

    // Update tag references in other collections
    const oldName = tag.name;
    const newName = data.name.trim();

    await Promise.all([
      DatabaseModel.updateMany(
        { userId, tags: oldName },
        { $set: { 'tags.$': newName } }
      ),
      FileModel.updateMany(
        { userId, tags: oldName },
        { $set: { 'tags.$': newName } }
      ),
      WorkspaceModel.updateMany(
        {
          $or: [
            { ownerId: userId },
            { 'members.userId': userId }
          ],
          tags: oldName
        },
        { $set: { 'tags.$': newName } }
      )
    ]);
  }

  // Update tag
  Object.assign(tag, {
    name: data.name?.trim() || tag.name,
    color: data.color || tag.color,
    description: data.description?.trim() || tag.description
  });

  await tag.save();

  return toTagInterface(tag);
};

// Delete tag
export const deleteTag = async (
  tagId: string,
  userId: string
): Promise<void> => {
  const tag = await TagModel.findOne({
    _id: tagId,
    userId
  });

  if (!tag) {
    throw createNotFoundError('Tag not found');
  }

  // Remove tag from all collections
  await Promise.all([
    DatabaseModel.updateMany(
      { userId, tags: tag.name },
      { $pull: { tags: tag.name } }
    ),
    FileModel.updateMany(
      { userId, tags: tag.name },
      { $pull: { tags: tag.name } }
    ),
    WorkspaceModel.updateMany(
      {
        $or: [
          { ownerId: userId },
          { 'members.userId': userId }
        ],
        tags: tag.name
      },
      { $pull: { tags: tag.name } }
    )
  ]);

  // Delete the tag
  await TagModel.findByIdAndDelete(tagId);
};

// Get popular tags
export const getPopularTags = async (
  userId: string,
  limit: number = 10
): Promise<ITag[]> => {
  const tags = await TagModel.find({ userId })
    .sort({ usageCount: -1 })
    .limit(limit);

  return tags.map(tag => tag.toJSON()) as ITag[];
};

// Update tag usage count
export const updateTagUsage = async (
  userId: string,
  tagNames: string[]
): Promise<void> => {
  if (tagNames.length === 0) return;

  await TagModel.updateMany(
    {
      userId,
      name: { $in: tagNames }
    },
    {
      $inc: { usageCount: 1 }
    }
  );
};

// Helper functions
function toTagInterface(doc: ITagDocument): ITag {
  const obj = doc.toJSON();
  return {
    id: obj._id,
    name: obj.name,
    color: obj.color,
    description: obj.description,
    userId: obj.userId,
    usageCount: obj.usageCount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}
