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
