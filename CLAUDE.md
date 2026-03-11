# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ditchy is an AI-powered exam preparation platform for university students. Users upload study materials (past exams, slides, notes), the AI generates a structured study plan, and then provides interactive AI tutoring through topic-specific and revision chats.

**Current state**: Planning/specification phase — no code yet. The project is defined across four spec documents: `what.md` (features/user flow), `design.md` (UI/UX), `tech.md` (technical architecture), `plan.md` (26-phase implementation plan).

## Tech Stack

- **Framework**: Next.js (App Router, API Routes)
- **Frontend**: React + Tailwind CSS (dark mode only, Geist font)
- **Database**: Neon Postgres + pgvector for embeddings
- **Database access**: Raw SQL via `@neondatabase/serverless` (no ORM)
- **Migrations**: `node-pg-migrate`
- **File storage**: Vercel Blob (signed URLs for direct upload)
- **Auth**: JWT in HTTP-only cookies, OTP via Resend
- **AI**: Google Gemini (multiple models per task, configured in `config/ai.ts`)
- **Hosting**: Vercel

## Architecture

### Planned Directory Structure

```
src/
  middleware.ts              # Auth middleware (JWT verification)
  app/
    (auth)/                  # Login/register (no navbar)
    (main)/                  # Authenticated pages (navbar + breadcrumb)
      dashboard/
      sections/[id]/
      sections/[id]/chat/[chatId]/
    api/                     # REST API routes
  components/
    ui/                      # Generic reusable components
  lib/
    db/
      connection.ts
      queries/               # SQL functions grouped by entity
    auth.ts                  # JWT utilities
    ai.ts                    # LLM wrappers
  config/
    ai.ts                    # Model IDs and tunable AI parameters
  prompts/
    index.ts                 # All prompt templates
db/
  migrations/                # node-pg-migrate SQL files
```

### Key Architectural Patterns

- **Self-chaining background jobs**: Long-running tasks (file extraction, plan generation) use self-invoking serverless functions to stay within Vercel's 60s timeout
- **RAG pipeline**: Extracted text → chunked (~1000 tokens, ~100 overlap) → embedded with `gemini-embedding-001` → stored in pgvector → retrieved via similarity search (top 4 chunks)
- **Plan draft versioning**: Undo/redo through immutable draft snapshots
- **Cumulative chat summarization**: When context grows too large, older messages are summarized; last 2 messages always kept unsummarized
- **Lazy chat creation**: Chat records created on first open, not upfront

### AI Models

| Task | Model |
|------|-------|
| Teaching chat | `gemini-3.1-flash-lite-preview` |
| Text extraction | `gemini-2.5-flash-lite` |
| Plan generation | `gemini-2.5-flash-lite` |
| Summarization | `gemini-2.5-flash-lite` |
| Embeddings | `gemini-embedding-001` |

### Database

12 tables with UUID primary keys, CASCADE deletes, timestamps. Messages use SERIAL IDs for ordering. See `tech.md` for full schema.

## Design Constraints

- **Dark mode only** — custom palette with accent blue (#2B5CE6), success green (#3D8B5E), danger red (#D94444)
- **No animations** — static UI only
- **Flat design** with subtle hover effects and slightly rounded corners
- **i18n**: Default pt-BR, secondary English. LLM language priority: last user message language > materials language > user preference

## Key Limits

- Max 10 sections per user, 100 MB files per section
- OTP: 10-min validity, 3 attempts max
- JWT: 30-day expiry
- Message undo only for unsummarized messages

## Environment Variables

`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `JWT_SECRET`
