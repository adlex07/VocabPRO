import { WordData, QuizPerformance, UserSettings, UserStreak } from "../types";
import { db, createEmptyQuizPerformance } from "./db";
import { createInitialFSRS, type FSRSData } from "./fsrsService";

// Default settings
export const getDefaultSettings = (): UserSettings => ({
  showMnemonics: true,
  autoAudio: false,
  lookupHistory: [],
  showVisuals: false,
  focusOverlay: {
    enabled: false,
    intensity: 0.5
  },
  audioSettings: {
    speed: 1.0,
    voice: undefined,
    autoPlay: false
  },
  dailyGoal: {
    reviews: 15,
    newWords: 3
  }
});

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  try {
    const settingsJson = JSON.stringify(settings);
    const existing = await db.settings.where('key').equals('userSettings').first();
    
    if (existing) {
      await db.settings.update(existing.id!, { value: settingsJson });
    } else {
      await db.settings.add({ key: 'userSettings', value: settingsJson });
    }
  } catch (error) {
    console.error("Failed to save settings", error);
  }
};

export const loadSettings = async (): Promise<UserSettings> => {
  try {
    const record = await db.settings.where('key').equals('userSettings').first();
    if (record && record.value) {
      const settings = JSON.parse(record.value) as UserSettings;
      // Deep merge with defaults to handle nested objects properly
      const defaults = getDefaultSettings();
      return {
        ...defaults,
        ...settings,
        focusOverlay: {
          ...defaults.focusOverlay,
          ...(settings.focusOverlay || {})
        },
        audioSettings: {
          ...defaults.audioSettings,
          ...(settings.audioSettings || {})
        }
      };
    }
  } catch (error) {
    console.error("Failed to load settings", error);
  }
  return getDefaultSettings();
};

export const saveWordToHistory = async (wordData: WordData): Promise<void> => {
  try {
    const allWords = await db.words.toArray();
    const existing = allWords.find(w => w.word.toLowerCase() === wordData.word.toLowerCase());

    if (existing) {
      // Preserve existing mastery, SRS, FSRS, and quiz history if updating word content
      const updatedWord = {
        ...wordData,
        id: existing.id,
        mastery: existing.mastery || 0,
        srs: existing.srs,
        fsrs: existing.fsrs,
        quizHistory: existing.quizHistory
      };
      await db.words.put(updatedWord);
    } else {
      // Initialize FSRS and quiz history for new words
      const newWord = { ...wordData };
      newWord.fsrs = createInitialFSRS();
      newWord.quizHistory = createEmptyQuizPerformance();
      // Also set legacy srs for backward compat during transition
      newWord.srs = {
        nextReview: Date.now(),
        interval: 0,
        repetition: 0,
        easeFactor: 2.5
      };
      await db.words.add(newWord);
    }
  } catch (error) {
    console.error("Failed to save word", error);
  }
};

export const getWordHistory = async (): Promise<WordData[]> => {
  try {
    return await db.words.reverse().toArray(); // Recent first
  } catch (error) {
    console.error("Failed to get history", error);
    return [];
  }
};

export const updateWordMastery = async (word: string, delta: number) => {
  try {
    const allWords = await db.words.toArray();
    const existing = allWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    
    if (existing && existing.id) {
      const current = existing.mastery || 0;
      // Clamp between 0 and 100
      const newMastery = Math.min(100, Math.max(0, current + delta));
      await db.words.update(existing.id, { mastery: newMastery });
    }
  } catch (error) {
    console.error("Failed to update mastery", error);
  }
};

export const updateWordFSRS = async (word: string, fsrsState: FSRSData) => {
  try {
    const allWords = await db.words.toArray();
    const existing = allWords.find(w => w.word.toLowerCase() === word.toLowerCase());

    if (existing && existing.id) {
      await db.words.update(existing.id, { fsrs: fsrsState });
    }
  } catch (error) {
    console.error("Failed to update FSRS", error);
  }
};

export const updateQuizHistory = async (word: string, quizHistory: QuizPerformance) => {
  try {
    const allWords = await db.words.toArray();
    const existing = allWords.find(w => w.word.toLowerCase() === word.toLowerCase());

    if (existing && existing.id) {
      await db.words.update(existing.id, { quizHistory });
    }
  } catch (error) {
    console.error("Failed to update quiz history", error);
  }
};

// Export/Import functionality
export interface ExportData {
  version: string;
  exportDate: string;
  words: WordData[];
  settings: UserSettings;
}

export const exportUserData = async (): Promise<string> => {
  try {
    const words = await db.words.toArray();
    const settings = await loadSettings();
    
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      words,
      settings
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Failed to export data", error);
    throw error;
  }
};

export const downloadExportedData = async (): Promise<void> => {
  try {
    const jsonData = await exportUserData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepvocab-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download data", error);
    throw error;
  }
};

export const importUserData = async (jsonData: string, mode: 'merge' | 'replace' = 'merge'): Promise<{ imported: number; skipped: number }> => {
  try {
    const data: ExportData = JSON.parse(jsonData);
    
    // Validate data structure
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid backup file format');
    }
    
    let imported = 0;
    let skipped = 0;
    
    if (mode === 'replace') {
      // Clear existing data
      await db.words.clear();
    }
    
    // Import words
    for (const word of data.words) {
      try {
        const existing = await db.words.where('word').equalsIgnoreCase(word.word).first();
        
        if (existing && mode === 'merge') {
          // In merge mode, keep existing word (don't overwrite)
          skipped++;
        } else {
          // Remove id to let IndexedDB assign new one
          const { id, ...wordWithoutId } = word;
          await db.words.add(wordWithoutId);
          imported++;
        }
      } catch (err) {
        console.warn(`Failed to import word: ${word.word}`, err);
        skipped++;
      }
    }
    
    // Import settings if available
    if (data.settings) {
      await saveSettings(data.settings);
    }
    
    return { imported, skipped };
  } catch (error) {
    console.error("Failed to import data", error);
    throw error;
  }
};

// Streak tracking functions
export const getDefaultStreak = (): UserStreak => ({
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  calendar: {},
  totalStudyDays: 0
});

export const loadStreak = async (): Promise<UserStreak> => {
  try {
    const record = await db.settings.where('key').equals('userStreak').first();
    if (record && record.value) {
      return JSON.parse(record.value) as UserStreak;
    }
  } catch (error) {
    console.error("Failed to load streak", error);
  }
  return getDefaultStreak();
};

export const saveStreak = async (streak: UserStreak): Promise<void> => {
  try {
    const streakJson = JSON.stringify(streak);
    const existing = await db.settings.where('key').equals('userStreak').first();
    
    if (existing) {
      await db.settings.update(existing.id!, { value: streakJson });
    } else {
      await db.settings.add({ key: 'userStreak', value: streakJson });
    }
  } catch (error) {
    console.error("Failed to save streak", error);
  }
};

export const updateStreak = async (date?: Date): Promise<UserStreak> => {
  const today = date || new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const streak = await loadStreak();
  
  // If already studied today, don't update
  if (streak.calendar[todayStr]) {
    return streak;
  }
  
  // Mark today as completed
  streak.calendar[todayStr] = true;
  streak.totalStudyDays++;
  
  // Calculate streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (streak.lastStudyDate === yesterdayStr) {
    // Continue streak
    streak.currentStreak++;
  } else if (streak.lastStudyDate === todayStr) {
    // Already counted today
  } else {
    // Streak broken, start new
    streak.currentStreak = 1;
  }
  
  // Update longest streak
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }
  
  streak.lastStudyDate = todayStr;
  
  await saveStreak(streak);
  return streak;
};
