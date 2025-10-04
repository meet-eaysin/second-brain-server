import { INoteContentBlock, IRichTextElement } from '../types/notes.types';
import { EContentBlockType } from '@/modules/core/types/record.types';

// Extract plain text from rich content blocks
export const extractTextFromContent = (content: INoteContentBlock[]): string => {
  const extractFromBlock = (block: INoteContentBlock): string => {
    let text = '';

    // Extract text from block content
    if (block.content) {
      text += block.content.map(element => element.plain_text || '').join('');
    }

    // Add newlines for certain block types
    if (
      [
        EContentBlockType.PARAGRAPH,
        EContentBlockType.HEADING_1,
        EContentBlockType.HEADING_2,
        EContentBlockType.HEADING_3,
        EContentBlockType.BULLETED_LIST_ITEM,
        EContentBlockType.NUMBERED_LIST_ITEM,
        EContentBlockType.TO_DO,
        EContentBlockType.QUOTE
      ].includes(block.type)
    ) {
      text += '\n';
    }

    // Extract text from children
    if (block.children) {
      text += block.children.map(extractFromBlock).join('');
    }

    return text;
  };

  return content.map(extractFromBlock).join('').trim();
};

// Calculate word count from content
export const calculateWordCount = (content: INoteContentBlock[]): number => {
  const text = extractTextFromContent(content);
  if (!text) return 0;

  // Split by whitespace and filter out empty strings
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
};

// Calculate reading time (average 200 words per minute)
export const calculateReadingTime = (wordCount: number): number => {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Generate note preview (first few sentences)
export const generateNotePreview = (
  content: INoteContentBlock[],
  maxLength: number = 200
): string => {
  const text = extractTextFromContent(content);
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  // Try to break at sentence boundaries
  const sentences = text.split(/[.!?]+/);
  let preview = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if ((preview + trimmedSentence).length > maxLength) {
      break;
    }

    preview += (preview ? '. ' : '') + trimmedSentence;
  }

  return preview + (preview.length < text.length ? '...' : '');
};

// Format note content for different outputs
export const formatNoteContent = (
  content: INoteContentBlock[],
  format: 'markdown' | 'html' | 'plain'
): string => {
  const formatBlock = (block: INoteContentBlock, depth: number = 0): string => {
    const indent = '  '.repeat(depth);
    let result = '';

    switch (format) {
      case 'markdown':
        result = formatBlockToMarkdown(block, depth);
        break;
      case 'html':
        result = formatBlockToHtml(block, depth);
        break;
      case 'plain':
        result = formatBlockToPlain(block, depth);
        break;
    }

    // Add children
    if (block.children) {
      result += block.children.map(child => formatBlock(child, depth + 1)).join('');
    }

    return result;
  };

  return content.map(block => formatBlock(block)).join('');
};

// Format block to Markdown
const formatBlockToMarkdown = (block: INoteContentBlock, depth: number): string => {
  const text = block.content.map(formatRichTextToMarkdown).join('');
  const indent = '  '.repeat(depth);

  switch (block.type) {
    case EContentBlockType.HEADING_1:
      return `# ${text}\n\n`;
    case EContentBlockType.HEADING_2:
      return `## ${text}\n\n`;
    case EContentBlockType.HEADING_3:
      return `### ${text}\n\n`;
    case EContentBlockType.PARAGRAPH:
      return `${text}\n\n`;
    case EContentBlockType.BULLETED_LIST_ITEM:
      return `${indent}- ${text}\n`;
    case EContentBlockType.NUMBERED_LIST_ITEM:
      return `${indent}1. ${text}\n`;
    case EContentBlockType.TO_DO:
      const checked = block.checked ? 'x' : ' ';
      return `${indent}- [${checked}] ${text}\n`;
    case EContentBlockType.QUOTE:
      return `> ${text}\n\n`;
    case EContentBlockType.CODE:
      const language = block.language || '';
      return `\`\`\`${language}\n${text}\n\`\`\`\n\n`;
    case EContentBlockType.DIVIDER:
      return '---\n\n';
    case EContentBlockType.CALLOUT:
      const icon = block.icon || '💡';
      return `> ${icon} ${text}\n\n`;
    default:
      return `${text}\n`;
  }
};

// Format block to HTML
const formatBlockToHtml = (block: INoteContentBlock, depth: number): string => {
  const text = block.content.map(formatRichTextToHtml).join('');

  switch (block.type) {
    case EContentBlockType.HEADING_1:
      return `<h1>${text}</h1>\n`;
    case EContentBlockType.HEADING_2:
      return `<h2>${text}</h2>\n`;
    case EContentBlockType.HEADING_3:
      return `<h3>${text}</h3>\n`;
    case EContentBlockType.PARAGRAPH:
      return `<p>${text}</p>\n`;
    case EContentBlockType.BULLETED_LIST_ITEM:
      return `<li>${text}</li>\n`;
    case EContentBlockType.NUMBERED_LIST_ITEM:
      return `<li>${text}</li>\n`;
    case EContentBlockType.TO_DO:
      const checked = block.checked ? 'checked' : '';
      return `<label><input type="checkbox" ${checked}> ${text}</label>\n`;
    case EContentBlockType.QUOTE:
      return `<blockquote>${text}</blockquote>\n`;
    case EContentBlockType.CODE:
      const language = block.language || '';
      return `<pre><code class="language-${language}">${text}</code></pre>\n`;
    case EContentBlockType.DIVIDER:
      return '<hr>\n';
    case EContentBlockType.CALLOUT:
      const icon = block.icon || '💡';
      const color = block.color || 'blue';
      return `<div class="callout callout-${color}">${icon} ${text}</div>\n`;
    default:
      return `<div>${text}</div>\n`;
  }
};

// Format block to plain text
const formatBlockToPlain = (block: INoteContentBlock, depth: number): string => {
  const text = block.content.map(element => element.plain_text || '').join('');
  const indent = '  '.repeat(depth);

  switch (block.type) {
    case EContentBlockType.HEADING_1:
    case EContentBlockType.HEADING_2:
    case EContentBlockType.HEADING_3:
      return `${text}\n${'='.repeat(text.length)}\n\n`;
    case EContentBlockType.BULLETED_LIST_ITEM:
      return `${indent}• ${text}\n`;
    case EContentBlockType.NUMBERED_LIST_ITEM:
      return `${indent}1. ${text}\n`;
    case EContentBlockType.TO_DO:
      const checked = block.checked ? '✓' : '☐';
      return `${indent}${checked} ${text}\n`;
    case EContentBlockType.QUOTE:
      return `${indent}"${text}"\n\n`;
    case EContentBlockType.DIVIDER:
      return `${'─'.repeat(50)}\n\n`;
    default:
      return `${text}\n\n`;
  }
};

// Format rich text to Markdown
const formatRichTextToMarkdown = (element: IRichTextElement): string => {
  let text = element.plain_text || '';

  if (element.annotations.bold) text = `**${text}**`;
  if (element.annotations.italic) text = `*${text}*`;
  if (element.annotations.strikethrough) text = `~~${text}~~`;
  if (element.annotations.code) text = `\`${text}\``;
  if (element.href) text = `[${text}](${element.href})`;

  return text;
};

// Format rich text to HTML
const formatRichTextToHtml = (element: IRichTextElement): string => {
  let text = element.plain_text || '';

  if (element.annotations.bold) text = `<strong>${text}</strong>`;
  if (element.annotations.italic) text = `<em>${text}</em>`;
  if (element.annotations.strikethrough) text = `<del>${text}</del>`;
  if (element.annotations.underline) text = `<u>${text}</u>`;
  if (element.annotations.code) text = `<code>${text}</code>`;
  if (element.href) text = `<a href="${element.href}">${text}</a>`;

  // Add color styling
  if (element.annotations.color !== 'default') {
    text = `<span style="color: ${element.annotations.color}">${text}</span>`;
  }

  return text;
};

// Search within note content
export const searchInContent = (
  content: INoteContentBlock[],
  query: string,
  caseSensitive: boolean = false
): Array<{
  blockId: string;
  blockType: EContentBlockType;
  content: string;
  context: string;
}> => {
  const results: Array<{
    blockId: string;
    blockType: EContentBlockType;
    content: string;
    context: string;
  }> = [];

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  const searchBlock = (block: INoteContentBlock): void => {
    const blockText = block.content.map(element => element.plain_text || '').join('');
    const searchText = caseSensitive ? blockText : blockText.toLowerCase();

    if (searchText.includes(searchQuery)) {
      // Find the context around the match
      const index = searchText.indexOf(searchQuery);
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(blockText.length, index + query.length + 50);
      const context = blockText.substring(contextStart, contextEnd);

      results.push({
        blockId: block.id,
        blockType: block.type,
        content: blockText,
        context:
          contextStart > 0
            ? '...' + context
            : context + (contextEnd < blockText.length ? '...' : '')
      });
    }

    // Search in children
    if (block.children) {
      block.children.forEach(searchBlock);
    }
  };

  content.forEach(searchBlock);
  return results;
};

// Extract mentions from content
export const extractMentions = (content: INoteContentBlock[]): string[] => {
  const mentions = new Set<string>();

  const extractFromBlock = (block: INoteContentBlock): void => {
    block.content.forEach(element => {
      if (element.mention?.type === 'user' && element.mention.user?.id) {
        mentions.add(element.mention.user.id);
      }
    });

    if (block.children) {
      block.children.forEach(extractFromBlock);
    }
  };

  content.forEach(extractFromBlock);
  return Array.from(mentions);
};

// Extract links from content
export const extractLinks = (
  content: INoteContentBlock[]
): Array<{
  url: string;
  text: string;
  blockId: string;
}> => {
  const links: Array<{
    url: string;
    text: string;
    blockId: string;
  }> = [];

  const extractFromBlock = (block: INoteContentBlock): void => {
    block.content.forEach(element => {
      if (element.href) {
        links.push({
          url: element.href,
          text: element.plain_text || '',
          blockId: block.id
        });
      }

      if (element.text?.link?.url) {
        links.push({
          url: element.text.link.url,
          text: element.plain_text || '',
          blockId: block.id
        });
      }
    });

    if (block.children) {
      block.children.forEach(extractFromBlock);
    }
  };

  content.forEach(extractFromBlock);
  return links;
};

// Generate note outline from headings
export const generateNoteOutline = (
  content: INoteContentBlock[]
): Array<{
  id: string;
  level: number;
  text: string;
  children: any[];
}> => {
  const outline: Array<{
    id: string;
    level: number;
    text: string;
    children: any[];
  }> = [];

  const extractHeadings = (blocks: INoteContentBlock[]): void => {
    blocks.forEach(block => {
      if (
        [
          EContentBlockType.HEADING_1,
          EContentBlockType.HEADING_2,
          EContentBlockType.HEADING_3
        ].includes(block.type)
      ) {
        const level =
          block.type === EContentBlockType.HEADING_1
            ? 1
            : block.type === EContentBlockType.HEADING_2
              ? 2
              : 3;
        const text = block.content.map(element => element.plain_text || '').join('');

        outline.push({
          id: block.id,
          level,
          text,
          children: []
        });
      }

      if (block.children) {
        extractHeadings(block.children);
      }
    });
  };

  extractHeadings(content);
  return outline;
};

// Validate note content structure
export const validateNoteContent = (
  content: INoteContentBlock[]
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  const validateBlock = (block: INoteContentBlock, path: string): void => {
    // Check required fields
    if (!block.id) {
      errors.push(`${path}: Block missing ID`);
    }

    if (!block.type) {
      errors.push(`${path}: Block missing type`);
    }

    if (!Array.isArray(block.content)) {
      errors.push(`${path}: Block content must be an array`);
    }

    // Validate content elements
    block.content?.forEach((element, index) => {
      if (!element.plain_text && element.plain_text !== '') {
        errors.push(`${path}.content[${index}]: Missing plain_text`);
      }
    });

    // Validate children
    if (block.children) {
      if (!Array.isArray(block.children)) {
        errors.push(`${path}: Children must be an array`);
      } else {
        block.children.forEach((child, index) => {
          validateBlock(child, `${path}.children[${index}]`);
        });
      }
    }
  };

  content.forEach((block, index) => {
    validateBlock(block, `content[${index}]`);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate unique block ID
export const generateBlockId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create empty content block
export const createEmptyBlock = (type: EContentBlockType, userId: string): INoteContentBlock => {
  const now = new Date();

  const richTextElement: IRichTextElement = {
    type: 'text',
    text: { content: '' },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default'
    },
    plain_text: ''
  };

  return {
    id: generateBlockId(),
    type,
    content: [richTextElement],
    createdAt: now,
    createdBy: userId,
    lastEditedAt: now,
    lastEditedBy: userId
  };
};
