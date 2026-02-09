import { fsrs, createEmptyCard, Rating, State, type Card, type Grade } from 'ts-fsrs';
import { WordData } from '../types';

// Re-export Rating for use in components
export { Rating, State };

// FSRS instance with vocabulary-optimized defaults
const f = fsrs({
  request_retention: 0.90,   // Target 90% recall rate
  maximum_interval: 365,     // Cap at 1 year between reviews
  enable_fuzz: true,         // Prevent scheduling clumps
  enable_short_term: true,   // Enable learning steps for new cards
});

// Serialized FSRS state stored in IndexedDB
export interface FSRSData {
  due: number;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: number;
  learningSteps: number;
}

// Convert our stored state to a ts-fsrs Card
function toCard(data: FSRSData): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: 0, // computed by ts-fsrs from last_review
    scheduled_days: data.scheduledDays,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state as State,
    last_review: data.lastReview ? new Date(data.lastReview) : undefined,
    learning_steps: data.learningSteps,
  };
}

// Convert a ts-fsrs Card back to our serializable format
function fromCard(card: Card): FSRSData {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    lastReview: card.last_review?.getTime(),
    learningSteps: card.learning_steps,
  };
}

// Create initial FSRS state for a new word
export function createInitialFSRS(): FSRSData {
  const card = createEmptyCard(new Date());
  return fromCard(card);
}

// Calculate the next FSRS state after a review
export function calculateFSRS(current: FSRSData | undefined, rating: Grade): FSRSData {
  const card = current ? toCard(current) : createEmptyCard(new Date());
  const now = new Date();
  const result = f.next(card, now, rating);
  return fromCard(result.card);
}

// Check if a word is due for review
export function isFSRSDue(data: FSRSData | undefined): boolean {
  if (!data) return true; // New words are always due
  return Date.now() >= data.due;
}

// Get human-readable stage name from FSRS state
export function getFSRSStage(data: FSRSData): string {
  switch (data.state as State) {
    case State.New: return 'New';
    case State.Learning: return 'Learning';
    case State.Relearning: return 'Relearning';
    case State.Review: {
      // Sub-stages based on stability (days of memory strength)
      if (data.stability <= 7) return 'Young';
      if (data.stability <= 30) return 'Familiar';
      if (data.stability <= 90) return 'Mature';
      return 'Mastered';
    }
    default: return 'New';
  }
}

// Get estimated retrievability (probability of recall) as a percentage
export function getRetrievability(data: FSRSData): number {
  if (!data.lastReview || data.state === State.New) return 0;
  const elapsedDays = (Date.now() - data.lastReview) / (24 * 60 * 60 * 1000);
  if (data.stability <= 0) return 0;
  // FSRS retrievability formula: R = (1 + elapsed / (9 * S))^(-1)
  const r = Math.pow(1 + elapsedDays / (9 * data.stability), -1);
  return Math.round(r * 100);
}
