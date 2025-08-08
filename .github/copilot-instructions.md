# Project Guidelines

**TypeScript full-stack SPA project** - Focus on functionality over styling. All code comments in English.

## Response Rules

- Respond in the same language as user's question

## Stack

**Frontend:** React + Tailwind + shadcn/ui + Tanstack Router + Zustand + BetterAuth  
**Backend:** Hono.js + SQLite + Drizzle ORM
**Package Manager:** pnpm

## File Naming

- Hooks: `camelCase` (useChat.ts)
- Components: `PascalCase` (ChatArea.tsx)

## Key Rules

- Ignore code formatting and css class sorting lint issues, focus on functionality implementation
- Pure SPA (Single Page Application) - no SSR
- TypeScript required, implement proper error handling
- Use `POST` + JSON for all API endpoints (not RESTful)
- Mobile-first responsive design
- shadcn/ui: `pnpm dlx shadcn@latest add <component>`
