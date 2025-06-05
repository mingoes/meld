import { createInterface } from "readline";

export const question = (prompt: string): Promise<string> => {
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

export const showHelp = () => {
  console.log(`
🔄 git-meld - AI-powered commit messages

Usage:
  meld "your commit message"     Create an enhanced commit message
  meld --dry "your message"     Preview the commit message without committing
  meld --choose-model           Select an AI model from available models
  meld --get-model              Show the currently selected model
  meld --set-model "model-id"   Set model ID directly (e.g., "anthropic/claude-2")
  meld --reset-key              Reset the stored API key and model choice
  meld melt <commit>            Squash all commits down to <commit> and generate a summarized commit message
  meld --version                Show the current version
  meld --help                   Show this help message

Examples:
  meld "fix login bug"
  meld --dry "add user profile"
  meld --set-model "anthropic/claude-2"
  meld melt 1234abcd
  
Note: Make sure to stage your changes with 'git add' first!
`);
};
