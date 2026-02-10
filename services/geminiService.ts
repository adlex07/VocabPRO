import { GoogleGenAI, Type } from "@google/genai";
import { WordData, ElaborationFeedback, QuickDefinitionResult } from "../types";

// Validate API key on module initialization
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set. Please set it in your .env.local file.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });
const model = "gemini-3-flash-preview";

// Configuration for retries and timeouts
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeout: 30000, // 30 seconds per request
};

// Custom error types for better error handling
export class APIError extends Error {
  constructor(message: string, public code?: string, public retryable = false) {
    super(message);
    this.name = "APIError";
  }
}

export class TimeoutError extends APIError {
  constructor(message = "Request timed out") {
    super(message, "TIMEOUT", true);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends APIError {
  constructor(message = "Network error occurred") {
    super(message, "NETWORK", true);
    this.name = "NetworkError";
  }
}

export class ValidationError extends APIError {
  constructor(message = "Invalid response format") {
    super(message, "VALIDATION", false);
    this.name = "ValidationError";
  }
}

// Helper function to implement timeout for promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), timeoutMs)
    ),
  ]);
};

// Helper function for exponential backoff retry logic
const retry = async <T>(
  fn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  delay = RETRY_CONFIG.initialDelay
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Check if error is retryable
    const isRetryable =
      error instanceof TimeoutError ||
      error instanceof NetworkError ||
      (error instanceof APIError && error.retryable);

    if (!isRetryable) {
      throw error;
    }

    // Wait before retrying with exponential backoff
    await new Promise((resolve) => setTimeout(resolve, delay));
    const nextDelay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
    
    console.log(`Retrying... (${RETRY_CONFIG.maxRetries - retries + 1}/${RETRY_CONFIG.maxRetries})`);
    return retry(fn, retries - 1, nextDelay);
  }
};

// Helper function to safely parse JSON response
const parseJSONResponse = (text: string | undefined | null, stageName: string): unknown => {
  if (!text || text.trim() === "") {
    throw new APIError(`No response received for ${stageName}`, "EMPTY_RESPONSE", true);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError(`Invalid JSON response for ${stageName}: ${error.message}`);
    }
    throw error;
  }
};

// Wrapper for API calls with error handling, timeout, and retry
const apiCall = async <T>(
  apiFunction: () => Promise<any>,
  stageName: string
): Promise<T> => {
  return retry(async () => {
    try {
      const response = await withTimeout(
        apiFunction(),
        RETRY_CONFIG.timeout
      );

      // Parse and validate response
      const text = response?.text;
      return parseJSONResponse(text, stageName);
    } catch (error) {
      // Convert various error types to our custom errors
      if (error instanceof TimeoutError || error instanceof ValidationError) {
        throw error;
      }

      // Network-related errors
      if (
        error instanceof TypeError ||
        (error as any)?.message?.includes("fetch") ||
        (error as any)?.message?.includes("network")
      ) {
        throw new NetworkError(`Network error during ${stageName}: ${(error as Error).message}`);
      }

      // API-specific errors
      if ((error as any)?.status) {
        const status = (error as any).status;
        const retryable = status === 429 || status >= 500;
        throw new APIError(
          `API error (${status}) during ${stageName}: ${(error as Error).message}`,
          `HTTP_${status}`,
          retryable
        );
      }

      // Unknown errors
      throw new APIError(
        `Unexpected error during ${stageName}: ${(error as Error).message}`,
        "UNKNOWN",
        false
      );
    }
  });
};

// Stage 1: Core Essentials
export const fetchWordStage1 = async (word: string): Promise<Partial<WordData>> => {
  return apiCall<Partial<WordData>>(
    () => ai.models.generateContent({
      model,
      contents: `You are an expert tutor. Define the word "${word}".
      Return JSON with:
      - simpleDefinition: Clear, easy to understand.
      - preciseDefinition: Academic/formal definition.
      - pronunciation: IPA or phonetic.
      - partOfSpeech: e.g., Noun, Verb.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            simpleDefinition: { type: Type.STRING },
            preciseDefinition: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
          },
          required: ["word", "simpleDefinition", "preciseDefinition", "pronunciation", "partOfSpeech"]
        }
      }
    }),
    "Stage 1"
  );
};

// Stage 2: Context & Examples
export const fetchWordStage2 = async (word: string): Promise<Partial<WordData>> => {
  return apiCall<Partial<WordData>>(
    () => ai.models.generateContent({
      model,
      contents: `For the word "${word}", provide context.
      Return JSON with:
      - examples: 3 diverse sentences.
      - wordFamily: 3-5 related forms (e.g., noun, verb, adj versions).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            wordFamily: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["examples", "wordFamily"]
        }
      }
    }),
    "Stage 2"
  );
};

// Stage 3: Deep Learning & Quiz
export const fetchWordStage3 = async (word: string): Promise<Partial<WordData>> => {
  return apiCall<Partial<WordData>>(
    () => ai.models.generateContent({
      model,
      contents: `For the word "${word}", provide DEEP LEARNING content and QUIZ.

    DEEP LEARNING:
    - conceptOrigin: Etymology/history.
    - comparisons: 1-2 words it is often confused with.
    - analogy: A real-world analogy.
    - mentalImage: A vivid image to visualize.
    - memoryStory: A short memorable story.
    - mnemonic: A memory aid.
    - associationPrompt: Personal connection prompt.
    - arabicAssociations: 3-5 Arabic words/synonyms.
    - etymology: list of parts.
    - synonyms: list with nuance.
    - antonyms: list.
    - relatedWords: list.

    QUIZ:
    - multipleChoiceOptions: 4 options (1 correct). The options MUST be descriptive definitions (5-15 words long) that explain the meaning. DO NOT use single words. DO NOT use the target word itself in the options. The WRONG options must be plausible and semantically close - they should describe meanings of words in the same domain or category. NEVER use obvious opposites or unrelated meanings as distractors.
    - nearMeaningDistractors: 4 words that are semantically similar to "${word}" (near-synonyms, same domain, or commonly confused). For each, provide the word and a brief definition. These must be real English words that a learner might confuse with "${word}".
    - errorSpotting: 3 sentences using "${word}" (1 uses it INCORRECTLY but in a subtle, plausible way - not obviously wrong). The incorrect usage should reflect a common misunderstanding of the word's meaning or grammar.
    - fillInBlankQuestion: A sentence with a blank where "${word}" fits. The sentence should provide enough context that only "${word}" (or a close variant) makes sense.
    - fillInBlankAnswer: The exact word that fills the blank.
    - recallQuestion: A definition-style clue that requires producing "${word}" from memory. Do NOT include the word itself in the clue.
    - recallAnswer: The target word.
    `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deepLearning: {
              type: Type.OBJECT,
              properties: {
                conceptOrigin: { type: Type.STRING },
                comparisons: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, difference: { type: Type.STRING } } }
                },
                analogy: { type: Type.STRING },
                mentalImage: { type: Type.STRING },
                memoryStory: { type: Type.STRING },
                mnemonic: { type: Type.STRING },
                associationPrompt: { type: Type.STRING },
                etymology: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { part: { type: Type.STRING }, meaning: { type: Type.STRING } } }
                },
                synonyms: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, nuance: { type: Type.STRING } } }
                },
                antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                relatedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                arabicAssociations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["conceptOrigin", "comparisons", "analogy", "mentalImage", "memoryStory", "mnemonic", "associationPrompt", "etymology", "synonyms", "antonyms", "relatedWords"]
            },
            quiz: {
              type: Type.OBJECT,
              properties: {
                fillInBlankQuestion: { type: Type.STRING },
                fillInBlankAnswer: { type: Type.STRING },
                recallQuestion: { type: Type.STRING },
                recallAnswer: { type: Type.STRING },
                multipleChoiceOptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { text: { type: Type.STRING }, isCorrect: { type: Type.BOOLEAN } }
                  }
                },
                nearMeaningDistractors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { word: { type: Type.STRING }, definition: { type: Type.STRING } }
                  }
                },
                errorSpotting: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { sentence: { type: Type.STRING }, isCorrect: { type: Type.BOOLEAN }, explanation: { type: Type.STRING } }
                  }
                }
              },
              required: ["fillInBlankQuestion", "fillInBlankAnswer", "recallQuestion", "recallAnswer", "multipleChoiceOptions", "nearMeaningDistractors", "errorSpotting"]
            }
          },
          required: ["deepLearning", "quiz"]
        }
      }
    }),
    "Stage 3"
  );
};

// Deprecated single-call function (kept for reference or fallback if needed, but not used in new flow)
export const lookupWord = async (word: string): Promise<WordData> => {
  // This is replaced by stage 1, 2, 3 calls in the UI
  const s1 = await fetchWordStage1(word);
  const s2 = await fetchWordStage2(word);
  const s3 = await fetchWordStage3(word);
  return { ...s1, ...s2, ...s3, mastery: 0 } as WordData;
};

export const checkElaboration = async (word: string, userDefinition: string, userSentence: string): Promise<ElaborationFeedback> => {
  return apiCall<ElaborationFeedback>(
    () => ai.models.generateContent({
      model,
      contents: `Act as a supportive but strict vocabulary tutor. Evaluate the user's understanding of the word "${word}".
    
    User's Definition: "${userDefinition}"
    User's Sentence: "${userSentence}"
    
    Provide detailed feedback.
    - For scores (1-5): 5 is perfect, 1 is completely wrong.
    - definitionFeedback: specific correction on their definition. Did they miss a nuance?
    - sentenceFeedback: specific correction on their usage. Did they use the right part of speech? Is the grammar correct?
    - generalFeedback: A summarizing comment.
    
    Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            generalFeedback: { type: Type.STRING },
            definitionScore: { type: Type.INTEGER },
            sentenceScore: { type: Type.INTEGER },
            definitionFeedback: { type: Type.STRING },
            sentenceFeedback: { type: Type.STRING }
          },
          required: ["isCorrect", "generalFeedback", "definitionScore", "sentenceScore", "definitionFeedback", "sentenceFeedback"]
        }
      }
    }),
    "Elaboration Check"
  );
};

export const getQuickDefinition = async (word: string): Promise<QuickDefinitionResult> => {
  return apiCall<QuickDefinitionResult>(
    () => ai.models.generateContent({
      model,
      contents: `Define "${word}" in 12 words or less. Simple and direct.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ["word", "definition"]
        }
      }
    }),
    "Quick Definition"
  );
};