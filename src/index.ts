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
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { question, showHelp } from "./ui.js";
import { chooseModel, generateCommitMessage } from "./openrouter.js";
import { meltCommand } from "./commands.js";

async function main() {
  try {
    const args = process.argv.slice(2);
    const isDryRun = args.includes("--dry");
    const filteredArgs = args.filter((arg) => arg !== "--dry");
    const command = filteredArgs[0];

    if (args.includes("--version")) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const pkgPath = join(__dirname, "..", "package.json");
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        console.log(`git-meld version ${pkg.version}`);
      } catch (e) {
        console.error("Could not read version info.");
      }
      return;
    }

    if (command === "--help") {
      showHelp();
      return;
    }

    if (command === "--reset-key") {
      await resetApiKey();
      return;
    }

    if (command === "--choose-model") {
      await chooseModel();
      return;
    }

    if (command === "--get-model") {
      const model = await getModel();
      console.log(`Current model: ${model}`);
      return;
    }

    if (command === "--set-model") {
      const modelId = filteredArgs[1];
      if (!modelId) {
        console.error("❌ Please provide a model ID");
        console.log('Example: meld --set-model "anthropic/claude-2"');
        process.exit(1);
      }

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
          return;
        }
      }

      await setModel(modelId);
      console.log(`✨ Model set to: ${modelId}`);
      return;
    }

    if (command === "melt") {
      const commitNumber = filteredArgs[1];
      await meltCommand(commitNumber);
      return;
    }

    // No command, or a message for commit
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
      return;
    }

    // This is a commit message
    const apiKey = await getApiKey();
    const userMessage = filteredArgs.join(" ");

    if (!userMessage) {
      console.error("❌ Please provide a commit message");
      showHelp();
      process.exit(1);
    }

    // Get git diff and status
    const gitDiff = execSync("git diff --staged --unified=20").toString();

    if (!gitDiff) {
      console.error(
        "❌ No staged changes found. Use git add to stage your changes."
      );
      process.exit(1);
    }

    const commitMessage = await generateCommitMessage(
      apiKey,
      userMessage,
      gitDiff
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
        console.log("\n📝 Commit message used:\n");
        console.log(commitMessage);
      }
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
