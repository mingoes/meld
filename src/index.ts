#!/usr/bin/env NODE_NO_WARNINGS=1 node
import { execSync } from "child_process";
import {
  getApiKey,
  resetApiKey,
  hasApiKey,
  getModel,
  setModel,
  listModels,
} from "./config.js";
import { createInterface } from "readline";
import { readFileSync } from "fs";

// OpenRouter types
type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
};

type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

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

const showHelp = () => {
  console.log(`
🔄 git-meld - AI-powered commit messages

Usage:
  meld "your commit message"     Create an enhanced commit message
  meld --dry "your message"     Preview the commit message without committing
  meld --choose-model           Select an AI model from available models
  meld --set-model "model-id"   Set model ID directly (e.g., "anthropic/claude-2")
  meld --reset-key              Reset the stored API key and model choice
  meld --help                   Show this help message

Examples:
  meld "fix login bug"
  meld --dry "add user profile"
  meld --set-model "anthropic/claude-2"
  
Note: Make sure to stage your changes with 'git add' first!
`);
};

async function generateCommitMessage(
  apiKey: string,
  userMessage: string,
  gitDiff: string,
  gitStatus: string
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
          ? `\n\nAdditional instructions from .meld file (they override the ones in the system prompt):\n${additionalInstructions}`
          : ""
      }\n\nGit diff:\n${gitDiff}\n\nGit status:\n${gitStatus}`,
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

async function chooseModel(): Promise<void> {
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

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args[0] === "--dry";
  const command = isDryRun ? args[1] : args[0];

  if (command === "--help") {
    showHelp();
    process.exit(0);
  }

  if (command === "--reset-key") {
    await resetApiKey();
    process.exit(0);
  }

  if (command === "--choose-model") {
    await chooseModel();
    process.exit(0);
  }

  if (command === "--set-model") {
    const modelId = args[1];
    if (!modelId) {
      console.error("❌ Please provide a model ID");
      console.log('Example: meld --set-model "anthropic/claude-2"');
      process.exit(1);
    }

    try {
      const apiKey = await getApiKey();
      const modelsData = await listModels(apiKey);
      const models = modelsData.data;
      const modelExists = models.some((model: any) => model.id === modelId);

      if (!modelExists) {
        console.log(
          "⚠️  Warning: The provided model ID was not found in the available models."
        );
        console.log("You can view available models with: meld --choose-model");
        const proceed = await question(
          "Do you want to set this model anyway? (y/N): "
        );
        if (proceed.toLowerCase() !== "y") {
          process.exit(0);
        }
      }

      await setModel(modelId);
      console.log(`✨ Model set to: ${modelId}`);
      process.exit(0);
    } catch (error) {
      console.error(
        "❌ Failed to set model:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  }

  // No arguments provided
  if (!command) {
    if (await hasApiKey()) {
      showHelp();
    } else {
      console.log(
        "👋 Welcome to git-meld! Let's set up your OpenRouter API key."
      );
      await getApiKey();
      console.log("\n✨ Using default model: openai/o1-mini-2024-09-12");
      console.log("You can change the model anytime with:");
      console.log("  meld --choose-model    (interactive selection)");
      console.log('  meld --set-model "model-id"');
      console.log("\nTry creating your first commit:");
      console.log('meld "your commit message"');
    }
    process.exit(0);
  }

  try {
    const apiKey = await getApiKey();
    const userMessage = isDryRun ? args.slice(1).join(" ") : args.join(" ");

    if (!userMessage) {
      console.error("❌ Please provide a commit message");
      process.exit(1);
    }

    // Get git diff and status
    const gitDiff = execSync("git diff").toString();
    const gitStatus = execSync("git status --porcelain").toString();

    if (!gitDiff && !gitStatus) {
      console.error(
        "❌ No staged changes found. Use git add to stage your changes."
      );
      process.exit(1);
    }

    const commitMessage = await generateCommitMessage(
      apiKey,
      userMessage,
      gitDiff,
      gitStatus
    );

    if (commitMessage) {
      if (isDryRun) {
        console.log("\n📝 Generated commit message (dry run):\n");
        console.log(commitMessage);
      } else {
        execSync(`git commit -F -`, {
          input: commitMessage,
          stdio: ["pipe", "inherit", "inherit"],
        });
        console.log("✨ Commit created successfully!");
      }
      process.exit(0);
    }
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}

main();
