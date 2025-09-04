# MangoFlow: AI Chat Sidebar

<div align="center">

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Plasmo](https://img.shields.io/badge/Built%20with-Plasmo-FFD700?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cGF0aCBmaWxsPSIjRkZEQTAwIiBkPSJNMTI4IDBMMjU2IDEyOEwxMjggMjU2TDAgMTI4Wk0xMjggNjRMMTkyIDEyOEwxMjggMTkyTDY0IDEyOFoiLz48L3N2Zz4=)](https://docs.plasmo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.1.2-blue)](https://github.com/zh30/mangoflow)

**A powerful AI companion that brings intelligent conversation to your browsing experience**

[Features](#-features) • [Installation](#-installation) • [Configuration](#-configuration) • [Development](#-development) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🤖 Multi-Model Support
- **OpenAI** & OpenAI-compatible APIs (including custom endpoints)
- **Anthropic Claude 3** - Advanced reasoning and creative capabilities
- **Google Gemini** - Google's cutting-edge AI model
- **Groq** - Lightning-fast inference with Llama models
- **Ollama** - Local AI models for privacy-conscious users

### 💬 Smart Chat Interface
- **Chrome Side Panel Integration** - Chat while browsing without switching tabs
- **Real-time Streaming** - Watch responses generate in real-time
- **Markdown Support** - Rich text formatting with syntax highlighting
- **Chat History** - Maintain conversation context across sessions

### 🎯 Prompt Management
- **Custom System Prompts** - Define AI behavior and personality
- **Prompt Templates** - Save and reuse effective prompts
- **Dynamic Prompt Selection** - Switch prompts on-the-fly

### 🌍 Internationalization
- **Multi-language Support** - Available in English, Chinese, Japanese, Korean, Arabic, Bengali, and Spanish
- **Chrome i18n Integration** - Native browser localization

### 🔒 Privacy & Security
- **Local Storage** - All configurations stored locally
- **No Tracking** - Respects user privacy
- **Self-hosted Options** - Support for local AI models

## 🚀 Installation

### Chrome Web Store
*Coming soon - Currently in development*

### Development Build

#### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Chrome browser (version 116+)

#### Setup
```bash
# Clone the repository
git clone https://github.com/zh30/mangoflow.git
cd mangoflow

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

#### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` directory
5. The extension icon will appear in your toolbar

## ⚙️ Configuration

### Adding AI Models

1. **Click the extension icon** in your toolbar to open the side panel
2. **Click the settings icon** (⚙️) to open configuration
3. **Navigate to "Model Management"**
4. **Click "Add New Model"** and configure:

#### OpenAI / Custom API
- **Model Title**: Display name for the model
- **Model Type**: "Other (OpenAI-like)"
- **Domain**: API endpoint (e.g., `https://api.openai.com/v1`)
- **API Key**: Your service API key
- **Model Name**: Specific model (e.g., `gpt-4`, `claude-3-opus`)

#### Anthropic Claude
- **Model Type**: "Anthropic Claude 3"
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/settings/keys)
- **Model Name**: `claude-3-opus`, `claude-3-sonnet`, or `claude-3-haiku`

#### Google Gemini
- **Model Type**: "Google Gemini"
- **API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Model Name**: `gemini-pro` or `gemini-pro-vision`

#### Groq
- **Model Type**: "Groq Cloud"
- **API Key**: Get from [Groq Console](https://console.groq.com/keys)
- **Model Name**: `llama3-70b-8192`, `mixtral-8x7b-32768`, etc.

#### Ollama (Local)
- **Model Type**: "Ollama"
- **Start Ollama**: Run `OLLAMA_ORIGINS=chrome-extension://* ollama serve`
- **Model Name**: Available local models (e.g., `llama3`, `mistral`, `codellama`)

### Creating System Prompts

1. **Go to "Prompt Management"** in settings
2. **Click "Add a New Prompt"**
3. **Configure your prompt**:
   - **Prompt Title**: Short, descriptive name
   - **System Prompt Body**: Detailed instructions for the AI
4. **Use prompts** in chat via the dropdown in the side panel

## 💻 Development

### Tech Stack
- **Framework**: [Plasmo](https://docs.plasmo.com/) - Chrome extension development
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand + Plasmo Storage
- **Forms**: React Hook Form + Zod validation
- **Icons**: Iconify with multiple icon sets
- **Markdown**: Marked.js for response rendering

### Project Structure
```
src/
├── sidepanel/          # Main chat interface
├── options/           # Settings/configuration page
├── background/        # Background service worker
│   ├── ports/         # Message handlers
│   └── messages/      # Message definitions
├── components/ui/     # Reusable UI components
├── contents/          # Content scripts
├── lib/              # Utility functions
└── style.css         # Global styles
```

### Development Commands
```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Package for distribution
pnpm package

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Building for Production
```bash
# Create production build
pnpm build

# Package for Chrome Web Store
pnpm package

# Files will be in:
# - build/chrome-mv3-prod/  # Chrome production build
# - build/chrome-mv3-dev/   # Chrome development build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use existing component patterns
- Maintain consistent formatting with Prettier
- Write clear, descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Plasmo Framework](https://docs.plasmo.com/) - Chrome extension development platform
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Iconify](https://iconify.design/) - Universal icon framework

## 📞 Support

- 📧 **Email**: hello@zhanghe.dev
- 💬 **Telegram**: [MangoFlow Community](https://t.me/mangoflowai)
- 🐦 **Twitter**: [@zhanghedev](https://twitter.com/zhanghedev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/zh30/mangoflow/issues)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zh30/mangoflow&type=Date)](https://star-history.com/zh30/mangoflow&Date)

---

<div align="center">

Made with ❤️ by [Henry](https://x.com/zhanghedev)

</div>