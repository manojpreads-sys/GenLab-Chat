import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_GEMINI_API_KEY is not configured. Please set it in your .env file"
  );
}

const genAI = new GoogleGenerativeAI(API_KEY);

// List of models to try in order of preference (only use gemini-2.0 models)
const availableModels = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

// Get the Gemini model with fallback
const getModel = async (versionName = "v1") => {
  for (const modelName of availableModels) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      // Test the model with a simple request
      const testResult = await model.generateContent("Hi");
      console.log(`Successfully using model: ${modelName}`);
      return model;
    } catch (error) {
      console.warn(`Model ${modelName} not available:`, error.message);
      continue;
    }
  }
  // If none work, throw an error with helpful info
  throw new Error(
    `No Gemini models available. Tried: ${availableModels.join(", ")}. ` +
    `Please check your API key has access to Gemini models.`
  );
};

// Send a message and get a text response
export const sendMessage = async (messageText, versionName = "v1") => {
  try {
    const model = await getModel(versionName);
    const result = await model.generateContent(messageText);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(
      error.message || "Failed to get response from Gemini API"
    );
  }
};

// Start a chat session (for multi-turn conversations)
export const startChatSession = async (versionName = "v1") => {
  const model = await getModel(versionName);
  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 1024,
    },
  });
};

// Send a message in a chat session
export const sendChatMessage = async (chatSession, messageText) => {
  try {
    const result = await chatSession.sendMessage(messageText);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error(
      error.message || "Failed to get response from Gemini Chat"
    );
  }
};

export default {
  sendMessage,
  startChatSession,
  sendChatMessage,
};
