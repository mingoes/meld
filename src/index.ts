#!/usr/bin/env node
import { execSync } from "child_process";
import OpenAI from "openai";
import { getApiKey, resetApiKey } from "./config.js";

async function main() {
  const command = process.argv[2];

  if (command === "--reset-key") {
    await resetApiKey();
    return;
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
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates detailed git commit messages. Include relevant details from the diff, and add appropriate emojis when relevant. Keep the message concise but informative.",
        },
        {
          role: "user",
          content: `Please generate a detailed commit message. Keep the tone light, add an emoji here and there. The user's message was: "${userMessage}"\n\nGit diff:\n${gitDiff}\n\nGit status:\n${gitStatus}`,
        },
      ],
    });

    const commitMessage = completion.choices[0].message.content;

    if (commitMessage) {
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      console.log("✨ Commit created successfully!");
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
