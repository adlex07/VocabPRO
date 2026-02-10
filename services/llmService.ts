import { WordData, ElaborationFeedback, QuickDefinitionResult, LLMProvider } from "../types";
import * as geminiService from "./geminiService";
import * as cerebrasService from "./cerebrasService";

// Service router that delegates to the appropriate provider
export const fetchWordStage1 = async (
  word: string,
  provider: LLMProvider,
  apiKey: string
): Promise<Partial<WordData>> => {
  if (provider === "cerebras") {
    return cerebrasService.fetchWordStage1(word, apiKey);
  }
  return geminiService.fetchWordStage1(word, apiKey);
};

export const fetchWordStage2 = async (
  word: string,
  provider: LLMProvider,
  apiKey: string
): Promise<Partial<WordData>> => {
  if (provider === "cerebras") {
    return cerebrasService.fetchWordStage2(word, apiKey);
  }
  return geminiService.fetchWordStage2(word, apiKey);
};

export const fetchWordStage3 = async (
  word: string,
  provider: LLMProvider,
  apiKey: string
): Promise<Partial<WordData>> => {
  if (provider === "cerebras") {
    return cerebrasService.fetchWordStage3(word, apiKey);
  }
  return geminiService.fetchWordStage3(word, apiKey);
};

export const lookupWord = async (
  word: string,
  provider: LLMProvider,
  apiKey: string
): Promise<WordData> => {
  if (provider === "cerebras") {
    return cerebrasService.lookupWord(word, apiKey);
  }
  return geminiService.lookupWord(word, apiKey);
};

export const checkElaboration = async (
  word: string,
  userDefinition: string,
  userSentence: string,
  provider: LLMProvider,
  apiKey: string
): Promise<ElaborationFeedback> => {
  if (provider === "cerebras") {
    return cerebrasService.checkElaboration(word, userDefinition, userSentence, apiKey);
  }
  return geminiService.checkElaboration(word, userDefinition, userSentence, apiKey);
};

export const getQuickDefinition = async (
  word: string,
  provider: LLMProvider,
  apiKey: string
): Promise<QuickDefinitionResult> => {
  if (provider === "cerebras") {
    return cerebrasService.getQuickDefinition(word, apiKey);
  }
  return geminiService.getQuickDefinition(word, apiKey);
};
