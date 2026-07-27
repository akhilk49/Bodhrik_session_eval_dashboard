/**
 * Tests for lib/utils.ts
 * Feature: session-eval-dashboard
 *
 * Covers:
 *   - Unit tests for all utility functions
 *   - Property 2: Filter conjunctive correctness  (Validates: Requirements 2.2, 2.3, 2.4, 2.5)
 *   - Property 3: URL filter round-trip           (Validates: Requirements 8.3, 8.4, 8.5)
 *   - Property 4: Average score calculation       (Validates: Requirements 7.3)
 */

import * as fc from 'fast-check';
import {
  calcAverageScore,
  applyFilters,
  formatDate,
  sleep,
  filtersToQueryString,
  queryStringToFilters,
} from '@/lib/utils';
import type { Session, MetricPoint, FilterParams } from '@/types';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const metricPointArb: fc.Arbitrary<MetricPoint> = fc.record({
  t: fc.integer({ min: 0, max: 3600 }),
  engagement: fc.integer({ min: 0, max: 100 }),
  clarity: fc.integer({ min: 0, max: 100 }),
  pacing: fc.integer({ min: 0, max: 100 }),
});

const isoDateArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2024-03-01'), max: new Date('2024-04-30') })
  .map((d) => d.toISOString().slice(0, 10));

const sessionArb: fc.Arbitrary<Session> = fc.record({
  id: fc.string({ minLength: 1 }),
  student: fc.constantFrom(
    'Aisha Patel',
    'Ben Carter',
    'Chiara Rossi',
    'David Kim',
    'Elena Soto'
  ),
  date: isoDateArb,
  durationMinutes: fc.integer({ min: 10, max: 120 }),
  metrics: fc.array(metricPointArb, { minLength: 1, maxLength: 15 }),
});

/** Builds a FilterParams arbitrary whose date fields are consistent ISO strings */
const filterParamsArb: fc.Arbitrary<FilterParams> = fc.record(
  {
    student: fc.option(
      fc.constantFrom(
        'Aisha Patel',
        'Ben Carter',
        'Chiara Rossi',
        'David Kim',
        'Elena Soto'
      ),
      { nil: undefined }
    ),
    from: fc.option(isoDateArb, { nil: undefined }),
    to: fc.option(isoDateArb, { nil: undefined }),
  },
  { requiredKeys: [] }
);

// ---------------------------------------------------------------------------
// calcAverageScore — unit tests
// ---------------------------------------------------------------------------

describe('calcAverageScore', () => {
  const makeSession = (metrics: MetricPoint[]): Session => ({
    id: 's1',
    student: 'Test',
    date: '2024-03-01',
    durationMinutes: 30,
    metrics,
  });

  it('returns 0 for a session with no metrics', () => {
    expect(calcAverageScore(makeSession([]))).toBe(0);
  });

  it('calculates correctly for a single MetricPoint', () => {
    const session = makeSession([{ t: 0, engagement: 80, clarity: 60, pacing: 70 }]);
    // (80 + 60 + 70) / 3 = 70
    expect(calcAverageScore(session)).toBeCloseTo(70);
  });

  it('calculates correctly for multiple MetricPoints', () => {
    const session = makeSession([
      { t: 0, engagement: 100, clarity: 100, pacing: 100 },
      { t: 60, engagement: 0, clarity: 0, pacing: 0 },
    ]);
    // (100+100+100+0+0+0) / 6 = 50
    expect(calcAverageScore(session)).toBeCloseTo(50);
  });

  it('returns a value between 0 and 100 for valid metric values', () => {
    const session = makeSession([
      { t: 0, engagement: 50, clarity: 75, pacing: 25 },
    ]);
    const avg = calcAverageScore(session);
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// calcAverageScore — Property 4
// Feature: session-eval-dashboard, Property 4: average score calculation correctness
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------

describe('calcAverageScore — Property 4: average score equals arithmetic mean of all metric values', () => {
  it('equals the arithmetic mean of all engagement, clarity, pacing values', () => {
    fc.assert(
      fc.property(sessionArb, (session) => {
        const expected =
          session.metrics.reduce(
            (acc, mp) => acc + mp.engagement + mp.clarity + mp.pacing,
            0
          ) /
          (session.metrics.length * 3);

        expect(calcAverageScore(session)).toBeCloseTo(expected, 10);
      }),
      { numRuns: 200 }
    );
  });

  it('always returns a value in [0, 100] when metrics are valid (0–100)', () => {
    fc.assert(
      fc.property(sessionArb, (session) => {
        const avg = calcAverageScore(session);
        expect(avg).toBeGreaterThanOrEqual(0);
        expect(avg).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// applyFilters — unit tests
// ---------------------------------------------------------------------------

describe('applyFilters', () => {
  const sessions: Session[] = [
    {
      id: 's1',
      student: 'Aisha Patel',
      date: '2024-03-10',
      durationMinutes: 45,
      metrics: [],
    },
    {
      id: 's2',
      student: 'Ben Carter',
      date: '2024-03-20',
      durationMinutes: 60,
      metrics: [],
    },
    {
      id: 's3',
      student: 'Aisha Patel',
      date: '2024-04-05',
      durationMinutes: 30,
      metrics: [],
    },
    {
      id: 's4',
      student: 'Chiara Rossi',
      date: '2024-04-15',
      durationMinutes: 50,
      metrics: [],
    },
  ];

  it('returns all sessions when no filters are applied', () => {
    expect(applyFilters(sessions, {})).toHaveLength(4);
  });

  it('filters by student (case-insensitive)', () => {
    const result = applyFilters(sessions, { student: 'aisha patel' });
    expect(result).toHaveLength(2);
    result.forEach((s) => expect(s.student).toBe('Aisha Patel'));
  });

  it('filters by from date (inclusive)', () => {
    const result = applyFilters(sessions, { from: '2024-03-20' });
    expect(result.map((s) => s.id)).toEqual(expect.arrayContaining(['s2', 's3', 's4']));
    expect(result).toHaveLength(3);
  });

  it('filters by to date (inclusive)', () => {
    const result = applyFilters(sessions, { to: '2024-03-20' });
    expect(result.map((s) => s.id)).toEqual(expect.arrayContaining(['s1', 's2']));
    expect(result).toHaveLength(2);
  });

  it('applies student + from + to conjunctively (AND logic)', () => {
    const result = applyFilters(sessions, {
      student: 'Aisha Patel',
      from: '2024-03-01',
      to: '2024-03-31',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('returns empty array when no sessions match', () => {
    expect(applyFilters(sessions, { student: 'Nobody Here' })).toHaveLength(0);
  });

  it('returns empty array when input is empty', () => {
    expect(applyFilters([], { student: 'Aisha Patel' })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyFilters — Property 2
// Feature: session-eval-dashboard, Property 2: filter conjunctive correctness
// Validates: Requirements 2.2, 2.3, 2.4, 2.5
// ---------------------------------------------------------------------------

describe('applyFilters — Property 2: filter conjunctive correctness', () => {
  it('every result satisfies all supplied filters', () => {
    fc.assert(
      fc.property(
        fc.array(sessionArb, { minLength: 0, maxLength: 30 }),
        filterParamsArb,
        (sessions, params) => {
          const result = applyFilters(sessions, params);

          for (const session of result) {
            if (params.student) {
              expect(session.student.toLowerCase()).toBe(
                params.student.toLowerCase()
              );
            }
            if (params.from) {
              expect(session.date >= params.from).toBe(true);
            }
            if (params.to) {
              expect(session.date <= params.to).toBe(true);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('no matching session is absent from the result', () => {
    fc.assert(
      fc.property(
        fc.array(sessionArb, { minLength: 0, maxLength: 30 }),
        filterParamsArb,
        (sessions, params) => {
          const result = applyFilters(sessions, params);
          const resultIds = new Set(result.map((s) => s.id));

          for (const session of sessions) {
            const studentMatch =
              !params.student ||
              session.student.toLowerCase() === params.student.toLowerCase();
            const fromMatch = !params.from || session.date >= params.from;
            const toMatch = !params.to || session.date <= params.to;

            if (studentMatch && fromMatch && toMatch) {
              // This session should be in the result
              // (ids may not be unique in generated data, so check by reference)
              expect(result).toContain(session);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// formatDate — unit tests
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats a known date correctly', () => {
    expect(formatDate('2024-03-15')).toBe('March 15, 2024');
  });

  it('formats January 1st correctly', () => {
    expect(formatDate('2024-01-01')).toBe('January 1, 2024');
  });

  it('formats December 31st correctly', () => {
    expect(formatDate('2024-12-31')).toBe('December 31, 2024');
  });

  it('handles the start of the mock dataset date range', () => {
    expect(formatDate('2024-03-01')).toBe('March 1, 2024');
  });

  it('handles the end of the mock dataset date range', () => {
    expect(formatDate('2024-04-30')).toBe('April 30, 2024');
  });
});

// ---------------------------------------------------------------------------
// sleep — unit tests
// ---------------------------------------------------------------------------

describe('sleep', () => {
  it('resolves after approximately the given milliseconds', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // allow a little jitter
  });

  it('resolves immediately for 0ms', async () => {
    await expect(sleep(0)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// filtersToQueryString — unit tests
// ---------------------------------------------------------------------------

describe('filtersToQueryString', () => {
  it('returns empty string for empty params', () => {
    expect(filtersToQueryString({})).toBe('');
  });

  it('serialises student correctly', () => {
    expect(filtersToQueryString({ student: 'Aisha Patel' })).toBe(
      '?student=Aisha+Patel'
    );
  });

  it('serialises from and to correctly', () => {
    const qs = filtersToQueryString({ from: '2024-03-01', to: '2024-04-30' });
    expect(qs).toContain('from=2024-03-01');
    expect(qs).toContain('to=2024-04-30');
    expect(qs.startsWith('?')).toBe(true);
  });

  it('omits undefined values', () => {
    expect(filtersToQueryString({ student: undefined })).toBe('');
  });

  it('serialises all three fields together', () => {
    const qs = filtersToQueryString({
      student: 'Ben Carter',
      from: '2024-03-01',
      to: '2024-03-31',
    });
    expect(qs).toContain('student=Ben+Carter');
    expect(qs).toContain('from=2024-03-01');
    expect(qs).toContain('to=2024-03-31');
  });
});

// ---------------------------------------------------------------------------
// queryStringToFilters — unit tests
// ---------------------------------------------------------------------------

describe('queryStringToFilters', () => {
  it('returns empty object for empty string', () => {
    expect(queryStringToFilters('')).toEqual({});
  });

  it('parses student correctly', () => {
    expect(queryStringToFilters('?student=Aisha+Patel')).toEqual({
      student: 'Aisha Patel',
    });
  });

  it('parses from and to correctly', () => {
    expect(
      queryStringToFilters('?from=2024-03-01&to=2024-04-30')
    ).toEqual({ from: '2024-03-01', to: '2024-04-30' });
  });

  it('parses all three fields', () => {
    expect(
      queryStringToFilters('?student=Ben+Carter&from=2024-03-01&to=2024-03-31')
    ).toEqual({ student: 'Ben Carter', from: '2024-03-01', to: '2024-03-31' });
  });

  it('works without leading ?', () => {
    expect(queryStringToFilters('student=David+Kim')).toEqual({
      student: 'David Kim',
    });
  });

  it('ignores empty param values', () => {
    expect(queryStringToFilters('?student=')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// filtersToQueryString + queryStringToFilters — Property 3
// Feature: session-eval-dashboard, Property 3: URL filter round-trip
// Validates: Requirements 8.3, 8.4, 8.5
// ---------------------------------------------------------------------------

describe('filtersToQueryString / queryStringToFilters — Property 3: URL filter round-trip', () => {
  it('round-trip preserves all defined filter values', () => {
    fc.assert(
      fc.property(filterParamsArb, (params) => {
        const qs = filtersToQueryString(params);
        const parsed = queryStringToFilters(qs);

        // Only keys explicitly set (non-undefined, non-empty) should survive
        if (params.student) {
          expect(parsed.student).toBe(params.student);
        } else {
          expect(parsed.student).toBeUndefined();
        }

        if (params.from) {
          expect(parsed.from).toBe(params.from);
        } else {
          expect(parsed.from).toBeUndefined();
        }

        if (params.to) {
          expect(parsed.to).toBe(params.to);
        } else {
          expect(parsed.to).toBeUndefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('applying original params and applying round-tripped params produces the same result', () => {
    fc.assert(
      fc.property(
        fc.array(sessionArb, { minLength: 0, maxLength: 20 }),
        filterParamsArb,
        (sessions, params) => {
          const qs = filtersToQueryString(params);
          const parsed = queryStringToFilters(qs);

          const direct = applyFilters(sessions, params);
          const viaRoundTrip = applyFilters(sessions, parsed);

          expect(direct).toEqual(viaRoundTrip);
        }
      ),
      { numRuns: 200 }
    );
  });
});
