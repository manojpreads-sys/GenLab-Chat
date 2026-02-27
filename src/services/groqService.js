import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_GEMINI_API_KEY is not configured. Please set it in your .env file"
  );
}

const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

// Map version names to Groq models (using currently available models)
const modelMap = {
  v1: "llama-3.1-8b-instant",
  v2: "llama-3.1-70b-versatile",
  pro: "llama-3.1-70b-versatile",
};

// Get the Groq model name for a version
const getModel = (versionName = "v1") => {
  return modelMap[versionName] || "mixtral-8x7b-32768";
};

// Send a message and get a text response
export const sendMessage = async (messageText, versionName = "v1") => {
  try {
    const modelName = getModel(versionName);
    console.log(`Using Groq model: ${modelName}`);
    
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: messageText,
        },
      ],
      model: modelName,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return message.choices[0]?.message?.content || "No response from Groq";
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      error.message || "Failed to get response from Groq API"
    );
  }
};

// Start a chat session (for multi-turn conversations)
export const startChatSession = async (versionName = "v1") => {
  return {
    history: [],
    modelName: getModel(versionName),
    sendMessage: async (messageText) => {
      const fullHistory = [
        ...this.history,
        { role: "user", content: messageText },
      ];

      const message = await groq.chat.completions.create({
        messages: fullHistory,
        model: this.modelName,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const reply = message.choices[0]?.message?.content || "";
      this.history.push({ role: "user", content: messageText });
      this.history.push({ role: "assistant", content: reply });
      return reply;
    },
  };
};

// Send a message in a chat session
export const sendChatMessage = async (chatSession, messageText) => {
  try {
    return await chatSession.sendMessage(messageText);
  } catch (error) {
    console.error("Groq Chat Error:", error);
    throw new Error(
      error.message || "Failed to get response from Groq Chat"
    );
  }
};

export default {
  sendMessage,
  startChatSession,
  sendChatMessage,
};
