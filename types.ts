export interface WordData {
  id?: number;
  word: string;
  simpleDefinition: string;
  preciseDefinition: string;
  pronunciation: string;
  partOfSpeech: string;
  examples?: string[];
  wordFamily?: string[];
  mastery?: number; // 0 to 100
  
  // Spaced Repetition Fields (Legacy SM-2 - kept for migration)
  srs?: {
    nextReview: number; // Timestamp
    interval: number; // In days
    repetition: number; // Count
    easeFactor: number; // SM-2 multiplier
  };

  // FSRS (Free Spaced Repetition Scheduler)
  fsrs?: {
    due: number;            // Timestamp when card is due
    stability: number;      // Memory stability (days until R drops to 90%)
    difficulty: number;     // Card difficulty [1-10]
    scheduledDays: number;  // Current interval in days
    reps: number;           // Total successful reviews
    lapses: number;         // Failed review count
    state: number;          // 0=New, 1=Learning, 2=Review, 3=Relearning
    lastReview?: number;    // Timestamp of last review
    learningSteps: number;  // Current learning step index
  };

  deepLearning?: {
    conceptOrigin: string;
    comparisons: { word: string; difference: string }[];
    analogy: string;
    mentalImage: string;
    memoryStory: string;
    mnemonic: string;
    associationPrompt: string;
    arabicAssociations?: string[];
    etymology: { part: string; meaning: string }[];
    synonyms: { word: string; nuance: string }[];
    antonyms: string[];
    relatedWords: string[];
    visual?: {
        imageDescription: string;
        spatialCue: string;
        colorAssociation: string;
        lociContext: string;
    };
  };

  quiz?: {
    fillInBlankQuestion: string;
    fillInBlankAnswer: string;
    recallQuestion: string;
    recallAnswer: string;
    multipleChoiceOptions?: { text: string; isCorrect: boolean }[];
    errorSpotting?: { sentence: string; isCorrect: boolean; explanation: string }[];
    // Near-meaning distractor words for definition→word mode
    nearMeaningDistractors?: { word: string; definition: string }[];
  };

  // Per-word quiz performance history for adaptive difficulty
  quizHistory?: QuizPerformance;
}

export type QuizMode = 'recognition' | 'recall' | 'context' | 'error';

export interface QuizAttempt {
  mode: QuizMode;
  correct: boolean;
  timestamp: number;
  difficultyAtTime: number;
}

export interface QuizPerformance {
  attempts: QuizAttempt[];
  currentDifficulty: number;       // 1-5 adaptive difficulty level
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  lastMode: QuizMode | null;
  modeStats: Record<QuizMode, { correct: number; incorrect: number }>;
}

export interface ElaborationFeedback {
  isCorrect: boolean;
  generalFeedback: string;
  definitionScore: number;
  sentenceScore: number;
  definitionFeedback: string;
  sentenceFeedback: string;
}

export interface QuickDefinitionResult {
  word: string;
  definition: string;
}

export interface UserSettings {
  showMnemonics: boolean;
  autoAudio: boolean;
  lookupHistory: string[];
  showVisuals?: boolean;
  focusOverlay?: {
    enabled: boolean;
    intensity: number;
  };
  audioSettings?: {
    speed: number;
    voice?: string;
    autoPlay: boolean;
  };
  dailyGoal?: {
    reviews: number;
    newWords: number;
  };
}

export interface FocusSettings {
  enabled: boolean;
  intensity: number;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD format
  calendar: Record<string, boolean>; // YYYY-MM-DD -> completed
  totalStudyDays: number;
}
