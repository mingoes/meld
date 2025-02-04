#!/usr/bin/env NODE_NO_WARNINGS=1 node
import { execSync } from "child_process";
import OpenAI from "openai";
import { getApiKey, resetApiKey, hasApiKey } from "./config.js";
import { ChatCompletionMessage } from "openai/resources/index.mjs";

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

const showHelp = () => {
  console.log(`
🔄 git-meld - AI-powered commit messages

Usage:
  meld "your commit message"     Create an enhanced commit message
  meld --dry "your message"     Preview the commit message without committing
  meld --reset-key              Reset the stored API key and provider choice
  meld --help                   Show this help message

Examples:
  meld "fix login bug"
  meld --dry "add user profile"
  
Note: Make sure to stage your changes with 'git add' first!
`);
};

async function generateCommitMessage(
  provider: string,
  apiKey: string,
  userMessage: string,
  gitDiff: string,
  gitStatus: string
): Promise<string> {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that generates detailed git commit messages. Include relevant details from the diff, and add appropriate emojis when relevant. Keep the message concise but informative Only output a commit message, that goes directly into git.",
    },
    {
      role: "user",
      content: `Please generate a detailed commit message. The user's message was: "${userMessage}"\n\nGit diff:\n${gitDiff}\n\nGit status:\n${gitStatus}`,
    },
  ];

  try {
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages as ChatCompletionMessage[],
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error("No response from OpenAI");
      }

      return completion.choices[0].message.content;
    } else {
      // OpenRouter
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
            model: "openai/o1-mini-2024-09-12",
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
    }
  } catch (error) {
    throw new Error(
      `Failed to generate commit message: ${
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

  // No arguments provided
  if (!command) {
    if (await hasApiKey()) {
      showHelp();
    } else {
      console.log(
        "👋 Welcome to git-meld! Let's set up your AI provider first."
      );
      await getApiKey();
      console.log("\nGreat! Now you can use git-meld. Try:");
      console.log('meld "your commit message"');
    }
    process.exit(0);
  }

  try {
    const { provider, apiKey } = await getApiKey();
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
      provider,
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
