import { State } from 'ts-fsrs';
import { WordData } from '../types';
import type { FSRSData } from './fsrsService';

// Convert SM-2 state to FSRS state for data migration
export function convertSM2ToFSRS(srs: NonNullable<WordData['srs']>): FSRSData {
  const stability = estimateStability(srs);
  const difficulty = estimateDifficulty(srs);
  const state = determineState(srs);
  const lapses = estimateLapses(srs);

  return {
    due: srs.nextReview,
    stability,
    difficulty,
    scheduledDays: srs.interval,
    reps: srs.repetition,
    lapses,
    state,
    lastReview: srs.interval > 0
      ? srs.nextReview - srs.interval * 24 * 60 * 60 * 1000
      : undefined,
    learningSteps: state === State.New ? 0 : state === State.Learning ? 1 : 0,
  };
}

function estimateStability(srs: NonNullable<WordData['srs']>): number {
  // Stability approximates the interval at which R = 90%
  // For established cards, this closely matches the current interval
  if (srs.repetition === 0) return 0.001; // ts-fsrs default for new
  if (srs.repetition === 1) return Math.max(1, srs.interval);
  return Math.max(1, srs.interval);
}

function estimateDifficulty(srs: NonNullable<WordData['srs']>): number {
  // Map SM-2 easeFactor (1.3-2.5+) to FSRS difficulty (1-10)
  // Lower easeFactor = harder = higher difficulty
  // EF 2.5 -> D ~4 (easy), EF 1.3 -> D ~8.5 (hard)
  const ef = Math.max(1.3, Math.min(2.8, srs.easeFactor));
  const d = 10 - ((ef - 1.3) / (2.8 - 1.3)) * 7; // Range ~3 to ~10
  return Math.max(1, Math.min(10, Math.round(d * 10) / 10));
}

function estimateLapses(srs: NonNullable<WordData['srs']>): number {
  // Infer lapses from easeFactor degradation
  // Each lapse typically reduces EF by ~0.2
  if (srs.easeFactor >= 2.5) return 0;
  const lapseEstimate = Math.round((2.5 - srs.easeFactor) / 0.2);
  return Math.max(0, Math.min(lapseEstimate, 10));
}

function determineState(srs: NonNullable<WordData['srs']>): number {
  if (srs.repetition === 0) return State.New;
  if (srs.repetition <= 2) return State.Learning;
  return State.Review;
}
