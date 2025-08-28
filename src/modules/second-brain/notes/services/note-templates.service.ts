import { TemplateModel } from '@/modules/templates/models/template.model';
import { notesService } from './notes.service';
import {
  INoteTemplate,
  ICreateNoteRequest,
  INoteContentBlock,
  EContentBlockType
} from '../types/notes.types';
import {
  createAppError,
  createNotFoundError,
  createValidationError,
  createForbiddenError
} from '@/utils/error.utils';
import { generateId } from '@/utils/id-generator';
import { createEmptyBlock } from '../utils/notes.utils';

export class NoteTemplatesService {

  async createNoteTemplate(data: {
    name: string;
    description?: string;
    content: INoteContentBlock[];
    tags?: string[];
    isPublic?: boolean;
  }, userId: string): Promise<INoteTemplate> {
    try {
      const template = new TemplateModel({
        _id: generateId(),
        name: data.name,
        description: data.description,
        type: 'note',
        content: {
          blocks: data.content,
          metadata: {
            tags: data.tags || [],
            wordCount: this.calculateWordCount(data.content),
            blockCount: data.content.length
          }
        },
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        usageCount: 0,
        createdBy: userId
      });

      const savedTemplate = await template.save();
      return this.formatTemplateResponse(savedTemplate);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to create note template: ${error.message}`, 500);
    }
  }

  async getNoteTemplates(params: {
    search?: string;
    tags?: string[];
    isPublic?: boolean;
    createdBy?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, userId: string): Promise<{
    templates: INoteTemplate[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const query = this.buildTemplateQuery(params, userId);
      const { page = 1, limit = 25, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

      const skip = (page - 1) * limit;
      const sortOptions: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [templates, total] = await Promise.all([
        TemplateModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        TemplateModel.countDocuments(query)
      ]);

      const formattedTemplates = templates.map(template => this.formatTemplateResponse(template));

      const hasNext = skip + limit < total;
      const hasPrev = page > 1;

      return {
        templates: formattedTemplates,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get note templates: ${error.message}`, 500);
    }
  }

  async getNoteTemplateById(id: string, userId: string): Promise<INoteTemplate> {
    try {
      const template = await TemplateModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!template) {
        throw createNotFoundError('Note template', id);
      }

      // Check if user can access this template
      if (!(template as any).isPublic && template.createdBy !== userId) {
        throw createForbiddenError('Insufficient permissions to view this template');
      }

      return this.formatTemplateResponse(template);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to get note template: ${error.message}`, 500);
    }
  }

  async updateNoteTemplate(id: string, data: {
    name?: string;
    description?: string;
    content?: INoteContentBlock[];
    tags?: string[];
    isPublic?: boolean;
  }, userId: string): Promise<INoteTemplate> {
    try {
      const template = await TemplateModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!template) {
        throw createNotFoundError('Note template', id);
      }

      // Check if user can edit this template
      if (template.createdBy !== userId) {
        throw createForbiddenError('Insufficient permissions to edit this template');
      }

      const updateData: any = {
        updatedBy: userId,
        updatedAt: new Date()
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.content !== undefined) {
        updateData.content = {
          blocks: data.content,
          metadata: {
            tags: data.tags || template.tags,
            wordCount: this.calculateWordCount(data.content),
            blockCount: data.content.length
          }
        };
      }
      if (data.tags !== undefined) {
        updateData.tags = data.tags;
      }
      if (data.isPublic !== undefined) {
        updateData.isPublic = data.isPublic;
      }

      const updatedTemplate = await TemplateModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedTemplate) {
        throw createNotFoundError('Note template', id);
      }

      return this.formatTemplateResponse(updatedTemplate);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to update note template: ${error.message}`, 500);
    }
  }

  async deleteNoteTemplate(id: string, userId: string, permanent: boolean = false): Promise<void> {
    try {
      const template = await TemplateModel.findOne({
        _id: id,
        isDeleted: { $ne: true }
      }).exec();

      if (!template) {
        throw createNotFoundError('Note template', id);
      }

      // Check if user can delete this template
      if (template.createdBy !== userId) {
        throw createForbiddenError('Insufficient permissions to delete this template');
      }

      if (permanent) {
        await TemplateModel.findByIdAndDelete(id);
      } else {
        await TemplateModel.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        });
      }
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to delete note template: ${error.message}`, 500);
    }
  }

  async applyNoteTemplate(templateId: string, data: {
    databaseId: string;
    title?: string;
    customValues?: Record<string, any>;
  }, userId: string): Promise<any> {
    try {
      const template = await this.getNoteTemplateById(templateId, userId);

      // Increment usage count
      await TemplateModel.findByIdAndUpdate(templateId, {
        $inc: { usageCount: 1 }
      });

      // Create note from template
      const noteData: ICreateNoteRequest = {
        databaseId: data.databaseId,
        title: data.title || `New note from ${template.name}`,
        content: this.processTemplateContent(template.content, data.customValues || {}),
        tags: template.tags,
        isPublished: false,
        allowComments: true
      };

      return await notesService.createNote(noteData, userId);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to apply note template: ${error.message}`, 500);
    }
  }

  async duplicateNoteTemplate(id: string, data: {
    name?: string;
    isPublic?: boolean;
  }, userId: string): Promise<INoteTemplate> {
    try {
      const originalTemplate = await this.getNoteTemplateById(id, userId);

      const duplicateData = {
        name: data.name || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        content: JSON.parse(JSON.stringify(originalTemplate.content)), // Deep copy
        tags: [...originalTemplate.tags],
        isPublic: data.isPublic !== undefined ? data.isPublic : false
      };

      return await this.createNoteTemplate(duplicateData, userId);
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createAppError(`Failed to duplicate note template: ${error.message}`, 500);
    }
  }

  async getPopularNoteTemplates(limit: number = 10): Promise<INoteTemplate[]> {
    try {
      const templates = await TemplateModel.find({
        type: 'note',
        isPublic: true,
        isDeleted: { $ne: true }
      })
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(limit)
        .exec();

      return templates.map(template => this.formatTemplateResponse(template));
    } catch (error: any) {
      throw createAppError(`Failed to get popular note templates: ${error.message}`, 500);
    }
  }

  async getFeaturedNoteTemplates(limit: number = 10): Promise<INoteTemplate[]> {
    try {
      const templates = await TemplateModel.find({
        type: 'note',
        isPublic: true,
        isFeatured: true,
        isDeleted: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return templates.map(template => this.formatTemplateResponse(template));
    } catch (error: any) {
      throw createAppError(`Failed to get featured note templates: ${error.message}`, 500);
    }
  }

  // Helper methods
  private buildTemplateQuery(params: any, userId: string): any {
    const query: any = {
      type: 'note',
      isDeleted: { $ne: true }
    };

    // Public templates or user's own templates
    query.$or = [
      { isPublic: true },
      { createdBy: userId }
    ];

    if (params.search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: params.search, $options: 'i' } },
          { description: { $regex: params.search, $options: 'i' } }
        ]
      });
    }

    if (params.tags && params.tags.length > 0) {
      query.tags = { $in: params.tags };
    }

    if (params.isPublic !== undefined) {
      query.isPublic = params.isPublic;
    }

    if (params.createdBy) {
      query.createdBy = params.createdBy;
    }

    return query;
  }

  private formatTemplateResponse(template: any): INoteTemplate {
    return {
      id: template._id.toString(),
      name: template.name,
      description: template.description,
      content: template.content?.blocks || [],
      tags: template.tags || [],
      isPublic: template.isPublic || false,
      usageCount: template.usageCount || 0,
      createdBy: template.createdBy,
      createdAt: template.createdAt
    };
  }

  private calculateWordCount(content: INoteContentBlock[]): number {
    let wordCount = 0;

    const countInBlock = (block: INoteContentBlock): void => {
      if (block.content) {
        block.content.forEach(element => {
          if (element.text?.content) {
            const words = element.text.content.split(/\s+/).filter(word => word.length > 0);
            wordCount += words.length;
          }
        });
      }

      if (block.children) {
        block.children.forEach(countInBlock);
      }
    };

    content.forEach(countInBlock);
    return wordCount;
  }

  private processTemplateContent(content: INoteContentBlock[], customValues: Record<string, any>): INoteContentBlock[] {
    // Process template variables in content
    const processBlock = (block: INoteContentBlock): INoteContentBlock => {
      const processedBlock = { ...block };

      if (processedBlock.content) {
        processedBlock.content = processedBlock.content.map(element => {
          if (element.text?.content) {
            let processedContent = element.text.content;

            // Replace template variables like {{variable}}
            Object.entries(customValues).forEach(([key, value]) => {
              const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
              processedContent = processedContent.replace(regex, String(value));
            });

            return {
              ...element,
              text: {
                ...element.text,
                content: processedContent
              }
            };
          }
          return element;
        });
      }

      if (processedBlock.children) {
        processedBlock.children = processedBlock.children.map(processBlock);
      }

      return processedBlock;
    };

    return content.map(processBlock);
  }
}

export const noteTemplatesService = new NoteTemplatesService();
export default noteTemplatesService;
