# AI Call Logging — Implementation Plan

## Goal

Track every LLM/embedding API call with token usage, latency, cost approximation, and full input/output text. Data stored in Postgres for a future monitoring dashboard.

## Database

### New table: `ai_call_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `label` | text NOT NULL | e.g. `plan-generation`, `chat-stream`, `text-extraction` |
| `model` | text NOT NULL | e.g. `gemini-3-flash-preview` |
| `input_tokens` | integer | nullable — provider may not return it |
| `output_tokens` | integer | nullable |
| `input_text` | text | nullable — full prompt/input |
| `output_text` | text | nullable — full response (null for embeddings) |
| `user_id` | uuid | nullable — populated only where already in scope |
| `section_id` | uuid | nullable — populated only where already in scope |
| `duration_ms` | integer NOT NULL | wall-clock time |
| `created_at` | timestamptz | `DEFAULT now()` |

Index on `created_at` for dashboard date-range queries and newest-first ordering.

### Migration

New migration file via `node-pg-migrate`.

## Files to change

### 1. `db/migrations/XXX_create-ai-call-logs.sql` (new)

Create the `ai_call_logs` table.

### 2. `src/lib/db/queries/ai-logs.ts` (new)

Single function: `insertAiCallLog({ label, model, inputTokens, outputTokens, inputText, outputText, userId, sectionId, durationMs })`. `userId` and `sectionId` are optional. Fire-and-forget (no await needed at call site), with internal try/catch so logging never blocks or breaks AI calls.

### 3. `src/lib/ai.ts`

Wrap each function to measure duration and log after completion:

| Function | Label | Input text | Output text |
|----------|-------|------------|-------------|
| `generatePlan` | `plan-generation` | system prompt + allText (full prompt as sent) | JSON stringified result |
| `regeneratePlan` | `plan-regeneration` | system prompt + allText + guidance (full prompt as sent) | JSON stringified result |
| `extractTextFromFile` | `text-extraction` | system prompt + `[binary file: {mimeType}]` | extracted text |
| `summarizeChat` | `chat-summarization` | system prompt + full messages array as sent | summary text |
| `embedText` | `embed-single` | the input text | null (vectors not useful as text) |
| `embedTexts` | `embed-batch` | all texts joined with separator | null (vectors not useful as text) |

`input_text` captures everything sent to the LLM: system prompts, past messages, and user content — no truncation.

Each wrapper: record `Date.now()` before, call SDK, record after, fire-and-forget insert.

### 4. `src/app/api/chats/[id]/messages/route.ts`

Two logging points:

- **GET** (initial greeting): After the `generateText` call, log with label `chat-initial-greeting`. `input_text` = system prompt + the seeded fake user message. Pass `userId` and `sectionId` (both already in scope from auth + ownership check).
- **POST** (streaming): Extend the existing `onFinish` callback to log with label `chat-stream`. `onFinish` receives `{ text, usage }` — use `usage.promptTokens` and `usage.completionTokens`. Record `Date.now()` before `streamText` to compute duration. `input_text` = system prompt + full message history as sent to the model. Pass `userId` and `sectionId` (both already in scope).

`user_id` and `section_id` are only populated in the messages route — these are the highest-frequency calls and both values are already available. The `ai.ts` wrappers don't have access to user/section context, so they pass null.

## Labels

| Label | Call site | Expected frequency |
|-------|-----------|-------------------|
| `plan-generation` | `generatePlan()` | Once per section |
| `plan-regeneration` | `regeneratePlan()` | User-triggered, rare |
| `text-extraction` | `extractTextFromFile()` | Once per uploaded file |
| `chat-summarization` | `summarizeChat()` | When token threshold exceeded |
| `embed-single` | `embedText()` | Per RAG query (tool call) |
| `embed-batch` | `embedTexts()` | Once per section (all chunks) |
| `chat-initial-greeting` | GET messages route | Once per chat first load |
| `chat-stream` | POST messages route | Every user message |

## Monitoring Dashboard

### Auth

Reuse existing JWT auth. The page checks if the logged-in user's email matches the `ADMIN_EMAIL` env var. If not, return 404 (don't reveal the page exists). One new env var, zero new auth code.

### Route

`src/app/(main)/admin/ai-logs/page.tsx` — lives inside the `(main)` route group so it gets the navbar and breadcrumb for free.

### Page content

Server component that queries `ai_call_logs` directly. No API route needed.

**Summary table** (grouped by label):

| Label | Count | Total input tokens | Total output tokens | Cost approximation | Avg duration |
|-------|-------|--------------------|---------------------|--------------------|--------------|

Cost approximation = `SUM(input_tokens) + 6 * SUM(output_tokens)` (unitless weighted score — output tokens are ~6× more expensive than input).

**Recent calls list** (newest first, paginated via query params `?page=1`):

All columns from the table. `input_text` and `output_text` truncated in the list, expandable on click (client component for the expand toggle).

**Date range filter** via query params `?from=2026-03-01&to=2026-03-20`. Defaults to last 7 days.

### Auth detail

The JWT only stores `userId`, not email. So `isAdmin` must fetch the user's email from the DB and compare against `ADMIN_EMAIL`. The server component reads the JWT from `cookies()` (not `getUserIdFromRequest`, which takes a `NextRequest`).

### Files

- `src/app/(main)/admin/ai-logs/page.tsx` — server component, auth check + queries + render
- `src/lib/db/queries/ai-logs.ts` — add query functions: `getAiLogsSummary(from, to)`, `getAiLogsList(from, to, page, pageSize)`
- `src/lib/auth.ts` — add `isAdmin(userId)` helper: fetches user email from DB, compares against `ADMIN_EMAIL`

## Implementation order

1. Migration file
2. Run migration (`npm run migrate up`)
3. `insertAiCallLog` query function
4. Wrap functions in `ai.ts`
5. Add logging to messages route
6. Test locally — verify rows appear in `ai_call_logs`
7. Add `ADMIN_EMAIL` to `.env.local` and `.env.example`; set in Vercel dashboard
8. `isAdmin` auth helper
9. Dashboard query functions
10. Dashboard page
