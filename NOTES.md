# NOTES.md — Session Evaluation Dashboard

## Data-Fetching: fetch-in-hook vs SWR / TanStack Query

The application uses two custom hooks — `useSessions` and `useSession` — each wrapping `fetch`, `useState`, and `useEffect` directly. No external data-fetching library was introduced.

SWR and TanStack Query are excellent, but they earn their cost at a certain scale. At 20 sessions their benefits — automatic deduplication, background revalidation, and cache normalisation — go entirely unused. Each adds ~15–30 kB to the bundle and non-trivial configuration surface area. The custom hooks accomplish exactly what is needed in roughly 25 lines each: set loading, call fetch, handle success and error, expose a stable `refetch` callback. That is the right fit for this scale and timebox.

**Why client-side filtering?** With 20 sessions fetched once, filtering in memory is faster than a server round-trip (which would add 400–800 ms of artificial latency per filter change). All three dimensions are applied in a single pass. This is the first decision to revisit as the dataset grows.

---

## What Was Cut and Why

| Cut | Reason |
|---|---|
| Automated tests (property + unit) | Timebox — fast-check tests require non-trivial setup; the spec marks them optional |
| Real authentication | Mock httpOnly cookie demonstrates HTTP auth semantics without a real identity provider |
| Pagination | Not meaningful for 20 sessions; adds routing and API complexity the timebox did not allow |
| Server-side filtering | Client-side is correct and simpler for this dataset size |
| `/api/students` endpoint | Distinct names are derived from the already-fetched session list at no extra cost |
| Dark mode | Purely cosmetic; adds no functional value in a timebox |
| Virtualised list | Unnecessary for 20 items; React renders them synchronously without perceptible cost |
| Real database | Static JSON removes all infrastructure and environment concerns for a timebox delivery |
| Detailed error taxonomy | A single `Error | null` state is sufficient; distinguishing 404 from 500 adds branching without user-facing benefit at this scale |

---

## What Changes at 10,000 Sessions

**Server-side filtering and pagination.** Fetching 10 k sessions in one request is impractical — compressed JSON would be several megabytes and client-side filtering would block the main thread. Filtering moves to the API, with `student`, `from`, and `to` as server-applied predicates. Cursor-based pagination becomes mandatory, and the API returns a `{ data, total, nextCursor }` envelope.

**Dedicated `/api/students` endpoint.** Deriving distinct names from 10 k sessions in the browser is wasteful. A lightweight, cached endpoint replaces the current in-memory derivation.

**Real database.** A static JSON file cannot handle writes, concurrent access, or meaningful data volumes. PostgreSQL with indexed `student` and `date` columns enables fast server-side filtering queries.

**Virtualised list.** Rendering 10 k DOM nodes is not viable. A windowing library (react-window or TanStack Virtual) renders only visible rows, keeping scroll performance acceptable.

**SWR or TanStack Query earns its place.** With server pagination and multiple concurrent filter views, cache normalisation, background revalidation, and request deduplication become genuinely valuable. TanStack Query's `useInfiniteQuery` handles cursor pagination cleanly. Either library is justified at that scale — neither is justified at 20 sessions.
