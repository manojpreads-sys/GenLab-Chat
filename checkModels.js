import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDT5S9cYzHcqDeGKKxgEsH6o_PecBKifA8";

const genAI = new GoogleGenerativeAI(API_KEY);

// Test models commonly available
const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-pro-vision",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    console.log(`✓ ${modelName} - SUCCESS`);
    return { model: modelName, success: true };
  } catch (error) {
    console.log(`✗ ${modelName}`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, success: false, error: error.message };
  }
}

async function findWorkingModel() {
  console.log("Checking available models with your API key...\n");
  
  const results = [];
  for (const modelName of modelsToTest) {
    const result = await testModel(modelName);
    results.push(result);
    if (result.success) {
      console.log(`\n✓ Found working model: ${modelName}`);
      return modelName;
    }
  }
  
  console.log("\nNo models worked. Here's what failed:");
  results.forEach((r) => {
    if (!r.success) {
      console.log(`- ${r.model}`);
    }
  });
  
  return null;
}

findWorkingModel().then((model) => {
  if (model) {
    console.log(`\nUse this model in geminiService.js: "${model}"`);
  }
});
