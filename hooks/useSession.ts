"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "@/types";
import { fetchSession } from "@/lib/api";

interface UseSessionResult {
  data: Session | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSession(id: string): UseSessionResult {
  const [data, setData] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    fetchSession(id)
      .then((session) => {
        if (cancelled) return;
        setData(session);
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
  }, [id, refetchCounter]);

  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
