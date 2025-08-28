import { createNotFoundError } from '@/utils/response.utils';
import { RecordModel } from '@/modules/database/models/record.model';
import { IRichTextContent, ITextAnnotations, RichTextType, MentionType } from '@/modules/database/types/blocks.types';
import { IRichText } from '@/modules/core/types/record.types';
import { createAppError } from '@/utils';
import { generateId } from '@/utils/id-generator';

// Conversion functions between IRichText and IRichTextContent
function convertIRichTextToIRichTextContent(richText: IRichText): IRichTextContent {
  const baseContent = {
    annotations: richText.annotations,
    plain_text: richText.plain_text
  };

  switch (richText.type) {
    case 'text':
      return {
        type: RichTextType.TEXT,
        text: richText.text || { content: '' },
        href: richText.href,
        ...baseContent
      };
    case 'mention':
      // Convert mention type from string to enum
      const mentionType = richText.mention?.type || 'user';
      const convertedMention = {
        type: mentionType as MentionType,
        user: richText.mention?.user,
        page: richText.mention?.page,
        database: richText.mention?.database,
        date: richText.mention?.date
      };
      return {
        type: RichTextType.MENTION,
        mention: convertedMention,
        ...baseContent
      };
    case 'equation':
      return {
        type: RichTextType.EQUATION,
        equation: richText.equation || { expression: '' },
        ...baseContent
      };
    default:
      throw new Error(`Unknown rich text type: ${richText.type}`);
  }
}

function convertIRichTextContentToIRichText(richTextContent: IRichTextContent): IRichText {
  const baseContent = {
    annotations: richTextContent.annotations,
    plain_text: richTextContent.plain_text
  };

  switch (richTextContent.type) {
    case RichTextType.TEXT:
      return {
        type: 'text' as const,
        text: 'text' in richTextContent ? richTextContent.text : undefined,
        href: 'href' in richTextContent ? richTextContent.href : undefined,
        ...baseContent
      };
    case RichTextType.MENTION:
      // Convert mention type from enum to string and simplify structure
      const mention = 'mention' in richTextContent ? richTextContent.mention : undefined;
      const convertedMention = mention ? {
        type: mention.type as 'user' | 'page' | 'database' | 'date',
        user: mention.user ? { id: mention.user.id } : undefined,
        page: mention.page ? { id: mention.page.id } : undefined,
        database: mention.database ? { id: mention.database.id } : undefined,
        date: mention.date
      } : undefined;
      return {
        type: 'mention' as const,
        mention: convertedMention,
        ...baseContent
      };
    case RichTextType.EQUATION:
      return {
        type: 'equation' as const,
        equation: 'equation' in richTextContent ? richTextContent.equation : undefined,
        ...baseContent
      };
    default:
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = richTextContent;
      throw new Error(`Unknown rich text content type: ${(_exhaustiveCheck as any).type}`);
  }
}

export function convertIRichTextArrayToIRichTextContentArray(richTextArray: IRichText[]): IRichTextContent[] {
  return richTextArray.map(convertIRichTextToIRichTextContent);
}

export function convertIRichTextContentArrayToIRichTextArray(richTextContentArray: IRichTextContent[]): IRichText[] {
  return richTextContentArray.map(convertIRichTextContentToIRichText);
}

export interface IEditorOperation {
  type: 'insert' | 'delete' | 'format' | 'replace';
  position: number;
  length?: number;
  content?: string;
  formatting?: Partial<ITextAnnotations>;
  blockId?: string;
  timestamp: number;
  userId: string;
}

export interface IEditorState {
  content: IRichTextContent[];
  selection: {
    start: number;
    end: number;
    blockId?: string;
  };
  version: number;
  lastModified: Date;
  collaborators: string[];
}

export interface IFormattingOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'normal' | 'large';
  link?: { url: string; title?: string };
}

export interface IInsertOptions {
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    id: string;
    displayText: string;
  };
  equation?: {
    expression: string;
    latex?: string;
  };
  embed?: {
    type: 'image' | 'video' | 'file' | 'link';
    url: string;
    caption?: string;
  };
}

export class RichEditorService {
  // Apply text formatting to selection
  async applyFormatting(
    recordId: string,
    blockId: string,
    start: number,
    end: number,
    formatting: IFormattingOptions,
    userId: string
  ): Promise<IRichTextContent[]> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const block = record.content?.find(b => b.id === blockId);
    if (!block) {
      throw createNotFoundError('Block not found');
    }

    // Apply formatting to the specified range
    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
    const updatedContent = this.applyFormattingToRange(
      convertedContent,
      start,
      end,
      formatting
    );

    // Update the block content
    await this.updateBlockContent(recordId, blockId, updatedContent, userId);

    return updatedContent;
  }

  // Insert text at cursor position
  async insertText(
    recordId: string,
    blockId: string,
    position: number,
    text: string,
    formatting?: IFormattingOptions,
    userId?: string
  ): Promise<IRichTextContent[]> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const block = record.content?.find(b => b.id === blockId);
    if (!block) {
      throw createNotFoundError('Block not found');
    }

    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
    const updatedContent = this.insertTextAtPosition(
      convertedContent,
      position,
      text,
      formatting
    );

    await this.updateBlockContent(recordId, blockId, updatedContent, userId);

    return updatedContent;
  }

  // Insert special content (mentions, equations, embeds)
  async insertSpecialContent(
    recordId: string,
    blockId: string,
    position: number,
    options: IInsertOptions,
    userId: string
  ): Promise<IRichTextContent[]> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const block = record.content?.find(b => b.id === blockId);
    if (!block) {
      throw createNotFoundError('Block not found');
    }

    let specialContent: IRichTextContent;

    if (options.mention) {
      specialContent = this.createMentionContent(options.mention);
    } else if (options.equation) {
      specialContent = this.createEquationContent(options.equation);
    } else {
      throw createAppError('Invalid special content type', 400);
    }

    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
    const updatedContent = this.insertContentAtPosition(
      convertedContent,
      position,
      specialContent
    );

    await this.updateBlockContent(recordId, blockId, updatedContent, userId);

    return updatedContent;
  }

  // Delete text range
  async deleteText(
    recordId: string,
    blockId: string,
    start: number,
    end: number,
    userId: string
  ): Promise<IRichTextContent[]> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    const block = record.content?.find(b => b.id === blockId);
    if (!block) {
      throw createNotFoundError('Block not found');
    }

    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content || []);
    const updatedContent = this.deleteTextRange(
      convertedContent,
      start,
      end
    );

    await this.updateBlockContent(recordId, blockId, updatedContent, userId);

    return updatedContent;
  }

  // Convert rich text to different formats
  async exportContent(
    recordId: string,
    format: 'markdown' | 'html' | 'plain' | 'json'
  ): Promise<string> {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      throw createNotFoundError('Record not found');
    }

    switch (format) {
      case 'markdown':
        return this.convertToMarkdown(record.content || []);
      case 'html':
        return this.convertToHtml(record.content || []);
      case 'plain':
        return this.convertToPlainText(record.content || []);
      case 'json':
        return JSON.stringify(record.content, null, 2);
      default:
        throw createAppError('Unsupported export format', 400);
    }
  }

  // Import content from different formats
  async importContent(
    recordId: string,
    content: string,
    format: 'markdown' | 'html' | 'plain',
    userId: string
  ): Promise<any[]> {
    let parsedContent: any[];

    switch (format) {
      case 'markdown':
        parsedContent = this.parseMarkdown(content);
        break;
      case 'html':
        parsedContent = this.parseHtml(content);
        break;
      case 'plain':
        parsedContent = this.parsePlainText(content);
        break;
      default:
        throw createAppError('Unsupported import format', 400);
    }

    // Update record content
    await RecordModel.findByIdAndUpdate(recordId, {
      content: parsedContent,
      lastEditedAt: new Date(),
      lastEditedBy: userId
    });

    return parsedContent;
  }

  // Apply formatting to a range of text
  private applyFormattingToRange(
    content: IRichTextContent[],
    start: number,
    end: number,
    formatting: IFormattingOptions
  ): IRichTextContent[] {
    let currentPos = 0;
    const result: IRichTextContent[] = [];

    for (const item of content) {
      const itemLength = item.plain_text.length;
      const itemEnd = currentPos + itemLength;

      if (currentPos >= end) {
        // After selection, keep as is
        result.push(item);
      } else if (itemEnd <= start) {
        // Before selection, keep as is
        result.push(item);
      } else {
        // Overlaps with selection, need to split and format
        const splitItems = this.splitAndFormatItem(
          item,
          Math.max(0, start - currentPos),
          Math.min(itemLength, end - currentPos),
          formatting
        );
        result.push(...splitItems);
      }

      currentPos = itemEnd;
    }

    return this.mergeAdjacentItems(result);
  }

  // Split text item and apply formatting
  private splitAndFormatItem(
    item: IRichTextContent,
    start: number,
    end: number,
    formatting: IFormattingOptions
  ): IRichTextContent[] {
    if (item.type !== 'text') {
      return [item];
    }

    const text = item.text?.content || '';
    const result: IRichTextContent[] = [];

    // Before formatted section
    if (start > 0) {
      result.push({
        ...item,
        text: { ...item.text, content: text.substring(0, start) },
        plain_text: text.substring(0, start)
      });
    }

    // Formatted section
    const formattedText = text.substring(start, end);
    if (formattedText.length > 0) {
      const newAnnotations = {
        ...item.annotations,
        ...formatting
      };

      result.push({
        ...item,
        text: {
          ...item.text,
          content: formattedText,
          link: formatting.link || item.text?.link
        },
        annotations: newAnnotations,
        plain_text: formattedText,
        href: formatting.link?.url || item.href
      });
    }

    // After formatted section
    if (end < text.length) {
      result.push({
        ...item,
        text: { ...item.text, content: text.substring(end) },
        plain_text: text.substring(end)
      });
    }

    return result;
  }

  // Insert text at specific position
  private insertTextAtPosition(
    content: IRichTextContent[],
    position: number,
    text: string,
    formatting?: IFormattingOptions
  ): IRichTextContent[] {
    let currentPos = 0;
    const result: IRichTextContent[] = [];

    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      const itemLength = item.plain_text.length;
      const itemEnd = currentPos + itemLength;

      if (position <= currentPos) {
        // Insert before this item
        if (result.length === 0) {
          result.push(this.createTextContent(text, formatting));
        }
        result.push(item);
      } else if (position >= itemEnd) {
        // Insert after this item
        result.push(item);
        if (i === content.length - 1) {
          result.push(this.createTextContent(text, formatting));
        }
      } else {
        // Insert within this item
        if (item.type === 'text') {
          const beforeText = item.text?.content.substring(0, position - currentPos) || '';
          const afterText = item.text?.content.substring(position - currentPos) || '';

          if (beforeText) {
            result.push({
              ...item,
              text: { ...item.text, content: beforeText },
              plain_text: beforeText
            });
          }

          result.push(this.createTextContent(text, formatting));

          if (afterText) {
            result.push({
              ...item,
              text: { ...item.text, content: afterText },
              plain_text: afterText
            });
          }
        } else {
          result.push(item);
          result.push(this.createTextContent(text, formatting));
        }
      }

      currentPos = itemEnd;
    }

    if (content.length === 0) {
      result.push(this.createTextContent(text, formatting));
    }

    return this.mergeAdjacentItems(result);
  }

  // Create text content with formatting
  private createTextContent(
    text: string,
    formatting?: IFormattingOptions
  ): IRichTextContent {
    return {
      type: RichTextType.TEXT,
      text: {
        content: text,
        link: formatting?.link
      },
      annotations: {
        bold: formatting?.bold || false,
        italic: formatting?.italic || false,
        underline: formatting?.underline || false,
        strikethrough: formatting?.strikethrough || false,
        code: formatting?.code || false,
        color: formatting?.color || 'default'
      },
      plain_text: text,
      href: formatting?.link?.url
    };
  }

  // Create mention content
  private createMentionContent(mention: {
    type: 'user' | 'page' | 'database' | 'date';
    id: string;
    displayText: string;
  }): IRichTextContent {
    const mentionData: any = {};
    mentionData[mention.type] = { id: mention.id };

    return {
      type: RichTextType.MENTION,
      mention: {
        type: mention.type as MentionType,
        ...mentionData
      },
      annotations: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        code: false,
        color: 'default'
      },
      plain_text: mention.displayText
    };
  }

  // Create equation content
  private createEquationContent(equation: {
    expression: string;
    latex?: string;
  }): IRichTextContent {
    return {
      type: RichTextType.EQUATION,
      equation: {
        expression: equation.expression
      },
      annotations: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        code: false,
        color: 'default'
      },
      plain_text: equation.expression
    };
  }

  // Insert content at position
  private insertContentAtPosition(
    content: IRichTextContent[],
    position: number,
    newContent: IRichTextContent
  ): IRichTextContent[] {
    // Similar to insertTextAtPosition but for rich content
    return this.insertTextAtPosition(content, position, '', {}).concat([newContent]);
  }

  // Delete text range
  private deleteTextRange(
    content: IRichTextContent[],
    start: number,
    end: number
  ): IRichTextContent[] {
    let currentPos = 0;
    const result: IRichTextContent[] = [];

    for (const item of content) {
      const itemLength = item.plain_text.length;
      const itemEnd = currentPos + itemLength;

      if (itemEnd <= start || currentPos >= end) {
        // Outside deletion range
        result.push(item);
      } else if (currentPos >= start && itemEnd <= end) {
        // Completely within deletion range, skip
        continue;
      } else {
        // Partially within deletion range
        if (item.type === 'text') {
          const beforeText = currentPos < start ?
            item.text?.content.substring(0, start - currentPos) : '';
          const afterText = itemEnd > end ?
            item.text?.content.substring(end - currentPos) : '';

          if (beforeText) {
            result.push({
              ...item,
              text: { ...item.text, content: beforeText },
              plain_text: beforeText
            });
          }

          if (afterText) {
            result.push({
              ...item,
              text: { ...item.text, content: afterText },
              plain_text: afterText
            });
          }
        }
      }

      currentPos = itemEnd;
    }

    return this.mergeAdjacentItems(result);
  }

  // Merge adjacent items with same formatting
  private mergeAdjacentItems(content: IRichTextContent[]): IRichTextContent[] {
    if (content.length <= 1) return content;

    const result: IRichTextContent[] = [content[0]];

    for (let i = 1; i < content.length; i++) {
      const current = content[i];
      const previous = result[result.length - 1];

      if (this.canMergeItems(previous, current)) {
        // Merge with previous - only merge text content
        if (previous.type === RichTextType.TEXT && current.type === RichTextType.TEXT) {
          result[result.length - 1] = {
            ...previous,
            text: {
              ...('text' in previous ? previous.text : { content: '' }),
              content: (('text' in previous ? previous.text?.content : '') || '') +
                      (('text' in current ? current.text?.content : '') || '')
            },
            plain_text: previous.plain_text + current.plain_text
          };
        } else {
          // Can't merge non-text items, just add current
          result.push(current);
        }
      } else {
        result.push(current);
      }
    }

    return result;
  }

  // Check if two items can be merged
  private canMergeItems(a: IRichTextContent, b: IRichTextContent): boolean {
    if (a.type !== 'text' || b.type !== 'text') return false;

    return JSON.stringify(a.annotations) === JSON.stringify(b.annotations) &&
           a.href === b.href;
  }

  // Update block content in database
  private async updateBlockContent(
    recordId: string,
    blockId: string,
    content: IRichTextContent[],
    userId?: string
  ): Promise<void> {
    // Convert back to IRichText[] for database storage
    const convertedContent = convertIRichTextContentArrayToIRichTextArray(content);

    await RecordModel.updateOne(
      { _id: recordId, 'content.id': blockId },
      {
        $set: {
          'content.$.content': convertedContent,
          'content.$.lastEditedAt': new Date(),
          'content.$.lastEditedBy': userId,
          lastEditedAt: new Date(),
          lastEditedBy: userId
        }
      }
    );
  }

  // Convert to markdown
  private convertToMarkdown(content: any[]): string {
    // Implementation for markdown conversion
    return content.map(block => this.blockToMarkdown(block)).join('\n\n');
  }

  // Convert to HTML
  private convertToHtml(content: any[]): string {
    // Implementation for HTML conversion
    return content.map(block => this.blockToHtml(block)).join('\n');
  }

  // Convert to plain text
  private convertToPlainText(content: any[]): string {
    // Implementation for plain text conversion
    return content.map(block => this.blockToPlainText(block)).join('\n');
  }

  // Helper methods for format conversion
  private blockToMarkdown(block: any): string {
    // Convert block to markdown
    if (!block.content) return '';
    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content);
    return convertedContent.map((item: IRichTextContent) => item.plain_text).join('') || '';
  }

  private blockToHtml(block: any): string {
    // Convert block to HTML
    if (!block.content) return '<p></p>';
    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content);
    return `<p>${convertedContent.map((item: IRichTextContent) => item.plain_text).join('') || ''}</p>`;
  }

  private blockToPlainText(block: any): string {
    // Convert block to plain text
    if (!block.content) return '';
    const convertedContent = convertIRichTextArrayToIRichTextContentArray(block.content);
    return convertedContent.map((item: IRichTextContent) => item.plain_text).join('') || '';
  }

  // Parse markdown to rich content
  private parseMarkdown(content: string): any[] {
    // Basic markdown parsing implementation
    const lines = content.split('\n');
    return lines.map(line => ({
      id: generateId(),
      type: 'paragraph',
      content: [{
        type: 'text',
        text: { content: line },
        annotations: {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          code: false,
          color: 'default'
        },
        plain_text: line
      }],
      createdAt: new Date(),
      lastEditedAt: new Date()
    }));
  }

  // Parse HTML to rich content
  private parseHtml(content: string): any[] {
    // Basic HTML parsing implementation
    // In a real implementation, you'd use a proper HTML parser
    const textContent = content.replace(/<[^>]*>/g, '');
    return this.parsePlainText(textContent);
  }

  // Parse plain text to rich content
  private parsePlainText(content: string): any[] {
    const lines = content.split('\n');
    return lines.map(line => ({
      id: generateId(),
      type: 'paragraph',
      content: [{
        type: 'text',
        text: { content: line },
        annotations: {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          code: false,
          color: 'default'
        },
        plain_text: line
      }],
      createdAt: new Date(),
      lastEditedAt: new Date()
    }));
  }
}

export const richEditorService = new RichEditorService();
