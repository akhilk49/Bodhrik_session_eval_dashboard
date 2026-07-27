# Implementation Plan: Session Evaluation Dashboard

## Overview

Incremental implementation of a Next.js 14 (App Router) + TypeScript session evaluation dashboard. Each task builds on the previous step and ends with all pieces wired together. Tasks cover: project scaffold, mock dataset, type definitions, utility functions, API routes, auth middleware, custom hooks, UI components, and the NOTES.md write-up.

---

## Tasks

- [x] 1. Scaffold project and define shared types
  - Initialise a Next.js 14 App Router project with TypeScript and Tailwind CSS (`create-next-app`)
  - Create `types/index.ts` with `MetricPoint`, `Session`, `FilterParams`, and `ApiError` interfaces exactly as specified in the design
  - Create the directory structure: `app/`, `app/api/`, `components/`, `hooks/`, `lib/`, `data/`, `__tests__/`
  - _Requirements: 1.6, 11.1, 11.2_

- [ ] 2. Create mock dataset and utility functions
  - [ ] 2.1 Create `data/sessions.json`
    - Generate 18–25 `Session` objects with 5–6 distinct student names, dates spanning 2024-03-01 to 2024-04-30, each session with 8–15 `MetricPoint` entries at regular offsets
    - Include exactly one edge-case session (`id: "sess_edge"`) with exactly 2 MetricPoints
    - All `engagement`, `clarity`, `pacing` values must be integers in 0–100
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 2.2 Implement utility functions in `lib/utils.ts`
    - Implement `calcAverageScore(session: Session): number` — arithmetic mean of all engagement, clarity, and pacing values across every MetricPoint
    - Implement `applyFilters(sessions: Session[], params: FilterParams): Session[]` — AND-logic filtering by student (case-insensitive), from-date, and to-date
    - Implement `formatDate(dateStr: string): string` — converts ISO date string to a human-readable format
    - Implement `sleep(ms: number): Promise<void>` helper
    - Export URL serialise/parse helpers: `filtersToQueryString(params: FilterParams): string` and `queryStringToFilters(search: string): FilterParams`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 7.3, 8.3, 8.4, 8.5_

  - [ ]* 2.3 Create shared test arbitraries in `__tests__/arbitraries.ts`
    - Define `metricPointArb` and `sessionArb` using fast-check as specified in the design's Testing Strategy section
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ]* 2.4 Write property test for dataset structural validity (Property 1)
    - **Property 1: Dataset structural validity**
    - **Validates: Requirements 1.4, 1.5, 1.6**
    - Load `data/sessions.json` and iterate over every entry; assert `metrics.length` is in [8, 15] or the session is `sess_edge` with exactly 2 MetricPoints; assert each MetricPoint's fields are integers in [0, 100]
    - Tag: `// Feature: session-eval-dashboard, Property 1: dataset structural validity`

  - [ ]* 2.5 Write property test for filter conjunctive correctness (Property 2)
    - **Property 2: Filter conjunctive correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.8**
    - Use `fc.array(sessionArb)` and `fc.record({ student, from, to })` to generate arbitrary inputs; assert `applyFilters` returns exactly the sessions satisfying every supplied filter simultaneously
    - Tag: `// Feature: session-eval-dashboard, Property 2: filter conjunctive correctness`

  - [ ]* 2.6 Write property test for URL filter round-trip (Property 3)
    - **Property 3: URL filter round-trip**
    - **Validates: Requirements 8.3, 8.4, 8.5**
    - Use `fc.record({ student, from, to })` to generate arbitrary `FilterParams`; assert that `queryStringToFilters(filtersToQueryString(params))` produces the same filtered result as applying `params` directly
    - Tag: `// Feature: session-eval-dashboard, Property 3: URL filter round-trip`

  - [ ]* 2.7 Write property test for average score calculation (Property 4)
    - **Property 4: Average score calculation correctness**
    - **Validates: Requirements 7.3**
    - Use `fc.array(metricPointArb, { minLength: 1 })` inside a session record; assert `calcAverageScore(session)` equals the arithmetic mean of all engagement + clarity + pacing values
    - Tag: `// Feature: session-eval-dashboard, Property 4: average score calculation correctness`

- [ ] 3. Implement API route handlers
  - [ ] 3.1 Implement GET `/api/sessions` route handler in `app/api/sessions/route.ts`
    - Read and parse `data/sessions.json`
    - Apply `student`, `from`, `to` query params using `applyFilters`
    - Sleep 400–800 ms random delay before responding
    - Return HTTP 200 with JSON array (empty array when no sessions match)
    - Return HTTP 500 `{ error: "Simulated server error" }` when `simulateError=1` is present
    - Wrap all logic in try/catch; never throw unhandled exceptions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 3.2 Implement GET `/api/sessions/[id]` route handler in `app/api/sessions/[id]/route.ts`
    - Return HTTP 200 with full session object (including `metrics`) for a valid ID
    - Return HTTP 404 `{ error: "Session not found" }` for unknown IDs
    - Sleep 400–800 ms random delay; return HTTP 500 when `simulateError=1`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.3 Implement POST `/api/auth/login` and POST `/api/auth/logout` route handlers
    - `/api/auth/login/route.ts`: accept `{ username, password }`; if credentials are `admin`/`admin`, set httpOnly `session-token` cookie (value `"mock-token-abc123"`, `path: "/"`, `sameSite: "lax"`, `maxAge: 86400`) and return `{ ok: true }`; otherwise return HTTP 401 `{ error: "Invalid credentials" }`
    - `/api/auth/logout/route.ts`: clear the `session-token` cookie and return `{ ok: true }` with HTTP 200
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.4 Write unit tests for API route handlers
    - Test: valid login → 200 + Set-Cookie header present
    - Test: invalid credentials → 401
    - Test: `simulateError=1` on list endpoint → 500
    - Test: `simulateError=1` on detail endpoint → 500
    - Test: unknown session ID → 404
    - _Requirements: 2.7, 3.2, 3.4, 4.1, 4.2_

- [ ] 4. Implement auth middleware and typed fetch helpers
  - [ ] 4.1 Implement auth middleware in `middleware.ts`
    - Match paths `/dashboard/:path*`
    - Read `session-token` cookie; if absent or empty, redirect to `/login`; otherwise pass through
    - _Requirements: 5.1, 5.2_

  - [ ]* 4.2 Write property test for auth gate invariant (Property 6)
    - **Property 6: Auth gate invariant**
    - **Validates: Requirements 5.1, 5.2**
    - Use `fc.string()` as path suffix and `fc.boolean()` as cookie-present flag; assert that for every `/dashboard/*` path the middleware result is exactly redirect-to-login (no cookie) or pass-through (cookie present) — no third outcome
    - Tag: `// Feature: session-eval-dashboard, Property 6: auth gate invariant`

  - [ ] 4.3 Implement typed fetch helpers in `lib/api.ts`
    - `fetchSessions(params: FilterParams): Promise<Session[]>` — calls `GET /api/sessions` with serialised query string; throws on non-2xx
    - `fetchSession(id: string): Promise<Session>` — calls `GET /api/sessions/[id]`; throws on non-2xx (including 404)
    - _Requirements: 11.1, 11.2_

- [ ] 5. Implement custom React hooks
  - [ ] 5.1 Implement `useSessions` hook in `hooks/useSessions.ts`
    - State: `{ data: Session[], isLoading: boolean, error: Error | null }`
    - `useEffect` with `JSON.stringify(params)` as dependency — fires on mount and when params change
    - Set `isLoading: true` at start; on success set `data` and clear error; on non-2xx or network error set `error`
    - Expose stable `refetch` callback via `useCallback` that increments an internal counter to re-trigger the effect
    - _Requirements: 7.1, 7.5, 7.7, 11.1, 11.3_

  - [ ] 5.2 Implement `useSession` hook in `hooks/useSession.ts`
    - Same pattern as `useSessions` but hits `/api/sessions/[id]`; state is `{ data: Session | null, isLoading: boolean, error: Error | null }`
    - _Requirements: 9.1, 9.7, 9.8, 11.2_

- [ ] 6. Build shared UI components
  - [ ] 6.1 Implement `ErrorState` component in `components/ErrorState.tsx`
    - Props: `{ message: string; onRetry: () => void }`
    - Render visible error message and a retry button that calls `onRetry`
    - _Requirements: 7.7, 9.8_

  - [ ] 6.2 Implement `LoadingSkeletons` component in `components/LoadingSkeletons.tsx`
    - Export `SessionListSkeleton` and `SessionDetailSkeleton` variants
    - Skeleton uses animated Tailwind `animate-pulse` blocks
    - _Requirements: 7.5, 9.7_

  - [ ] 6.3 Implement `SessionCard` component in `components/SessionCard.tsx`
    - Props: `{ session: Session }`
    - Display student name, human-readable date (via `formatDate`), duration in minutes, and average score (via `calcAverageScore`)
    - Entire card is a clickable link to `/dashboard/[session.id]`
    - Responsive: full-width stacked card on mobile, compact row feel on wider screens
    - _Requirements: 7.2, 7.3, 7.4, 10.1_

  - [ ]* 6.4 Write property test for session summary display completeness (Property 7)
    - **Property 7: Session summary display completeness**
    - **Validates: Requirements 7.2, 9.2**
    - Render `<SessionCard session={session} />` via `@testing-library/react` for arbitrary `session` values; assert rendered output contains the student name, a human-readable date string, and the durationMinutes value
    - Tag: `// Feature: session-eval-dashboard, Property 7: session summary display completeness`

  - [ ] 6.5 Implement `MetricChart` component in `components/MetricChart.tsx`
    - Props: `{ metrics: MetricPoint[] }`
    - Render `<ResponsiveContainer width="100%" height={300}>` wrapping `<LineChart>`
    - Three `<Line>` elements: `engagement` (blue), `clarity` (green), `pacing` (orange)
    - Include `<Tooltip>` showing timestamp and three metric values, and `<Legend>` below the chart
    - Works for the 2-point edge case without special branching
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.10_

  - [ ]* 6.6 Write property test for MetricChart rendering (Property 5)
    - **Property 5: MetricChart renders for any valid metrics array**
    - **Validates: Requirements 9.3, 9.6**
    - Render `<MetricChart metrics={metrics} />` via `@testing-library/react` for arbitrary `fc.array(metricPointArb, { minLength: 2 })` inputs; assert no JavaScript error is thrown and output contains exactly three line series
    - Tag: `// Feature: session-eval-dashboard, Property 5: MetricChart renders for any valid metrics array`

  - [ ] 6.7 Implement `SessionFilters` component in `components/SessionFilters.tsx`
    - Props: `{ students: string[]; currentFilters: FilterParams; onChange: (filters: FilterParams) => void }`
    - Student `<select>` populated with distinct names; two date inputs (from, to)
    - Calls `onChange` on every input change
    - Stacks vertically on mobile (below 640px)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.2_

  - [ ]* 6.8 Write property test for filter dropdown population (Property 8)
    - **Property 8: Filter dropdown population**
    - **Validates: Requirements 8.1**
    - Render `<SessionFilters />` via `@testing-library/react` with arbitrary `fc.array(sessionArb, { minLength: 1 })`; extract distinct student values and assert the `<select>` contains exactly that set — no more, no fewer
    - Tag: `// Feature: session-eval-dashboard, Property 8: filter dropdown population`

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build page routes and wire everything together
  - [ ] 8.1 Implement root layout in `app/layout.tsx`
    - Set global font and Tailwind base styles; wrap `children`
    - _Requirements: 10.3_

  - [ ] 8.2 Implement login page in `app/login/page.tsx`
    - Client Component with controlled username/password inputs and submit button
    - On submit: call `POST /api/auth/login`; on success redirect to `/dashboard`; on failure show visible error message below the form
    - Disable submit button and show loading indicator while request is in flight
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 8.3 Implement session list page in `app/dashboard/page.tsx`
    - Client Component; read `searchParams` for filter state
    - Call `useSessions(params)` and derive `students` list from returned data
    - Render `<SessionFilters />` wired to `router.replace` on change (URL as single source of truth)
    - Render `<SessionListSkeleton />` while loading, `<ErrorState />` on error, empty-state with "Clear filters" button when `data.length === 0`, or list of `<SessionCard />` when data is present
    - _Requirements: 7.1, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.1, 10.2, 11.3_

  - [ ] 8.4 Implement session detail page in `app/dashboard/[sessionId]/page.tsx`
    - Client Component; extract `sessionId` from route params
    - Call `useSession(sessionId)`; render `<SessionDetailSkeleton />` while loading, `<ErrorState />` on error, or full detail view with page header and `<MetricChart />`
    - Page header displays student name, human-readable date, and duration in minutes
    - Back link navigates to `/dashboard` preserving filter state via `router.back()` or filter params in href
    - _Requirements: 9.1, 9.2, 9.3, 9.7, 9.8, 9.9_

  - [ ]* 8.5 Write unit / component tests for page interactions
    - Clicking a `SessionCard` navigates to `/dashboard/[id]`
    - Loading state renders skeleton
    - Empty state renders "No sessions" message and clear-filters button
    - Error state renders retry button
    - Login loading state disables submit button
    - Back link navigates to `/dashboard`
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 6.4, 9.9_

- [ ] 9. Add responsive layout pass
  - Apply Tailwind responsive classes to `app/dashboard/page.tsx` and `SessionCard` so the list renders as stacked cards below 640px and as a wider layout above
  - Apply Tailwind responsive classes to `SessionFilters` so controls stack vertically below 640px
  - Verify no horizontal overflow at any viewport width (use `overflow-x-hidden` on the root if needed)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10. Write NOTES.md
  - Create `NOTES.md` at project root (300–500 words)
  - Justify fetch-in-hook vs SWR/TanStack Query for this specific project size and timebox
  - List everything cut or simplified and tie each cut to the timebox
  - Describe what would change at 10,000 sessions: server-side filtering/pagination, virtualisation, `/api/students` endpoint, real database, when SWR/React Query earns its place
  - _Requirements: 11.4, 12.1, 12.2, 12.3, 12.4_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Run `npx tsc --noEmit` to verify no TypeScript errors
  - Run the full test suite to confirm all property and unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 7 and 11) provide incremental validation gates
- Property tests validate universal correctness properties using fast-check (≥ 100 iterations each)
- Unit/component tests validate specific examples, edge cases, and UI interactions
- Git commit discipline (Requirement 13) is the developer's responsibility and is not a coding task — each top-level task above corresponds roughly to one commit

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "3.1", "3.2", "3.3", "4.1"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6", "2.7", "3.4", "4.2", "4.3"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.5", "6.7"] },
    { "id": 5, "tasks": ["6.4", "6.6", "6.8", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 7, "tasks": ["8.5"] }
  ]
}
```
