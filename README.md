# 🔄 git-meld

> Enhance your git commits with AI-powered commit messages!

`git-meld` is a CLI tool that uses AI to analyze your changes and generate meaningful, detailed commit messages. It's like having a helpful co-pilot for your git commits! 🚀

## ✨ Features

- 🤖 Uses AI to analyze your git diff and generate detailed commit messages
- 🔄 Supports both OpenAI and OpenRouter as AI providers
- 🔒 Securely stores your API keys in your system's keychain
- 🎯 Considers both staged changes and git status
- 😊 Adds relevant emojis to make your commits more expressive
- 🚀 Simple to use - just replace `git commit` with `meld`

## 📦 Installation

```bash
npm install -g git-meld
```

## 🛠️ First Time Setup

On first run, git-meld will ask you to choose an AI provider:

1. OpenAI (get your API key from [OpenAI Platform](https://platform.openai.com/api-keys))
2. OpenRouter (get your API key from [OpenRouter](https://openrouter.ai/keys))

```bash
meld
# Follow the prompts to select provider and enter your API key
```

Your API key will be stored securely in your system's keychain.

## 💡 Usage

1. Stage your changes as usual:

```bash
git add .  # or git add <specific-files>
```

2. Instead of `git commit`, use:

```bash
meld "brief description"
```

The tool will analyze your changes and generate a detailed, meaningful commit message!

### Commands

- `meld "your message"` - Create an enhanced commit message
- `meld --help` - Show help information
- `meld --reset-key` - Reset the stored API key and provider choice

## 📝 Example

```bash
$ git add feature.ts
$ meld "add user auth"

# Generated commit message might look like:
✨ feat(auth): Implement user authentication system

- Add JWT token validation middleware
- Create secure password hashing functionality
- Implement session management
```

## 🤔 Why git-meld?

"Meld" is a Dutch word meaning "report" or "announce". This tool helps you announce your changes in a more meaningful way, ensuring your git history is clear and informative.

## 🔑 Security

Your API keys are stored securely in your system's keychain, not in plain text files.

## 📄 License

MIT © 2024

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/mingoes/meld/issues)!
