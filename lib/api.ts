import type { Session, FilterParams } from "@/types";
import { filtersToQueryString } from "@/lib/utils";

/**
 * Fetches the session list from GET /api/sessions.
 * Filter params are serialised into the query string via filtersToQueryString.
 * Throws an Error on any non-2xx response.
 */
export async function fetchSessions(params: FilterParams): Promise<Session[]> {
  const qs = filtersToQueryString(params);
  const response = await fetch(`/api/sessions${qs}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: string }).error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<Session[]>;
}

/**
 * Fetches a single session from GET /api/sessions/[id].
 * Throws an Error on any non-2xx response, including 404.
 */
export async function fetchSession(id: string): Promise<Session> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: string }).error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<Session>;
}
