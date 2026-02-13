import { HTMLStats } from '../types.ts';

export const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
};

export const calculateFleschReadingEase = (text: string): { score: number; label: string } => {
  if (!text.trim()) return { score: 0, label: 'N/A' };

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g)?.length || Math.max(1, text.split('\n').length);
  const wordsArray = text.trim().split(/\s+/);
  const words = wordsArray.length;
  
  if (words === 0) return { score: 0, label: 'N/A' };

  let totalSyllables = 0;
  wordsArray.forEach((word) => {
    totalSyllables += countSyllables(word);
  });

  // Fórmula de Facilidade de Leitura Flesch
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words);
  const clampedScore = Math.min(100, Math.max(0, score));

  let label = '';
  if (clampedScore >= 90) label = 'Muito Fácil';
  else if (clampedScore >= 80) label = 'Fácil';
  else if (clampedScore >= 70) label = 'Razoavelmente Fácil';
  else if (clampedScore >= 60) label = 'Padrão';
  else if (clampedScore >= 50) label = 'Razoavelmente Difícil';
  else if (clampedScore >= 30) label = 'Difícil';
  else label = 'Muito Difícil';

  return { score: Math.round(clampedScore), label };
};

export const analyzeHtml = (html: string): HTMLStats => {
  // Remover tags HTML para analisar o conteúdo do texto (usado para contagem de palavras e legibilidade)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const textContent = doc.body.textContent || '';
  
  const wordsArray = textContent.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = wordsArray.length;
  
  // Contagem de caracteres agora usa o HTML bruto (inclui tags e espaços)
  const charCount = html.length;
  
  const readability = calculateFleschReadingEase(textContent);
  
  return {
    wordCount,
    charCount,
    readabilityScore: readability.score,
    readabilityLabel: readability.label,
  };
};