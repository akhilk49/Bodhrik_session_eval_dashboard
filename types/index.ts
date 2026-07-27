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
