import { WordData, QuizMode, QuizPerformance, QuizAttempt } from '../types';
import { State } from './fsrsService';
import { db, createEmptyQuizPerformance } from './db';

// ─── Adaptive Mode Selection ────────────────────────────────────────
// Selects the optimal quiz mode based on FSRS state, performance history,
// and adaptive difficulty. Eliminates user guesswork about what to practice.

export function selectQuizMode(data: WordData): QuizMode {
  const perf = data.quizHistory || createEmptyQuizPerformance();
  const fsrsState = data.fsrs?.state ?? State.New;
  const difficulty = perf.currentDifficulty;

  // After failure: switch to a different mode to approach the word differently
  if (perf.consecutiveIncorrect > 0 && perf.lastMode) {
    return getAlternateMode(perf.lastMode, difficulty);
  }

  // Mode selection based on FSRS learning stage + difficulty
  if (fsrsState === State.New || fsrsState === State.Relearning) {
    // New or relearning: prefer context mode which doesn't require other words
    // Recognition is good but needs vocabulary in the library
    return difficulty >= 3 ? 'recall' : 'context';
  }

  if (fsrsState === State.Learning) {
    // Active learning: rotate between context and error spotting
    if (difficulty >= 4) return 'recall';
    if (difficulty >= 2) return perf.lastMode === 'context' ? 'error' : 'context';
    return 'context';
  }

  // Review state: base on stability sub-stages
  const stability = data.fsrs?.stability ?? 0;

  if (stability <= 7) {
    // Young: context or error spotting
    return difficulty >= 3 ? 'recall' : 'context';
  }
  if (stability <= 30) {
    // Familiar: recall or error
    return perf.lastMode === 'recall' ? 'error' : 'recall';
  }
  // Mature/Mastered: hardest modes
  return 'recall';
}

function getAlternateMode(lastMode: QuizMode, difficulty: number): QuizMode {
  const fallbackOrder: Record<QuizMode, QuizMode[]> = {
    recognition: ['context', 'error', 'recall'],
    context: ['error', 'recall', 'recognition'],
    error: ['context', 'recall', 'recognition'],
    recall: ['context', 'error', 'recognition'],
  };

  const candidates = fallbackOrder[lastMode];
  // Pick based on difficulty - at lower difficulty, pick earlier (easier) modes
  const idx = Math.min(Math.floor(difficulty / 2), candidates.length - 1);
  return candidates[idx];
}

// ─── Difficulty Adaptation ──────────────────────────────────────────

export function updateDifficulty(perf: QuizPerformance, correct: boolean): QuizPerformance {
  const updated = { ...perf };

  if (correct) {
    updated.consecutiveCorrect = perf.consecutiveCorrect + 1;
    updated.consecutiveIncorrect = 0;

    // Escalate difficulty after consecutive correct answers
    if (updated.consecutiveCorrect >= 3 && updated.currentDifficulty < 5) {
      updated.currentDifficulty = Math.min(5, perf.currentDifficulty + 1);
      updated.consecutiveCorrect = 0; // Reset streak after escalation
    }
  } else {
    updated.consecutiveIncorrect = perf.consecutiveIncorrect + 1;
    updated.consecutiveCorrect = 0;

    // De-escalate after consecutive failures
    if (updated.consecutiveIncorrect >= 2 && updated.currentDifficulty > 1) {
      updated.currentDifficulty = Math.max(1, perf.currentDifficulty - 1);
    }
  }

  return updated;
}

export function recordAttempt(
  perf: QuizPerformance,
  mode: QuizMode,
  correct: boolean
): QuizPerformance {
  const attempt: QuizAttempt = {
    mode,
    correct,
    timestamp: Date.now(),
    difficultyAtTime: perf.currentDifficulty,
  };

  const updated = updateDifficulty(perf, correct);

  // Update mode-specific stats
  const modeStats = { ...updated.modeStats };
  const stat = { ...modeStats[mode] };
  if (correct) stat.correct++;
  else stat.incorrect++;
  modeStats[mode] = stat;

  return {
    ...updated,
    attempts: [...perf.attempts.slice(-49), attempt], // Keep last 50 attempts
    lastMode: mode,
    modeStats,
  };
}

// ─── Distractor Generation ──────────────────────────────────────────
// Pulls semantically close distractors from the user's own vocabulary,
// falling back to AI-generated ones when the pool is too small.

export interface DistractorOption {
  word: string;
  definition: string;
  isCorrect: boolean;
}

export async function generateDistractors(
  targetWord: WordData,
  count: number = 3
): Promise<DistractorOption[]> {
  const allWords = await db.words.toArray();

  // Filter candidates: same part of speech preferred, exclude target
  const samePOS = allWords.filter(
    w => w.word.toLowerCase() !== targetWord.word.toLowerCase()
      && w.partOfSpeech === targetWord.partOfSpeech
      && w.simpleDefinition
  );

  const otherWords = allWords.filter(
    w => w.word.toLowerCase() !== targetWord.word.toLowerCase()
      && w.partOfSpeech !== targetWord.partOfSpeech
      && w.simpleDefinition
  );

  // Prioritize semantic neighbors:
  // 1. Words from deepLearning.comparisons (confusable words)
  // 2. Words from deepLearning.synonyms
  // 3. Same part of speech from user's vocabulary
  // 4. Any other word from user's vocabulary
  const prioritized: WordData[] = [];

  // Add confusable words first
  if (targetWord.deepLearning?.comparisons) {
    for (const comp of targetWord.deepLearning.comparisons) {
      const match = allWords.find(w =>
        w.word.toLowerCase() === comp.word.toLowerCase()
        && w.word.toLowerCase() !== targetWord.word.toLowerCase()
      );
      if (match) prioritized.push(match);
    }
  }

  // Add synonyms from user's vocabulary
  if (targetWord.deepLearning?.synonyms) {
    for (const syn of targetWord.deepLearning.synonyms) {
      const match = allWords.find(w =>
        w.word.toLowerCase() === syn.word.toLowerCase()
        && w.word.toLowerCase() !== targetWord.word.toLowerCase()
        && !prioritized.some(p => p.word === w.word)
      );
      if (match) prioritized.push(match);
    }
  }

  // Build distractor pool: prioritized first, then same POS, then others
  const pool = [
    ...prioritized,
    ...shuffleArray(samePOS.filter(w => !prioritized.some(p => p.word === w.word))),
    ...shuffleArray(otherWords.filter(w => !prioritized.some(p => p.word === w.word))),
  ];

  const selected = pool.slice(0, count);

  // If we don't have enough from user vocab, use AI-generated nearMeaningDistractors
  if (selected.length < count && targetWord.quiz?.nearMeaningDistractors) {
    const aiDistractors = targetWord.quiz.nearMeaningDistractors;
    for (const ai of aiDistractors) {
      if (selected.length >= count) break;
      // Don't duplicate words already selected
      if (!selected.some(s => s.word.toLowerCase() === ai.word.toLowerCase())) {
        selected.push({
          word: ai.word,
          simpleDefinition: ai.definition,
          partOfSpeech: targetWord.partOfSpeech,
        } as WordData);
      }
    }
  }

  // Map to DistractorOption format
  const distractors: DistractorOption[] = selected.map(w => ({
    word: w.word,
    definition: w.simpleDefinition,
    isCorrect: false,
  }));

  return distractors;
}

// Build a complete set of options for definition→word recognition mode
export async function buildRecognitionOptions(
  targetWord: WordData,
  difficulty: number
): Promise<DistractorOption[]> {
  // Validate target word data
  if (!targetWord.simpleDefinition || !targetWord.word) {
    throw new Error('Word data incomplete for recognition quiz');
  }

  const distractorCount = difficulty >= 4 ? 5 : 3; // More distractors at higher difficulty
  const distractors = await generateDistractors(targetWord, distractorCount);

  // Need at least 2 distractors for a meaningful quiz (minimum 3 options total)
  if (distractors.length < 2) {
    throw new Error('Not enough vocabulary for semantic recognition quiz');
  }

  const correctOption: DistractorOption = {
    word: targetWord.word,
    definition: targetWord.simpleDefinition,
    isCorrect: true,
  };

  const options = shuffleArray([correctOption, ...distractors]);
  return options;
}

// Build definition-based MC options (for "which definition matches?" mode)
export function buildDefinitionOptions(
  targetWord: WordData,
  difficulty: number
): { text: string; isCorrect: boolean }[] | null {
  if (!targetWord.quiz?.multipleChoiceOptions) return null;

  const options = [...targetWord.quiz.multipleChoiceOptions];

  // At higher difficulty, we could strip hints from definitions
  // or add more plausible options, but for now use AI-generated ones
  return shuffleArray(options);
}

// ─── Answer Validation ──────────────────────────────────────────────
// Better matching than substring(0,4)

export function validateContextAnswer(input: string, expected: string): boolean {
  const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z]/g, '');
  const userAnswer = clean(input);
  const correctAnswer = clean(expected);

  // Exact match
  if (userAnswer === correctAnswer) return true;

  // Stem match: check if user provided a valid word form
  // Accept if the input shares the same root (at least 5 chars or 70% of the word)
  const minLen = Math.max(5, Math.floor(correctAnswer.length * 0.7));
  const sharedPrefix = getSharedPrefix(userAnswer, correctAnswer);
  if (sharedPrefix.length >= minLen) return true;

  // Levenshtein distance for typo tolerance (allow 1 error for words > 4 chars)
  if (correctAnswer.length > 4 && levenshtein(userAnswer, correctAnswer) <= 1) return true;

  return false;
}

function getSharedPrefix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.substring(0, i);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Quiz Mode Labels & Descriptions ────────────────────────────────

export interface QuizModeInfo {
  id: QuizMode;
  label: string;
  description: string;
  cognitiveLevel: string;
}

export const QUIZ_MODES: QuizModeInfo[] = [
  {
    id: 'recognition',
    label: 'Definition Match',
    description: 'Match the definition to the correct word',
    cognitiveLevel: 'Identify',
  },
  {
    id: 'context',
    label: 'Fill in Context',
    description: 'Complete the sentence with the right word',
    cognitiveLevel: 'Apply',
  },
  {
    id: 'error',
    label: 'Spot the Error',
    description: 'Find the sentence with incorrect usage',
    cognitiveLevel: 'Analyze',
  },
  {
    id: 'recall',
    label: 'Free Recall',
    description: 'Produce the word from memory given a clue',
    cognitiveLevel: 'Produce',
  },
];

// ─── FSRS Rating Mapping ────────────────────────────────────────────
// Maps quiz mode + correctness to appropriate FSRS rating.
// Harder modes get stronger memory signals on success.

export function getQuizRating(mode: QuizMode, correct: boolean, difficulty: number) {
  // Import Rating values: Again=1, Hard=2, Good=3, Easy=4
  if (!correct) return 1; // Rating.Again

  switch (mode) {
    case 'recall':
      return 4; // Rating.Easy - hardest mode, strongest signal
    case 'error':
      return difficulty >= 3 ? 4 : 3; // Easy at high difficulty, Good otherwise
    case 'context':
      return 3; // Rating.Good
    case 'recognition':
      return difficulty >= 4 ? 3 : 2; // Good at high difficulty, Hard otherwise
    default:
      return 3;
  }
}

// ─── Utilities ──────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
