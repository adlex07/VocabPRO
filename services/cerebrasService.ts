import { WordData, ElaborationFeedback, QuickDefinitionResult } from "../types";

// Cerebras API configuration
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "llama3.1-8b"; // Default model

interface CerebrasMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CerebrasRequest {
  model: string;
  messages: CerebrasMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

const makeCerebrasRequest = async (messages: CerebrasMessage[], apiKey: string): Promise<string> => {
  const request: CerebrasRequest = {
    model: CEREBRAS_MODEL,
    messages,
    temperature: 0.7,
    response_format: { type: "json_object" }
  };

  const response = await fetch(CEREBRAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Stage 1: Core Essentials
export const fetchWordStage1 = async (word: string, apiKey: string): Promise<Partial<WordData>> => {
  const messages: CerebrasMessage[] = [
    {
      role: "system",
      content: "You are an expert tutor. You always respond with valid JSON only, no additional text."
    },
    {
      role: "user",
      content: `Define the word "${word}".
Return JSON with:
- word: The word itself
- simpleDefinition: Clear, easy to understand.
- preciseDefinition: Academic/formal definition.
- pronunciation: IPA or phonetic.
- partOfSpeech: e.g., Noun, Verb.

Example format:
{
  "word": "example",
  "simpleDefinition": "something that serves as a pattern",
  "preciseDefinition": "a representative form or pattern",
  "pronunciation": "/ɪɡˈzæmpəl/",
  "partOfSpeech": "noun"
}`
    }
  ];

  const text = await makeCerebrasRequest(messages, apiKey);
  if (!text) throw new Error("No response for Stage 1");
  return JSON.parse(text);
};

// Stage 2: Context & Examples
export const fetchWordStage2 = async (word: string, apiKey: string): Promise<Partial<WordData>> => {
  const messages: CerebrasMessage[] = [
    {
      role: "system",
      content: "You are an expert tutor. You always respond with valid JSON only, no additional text."
    },
    {
      role: "user",
      content: `For the word "${word}", provide context.
Return JSON with:
- examples: Array of 3 diverse sentences.
- wordFamily: Array of 3-5 related forms (e.g., noun, verb, adj versions).

Example format:
{
  "examples": ["sentence 1", "sentence 2", "sentence 3"],
  "wordFamily": ["word1", "word2", "word3"]
}`
    }
  ];

  const text = await makeCerebrasRequest(messages, apiKey);
  if (!text) throw new Error("No response for Stage 2");
  return JSON.parse(text);
};

// Stage 3: Deep Learning & Quiz
export const fetchWordStage3 = async (word: string, apiKey: string): Promise<Partial<WordData>> => {
  const messages: CerebrasMessage[] = [
    {
      role: "system",
      content: "You are an expert tutor. You always respond with valid JSON only, no additional text."
    },
    {
      role: "user",
      content: `For the word "${word}", provide DEEP LEARNING content and QUIZ in JSON format.

DEEP LEARNING:
- conceptOrigin: Etymology/history.
- comparisons: Array of 1-2 objects with {word, difference} for words it is often confused with.
- analogy: A real-world analogy.
- mentalImage: A vivid image to visualize.
- memoryStory: A short memorable story.
- mnemonic: A memory aid.
- associationPrompt: Personal connection prompt.
- arabicAssociations: Array of 3-5 Arabic words/synonyms.
- etymology: Array of objects with {part, meaning}.
- synonyms: Array of objects with {word, nuance}.
- antonyms: Array of strings.
- relatedWords: Array of strings.

QUIZ:
- multipleChoiceOptions: Array of 4 objects with {text, isCorrect}. Text must be descriptive definitions (5-15 words). DO NOT use single words. Wrong options must be plausible and semantically close.
- nearMeaningDistractors: Array of 4 objects with {word, definition} - semantically similar words.
- errorSpotting: Array of 3 objects with {sentence, isCorrect, explanation} - 1 incorrect usage.
- fillInBlankQuestion: A sentence with a blank.
- fillInBlankAnswer: The exact word.
- recallQuestion: A definition-style clue.
- recallAnswer: The target word.

Return complete valid JSON structure.`
    }
  ];

  const text = await makeCerebrasRequest(messages, apiKey);
  if (!text) throw new Error("No response for Stage 3");
  return JSON.parse(text);
};

export const lookupWord = async (word: string, apiKey: string): Promise<WordData> => {
  const s1 = await fetchWordStage1(word, apiKey);
  const s2 = await fetchWordStage2(word, apiKey);
  const s3 = await fetchWordStage3(word, apiKey);
  return { ...s1, ...s2, ...s3, mastery: 0 } as WordData;
};

export const checkElaboration = async (word: string, userDefinition: string, userSentence: string, apiKey: string): Promise<ElaborationFeedback> => {
  const messages: CerebrasMessage[] = [
    {
      role: "system",
      content: "You are a supportive but strict vocabulary tutor. You always respond with valid JSON only, no additional text."
    },
    {
      role: "user",
      content: `Act as a supportive but strict vocabulary tutor. Evaluate the user's understanding of the word "${word}".

User's Definition: "${userDefinition}"
User's Sentence: "${userSentence}"

Provide detailed feedback in JSON format:
- isCorrect: boolean
- generalFeedback: string
- definitionScore: number (1-5, where 5 is perfect, 1 is completely wrong)
- sentenceScore: number (1-5)
- definitionFeedback: string (specific correction)
- sentenceFeedback: string (specific correction)

Return valid JSON only.`
    }
  ];

  const text = await makeCerebrasRequest(messages, apiKey);
  if (!text) throw new Error("No response.");
  return JSON.parse(text) as ElaborationFeedback;
};

export const getQuickDefinition = async (word: string, apiKey: string): Promise<QuickDefinitionResult> => {
  const messages: CerebrasMessage[] = [
    {
      role: "system",
      content: "You are an expert tutor. You always respond with valid JSON only, no additional text."
    },
    {
      role: "user",
      content: `Define "${word}" in 12 words or less. Simple and direct.
      
Return JSON with:
{
  "word": "${word}",
  "definition": "short definition here"
}`
    }
  ];

  const text = await makeCerebrasRequest(messages, apiKey);
  if (!text) throw new Error("No response");
  return JSON.parse(text) as QuickDefinitionResult;
};
