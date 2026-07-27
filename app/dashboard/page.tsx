"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessions } from "@/hooks/useSessions";
import SessionFilters from "@/components/SessionFilters";
import SessionCard from "@/components/SessionCard";
import { SessionListSkeleton } from "@/components/LoadingSkeletons";
import ErrorState from "@/components/ErrorState";
import type { FilterParams } from "@/types";
import { filtersToQueryString } from "@/lib/utils";

// Inner component that reads searchParams — must be wrapped in Suspense
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build FilterParams from URL query string
  const params: FilterParams = useMemo(() => {
    const student = searchParams.get("student") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    return { student, from, to };
  }, [searchParams]);

  const { data, isLoading, error, refetch } = useSessions(params);

  // Derive distinct student names from the loaded data
  const students = useMemo(() => {
    const names = new Set(data.map((s) => s.student));
    return Array.from(names).sort();
  }, [data]);

  function handleFilterChange(filters: FilterParams) {
    const qs = filtersToQueryString(filters);
    router.replace(`/dashboard${qs}`);
  }

  function handleClearFilters() {
    router.replace("/dashboard");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <SessionListSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  // ── Success (empty or populated) ───────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Filters — always shown when not loading/error */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <SessionFilters
          students={students}
          currentFilters={params}
          onChange={handleFilterChange}
        />
      </div>

      {/* Empty state */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base text-gray-600">No sessions match these filters.</p>
          <button
            onClick={handleClearFilters}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Session list */
        <ul className="flex flex-col gap-4" aria-label="Session list">
          {data.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page shell with header ─────────────────────────────────────────────────────

function DashboardHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
        <button
          onClick={handleLogout}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main>
        {/*
          useSearchParams() requires a Suspense boundary in Next.js 14.
          DashboardContent reads searchParams; wrapping it here satisfies that requirement.
        */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
              <SessionListSkeleton />
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
