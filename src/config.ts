import keytar from "keytar";
import { createInterface } from "readline";

const SERVICE_NAME = "git-meld";
const ACCOUNT_NAME_OPENAI = "openai-api-key";
const ACCOUNT_NAME_OPENROUTER = "openrouter-api-key";
const PROVIDER_KEY = "provider";

type Provider = "openai" | "openrouter";

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

export async function getProvider(): Promise<Provider> {
  let provider = (await keytar.getPassword(
    SERVICE_NAME,
    PROVIDER_KEY
  )) as Provider;

  if (!provider) {
    console.log("🤖 Which AI provider would you like to use?");
    console.log("1. OpenAI (requires API key from openai.com)");
    console.log("2. OpenRouter (requires API key from openrouter.ai)");

    const choice = await question("Enter 1 or 2: ");
    provider = choice === "2" ? "openrouter" : "openai";
    await keytar.setPassword(SERVICE_NAME, PROVIDER_KEY, provider);
  }

  return provider;
}

export async function hasApiKey(): Promise<boolean> {
  const provider = await getProvider();
  const accountName =
    provider === "openai" ? ACCOUNT_NAME_OPENAI : ACCOUNT_NAME_OPENROUTER;
  const apiKey = await keytar.getPassword(SERVICE_NAME, accountName);
  return !!apiKey;
}

export async function getApiKey(): Promise<{
  provider: Provider;
  apiKey: string;
}> {
  const provider = await getProvider();
  const accountName =
    provider === "openai" ? ACCOUNT_NAME_OPENAI : ACCOUNT_NAME_OPENROUTER;
  let apiKey = await keytar.getPassword(SERVICE_NAME, accountName);

  if (!apiKey) {
    // Prompt user for API key
    console.log(
      `🔑 ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key not found.`
    );
    console.log(
      `Get your API key from ${
        provider === "openai" ? "openai.com" : "openrouter.ai"
      }`
    );
    apiKey = await question("Please enter your API key: ");

    if (!apiKey) {
      throw new Error("API key is required");
    }

    // Save to system keychain
    await keytar.setPassword(SERVICE_NAME, accountName, apiKey);
    console.log("✨ API key saved securely");
  }

  return { provider, apiKey };
}

export async function resetApiKey(): Promise<void> {
  const provider = await getProvider();
  const accountName =
    provider === "openai" ? ACCOUNT_NAME_OPENAI : ACCOUNT_NAME_OPENROUTER;
  await keytar.deletePassword(SERVICE_NAME, accountName);
  await keytar.deletePassword(SERVICE_NAME, PROVIDER_KEY);
  console.log(
    "🔄 Configuration reset. You will be prompted for new settings on next run."
  );
}
