# Design Document: Session Evaluation Dashboard

## Overview

The session evaluation dashboard is a Next.js 14 (App Router) + TypeScript single-page application that lets coaching staff browse, filter, and analyse tutoring sessions. All data lives in a static JSON file; the API routes simulate a real backend with artificial latency and error-simulation flags. A middleware-based mock auth gate keeps unauthenticated users off the dashboard routes.

**Technology choices (justified against the timebox):**

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 App Router | Provides file-system routing, Route Handlers, and Middleware in one package — no extra wiring needed |
| Language | TypeScript | Catch type errors early in a project with no test suite |
| Charts | Recharts | Best React charting library for a timebox — simple Line/Tooltip/Legend API, fully responsive |
| State / data-fetching | Custom hooks (`useSessions`, `useSession`) | Zero extra dependencies for a 20-session dataset; SWR/TanStack Query adds weight without material benefit at this scale |
| Styling | Tailwind CSS | Utility-first; enables responsive layout quickly without a separate CSS file strategy |
| Auth | Mock httpOnly cookie | Demonstrates HTTP auth semantics (cookie, redirect, logout) without a real auth system |

**Out of scope (documented in NOTES.md):** real database, real auth, pagination, server-side filtering, dark mode, automated tests beyond type-checking, virtualised lists.

---

## Architecture

### High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│  Next.js Edge Middleware  (middleware.ts)                 │
│  Intercepts /dashboard/* — checks session-token cookie   │
│  Redirect → /login  |  Pass-through                      │
└────────────────────┬─────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │    App Router        │
          │  /login              │
          │  /dashboard          │
          │  /dashboard/[id]     │
          └──────────┬──────────┘
                     │  Client Components call
          ┌──────────▼──────────────┐
          │   Custom React Hooks    │
          │  useSessions(params)    │
          │  useSession(id)         │
          └──────────┬──────────────┘
                     │  fetch()
          ┌──────────▼──────────────────┐
          │   Next.js Route Handlers    │
          │  GET  /api/sessions         │
          │  GET  /api/sessions/[id]    │
          │  POST /api/auth/login       │
          │  POST /api/auth/logout      │
          └──────────┬──────────────────┘
                     │  reads
          ┌──────────▼──────────┐
          │  data/sessions.json  │
          └──────────────────────┘
```

### Request Flow — Session List View

```
User navigates /dashboard
       │
       ▼
Middleware checks cookie
       │  valid
       ▼
/dashboard page renders
       │
       ▼
useSessions() fires useEffect
       │  fetch /api/sessions?student=…&from=…&to=…
       ▼
Route Handler reads sessions.json
  → applies filters
  → sleeps 400–800 ms
  → returns JSON array
       │
       ▼
useSessions sets { data, isLoading:false }
       │
       ▼
SessionList renders cards / table rows
```

### URL ↔ Filter State Synchronisation

Filters live exclusively in the URL query string. The list page reads `searchParams`, passes them into `useSessions`, and updates the URL (via `router.replace`) on each filter change. This makes filtered views bookmarkable and refresh-safe without any global state library.

---

## Components and Interfaces

### File / Folder Layout

```
/
├── app/
│   ├── layout.tsx                  # Root layout (font, global styles)
│   ├── middleware.ts               # Auth gate
│   ├── login/
│   │   └── page.tsx               # Login form (Client Component)
│   └── dashboard/
│       ├── page.tsx               # Session list (Client Component)
│       └── [sessionId]/
│           └── page.tsx           # Session detail (Client Component)
├── app/api/
│   ├── sessions/
│   │   ├── route.ts               # GET /api/sessions
│   │   └── [id]/
│   │       └── route.ts           # GET /api/sessions/[id]
│   └── auth/
│       ├── login/
│       │   └── route.ts           # POST /api/auth/login
│       └── logout/
│           └── route.ts           # POST /api/auth/logout
├── components/
│   ├── SessionCard.tsx            # Single session summary card
│   ├── SessionFilters.tsx         # Student + date-range filter controls
│   ├── MetricChart.tsx            # Recharts LineChart wrapper
│   ├── LoadingSkeletons.tsx       # Skeleton variants for list + detail
│   └── ErrorState.tsx             # Reusable error + retry UI
├── hooks/
│   ├── useSessions.ts             # Fetches + filters session list
│   └── useSession.ts              # Fetches single session
├── lib/
│   ├── api.ts                     # Typed fetch helpers (fetchSessions, fetchSession)
│   └── utils.ts                   # formatDate, calcAverageScore, sleep helper
├── types/
│   └── index.ts                   # MetricPoint, Session, FilterParams types
├── data/
│   └── sessions.json              # Static mock dataset
└── NOTES.md
```

### Component Contracts

#### `useSessions(params: FilterParams)`

```ts
interface FilterParams {
  student?: string;
  from?: string;   // ISO date
  to?: string;     // ISO date
}

interface UseSessionsResult {
  data: Session[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

- Fires on mount and whenever `params` changes (deep-equal check via JSON.stringify).
- Fetches `/api/sessions` with the filter params serialised as query-string values.
- `refetch` is a stable callback that increments an internal counter to re-trigger the effect.

#### `useSession(id: string)`

```ts
interface UseSessionResult {
  data: Session | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

- Same pattern as `useSessions` but hits `/api/sessions/[id]`.

#### `SessionFilters`

```tsx
interface SessionFiltersProps {
  students: string[];          // distinct names for <select>
  currentFilters: FilterParams;
  onChange: (filters: FilterParams) => void;
}
```

#### `MetricChart`

```tsx
interface MetricChartProps {
  metrics: MetricPoint[];      // ordered by timestamp ascending
}
```

- Renders a Recharts `<ResponsiveContainer width="100%" height={300}>` wrapping a `<LineChart>`.
- Three `<Line>` elements: `engagement` (blue), `clarity` (green), `pacing` (orange).
- `<Tooltip>` formatter shows timestamp and the three values.
- `<Legend>` displayed below the chart.
- Handles the 2-point edge case without special branching — Recharts draws a straight line.

#### `ErrorState`

```tsx
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}
```

---

## Data Models

### TypeScript Types (`types/index.ts`)

```ts
export interface MetricPoint {
  /** Offset from session start in seconds */
  t: number;
  engagement: number;  // 0–100
  clarity: number;     // 0–100
  pacing: number;      // 0–100
}

export interface Session {
  id: string;           // e.g. "sess_001"
  student: string;      // full name, one of 5–6 distinct values
  date: string;         // ISO date string "YYYY-MM-DD"
  durationMinutes: number;
  metrics: MetricPoint[];
}

export interface FilterParams {
  student?: string;
  from?: string;
  to?: string;
}

export interface ApiError {
  error: string;
  status: number;
}
```

### Mock Dataset Shape (`data/sessions.json`)

- 18–25 `Session` objects.
- 5–6 distinct student names (e.g. "Aisha Patel", "Ben Carter", "Chiara Rossi", "David Kim", "Elena Soto", "Faisal Hassan").
- Dates spanning ~2 months (e.g. 2024-03-01 → 2024-04-30).
- Each session has 8–15 `MetricPoint` entries sampled at regular offsets (e.g. every 3 minutes → `t: 0, 180, 360, …`), except one edge-case session (`id: "sess_edge"`) with exactly 2 MetricPoints.
- All metric values are integers in 0–100.

### API Response Shapes

**GET /api/sessions** → `Session[]` (metrics array included for average-score calculation)  
**GET /api/sessions/[id]** → `Session` | `{ error: string }` (404)  
**POST /api/auth/login** → `{ ok: true }` | `{ error: string }` (401)  
**POST /api/auth/logout** → `{ ok: true }`

### Cookie

Name: `session-token`  
Value: a static hardcoded string (e.g. `"mock-token-abc123"`)  
Flags: `httpOnly: true`, `path: "/"`, `sameSite: "lax"`, `maxAge: 86400`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties were derived from the acceptance criteria prework analysis. After reflection, redundant properties were consolidated: individual filter properties (student, from, to) are subsumed by the combined conjunctive filter property; dataset structural checks are merged into one; the auth gate's two complementary branches are expressed as a single invariant.

---

### Property 1: Dataset structural validity

*For any* session in `data/sessions.json`, the session SHALL conform to the `Session` TypeScript shape, its `metrics` array length SHALL be in [8, 15] inclusive OR the session SHALL be the designated edge-case entry with exactly 2 MetricPoints, and every `MetricPoint` in that session SHALL have `engagement`, `clarity`, and `pacing` values in the closed range [0, 100].

**Validates: Requirements 1.4, 1.5, 1.6**

---

### Property 2: Filter conjunctive correctness

*For any* sessions array and any combination of `student`, `from`, and `to` filter parameters, `applyFilters(sessions, params)` SHALL return exactly the subset of sessions that satisfies every supplied filter simultaneously (AND logic). No session that fails any applied filter SHALL appear in the result; no session that satisfies all applied filters SHALL be absent.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.8**

---

### Property 3: URL filter round-trip

*For any* `FilterParams` object serialised into the URL query string (`?student=…&from=…&to=…`), reading those params back from the URL and passing them to `applyFilters` SHALL produce the same filtered session list as applying the original `FilterParams` directly — the serialise-then-parse round-trip is lossless.

**Validates: Requirements 8.3, 8.4, 8.5**

---

### Property 4: Average score calculation correctness

*For any* `Session` object with any non-empty `MetricPoint` array, `calcAverageScore(session)` SHALL equal the arithmetic mean of all `engagement`, `clarity`, and `pacing` values across every `MetricPoint` in that session.

**Validates: Requirements 7.3**

---

### Property 5: MetricChart renders for any valid metrics array

*For any* `MetricPoint[]` with at least 2 entries (including the 2-point edge case), rendering `<MetricChart metrics={…} />` SHALL complete without throwing a JavaScript error and the resulting output SHALL contain exactly three line series — one each for `engagement`, `clarity`, and `pacing`.

**Validates: Requirements 9.3, 9.6**

---

### Property 6: Auth gate invariant

*For any* URL path matching `/dashboard/*`, the middleware result SHALL be exactly one of two outcomes: if the `session-token` cookie is absent or empty, the request SHALL be redirected to `/login`; if the cookie is present, the request SHALL be allowed to proceed. There is no third outcome.

**Validates: Requirements 5.1, 5.2**

---

### Property 7: Session summary display completeness

*For any* `Session` object, rendering the session summary component (whether as a list card or as the detail page header) SHALL produce output that contains the session's `student` name, a human-readable form of its `date`, and its `durationMinutes` value.

**Validates: Requirements 7.2, 9.2**

---

### Property 8: Filter dropdown population

*For any* sessions array passed to `<SessionFilters />`, the student `<select>` element SHALL contain exactly the set of distinct `student` values present in that array — no more, no fewer.

**Validates: Requirements 8.1**

---

## Error Handling

### API Layer

| Scenario | Behaviour |
|---|---|
| Valid request to `/api/sessions` | 200 + JSON array (possibly empty) |
| Valid request to `/api/sessions/[id]` | 200 + session object |
| Unknown session ID | 404 + `{ error: "Session not found" }` |
| `simulateError=1` | 500 + `{ error: "Simulated server error" }` |
| Invalid login credentials | 401 + `{ error: "Invalid credentials" }` |

The Route Handlers never throw unhandled exceptions — all code paths are wrapped in try/catch that returns the appropriate error JSON.

### Custom Hook Layer

`useSessions` and `useSession` both:
- Set `isLoading: true` at the start of each fetch.
- On a non-2xx response: parse the error body (or use a generic message), set `error`, set `isLoading: false`.
- On a network error: set `error` with the caught `Error`, set `isLoading: false`.
- On success: set `data`, clear `error`, set `isLoading: false`.

The `refetch` callback is stable across renders (wrapped in `useCallback`).

### UI Layer

| State | Component shown |
|---|---|
| `isLoading: true` | `<LoadingSkeleton />` |
| `error !== null` | `<ErrorState message={error.message} onRetry={refetch} />` |
| `data.length === 0` | Empty state with "No sessions found" + "Clear filters" button |
| `data.length > 0` | Session list or detail chart |

---

## Testing Strategy

### Assessment: Is Property-Based Testing Applicable?

This feature is a Next.js dashboard application. The majority of the code is:
- **UI rendering** (React components, Tailwind layout)
- **API routes with artificial latency** (simple read-only over a static JSON file)
- **Custom hooks** (thin wrappers around `fetch` + `useState`)

PBT is **not** appropriate for the rendering or API-wiring concerns (covered by example tests and smoke tests respectively). It **is** appropriate for the targeted areas that have pure, universally-quantifiable logic: filter computation, average score calculation, MetricChart rendering, middleware logic, and filter dropdown population.

The Correctness Properties above were derived from the acceptance criteria prework analysis. Individual filter properties (student, from, to) were consolidated into one conjunctive property after reflection; dataset structural checks were merged; the auth gate's two branches are expressed as a single invariant.

### Property-Based Testing — Scope and Library

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native, zero extra runtime dependencies, excellent arbitrary generators for records and arrays).

**Tests to implement** (each runs ≥ 100 iterations):

| # | Property | Target | Arbitraries |
|---|---|---|---|
| 1 | Dataset structural validity | Static dataset schema check | `fc.integer({ min: 0, max: 14 })` as index into loaded array |
| 2 | Filter conjunctive correctness | `applyFilters(sessions, params)` in `lib/utils.ts` | `fc.array(sessionArb)`, `fc.record({ student, from, to })` |
| 3 | URL filter round-trip | URL serialise/parse helpers | `fc.record({ student, from, to })` |
| 4 | Average score calculation | `calcAverageScore(session)` | `fc.array(metricPointArb, { minLength: 1 })` inside a session |
| 5 | MetricChart renders without error | `<MetricChart />` via `@testing-library/react` | `fc.array(metricPointArb, { minLength: 2 })` |
| 6 | Auth gate invariant | `middleware(request)` with mocked cookies | `fc.string()` as path suffix, `fc.boolean()` as cookie present |
| 7 | Session summary display completeness | `<SessionCard />` / detail header via RTL | `fc.record(sessionArb)` |
| 8 | Filter dropdown population | `<SessionFilters />` via RTL | `fc.array(sessionArb, { minLength: 1 })` |

**Arbitraries defined in `__tests__/arbitraries.ts`:**

```ts
const metricPointArb = fc.record({
  t: fc.integer({ min: 0, max: 3600 }),
  engagement: fc.integer({ min: 0, max: 100 }),
  clarity: fc.integer({ min: 0, max: 100 }),
  pacing: fc.integer({ min: 0, max: 100 }),
});

const sessionArb = fc.record({
  id: fc.string({ minLength: 1 }),
  student: fc.constantFrom("Aisha Patel", "Ben Carter", "Chiara Rossi", "David Kim", "Elena Soto"),
  date: fc.date({ min: new Date("2024-03-01"), max: new Date("2024-04-30") })
        .map(d => d.toISOString().slice(0, 10)),
  durationMinutes: fc.integer({ min: 10, max: 120 }),
  metrics: fc.array(metricPointArb, { minLength: 2, maxLength: 15 }),
});
```

**Tag format per test:**
```ts
// Feature: session-eval-dashboard, Property 2: filter conjunctive correctness
```

### Unit Tests (Example-Based)

| Scenario | Type |
|---|---|
| Login with `admin`/`admin` → 200 + Set-Cookie | Unit (mock handler) |
| Login with wrong credentials → 401 | Unit |
| `simulateError=1` on list endpoint → 500 | Unit |
| `simulateError=1` on detail endpoint → 500 | Unit |
| Unknown session ID → 404 | Unit |
| Clicking session card navigates to `/dashboard/[id]` | Component (RTL) |
| Loading state renders skeleton | Component (RTL) |
| Empty state renders "No sessions" + clear-filters button | Component (RTL) |
| Error state renders retry button | Component (RTL) |
| Login loading state disables submit button | Component (RTL) |
| Back link navigates to `/dashboard` | Component (RTL) |

### Smoke / Integration Tests

Not automated in this delivery (timebox constraint). Manual smoke tests:
1. Navigate to `/dashboard` without a cookie → redirected to `/login`.
2. Log in with `admin`/`admin` → redirected to `/dashboard`, sessions load.
3. Apply student filter → URL updates, list filters.
4. Navigate to a session detail → chart renders with three lines.
5. Click back → returns to filtered list.
6. Append `?simulateError=1` to an API URL → error state visible.
7. Resize to 375px → no horizontal scroll, cards stack, filters stack.

All deferred automation is documented in NOTES.md under "What would change at 10,000 sessions."
