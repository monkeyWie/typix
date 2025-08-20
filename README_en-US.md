# Typix - Type To Pixels

English | [简体中文](README.md)

Typix is a modern, open-source, user-friendly, and privacy-secure AI tool focused on media content generation, providing creators with a one-stop generation experience.

![](docs/public/images/demo/preview.png)

## 🎯 Quick Start

- [https://typix.art](https://typix.art)
  Production-grade stable version with reliable experience.
- [https://preview.typix.art](https://preview.typix.art)
  Preview the latest features and improvements, with free Cloudflare AI image generation service (daily quota limited, first come first served).

## ✨ Core Features

Focus on AI image generation, turning creativity into visual art instantly

- 📱 **Local First** - Prioritize local storage and offline functionality
- 🏠 **Self-hosted** - Full control over your data and privacy
- 🎁 **Free Generation** - Free image generation with Cloudflare Workers AI
- ☁️ **One-click Deploy** - Quick deployment with Docker and Cloudflare Workers
- 🤖 **Multi-model Support** - Support multiple AI models and service providers
- 🔄 **Cloud Sync** - Seamlessly sync your content across all devices

## 🔒 Data Security

Typix puts your data security and privacy protection first:

- **🛡️ Browser Local Storage** - Based on WASM SQLite technology, all data is completely stored in your browser
- **🔐 Zero Data Upload** - Your creative content, settings and other sensitive data never leave your device
- **🚫 No Server Dependencies** - Client mode requires no external server dependencies, ensuring data sovereignty
- **🔄 Optional Cloud Sync** - Support for optional cloud sync functionality

We protect both your creativity and privacy.

## ⚡ Powered by Leading AI Models

Integrated with cutting-edge AI models and services to provide the best image generation experience:

- **OpenAI** - Industry-leading AI technology
- **Flux** - High-quality image generation models
- **Fal** - Fast AI inference service
- **Cloudflare** - Free AI model support

More service providers and models are being integrated continuously.

## 🚀 Quick Deployment

### One-click Deploy to Cloudflare Workers (Recommended)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/monkeyWie/typix)

Cloudflare Workers deployment provides free access to Cloudflare AI image generation services.

> After successful deployment, you'll get a `typix.xxx.workers.dev` domain to start using!

### Node.js Deployment

#### Prerequisites

- Node.js 20+
- pnpm or npm

#### Deployment Steps

1. **Clone and install**

```bash
git clone https://github.com/monkeyWie/typix.git
cd typix
pnpm install
```

2. **Configure environment variables**

```bash
cp .env.node.example .env
# Edit .env file to configure necessary parameters
```

3. **Database initialization**

```bash
pnpm db:generate
pnpm db:migrate
```

4. **Build project**

```bash
pnpm build:node
```

5. **Start service**

```bash
node .bin/node.js
```

## 🛠️ Development Documentation

### Tech Stack

**Frontend:**

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Atomic CSS framework
- **shadcn/ui** - High-quality UI component library
- **Tanstack Router** - Type-safe routing management
- **Zustand** - Lightweight state management
- **BetterAuth** - Modern authentication solution

**Backend:**

- **Hono.js** - Lightweight web framework
- **SQLite** - Embedded database
- **Drizzle ORM** - Type-safe ORM

**Development Tools:**

- **Vite** - Fast build tool
- **Biome** - Code formatting and linting
- **pnpm** - Package manager

### Local Development Guide

#### Environment Setup

1. **Install Node.js 20+**
2. **Install pnpm**

```bash
npm install -g pnpm
```

#### Development Workflow

1. **Clone project**

```bash
git clone https://github.com/monkeyWie/typix.git
cd typix
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Database initialization**

```bash
# Generate database migration files
pnpm db:generate

# Execute migration
pnpm db:migrate
```

4. **Start development server**

```bash
# Start frontend development server
pnpm dev
```

#### Project Structure

```
src/
├── app/                    # Frontend application
│   ├── components/         # React components
│   ├── hooks/             # Custom Hooks
│   ├── routes/            # Route pages
│   ├── stores/            # State management
│   └── lib/               # Utility libraries
├── server/                # Backend service
│   ├── api/               # API routes
│   ├── ai/                # AI provider integration
│   ├── db/                # Database schemas
│   └── service/           # Business logic
```

## 📄 License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

You are free to:

- ✅ Commercial use
- ✅ Modify code
- ✅ Distribute project
- ✅ Private use

But you must:

- 📝 Include copyright notice
- 📝 Include license file
- 📝 State significant changes

---

If this project helps you, please consider giving us a ⭐ Star!
