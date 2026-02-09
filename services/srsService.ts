import { WordData } from '../types';

export interface SRSState {
  nextReview: number; // Timestamp
  interval: number;   // Days
  repetition: number; // Counter
  easeFactor: number; // Multiplier (starts at 2.5)
}

// SuperMemo-2 Algorithm
export const calculateSRS = (currentSRS: SRSState | undefined, grade: number): SRSState => {
  // Defaults if no history exists
  let interval = 0;
  let repetition = 0;
  let easeFactor = 2.5;

  if (currentSRS) {
    interval = currentSRS.interval;
    repetition = currentSRS.repetition;
    easeFactor = currentSRS.easeFactor;
  }

  // Grade: 0-2 (Fail), 3-5 (Pass)
  if (grade >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1; // Reset to 1 day
  }

  // Update Ease Factor
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate Next Review Date
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    nextReview,
    interval,
    repetition,
    easeFactor,
  };
};

export const getSRSStage = (interval: number): string => {
  if (interval < 1) return 'New';
  if (interval <= 4) return 'Apprentice';
  if (interval <= 21) return 'Guru';
  if (interval <= 60) return 'Master';
  return 'Enlightened';
};

export const isDue = (srs: SRSState | undefined): boolean => {
  if (!srs) return true; // New words are due
  return Date.now() >= srs.nextReview;
};