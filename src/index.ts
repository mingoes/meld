#!/usr/bin/env NODE_NO_WARNINGS=1 node
import { execSync } from "child_process";
import OpenAI from "openai";
import { getApiKey, resetApiKey, hasApiKey } from "./config.js";

const showHelp = () => {
  console.log(`
🔄 git-meld - AI-powered commit messages

Usage:
  meld "your commit message"     Create an enhanced commit message
  meld --reset-key              Reset the stored API key
  meld --help                   Show this help message

Examples:
  meld "fix login bug"
  meld "add user profile"
  
Note: Make sure to stage your changes with 'git add' first!
`);
};

async function main() {
  const command = process.argv[2];

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
        "👋 Welcome to git-meld! Let's set up your OpenAI API key first."
      );
      await getApiKey();
      console.log("\nGreat! Now you can use git-meld. Try:");
      console.log('meld "your commit message"');
    }
    process.exit(0);
  }

  try {
    const apiKey = await getApiKey();
    const openai = new OpenAI({ apiKey });

    const userMessage = process.argv.slice(2).join(" ");

    if (!userMessage) {
      console.error("❌ Please provide a commit message");
      process.exit(1);
    }

    // Get git diff and status
    const gitDiff = execSync("git diff --cached").toString();
    const gitStatus = execSync("git status --porcelain").toString();

    if (!gitDiff && !gitStatus) {
      console.error(
        "❌ No staged changes found. Use git add to stage your changes."
      );
      process.exit(1);
    }

    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates detailed git commit messages. Include relevant details from the diff, and add appropriate emojis when relevant. Keep the message concise but informative. Respond ONLY with a commmit message.",
        },
        {
          role: "user",
          content: `Please generate a brief but detailed commit message. The user's commit message was: "${userMessage}"\n\nGit diff:\n${gitDiff}\n\nGit status:\n${gitStatus}`,
        },
      ],
    });

    const commitMessage = completion.choices[0].message.content;

    if (commitMessage) {
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      console.log("✨ Commit created successfully!");
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
