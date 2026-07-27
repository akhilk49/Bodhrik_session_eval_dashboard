"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Session, FilterParams } from "@/types";
import { fetchSessions } from "@/lib/api";

interface UseSessionsResult {
  data: Session[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSessions(params: FilterParams): UseSessionsResult {
  const [data, setData] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState<number>(0);

  // Stable serialised key for deep-equal dependency tracking
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    fetchSessions(params)
      .then((sessions) => {
        if (cancelled) return;
        setData(sessions);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, refetchCounter]);

  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
