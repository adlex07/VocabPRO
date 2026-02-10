import { GoogleGenAI, Type } from "@google/genai";
import { WordData, ElaborationFeedback, QuickDefinitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-3-flash-preview";

// Stage 1: Core Essentials
export const fetchWordStage1 = async (word: string): Promise<Partial<WordData>> => {
  const response = await ai.models.generateContent({
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
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 1");
  return JSON.parse(text);
};

// Stage 2: Context & Examples
export const fetchWordStage2 = async (word: string): Promise<Partial<WordData>> => {
  const response = await ai.models.generateContent({
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
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 2");
  return JSON.parse(text);
};

// Stage 3: Deep Learning - Split into 3 parallel calls for performance

// Stage 3a: Core Learning Concepts (etymology, synonyms, antonyms, comparisons)
const fetchWordStage3_CoreLearning = async (word: string) => {
  const response = await ai.models.generateContent({
    model,
    contents: `For the word "${word}", provide core linguistic analysis.
    
    Provide:
    - conceptOrigin: Etymology/history (2-3 sentences).
    - comparisons: 1-2 words it is often confused with.
    - etymology: breakdown into linguistic parts with meanings.
    - synonyms: 3-5 synonyms with nuance explanations.
    - antonyms: 2-4 antonyms.
    - relatedWords: 3-5 related words in the same semantic field.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conceptOrigin: { type: Type.STRING },
          comparisons: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, difference: { type: Type.STRING } } }
          },
          etymology: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { part: { type: Type.STRING }, meaning: { type: Type.STRING } } }
          },
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, nuance: { type: Type.STRING } } }
          },
          antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          relatedWords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["conceptOrigin", "comparisons", "etymology", "synonyms", "antonyms", "relatedWords"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 3a");
  return JSON.parse(text);
};

// Stage 3b: Memory Aids (mnemonics, stories, imagery, associations)
const fetchWordStage3_MemoryAids = async (word: string) => {
  const response = await ai.models.generateContent({
    model,
    contents: `For the word "${word}", provide creative memory aids.
    
    Provide:
    - analogy: A real-world analogy to understand the concept.
    - mentalImage: A vivid visual image to help remember the word.
    - memoryStory: A short memorable story incorporating the word (2-3 sentences).
    - mnemonic: A clever memory aid or phrase.
    - associationPrompt: A personal connection question to help learners relate to the word.
    - arabicAssociations: 3-5 Arabic words or phrases that are similar or related.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analogy: { type: Type.STRING },
          mentalImage: { type: Type.STRING },
          memoryStory: { type: Type.STRING },
          mnemonic: { type: Type.STRING },
          associationPrompt: { type: Type.STRING },
          arabicAssociations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["analogy", "mentalImage", "memoryStory", "mnemonic", "associationPrompt"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 3b");
  return JSON.parse(text);
};

// Stage 3c: Quiz Content
const fetchWordStage3_Quiz = async (word: string) => {
  const response = await ai.models.generateContent({
    model,
    contents: `For the word "${word}", provide comprehensive quiz questions.
    
    QUIZ REQUIREMENTS:
    - multipleChoiceOptions: 4 options (1 correct). The options MUST be descriptive definitions (5-15 words long) that explain the meaning. DO NOT use single words. DO NOT use the target word itself in the options. The WRONG options must be plausible and semantically close - they should describe meanings of words in the same domain or category. NEVER use obvious opposites or unrelated meanings as distractors.
    - nearMeaningDistractors: 4 words that are semantically similar to "${word}" (near-synonyms, same domain, or commonly confused). For each, provide the word and a brief definition. These must be real English words that a learner might confuse with "${word}".
    - errorSpotting: 3 sentences using "${word}" (1 uses it INCORRECTLY but in a subtle, plausible way - not obviously wrong). The incorrect usage should reflect a common misunderstanding of the word's meaning or grammar.
    - fillInBlankQuestion: A sentence with a blank where "${word}" fits. The sentence should provide enough context that only "${word}" (or a close variant) makes sense.
    - fillInBlankAnswer: The exact word that fills the blank.
    - recallQuestion: A definition-style clue that requires producing "${word}" from memory. Do NOT include the word itself in the clue.
    - recallAnswer: The target word.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 3c");
  return JSON.parse(text);
};

// Stage 3: Combined function that runs all 3 in parallel
export const fetchWordStage3 = async (word: string): Promise<Partial<WordData>> => {
  // Run all three API calls in parallel for better performance
  const [coreLearning, memoryAids, quiz] = await Promise.all([
    fetchWordStage3_CoreLearning(word),
    fetchWordStage3_MemoryAids(word),
    fetchWordStage3_Quiz(word)
  ]);

  // Combine results into the expected structure
  return {
    deepLearning: {
      ...coreLearning,
      ...memoryAids
    },
    quiz
  };
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
  const response = await ai.models.generateContent({
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
  });
  const text = response.text;
  if (!text) throw new Error("No response.");
  return JSON.parse(text) as ElaborationFeedback;
};

export const getQuickDefinition = async (word: string): Promise<QuickDefinitionResult> => {
  const response = await ai.models.generateContent({
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
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text) as QuickDefinitionResult;
};