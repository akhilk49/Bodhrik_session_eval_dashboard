# Requirements Document

## Introduction

This document captures the requirements for a Next.js (App Router) + TypeScript tutoring/coaching session evaluation dashboard. The application displays time-series performance metrics (engagement, clarity, pacing) for individual coaching sessions, supports listing and filtering sessions, provides per-session metric charts, and gates access behind a mock authentication flow.

The primary constraint is a timeboxed take-home delivery. Every architectural decision must be justifiable within that constraint, and everything deliberately cut must be recorded in NOTES.md.

---

## Glossary

| Term | Definition |
|---|---|
| Session | A single tutoring or coaching interaction, identified by a unique ID, associated with one student, on a specific date, with a duration and a set of metric samples |
| MetricPoint | A single sample within a session containing a timestamp offset and numeric scores for engagement, clarity, and pacing (each 0–100) |
| Auth token | A mock session credential stored in an httpOnly cookie, used only to gate dashboard routes — not a real security mechanism |
| Filter state | The combination of student name and date-range values reflected in the URL query string (?student=&from=&to=) |
| Loading state | A visible skeleton or spinner rendered while a fetch is in flight |
| Empty state | A clear message shown when a query returns zero results, with an option to clear filters |
| Error state | A clear message shown on fetch failure or non-2xx response, with a retry button that re-triggers the fetch |

---

## Requirements

### Requirement 1: Mock Data Dataset

**User Story:** As a developer, I want a realistic static dataset of sessions stored in `data/sessions.json`, so that the API routes and UI have consistent, meaningful test data without a real database.

#### Acceptance Criteria

1. WHEN the application starts, THEN `data/sessions.json` SHALL contain between 18 and 25 session objects.
2. WHEN the dataset is loaded, THEN it SHALL contain exactly 5 to 6 distinct student names spread across the sessions.
3. WHEN the dataset is loaded, THEN the session dates SHALL span a range of approximately 2 months so that date-range filtering is meaningful.
4. WHEN each session is loaded, THEN it SHALL contain between 8 and 15 MetricPoint entries, sampled at regular time intervals, EXCEPT for at least one designated edge-case session which SHALL contain exactly 2 MetricPoint entries.
5. WHEN a MetricPoint is loaded, THEN each of its `engagement`, `clarity`, and `pacing` fields SHALL be a number in the range 0–100 inclusive.
6. WHEN a Session object is loaded, THEN it SHALL conform to the TypeScript type: `{ id: string; student: string; date: string; durationMinutes: number; metrics: MetricPoint[] }`.

---

### Requirement 2: Mock API — Session List Endpoint

**User Story:** As the frontend, I want a GET /api/sessions endpoint that returns a filtered list of sessions with realistic latency, so that the UI can fetch and display session data as if talking to a real backend.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/sessions`, THEN the endpoint SHALL respond with HTTP 200 and a JSON array of session objects loaded from `data/sessions.json`.
2. WHEN the request includes a `student` query parameter, THEN the endpoint SHALL return only sessions whose `student` field exactly matches the provided value (case-insensitive comparison is acceptable).
3. WHEN the request includes a `from` query parameter (ISO date string), THEN the endpoint SHALL return only sessions whose `date` is greater than or equal to `from`.
4. WHEN the request includes a `to` query parameter (ISO date string), THEN the endpoint SHALL return only sessions whose `date` is less than or equal to `to`.
5. WHEN multiple filter parameters are provided, THEN the endpoint SHALL apply all filters conjunctively (AND logic).
6. WHEN processing any request to `/api/sessions`, THEN the endpoint SHALL introduce an artificial delay of 400–800 ms (random within that range) before responding.
7. WHEN the request includes the query parameter `simulateError=1`, THEN the endpoint SHALL respond with HTTP 500 and a JSON error body, regardless of other parameters.
8. WHEN no sessions match the applied filters, THEN the endpoint SHALL respond with HTTP 200 and an empty JSON array.

---

### Requirement 3: Mock API — Session Detail Endpoint

**User Story:** As the frontend, I want a GET /api/sessions/[id] endpoint that returns a single session with its full metrics array, so that the detail view can render the per-session chart.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/sessions/[id]` with a valid session ID, THEN the endpoint SHALL respond with HTTP 200 and the full session object including the complete `metrics` array.
2. WHEN a GET request is made to `/api/sessions/[id]` with an ID that does not exist in `data/sessions.json`, THEN the endpoint SHALL respond with HTTP 404 and a JSON error body.
3. WHEN processing any request to `/api/sessions/[id]`, THEN the endpoint SHALL introduce an artificial delay of 400–800 ms before responding.
4. WHEN the request includes `simulateError=1`, THEN the endpoint SHALL respond with HTTP 500.

---

### Requirement 4: Mock API — Authentication Endpoints

**User Story:** As the frontend, I want POST /api/auth/login and POST /api/auth/logout endpoints, so that the mock auth gate has real HTTP semantics (cookies, status codes) without requiring a real auth system.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with body `{ username: "admin", password: "admin" }`, THEN the endpoint SHALL respond with HTTP 200, set an httpOnly cookie named `session-token` (or equivalent), and return a JSON success response.
2. WHEN a POST request is made to `/api/auth/login` with any other credentials, THEN the endpoint SHALL respond with HTTP 401 and a JSON error body.
3. WHEN a POST request is made to `/api/auth/logout`, THEN the endpoint SHALL clear the `session-token` cookie and respond with HTTP 200.
4. WHEN the login endpoint sets a cookie, THEN the cookie SHALL be httpOnly to prevent client-side JavaScript access.

---

### Requirement 5: Authentication Gate (Middleware)

**User Story:** As a user, I want unauthenticated access to `/dashboard/*` routes to be redirected to `/login`, so that the dashboard is gated even in this mock setup.

#### Acceptance Criteria

1. WHEN an unauthenticated user (no valid `session-token` cookie) navigates to any route matching `/dashboard/*`, THEN the middleware SHALL redirect the request to `/login`.
2. WHEN an authenticated user (valid `session-token` cookie present) navigates to `/dashboard/*`, THEN the middleware SHALL allow the request to proceed.
3. WHEN an authenticated user navigates to `/login`, THEN the page SHALL be accessible (no redirect away from login for authenticated users is required, but it is acceptable).
4. WHEN the logout action is triggered, THEN the `session-token` cookie SHALL be cleared and the user SHALL be redirected to `/login`.

---

### Requirement 6: Login Page

**User Story:** As a user, I want a login page at `/login` with username and password fields, so that I can authenticate and access the dashboard.

#### Acceptance Criteria

1. WHEN a user navigates to `/login`, THEN the page SHALL render a form containing a username input, a password input, and a submit button.
2. WHEN the user submits the form with username `admin` and password `admin`, THEN the application SHALL call POST `/api/auth/login`, receive the token/cookie, and redirect the user to `/dashboard`.
3. WHEN the user submits the form with invalid credentials, THEN the page SHALL display a visible error message without redirecting.
4. WHEN the login form is submitted, THEN the submit button SHALL be disabled and a loading indicator SHALL be shown while the request is in flight.

---

### Requirement 7: Session List View

**User Story:** As an authenticated user, I want to see a list of all sessions at `/dashboard`, so that I can browse and select sessions to review.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to `/dashboard`, THEN the page SHALL fetch and display all sessions from GET `/api/sessions`.
2. WHEN sessions are loaded, THEN each session entry SHALL display at minimum: student name, date (human-readable), and duration in minutes.
3. WHEN sessions are loaded, THEN each entry SHOULD also display an at-a-glance average score (mean of all engagement, clarity, and pacing values across all MetricPoints for that session).
4. WHEN a user clicks on a session entry, THEN the application SHALL navigate to `/dashboard/[sessionId]`.
5. WHEN the list view is loading (fetch in flight), THEN the page SHALL render a loading skeleton or spinner, not a blank or partially-rendered list.
6. WHEN no sessions exist or no sessions match the active filters, THEN the page SHALL render a clear empty-state message (e.g. "No sessions match these filters") and provide a control to clear all active filters.
7. WHEN the fetch fails or returns a non-2xx status, THEN the page SHALL render a visible error message and a retry button that re-triggers the fetch.

---

### Requirement 8: Session List Filters

**User Story:** As an authenticated user, I want to filter the session list by student name and date range, with filters reflected in the URL, so that filtered views are shareable and survive page refresh.

#### Acceptance Criteria

1. WHEN the list view is rendered, THEN it SHALL display a student filter (dropdown/select) populated with the distinct student names present in the loaded dataset.
2. WHEN the list view is rendered, THEN it SHALL display two date inputs (from date, to date) for date-range filtering.
3. WHEN the user changes the student filter, THEN the URL query string SHALL be updated to include `?student=<value>` and the displayed list SHALL update to show only matching sessions.
4. WHEN the user changes the from-date or to-date input, THEN the URL query string SHALL be updated with `?from=<value>` and/or `?to=<value>` and the displayed list SHALL update accordingly.
5. WHEN the page is loaded with filter parameters already in the URL (e.g. after a refresh or following a shared link), THEN the filters SHALL be pre-populated and the list SHALL reflect the filtered results.
6. WHEN the user clears all filters, THEN the URL query params SHALL be removed and the full unfiltered session list SHALL be shown.
7. WHERE the dataset contains 20 sessions, filtering SHALL be performed client-side (all sessions fetched once, filtered in memory) — this approach SHALL be documented in NOTES.md as the decision that flips first at 10,000 sessions.

---

### Requirement 9: Session Detail View

**User Story:** As an authenticated user, I want to view a single session's details and a metric chart at `/dashboard/[sessionId]`, so that I can analyse the engagement, clarity, and pacing trends across the session.

#### Acceptance Criteria

1. WHEN a user navigates to `/dashboard/[sessionId]`, THEN the page SHALL fetch and display the session from GET `/api/sessions/[id]`.
2. WHEN the session is loaded, THEN the page header SHALL display: student name, session date (human-readable), and duration in minutes.
3. WHEN the session is loaded, THEN the page SHALL render a Recharts `LineChart` with one line per metric (engagement, clarity, pacing), plotted against the session's timestamps on the X-axis.
4. WHEN the chart is rendered, THEN it SHALL include a legend identifying each metric line by colour and name.
5. WHEN the user hovers over a data point on the chart, THEN a tooltip SHALL display the timestamp and the values for all three metrics at that point.
6. WHEN the session has only 2 MetricPoints (edge-case session), THEN the chart SHALL render without visual breakage — lines SHALL connect the two points and no JavaScript errors SHALL occur.
7. WHEN the detail view is loading, THEN the page SHALL render a loading skeleton or spinner.
8. WHEN the fetch fails or returns non-2xx, THEN the page SHALL render a visible error message and a retry button.
9. WHEN the user clicks the back link, THEN the application SHALL navigate back to `/dashboard` while preserving any active filter state (via `router.back()` or by passing filter params in the back-link href).
10. WHEN the chart container is rendered on any viewport width, THEN it SHALL use Recharts `ResponsiveContainer` and SHALL NOT cause horizontal overflow on the page.

---

### Requirement 10: Responsive Layout

**User Story:** As a user on a mobile device, I want the dashboard to be usable at ~375px viewport width, so that the app is accessible on phones without horizontal scrolling.

#### Acceptance Criteria

1. WHEN the viewport width is below 640px, THEN the session list SHALL render as a card layout (stacked cards) rather than a wide table.
2. WHEN the viewport width is below 640px, THEN the filter controls SHALL stack vertically rather than appearing in a cramped horizontal row.
3. WHEN the page is rendered at any viewport width, THEN there SHALL be no horizontal scroll on the page itself.
4. WHEN the chart is rendered on a narrow viewport (~375px), THEN the Recharts `ResponsiveContainer` SHALL constrain the chart to the available width.

---

### Requirement 11: Data-Fetching Architecture

**User Story:** As a developer, I want a documented, consistent data-fetching pattern, so that the codebase is easy to reason about within the timebox and the approach is justified in writing.

#### Acceptance Criteria

1. WHEN the session list view fetches data, THEN it SHALL use a custom React hook `useSessions` that wraps `fetch`, `useState` (for `data`, `isLoading`, `error`), and `useEffect`, called from a Client Component.
2. WHEN the session detail view fetches data, THEN it SHALL use a custom React hook `useSession(id)` with the same pattern.
3. WHEN filter state changes, THEN `useSessions` SHALL re-fetch (or re-filter from cached data) in response to the updated URL params.
4. WHEN NOTES.md is written, THEN it SHALL explicitly document: (a) why fetch-in-hook was chosen over SWR/TanStack Query for this specific project size and timebox, (b) why client-side filtering was chosen over server-side filtering for 20 sessions, and (c) what would change at 10,000 sessions.

---

### Requirement 12: Written Notes (NOTES.md)

**User Story:** As the project reviewer, I want a NOTES.md file (300–500 words) that documents key decisions, trade-offs, and scaling considerations, so that the reasoning behind the implementation is explicit.

#### Acceptance Criteria

1. WHEN NOTES.md is present, THEN it SHALL be between 300 and 500 words.
2. WHEN NOTES.md is read, THEN it SHALL justify the state-management and data-fetching approach (fetch-in-hook vs SWR/TanStack Query) against the actual project constraints — not generic best practice.
3. WHEN NOTES.md is read, THEN it SHALL list everything that was cut or simplified (e.g. no automated tests, no real auth, no pagination, no server-side filtering, no dark mode, minimal error taxonomy) and tie each cut explicitly to the timebox.
4. WHEN NOTES.md is read, THEN it SHALL describe what would change at 10,000 sessions: server-side filtering/pagination, virtualization, a dedicated /api/students endpoint, a real database, and when SWR/React Query earns its place.

---

### Requirement 13: Git History

**User Story:** As the project reviewer, I want a meaningful incremental Git history, so that the build process is transparent and each commit represents a stable, runnable state.

#### Acceptance Criteria

1. WHEN the repository is inspected, THEN the Git history SHALL contain separate commits for at minimum: scaffold, mock dataset, API route handlers, mock auth, session list view, filters, session detail + chart, loading/empty/error states, responsive layout pass, and NOTES.md.
2. WHEN any commit in the history is checked out, THEN the application SHALL build and run without errors (no "WIP broken" commits).
3. WHEN changes are made, THEN they SHALL be pushed to the remote regularly rather than in a single end-of-project push.
