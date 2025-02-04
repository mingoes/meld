# 🔄 git-meld

> Enhance your git commits with AI-powered commit messages!

`git-meld` is a CLI tool that uses OpenAI to analyze your changes and generate meaningful, detailed commit messages. It's like having a helpful co-pilot for your git commits! 🚀

## ✨ Features

- 🤖 Uses OpenAI to analyze your git diff and generate detailed commit messages
- 🔒 Securely stores your API key in your system's keychain
- 🎯 Considers both staged changes and git status
- 😊 Adds relevant emojis to make your commits more expressive
- 🚀 Simple to use - just replace `git commit` with `meld`

## 📦 Installation

```bash
npm install -g git-meld
```

## 🛠️ First Time Setup

On first run, git-meld will prompt you for your OpenAI API key. You can get one from [OpenAI Platform](https://platform.openai.com/api-keys).

```bash
meld
# Follow the prompts to enter your API key
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
- `meld --reset-key` - Reset the stored API key

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

Your OpenAI API key is stored securely in your system's keychain, not in plain text files.

## 📄 License

MIT © 2024

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/yourusername/git-meld/issues)!
