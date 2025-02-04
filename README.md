# 🔄 git-meld

> Enhance your git commits with AI-powered commit messages!

`git-meld` is a CLI tool that uses AI to analyze your changes and generate meaningful, detailed commit messages. It's like having a helpful co-pilot for your git commits! 🚀

## ✨ Features

- 🤖 Uses AI to analyze your git diff and generate detailed commit messages
- 🔄 Powered by OpenRouter - access to multiple AI models
- 🎯 Considers both staged changes and git status
- 😊 Adds relevant emojis to make your commits more expressive
- 🔒 Securely stores your API key in your system's keychain
- 🚀 Simple to use - just replace `git commit` with `meld`
- 📝 Support for custom commit guidelines via `.meld` file

## 📦 Installation

```bash
npm install -g git-meld
```

## 🛠️ First Time Setup

On first run, git-meld will ask for your OpenRouter API key:

```bash
meld
# Follow the prompt to enter your OpenRouter API key
```

Get your API key from [OpenRouter](https://openrouter.ai/keys).
Your API key will be stored securely in your system's keychain.

By default, git-meld uses the `openai/o1-mini-2024-09-12` model, but you can easily switch to any other model available on OpenRouter.

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
- `meld --dry "message"` - Preview the commit message without committing
- `meld --choose-model` - Select an AI model from available models
- `meld --set-model "model-id"` - Set model ID directly (e.g., "anthropic/claude-2")
- `meld --reset-key` - Reset the stored API key and model choice
- `meld --help` - Show help information

### Choosing a Model

You can choose from any model available on OpenRouter:

```bash
# Interactive model selection
meld --choose-model

# Direct model setting
meld --set-model "anthropic/claude-2"
```

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

Your API key is stored securely in your system's keychain, not in plain text files.

## 📄 License

MIT © 2024

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/mingoes/meld/issues)!

### Custom Commit Guidelines

You can create a `.meld` file in your repository root to provide additional instructions for commit message generation. These instructions will be included every time a commit message is generated.

Example `.meld` file:

```
Follow conventional commits format (feat, fix, docs, etc)
Include ticket number from Jira (e.g., PROJ-123)
Keep subject line under 72 characters
```

The contents of this file will be added to the AI prompt, helping to maintain consistent commit message style across your project.
