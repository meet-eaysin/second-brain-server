import { createAppError } from '@/utils';
import { IRichTextContent, RichTextType } from '@/modules/database/types/blocks.types';

export interface ITextStatistics {
  characterCount: number;
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTime: number; // in minutes
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
}

export interface ISpellCheckResult {
  word: string;
  position: number;
  suggestions: string[];
  confidence: number;
}

export interface IAutoCompleteResult {
  text: string;
  confidence: number;
  type: 'word' | 'phrase' | 'sentence';
}

export interface ITextAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
  topics: string[];
  language: string;
  readabilityScore: number;
}

export interface IFormattingRule {
  pattern: RegExp;
  replacement: string;
  type: 'bold' | 'italic' | 'code' | 'link';
}

const commonWords = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'must',
  'shall'
]);

const formattingRules: IFormattingRule[] = [
  {
    pattern: /\*\*(.*?)\*\*/g,
    replacement: '$1',
    type: 'bold'
  },
  {
    pattern: /\*(.*?)\*/g,
    replacement: '$1',
    type: 'italic'
  },
  {
    pattern: /`(.*?)`/g,
    replacement: '$1',
    type: 'code'
  },
  {
    pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
    replacement: '$1',
    type: 'link'
  }
];

export const textProcessingService = {
  // Calculate text statistics
  calculateStatistics: function (content: IRichTextContent[]): ITextStatistics {
    const text = this.extractPlainText(content);

    const characterCount = text.length;
    const words = this.extractWords(text);
    const wordCount = words.length;
    const paragraphs = text.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Reading time calculation (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

    return {
      characterCount,
      wordCount,
      paragraphCount,
      sentenceCount,
      readingTime,
      averageWordsPerSentence,
      averageSentencesPerParagraph
    };
  },

  // Auto-complete text suggestions
  generateAutoComplete: function (
    content: IRichTextContent[],
    cursorPosition: number,
    context: string = ''
  ): IAutoCompleteResult[] {
    const text = this.extractPlainText(content);
    const beforeCursor = text.substring(0, cursorPosition);
    const currentWord = this.getCurrentWord(beforeCursor);

    const suggestions: IAutoCompleteResult[] = [];

    // Word completion
    if (currentWord.length > 2) {
      const wordSuggestions = this.getWordSuggestions(currentWord, text);
      suggestions.push(...wordSuggestions);
    }

    // Phrase completion
    const phraseSuggestions = this.getPhraseSuggestions(beforeCursor, context);
    suggestions.push(...phraseSuggestions);

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  },

  // Spell check
  performSpellCheck: function (content: IRichTextContent[]): ISpellCheckResult[] {
    const text = this.extractPlainText(content);
    const words = this.extractWordsWithPositions(text);
    const errors: ISpellCheckResult[] = [];

    for (const { word, position } of words) {
      if (!this.isWordCorrect(word)) {
        const suggestions = this.getSpellingSuggestions(word);
        errors.push({
          word,
          position,
          suggestions,
          confidence: this.calculateSpellingConfidence(word, suggestions)
        });
      }
    }

    return errors;
  },

  // Analyze text content
  analyzeText: function (content: IRichTextContent[]): ITextAnalysis {
    const text = this.extractPlainText(content);

    return {
      sentiment: this.analyzeSentiment(text),
      confidence: 0.8, // Placeholder
      keywords: this.extractKeywords(text),
      topics: this.extractTopics(text),
      language: this.detectLanguage(text),
      readabilityScore: this.calculateReadabilityScore(text)
    };
  },

  // Auto-format text with markdown-like syntax
  autoFormat: function (content: IRichTextContent[]): IRichTextContent[] {
    return content.map(item => {
      if (item.type === RichTextType.TEXT && item.text?.content) {
        return this.applyAutoFormatting(item);
      }
      return item;
    });
  },

  // Extract keywords from text
  extractKeywords: function (text: string, limit: number = 10): string[] {
    const words = this.extractWords(text.toLowerCase());
    const wordFreq = new Map<string, number>();

    // Count word frequencies
    words.forEach(word => {
      if (!commonWords.has(word) && word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Sort by frequency and return top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  },

  // Generate text summary
  generateSummary: function (content: IRichTextContent[], maxSentences: number = 3): string {
    const text = this.extractPlainText(content);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length <= maxSentences) {
      return text;
    }

    // Simple extractive summarization
    const sentenceScores = sentences.map((sentence: string) => ({
      sentence: sentence.trim(),
      score: this.calculateSentenceScore(sentence, text)
    }));

    // Sort by score and take top sentences
    const topSentences = sentenceScores
      .sort(
        (a: { sentence: string; score: number }, b: { sentence: string; score: number }) =>
          b.score - a.score
      )
      .slice(0, maxSentences)
      .map((item: { sentence: string; score: number }) => item.sentence);

    return topSentences.join('. ') + '.';
  },

  // Convert between formats
  convertFormat: function (
    content: IRichTextContent[],
    fromFormat: 'rich' | 'markdown' | 'html',
    toFormat: 'rich' | 'markdown' | 'html'
  ): string | IRichTextContent[] {
    if (fromFormat === toFormat) {
      return content;
    }

    switch (toFormat) {
      case 'markdown':
        return this.convertToMarkdown(content);
      case 'html':
        return this.convertToHtml(content);
      case 'rich':
        if (fromFormat === 'markdown') {
          return this.parseMarkdown(content as any);
        } else if (fromFormat === 'html') {
          return this.parseHtml(content as any);
        }
        break;
    }

    throw createAppError('Unsupported format conversion', 400);
  },

  // Private helper methods

  extractPlainText: function (content: IRichTextContent[]): string {
    return content.map(item => item.plain_text || '').join('');
  },

  extractWords: function (text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  },

  extractWordsWithPositions: function (text: string): Array<{ word: string; position: number }> {
    const words: Array<{ word: string; position: number }> = [];
    const regex = /\b\w+\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      words.push({
        word: match[0],
        position: match.index
      });
    }

    return words;
  },

  getCurrentWord: function (text: string): string {
    const words = text.split(/\s+/);
    return words[words.length - 1] || '';
  },

  getWordSuggestions: function (currentWord: string, context: string): IAutoCompleteResult[] {
    const words = this.extractWords(context);
    const suggestions: IAutoCompleteResult[] = [];

    // Find words that start with current word
    const matchingWords = words.filter(
      word => word.startsWith(currentWord.toLowerCase()) && word !== currentWord.toLowerCase()
    );

    // Remove duplicates and calculate confidence
    const uniqueWords = [...new Set(matchingWords)];

    uniqueWords.forEach(word => {
      const frequency = words.filter(w => w === word).length;
      suggestions.push({
        text: word,
        confidence: Math.min(0.9, (frequency / words.length) * 10),
        type: 'word'
      });
    });

    return suggestions;
  },

  getPhraseSuggestions: function (beforeCursor: string, context: string): IAutoCompleteResult[] {
    // Simple phrase completion based on common patterns
    const suggestions: IAutoCompleteResult[] = [];

    const lastWords = beforeCursor.trim().split(/\s+/).slice(-2);

    // Common phrase patterns
    const patterns = [
      { trigger: ['in', 'order'], completion: 'to', confidence: 0.8 },
      { trigger: ['as', 'well'], completion: 'as', confidence: 0.7 },
      { trigger: ['on', 'the'], completion: 'other hand', confidence: 0.6 },
      { trigger: ['for'], completion: 'example', confidence: 0.5 }
    ];

    patterns.forEach((pattern: { trigger: string[]; completion: string; confidence: number }) => {
      if (
        pattern.trigger.every(
          (word: string, index: number) =>
            lastWords[lastWords.length - pattern.trigger.length + index] === word
        )
      ) {
        suggestions.push({
          text: pattern.completion,
          confidence: pattern.confidence,
          type: 'phrase'
        });
      }
    });

    return suggestions;
  },

  isWordCorrect: function (word: string): boolean {
    // Simple spell check - in a real implementation, use a proper dictionary
    return word.length > 0 && /^[a-zA-Z]+$/.test(word);
  },

  getSpellingSuggestions: function (word: string): string[] {
    // Simple suggestions based on edit distance
    // In a real implementation, use a proper spell checker
    const suggestions = [];

    // Common corrections
    const corrections: Record<string, string> = {
      teh: 'the',
      adn: 'and',
      recieve: 'receive',
      seperate: 'separate',
      definately: 'definitely'
    };

    if (corrections[word.toLowerCase()]) {
      suggestions.push(corrections[word.toLowerCase()]);
    }

    return suggestions;
  },

  calculateSpellingConfidence: function (word: string, suggestions: string[]): number {
    return suggestions.length > 0 ? 0.8 : 0.3;
  },

  analyzeSentiment: function (text: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];

    const words = this.extractWords(text);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  },

  extractTopics: function (text: string): string[] {
    // Simple topic extraction based on keyword clustering
    const keywords = this.extractKeywords(text, 20);

    // Group related keywords (simplified)
    const topics = [];
    if (keywords.some(k => ['technology', 'software', 'computer', 'digital'].includes(k))) {
      topics.push('Technology');
    }
    if (keywords.some(k => ['business', 'market', 'company', 'finance'].includes(k))) {
      topics.push('Business');
    }
    if (keywords.some(k => ['science', 'research', 'study', 'analysis'].includes(k))) {
      topics.push('Science');
    }

    return topics;
  },

  detectLanguage: function (text: string): string {
    // Simple language detection - in a real implementation, use a proper library
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const words = this.extractWords(text);
    const englishCount = words.filter(word => englishWords.includes(word)).length;

    return englishCount > words.length * 0.1 ? 'en' : 'unknown';
  },

  calculateReadabilityScore: function (text: string): number {
    // Simplified Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.extractWords(text);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  },

  countSyllables: function (word: string): number {
    // Simple syllable counting
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent e
    if (word.toLowerCase().endsWith('e')) {
      count--;
    }

    return Math.max(1, count);
  },

  calculateSentenceScore: function (sentence: string, fullText: string): number {
    const words = this.extractWords(sentence);
    const keywords = this.extractKeywords(fullText, 10);

    // Score based on keyword presence and sentence position
    let score = 0;

    words.forEach(word => {
      if (keywords.includes(word)) {
        score += 1;
      }
    });

    // Normalize by sentence length
    return words.length > 0 ? score / words.length : 0;
  },

  applyAutoFormatting: function (item: IRichTextContent): IRichTextContent {
    if (item.type !== RichTextType.TEXT || !item.text?.content) {
      return item;
    }

    let content = item.text.content;
    const annotations = { ...item.annotations };

    // Apply formatting rules
    formattingRules.forEach(rule => {
      if (rule.pattern.test(content)) {
        switch (rule.type) {
          case 'bold':
            annotations.bold = true;
            break;
          case 'italic':
            annotations.italic = true;
            break;
          case 'code':
            annotations.code = true;
            break;
        }
        content = content.replace(rule.pattern, rule.replacement);
      }
    });

    return {
      ...item,
      text: {
        ...item.text,
        content
      },
      annotations,
      plain_text: content
    };
  },

  convertToMarkdown: function (content: IRichTextContent[]): string {
    return content
      .map(item => {
        if (item.type === RichTextType.TEXT) {
          let text = item.plain_text || '';

          if (item.annotations.bold) text = `**${text}**`;
          if (item.annotations.italic) text = `*${text}*`;
          if (item.annotations.strikethrough) text = `~~${text}~~`;
          if (item.annotations.code) text = `\`${text}\``;
          if (item.href) text = `[${text}](${item.href})`;

          return text;
        }
        return item.plain_text || '';
      })
      .join('');
  },

  convertToHtml: function (content: IRichTextContent[]): string {
    return content
      .map(item => {
        if (item.type === RichTextType.TEXT) {
          let text = item.plain_text || '';

          if (item.annotations.bold) text = `<strong>${text}</strong>`;
          if (item.annotations.italic) text = `<em>${text}</em>`;
          if (item.annotations.underline) text = `<u>${text}</u>`;
          if (item.annotations.strikethrough) text = `<del>${text}</del>`;
          if (item.annotations.code) text = `<code>${text}</code>`;
          if (item.href) text = `<a href="${item.href}">${text}</a>`;

          return text;
        }
        return item.plain_text || '';
      })
      .join('');
  },

  parseMarkdown: function (content: string): IRichTextContent[] {
    // Basic markdown parsing - in a real implementation, use a proper parser
    const lines = content.split('\n');
    return lines.map(line => ({
      type: RichTextType.TEXT,
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
    }));
  },

  parseHtml: function (content: string): IRichTextContent[] {
    // Basic HTML parsing - in a real implementation, use a proper parser
    const textContent = content.replace(/<[^>]*>/g, '');
    return [
      {
        type: RichTextType.TEXT,
        text: { content: textContent },
        annotations: {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          code: false,
          color: 'default'
        },
        plain_text: textContent
      }
    ];
  }
};
