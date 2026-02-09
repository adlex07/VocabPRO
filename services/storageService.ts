import { WordData, QuizPerformance, UserSettings } from "../types";
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
      // Merge with defaults to handle new settings fields
      return { ...getDefaultSettings(), ...settings };
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
