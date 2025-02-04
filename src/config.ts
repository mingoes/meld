import keytar from "keytar";
import { createInterface } from "readline";

const SERVICE_NAME = "git-meld";
const ACCOUNT_NAME = "openai-api-key";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

export async function getApiKey(): Promise<string> {
  // Try to get the API key from the system keychain
  let apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);

  if (!apiKey) {
    // Prompt user for API key
    console.log("🔑 OpenAI API key not found.");
    apiKey = (await question("Please enter your OpenAI API key: ")) as string;

    if (!apiKey) {
      throw new Error("API key is required");
    }

    // Save to system keychain
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
    console.log("✨ API key saved securely");
  }

  return apiKey;
}

export async function resetApiKey(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  console.log(
    "🔄 API key removed. You will be prompted for a new one on next run."
  );
}
