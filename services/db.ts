import Dexie, { Table } from 'dexie';
import { WordData, QuizPerformance, UserSettings } from '../types';
import { convertSM2ToFSRS } from './migrationService';

export function createEmptyQuizPerformance(): QuizPerformance {
  return {
    attempts: [],
    currentDifficulty: 1,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastMode: null,
    modeStats: {
      recognition: { correct: 0, incorrect: 0 },
      recall: { correct: 0, incorrect: 0 },
      context: { correct: 0, incorrect: 0 },
      error: { correct: 0, incorrect: 0 },
    },
  };
}

export interface AppLog {
  id?: number;
  timestamp: number;
  action: string;
  details: string;
}

export interface SettingsRecord {
  id?: number;
  key: string;
  value: string;
}

export class DeepVocabDB extends Dexie {
  words!: Table<WordData, number>;
  logs!: Table<AppLog, number>;
  settings!: Table<SettingsRecord, number>;

  constructor() {
    super('DeepVocabDB');

    this.version(1).stores({
      words: '++id, &word, mastery, srs.nextReview',
      logs: '++id, timestamp, action'
    });

    // v2: Add FSRS index and migrate SM-2 data to FSRS
    this.version(2).stores({
      words: '++id, &word, mastery, srs.nextReview, fsrs.due',
      logs: '++id, timestamp, action'
    }).upgrade(async (tx) => {
      console.log('[FSRS Migration] Starting SM-2 to FSRS migration...');
      const words = tx.table('words');
      const allWords = await words.toArray();
      let migrated = 0;

      for (const word of allWords) {
        if (word.srs && !word.fsrs) {
          const fsrsState = convertSM2ToFSRS(word.srs);
          await words.update(word.id!, { fsrs: fsrsState });
          migrated++;
        }
      }

      console.log(`[FSRS Migration] Migrated ${migrated}/${allWords.length} words.`);
    });

    // v3: Add quizHistory for adaptive quiz tracking
    this.version(3).stores({
      words: '++id, &word, mastery, srs.nextReview, fsrs.due',
      logs: '++id, timestamp, action'
    }).upgrade(async (tx) => {
      console.log('[Quiz History Migration] Initializing quiz performance data...');
      const words = tx.table('words');
      const allWords = await words.toArray();
      let migrated = 0;

      for (const word of allWords) {
        if (!word.quizHistory) {
          await words.update(word.id!, { quizHistory: createEmptyQuizPerformance() });
          migrated++;
        }
      }

      console.log(`[Quiz History Migration] Initialized ${migrated}/${allWords.length} words.`);
    });

    // v4: Add settings table for persistent user preferences
    this.version(4).stores({
      words: '++id, &word, mastery, srs.nextReview, fsrs.due',
      logs: '++id, timestamp, action',
      settings: '++id, &key'
    });
  }
}

export const db = new DeepVocabDB();

// Migration helper
export async function migrateFromLocalStorage() {
  const STORAGE_KEY = 'deepvocab_history_v1';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const history = JSON.parse(raw) as WordData[];
      if (Array.isArray(history) && history.length > 0) {
        console.log(`Migrating ${history.length} words from localStorage...`);
        
        await db.transaction('rw', db.words, async () => {
          for (const word of history) {
            // Check if exists
            const existing = await db.words.where('word').equals(word.word).first();
            if (!existing) {
              await db.words.add(word);
            }
          }
        });
        
        console.log('Migration complete.');
        // Optional: localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
