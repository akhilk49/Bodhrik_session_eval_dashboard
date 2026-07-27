import type { Session, FilterParams } from "@/types";

/**
 * Calculates the arithmetic mean of all engagement, clarity, and pacing values
 * across every MetricPoint in the session.
 * Each MetricPoint contributes 3 values, so total count = metrics.length * 3.
 */
export function calcAverageScore(session: Session): number {
  const { metrics } = session;
  if (metrics.length === 0) return 0;

  const total = metrics.reduce(
    (sum, point) => sum + point.engagement + point.clarity + point.pacing,
    0
  );

  return total / (metrics.length * 3);
}

/**
 * Filters a sessions array using AND logic across all supplied FilterParams.
 * - student: case-insensitive exact match
 * - from: session.date >= params.from
 * - to: session.date <= params.to
 * Unset/undefined params are ignored.
 */
export function applyFilters(sessions: Session[], params: FilterParams): Session[] {
  return sessions.filter((session) => {
    if (
      params.student &&
      session.student.toLowerCase() !== params.student.toLowerCase()
    ) {
      return false;
    }

    if (params.from && session.date < params.from) {
      return false;
    }

    if (params.to && session.date > params.to) {
      return false;
    }

    return true;
  });
}

/**
 * Converts an ISO date string (YYYY-MM-DD) to a human-readable format.
 * e.g. "2024-03-15" → "March 15, 2024"
 */
export function formatDate(dateStr: string): string {
  // Parse the date parts manually to avoid timezone offset issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Returns a Promise that resolves after the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serialises a FilterParams object into a URL query string.
 * Keys with undefined or empty-string values are omitted.
 * Returns an empty string if all params are empty/undefined.
 * e.g. { student: "Aisha Patel", from: "2024-03-01" } → "?student=Aisha+Patel&from=2024-03-01"
 */
export function filtersToQueryString(params: FilterParams): string {
  const searchParams = new URLSearchParams();

  if (params.student) {
    searchParams.set("student", params.student);
  }
  if (params.from) {
    searchParams.set("from", params.from);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Parses a URL query string back into a FilterParams object.
 * Only includes keys that are present and non-empty in the query string.
 * e.g. "?student=Aisha+Patel&from=2024-03-01" → { student: "Aisha Patel", from: "2024-03-01" }
 */
export function queryStringToFilters(search: string): FilterParams {
  const params = new URLSearchParams(search);
  const filters: FilterParams = {};

  const student = params.get("student");
  if (student) filters.student = student;

  const from = params.get("from");
  if (from) filters.from = from;

  const to = params.get("to");
  if (to) filters.to = to;

  return filters;
}
