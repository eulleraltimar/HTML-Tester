export interface HTMLStats {
  wordCount: number;
  charCount: number;
  readabilityScore: number; // 0-100 Flesch Reading Ease
  readabilityLabel: string;
}

export interface AISuggestions {
  title: string;
  description: string;
  keyword: string;
  loading: boolean;
  error?: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
}