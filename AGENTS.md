# Repository Guidelines

This file provides guidance to contributors and coding agents working in this repository.

## Project Overview

Eduh is an AI-powered exam preparation platform for university students. Users upload study materials such as past exams, slides, and notes; the app generates a structured study plan and then provides AI tutoring through topic-specific and revision chats.

Reference documents:

- `what.md` for product scope and user flow
- `design.md` for UI and UX decisions
- `tech.md` for technical architecture
- `plan.md` for the phased implementation plan

### Implementation Status

Completed: project setup, database, authentication, layout/UI foundation, dashboard/sections, file upload and processing, study plan generation, embeddings/RAG, studying section page, chat, and subscription.

In progress: broader polish and deployment work.

Not started: i18n review phase.

## Build, Test, and Development Commands

```bash
npm run dev          # Start the Next.js dev server
npm run build        # Build for production
npm run start        # Serve the production build
npm run lint         # Run ESLint
npm test             # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
npm run migrate      # Apply local DB migrations
npm run migrate:create  # Create a new migration
```

## Tech Stack

- Framework: Next.js 16 with App Router and API routes
- Frontend: React 19 and Tailwind CSS v4
- Database: Neon Postgres with `pgvector`
- DB access: raw SQL via `@neondatabase/serverless`
- Auth: JWT in HTTP-only cookies with OTP via Resend
- AI: Google Gemini through the Vercel AI SDK
- Payments: AbacatePay PIX flow
- Storage: Vercel Blob

## Project Structure & Module Organization

```text
src/
  proxy.ts
  app/
    (auth)/                # Login/register, serves /
    (main)/                # Authenticated app shell
    api/                   # REST endpoints
  components/
    ui/                    # Reusable primitives
  hooks/
  lib/
    db/
      connection.ts
      queries/             # SQL grouped by entity
    i18n/
    ai.ts
    auth.ts
    abacatepay.ts
  config/
  prompts/
db/
  migrations/
tests/
  unit/
  integration/
  db/
```

## Architecture Notes

- Route groups matter: `(auth)` has no navbar; `(main)` includes the app shell and breadcrumb.
- Ownership verification is explicit. API routes call `verify*Ownership(...)` queries before mutating or returning entity data.
- The RAG pipeline is: extracted text -> chunking -> Gemini embeddings -> pgvector similarity search -> chat tool access.
- Plan edits are versioned in `plan_drafts`; undo removes the newest draft.
- Usage gating is tier-aware: free users degrade and then block; pro users degrade but do not hard-block.
- Subscription flow is PIX-based: create a pending payment, poll status on the client, and activate on AbacatePay webhook confirmation.

## Coding Style & Naming Conventions

- Use TypeScript with strict mode and the `@/*` alias for imports from `src`.
- Follow the existing code style: 2-space indentation, double quotes, semicolons.
- Use PascalCase for React components, camelCase for functions and variables, and numeric-prefix migration filenames such as `009_create_promotion_claims.js`.
- Keep query files focused by entity. Put ownership and request validation in route handlers rather than burying them inside SQL helpers.
- Match existing UI patterns unless a change intentionally updates the design system.

## Testing Guidelines

- Vitest is the test runner.
- Place pure logic tests in `tests/unit`, end-to-end business flows in `tests/integration`, and database or migration coverage in `tests/db`.
- Use `*.test.ts` naming.
- Run `npm test` and `npm run lint` before opening a PR.
- If a change touches SQL, subscriptions, webhooks, or usage limits, update the related integration or DB coverage in the same change.

## Design Constraints

- Dark mode only
- Prefer flat UI with subtle hover states and slightly rounded corners
- Keep i18n in mind: default language is `pt-BR`, with English as secondary

## Security & Configuration Tips

- Never commit `.env*` secrets.
- `DATABASE_URL` is used for app runtime; `DATABASE_URL_UNPOOLED` is used for migrations.
- Configure Gemini, Resend, AbacatePay, JWT, and Blob credentials before testing those flows locally.
- See `.env.example` for required variables.
