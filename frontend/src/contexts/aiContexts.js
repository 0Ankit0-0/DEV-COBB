import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

/**
 * AI Service Functions
 */
export const codeSuggestion = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/suggestion/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code suggestion:", error);
    throw error;
  }
};
export const codeCompletion = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/completion/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code completion:", error);
    throw error;
  }
};
export const codeRefactoring = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/refactoring/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code refactoring:", error);
    throw error;
  }
};
export const codeReview = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/review/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code review:", error);
    throw error;
  }
};
export const codeSearch = async (query) => {
  try {
    const response = await api.post("/ai/search", { query });
    return response.data;
  } catch (error) {
    console.error("Failed to search code:", error);
    throw error;
  }
};
export const codeGeneration = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/generation/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to generate code:", error);
    throw error;
  }
};
export const codeDocumentation = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/documentation/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code documentation:", error);
    throw error;
  }
};
export const codeOptimization = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/optimization/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code optimization:", error);
    throw error;
  }
};
export const codeAnalysis = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/analysis/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code analysis:", error);
    throw error;
  }
};
export const codeIntegration = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/integration/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code integration:", error);
    throw error;
  }
};
export const chatWithAI = async (message) => {
  try {
    const response = await api.post("/ai/chat", { message });
    return response.data;
  } catch (error) {
    console.error("Failed to chat with AI:", error);
    throw error;
  }
};
export const codeDebugging = async (fileId, code) => {
  try {
    const response = await api.post(`/ai/debugging/${fileId}`, { code });
    return response.data;
  } catch (error) {
    console.error("Failed to get code debugging:", error);
    throw error;
  }
};

/**
 * (Optional) AI Context for managing AI UI/global state (if needed)
 */
const AIContext = createContext();
export const AIProvider = ({ children }) => {
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState(null);

  return (
    <AIContext.Provider value={{ aiLoading, setAILoading, aiError, setAIError }}>
      {children}
    </AIContext.Provider>
  );
};
export const useAI = () => useContext(AIContext);