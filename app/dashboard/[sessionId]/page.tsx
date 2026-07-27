"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { SessionDetailSkeleton } from "@/components/LoadingSkeletons";
import ErrorState from "@/components/ErrorState";
import MetricChart from "@/components/MetricChart";
import { formatDate } from "@/lib/utils";

interface SessionDetailContentProps {
  sessionId: string;
}

function SessionDetailContent({ sessionId }: SessionDetailContentProps) {
  const searchParams = useSearchParams();
  const { data, isLoading, error, refetch } = useSession(sessionId);

  // Build back-link href preserving active filter state from the URL
  const backHref = (() => {
    const qs = searchParams.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  })();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <SessionDetailSkeleton />
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

  // ── Success ────────────────────────────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">{data.student}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          <span>{formatDate(data.date)}</span>
          <span>{data.durationMinutes} min</span>
        </div>
      </div>

      {/* Metric chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-medium text-gray-800">Session Metrics</h2>
        <MetricChart metrics={data.metrics} />
      </div>
    </div>
  );
}

interface SessionDetailPageProps {
  params: { sessionId: string };
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">Session Detail</h1>
        </div>
      </header>
      <main>
        {/*
          useSearchParams() requires a Suspense boundary in Next.js 14.
          SessionDetailContent reads searchParams; wrapping it here satisfies that requirement.
        */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
              <SessionDetailSkeleton />
            </div>
          }
        >
          <SessionDetailContent sessionId={params.sessionId} />
        </Suspense>
      </main>
    </div>
  );
}
