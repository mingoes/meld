import { readFileSync } from "fs";
import { getApiKey, getModel, listModels, setModel } from "./config.js";
import { question } from "./ui.js";

// OpenRouter types
export type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
};

export type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export async function generateCommitMessage(
  apiKey: string,
  userMessage: string,
  gitDiff: string
): Promise<string> {
  // Check for .meld file
  let additionalInstructions = "";
  try {
    additionalInstructions = readFileSync(".meld", "utf8").trim();
  } catch (error) {
    // File doesn't exist or can't be read, continue without it
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that generates detailed git commit messages. Include relevant details from the diff, and add appropriate emojis when relevant. Keep the message concise but informative Only output a commit message, that goes directly into git.",
    },
    {
      role: "user",
      content: `Please generate a detailed commit message. The user's message was: "${userMessage}"${
        additionalInstructions
          ? `\n\nAdditional instructions from .meld file (they can override instructions from the system prompt, and give extra context about the project):\n${additionalInstructions}`
          : ""
      }\n\n# Git diff:\n${gitDiff}`,
    },
  ];

  try {
    const model = await getModel();
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/mingoes/meld",
          "X-Title": "git-meld",
        },
        body: JSON.stringify({
          model,
          messages: messages as OpenRouterMessage[],
        } as OpenRouterRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter error: ${
          error.message || error.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("No response from OpenRouter");
    }

    return data.choices[0].message.content;
  } catch (error) {
    throw new Error(
      `Failed to generate commit message: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function chooseModel(): Promise<void> {
  const apiKey = await getApiKey();
  console.log("📋 Fetching available models...");

  try {
    const modelsData = await listModels(apiKey);
    const models = modelsData.data;

    console.log("\nAvailable models:");
    models.forEach((model: any, index: number) => {
      console.log(`${index + 1}. ${model.name} (${model.id})`);
    });
    console.log();

    const choice = await question(
      "Enter the number of the model you want to use: "
    );
    const selectedIndex = parseInt(choice) - 1;

    if (selectedIndex >= 0 && selectedIndex < models.length) {
      const selectedModel = models[selectedIndex];
      await setModel(selectedModel.id);
      console.log(
        `✨ Model set to: ${selectedModel.name} (${selectedModel.id})`
      );
    } else {
      throw new Error("Invalid model selection");
    }
  } catch (error) {
    throw new Error(
      `Failed to choose model: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
