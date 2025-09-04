# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MangoFlow is a Chrome extension built with Plasmo that provides AI-powered chat capabilities through multiple LLM providers (OpenAI, Anthropic Claude, Google Gemini, Groq, and Ollama). The extension features a side panel chat interface with model configuration, prompt templates, and internationalization support.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm test` - Run tests
- `pnpm package` - Build and zip for distribution (Chrome + Edge)

### Package Management
- Uses `pnpm@9.12.1` as the package manager
- All dependencies should be installed using `pnpm`

## Architecture

### Core Components

**Extension Entry Points:**
- `src/sidepanel/index.tsx` - Main chat interface (Chrome side panel)
- `src/options/index.tsx` - Settings/configuration page
- `src/background/index.ts` - Background service worker
- `src/background/ports/assistant.ts` - AI model integration handler
- `src/contents/html.tsx` - Content script functionality

**UI Components:**
- `src/components/ui/` - Shadcn/ui components with Tailwind CSS styling
- Uses Radix UI primitives with custom styling
- Icon system powered by Iconify with multiple icon sets

**State Management:**
- Zustand stores for chat state, model management, and prompt management
- Plasmo storage for persistence across extension sessions
- React hooks for local component state

### Key Patterns

**Chat Flow:**
1. User enters message in sidepanel (`src/sidepanel/index.tsx:239-335`)
2. Message sent to background port (`src/background/ports/assistant.ts:15-187`)
3. Background handler routes to appropriate AI model provider
4. Streaming responses sent back to sidepanel
5. UI updates with streaming content and final completion

**Model Configuration:**
- Models defined in options page with type-specific fields
- Support for OpenAI-compatible APIs (including Ollama), Gemini, Groq, and Claude
- Each model type has custom authentication and API handling

**Internationalization:**
- Chrome i18n API for multi-language support
- Translation files in `locales/` directory
- Support for English, Chinese, Japanese, Korean, Arabic, Bengali, and Spanish

## Technology Stack

- **Framework**: Plasmo (Chrome extension development)
- **UI**: React 18.2.0 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State**: Zustand + Plasmo storage
- **Forms**: React Hook Form with Zod validation
- **Icons**: Iconify with multiple icon sets
- **Markdown**: Marked.js for rendering AI responses
- **AI SDKs**: OpenAI, Anthropic, Google Gemini, Groq

## File Structure Conventions

- `src/components/ui/` - Reusable UI components (Shadcn/ui)
- `src/lib/` - Utility functions and constants
- `src/background/` - Background scripts and message handlers
- `src/sidepanel/` - Side panel interface components
- `src/options/` - Options/settings page components
- `locales/` - Internationalization files

## Development Guidelines

### Component Development
- Use existing Shadcn/ui components when possible
- Follow the established patterns for forms and state management
- Implement proper TypeScript types for all props and state
- Use the existing icon system (Iconify) for icons

### Styling
- Follow Tailwind CSS utility-first approach
- Use the established color palette from `tailwind.config.js`
- Maintain consistency with existing component spacing and typography
- Dark mode support is built-in via the theme system

### State Management
- Use Zustand stores for cross-component state
- Use Plasmo storage hooks for persistence
- Keep component-local state in React useState/useEffect
- Follow the existing store patterns in `src/sidepanel/index.tsx`

### Form Handling
- Use React Hook Form with Zod schemas for validation
- Follow existing form patterns in `src/options/index.tsx`
- Implement proper error handling and user feedback
- Use the existing form components from `src/components/ui/form.tsx`

### AI Integration
- All AI model communication goes through `src/background/ports/assistant.ts`
- Handle streaming responses properly for real-time UI updates
- Implement proper error handling for API failures
- Follow the established patterns for different model types

## Testing

- Tests are run with `pnpm test` using Plasmo's test runner
- No specific test framework is currently configured
- Focus on testing AI model integrations and form validation

## Build Process

- Plasmo handles Chrome extension packaging
- Production builds created with `pnpm build`
- Distribution packages created with `pnpm package`
- Supports both Chrome and Edge manifest formats

## Chrome Extension Specifics

- Uses Chrome side panel API (requires Chrome 116+)
- Implements proper message passing between components
- Handles extension permissions and storage correctly
- Follows Chrome extension security best practices