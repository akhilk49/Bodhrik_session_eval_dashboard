# Session Evaluation Dashboard

A Next.js 14 (App Router) + TypeScript dashboard for reviewing tutoring and coaching session metrics — engagement, clarity, and pacing — across time.

## Tech Stack

- **Next.js 14** (App Router) — routing, API route handlers, middleware
- **TypeScript** — strict mode throughout
- **Tailwind CSS** — utility-first responsive styling
- **Recharts** — line chart for per-session metric visualisation
- **fast-check** — property-based tests for core utility logic
- **Jest + ts-jest** — test runner

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

**Credentials:** `admin` / `admin`

## Features

- **Session list** — browse all sessions with student name, date, duration, and average score
- **Filters** — filter by student name and/or date range; filter state is URL-synced (bookmarkable, refresh-safe)
- **Session detail** — per-session line chart of engagement, clarity, and pacing over time
- **Loading / empty / error states** — skeleton loaders, empty-state messages, retry buttons
- **Auth gate** — middleware redirects unauthenticated requests to `/login`
- **Responsive** — usable at 375px; no horizontal scroll at any viewport width

## Project Structure

```
app/                  # Next.js App Router pages and API routes
  api/sessions/       # GET /api/sessions, GET /api/sessions/[id]
  api/auth/           # POST /api/auth/login, POST /api/auth/logout
  dashboard/          # Session list and detail pages
  login/              # Login page
components/           # Shared UI components
hooks/                # useSessions, useSession custom hooks
lib/                  # Typed fetch helpers (api.ts) and utilities (utils.ts)
types/                # Shared TypeScript interfaces
data/                 # sessions.json — static mock dataset (20 sessions)
__tests__/            # Jest + fast-check property and unit tests
```

## Running Tests

```bash
npm test
```

35 tests — unit tests for all utility functions plus property-based tests (200 iterations each) for filter correctness, URL round-trip fidelity, and average score calculation.

## Architecture Notes

See [NOTES.md](./NOTES.md) for a full write-up covering:
- Why `fetch-in-hook` was chosen over SWR / TanStack Query
- Everything cut for the timebox and why
- What changes at 10,000 sessions

## Simulating Errors

Append `?simulateError=1` to any API URL to trigger a 500 response and see the error state UI in action.
