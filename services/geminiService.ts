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

// Stage 3: Deep Learning & Quiz
export const fetchWordStage3 = async (word: string): Promise<Partial<WordData>> => {
  const response = await ai.models.generateContent({
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
    - visual: REQUIRED object with:
      * imageDescription: Detailed visual scene for the word (vivid, concrete, memorable)
      * spatialCue: Where in space to place this memory (e.g., "on a bookshelf", "in a garden")
      * colorAssociation: What color represents this word's meaning
      * lociContext: How to place this in a memory palace (Method of Loci)

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
              arabicAssociations: { type: Type.ARRAY, items: { type: Type.STRING } },
              visual: {
                type: Type.OBJECT,
                properties: {
                  imageDescription: { type: Type.STRING },
                  spatialCue: { type: Type.STRING },
                  colorAssociation: { type: Type.STRING },
                  lociContext: { type: Type.STRING }
                },
                required: ["imageDescription", "spatialCue", "colorAssociation", "lociContext"]
              }
            },
            required: ["conceptOrigin", "comparisons", "analogy", "mentalImage", "memoryStory", "mnemonic", "associationPrompt", "etymology", "synonyms", "antonyms", "relatedWords", "visual"]
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
  });

  const text = response.text;
  if (!text) throw new Error("No response for Stage 3");
  return JSON.parse(text);
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