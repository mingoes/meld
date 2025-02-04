import keytar from "keytar";
import { createInterface } from "readline";

const SERVICE_NAME = "git-meld";
const ACCOUNT_NAME_OPENROUTER = "openrouter-api-key";
const MODEL_KEY = "model";
const DEFAULT_MODEL = "openai/o1-mini-2024-09-12";

const question = (prompt: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

export async function getModel(): Promise<string> {
  let model = await keytar.getPassword(SERVICE_NAME, MODEL_KEY);
  if (!model) {
    model = DEFAULT_MODEL;
  }
  return model;
}

export async function setModel(model: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, MODEL_KEY, model);
}

export async function hasApiKey(): Promise<boolean> {
  const apiKey = await keytar.getPassword(
    SERVICE_NAME,
    ACCOUNT_NAME_OPENROUTER
  );
  return !!apiKey;
}

export async function getApiKey(): Promise<string> {
  let apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME_OPENROUTER);

  if (!apiKey) {
    console.log("🔑 OpenRouter API key not found.");
    console.log("Get your API key from openrouter.ai");
    apiKey = await question("Please enter your API key: ");

    if (!apiKey) {
      throw new Error("API key is required");
    }

    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME_OPENROUTER, apiKey);
    console.log("✨ API key saved securely");
  }

  return apiKey;
}

export async function resetApiKey(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME_OPENROUTER);
  await keytar.deletePassword(SERVICE_NAME, MODEL_KEY);
  console.log(
    "🔄 Configuration reset. You will be prompted for new settings on next run."
  );
}

export async function listModels(apiKey: string): Promise<any> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/mingoes/meld",
      "X-Title": "git-meld",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch models from OpenRouter");
  }

  return response.json();
}
