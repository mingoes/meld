import { execSync } from "child_process";
import { getApiKey } from "./config.js";
import { generateCommitMessage } from "./openrouter.js";
import { question } from "./ui.js";

export async function meltCommand(commitNumber: string) {
  if (!commitNumber) {
    console.error("❌ Please provide a commit hash or number");
    console.log("Example: meld melt <commit-hash-or-number>");
    return;
  }

  try {
    const apiKey = await getApiKey();
    // 1. Get the parent of the given commit
    const parentCommit = execSync(`git rev-parse ${commitNumber}^`)
      .toString()
      .trim();
    // 2. Get all commit messages from <parentCommit> (exclusive) to HEAD (inclusive of <commitNumber>)
    const logRange = `${parentCommit}..HEAD`;
    const commitMessages = execSync(`git log --format=%B --reverse ${logRange}`)
      .toString()
      .trim();
    // 3. Get the combined diff for the same range
    const gitDiff = execSync(
      `git diff --unified=20 ${parentCommit}`
    ).toString();
    if (!gitDiff) {
      console.error("❌ No changes found to squash.");
      return;
    }
    // 4. Confirm with user
    console.log(
      "⚠️  This will squash all commits down to and including:",
      commitNumber
    );
    const proceed = await question("Continue? (y/N): ");
    if (proceed.toLowerCase() !== "y") {
      return;
    }
    // 5. Perform a soft reset to the parent of the target commit
    execSync(`git reset --soft ${parentCommit}`);
    // 6. Generate a summary commit message
    const userMessage = `Squash summary for commits after ${parentCommit} (including ${commitNumber}).\n\nCommits:\n${commitMessages}`;
    const commitMessage = await generateCommitMessage(
      apiKey,
      userMessage,
      gitDiff
    );
    // 7. Create a new squashed commit
    execSync(`git commit -F -`, {
      input: commitMessage,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log("✨ Squashed and summarized commit created!");
  } catch (error) {
    console.error(
      "❌ Error during melt:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}
